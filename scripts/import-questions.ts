/**
 * Script d'import et normalisation de la banque de questions TTMC vers Neon Postgres.
 *
 * Usage :
 *   npx tsx scripts/import-questions.ts --dry-run       # parse + rapport, pas d'écriture
 *   npx tsx scripts/import-questions.ts --normalize     # écrit src/data/normalized/*.json
 *   npx tsx scripts/import-questions.ts --upload        # upsert dans Neon Postgres (via DATABASE_URL)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { QuestionSchema, type Question } from '../src/lib/schemas/question.schema';
import { normalizeStandardCategory } from '../src/data/import/normalize-standard';
import { normalizeDebuter } from '../src/data/import/normalize-debuter';
import { normalizeFinal } from '../src/data/import/normalize-final';
import { normalizeIntrepide } from '../src/data/import/normalize-intrepide';

// Charge .env.local pour récupérer DATABASE_URL en dev local
loadDotenv({ path: path.join(__dirname, '..', '.env.local') });

const QUESTIONS_DIR = path.join(__dirname, '..', 'src', 'data', 'questions');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'normalized');

interface ImportStats {
  total: number;
  byKind: Record<string, number>;
  byCategory: Record<string, number>;
  cleaned: number;
  ranges: number;
  rejected: number;
}

function loadJson(filename: string): unknown {
  return JSON.parse(readFileSync(path.join(QUESTIONS_DIR, filename), 'utf-8'));
}

function normalizeAll(): { questions: Question[]; stats: ImportStats } {
  const questions: Question[] = [];
  const stats: ImportStats = {
    total: 0,
    byKind: {},
    byCategory: {},
    cleaned: 0,
    ranges: 0,
    rejected: 0,
  };

  const standardCategories = [
    { name: 'improbable', file: 'improbable.json' },
    { name: 'mature', file: 'mature.json' },
    { name: 'plaisir', file: 'plaisir.json' },
    { name: 'scolaire', file: 'scolaire.json' },
  ] as const;

  for (const { name, file } of standardCategories) {
    console.log(`📖 Parsing ${file}...`);
    const result = normalizeStandardCategory(name, loadJson(file));
    questions.push(...result.questions);
    stats.cleaned += result.stats.cleanedAnswers;
    stats.ranges += result.stats.extractedRanges;
    stats.rejected += result.stats.skipped;
    console.log(
      `   ✓ ${result.questions.length} cartes, ${result.stats.cleanedAnswers} réponses nettoyées, ${result.stats.extractedRanges} plages extraites`,
    );
  }

  console.log('📖 Parsing debuter.json...');
  const debuterQuestions = normalizeDebuter(loadJson('debuter.json'));
  questions.push(...debuterQuestions);
  console.log(`   ✓ ${debuterQuestions.length} cartes debuter`);

  console.log('📖 Parsing final.json...');
  const finalQuestions = normalizeFinal(loadJson('final.json'));
  questions.push(...finalQuestions);
  console.log(`   ✓ ${finalQuestions.length} cartes finales`);

  console.log('📖 Parsing intrepide.json...');
  const intrepideQuestions = normalizeIntrepide(loadJson('intrepide.json'));
  questions.push(...intrepideQuestions);
  console.log(`   ✓ ${intrepideQuestions.length} cartes intrepide`);

  console.log('\n🔍 Validation Zod stricte...');
  const validated: Question[] = [];
  for (const q of questions) {
    const result = QuestionSchema.safeParse(q);
    if (result.success) {
      validated.push(result.data);
      stats.total++;
      stats.byKind[result.data.kind] = (stats.byKind[result.data.kind] ?? 0) + 1;
      stats.byCategory[result.data.category] =
        (stats.byCategory[result.data.category] ?? 0) + 1;
    } else {
      stats.rejected++;
      console.warn(`   ⚠️  Rejeté : ${q.id}`);
      console.warn(`       ${result.error.message.substring(0, 200)}`);
    }
  }

  return { questions: validated, stats };
}

function writeNormalized(questions: Question[]) {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const byKind: Record<string, Question[]> = {};
  for (const q of questions) (byKind[q.kind] ??= []).push(q);
  for (const [kind, list] of Object.entries(byKind)) {
    const outPath = path.join(OUTPUT_DIR, `${kind}.json`);
    writeFileSync(outPath, JSON.stringify(list, null, 2), 'utf-8');
    console.log(`   ✓ ${kind}.json (${list.length} questions)`);
  }
}

async function uploadToNeon(questions: Question[]) {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL introuvable. Renseigne-le dans .env.local (https://console.neon.tech/).',
    );
  }
  console.log('\n☁️  Upload Neon Postgres via drizzle...');
  const { db } = await import('../src/lib/db/client');
  const { questions: questionsTable } = await import('../src/lib/db/schema');

  // Upsert par lot (on évite les transactions trop larges)
  const BATCH_SIZE = 100;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const slice = questions.slice(i, i + BATCH_SIZE);
    for (const q of slice) {
      const theme = 'theme' in q ? q.theme : 'Débuter';
      await db
        .insert(questionsTable)
        .values({
          id: q.id,
          kind: q.kind,
          category: q.category,
          theme,
          data: q,
        })
        .onConflictDoUpdate({
          target: questionsTable.id,
          set: {
            kind: q.kind,
            category: q.category,
            theme,
            data: q,
          },
        });
    }
    console.log(`   ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} (${slice.length} docs)`);
  }
  console.log(`✅ Upload terminé : ${questions.length} questions`);
}

function printStats(stats: ImportStats) {
  console.log('\n📊 Statistiques :');
  console.log(`   Total validé    : ${stats.total}`);
  console.log(`   Rejetés         : ${stats.rejected}`);
  console.log(`   Réponses clean  : ${stats.cleaned}`);
  console.log(`   Plages extraites: ${stats.ranges}`);
  console.log('\n   Par type :');
  for (const [k, v] of Object.entries(stats.byKind)) {
    console.log(`     ${k.padEnd(10)} : ${v}`);
  }
  console.log('\n   Par catégorie :');
  for (const [k, v] of Object.entries(stats.byCategory)) {
    console.log(`     ${k.padEnd(10)} : ${v}`);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const normalize = args.has('--normalize');
  const upload = args.has('--upload');

  if (!dryRun && !normalize && !upload) {
    console.log('Usage : tsx scripts/import-questions.ts [--dry-run|--normalize|--upload]');
    process.exit(1);
  }

  console.log('🎮 TTMC — Import & normalisation des questions\n');
  const { questions, stats } = normalizeAll();
  printStats(stats);

  if (normalize) {
    console.log('\n💾 Écriture dans src/data/normalized/...');
    writeNormalized(questions);
  }

  if (upload) {
    await uploadToNeon(questions);
  }

  if (dryRun) {
    console.log('\n✓ Dry-run terminé. Aucune écriture.');
  }
}

main().catch((err) => {
  console.error('\n❌ Erreur :', err);
  process.exit(1);
});
