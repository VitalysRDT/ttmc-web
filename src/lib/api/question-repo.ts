import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { questions, questionCaches } from '@/lib/db/schema';
import { QuestionSchema, type Question } from '@/lib/schemas/question.schema';
import {
  QuestionCacheSchema,
  type QuestionCache,
} from '@/lib/schemas/question-cache.schema';
import type { QuestionCategory } from '@/lib/schemas/enums';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis/client';

/** Récupère toutes les questions d'une catégorie (avec cache Redis 1h). */
export async function getQuestionsByCategory(category: QuestionCategory): Promise<Question[]> {
  // Cache Redis
  try {
    const cached = await redis.get<Question[]>(CACHE_KEYS.questionsByCategory(category));
    if (cached && Array.isArray(cached)) {
      return cached.map((q) => QuestionSchema.parse(q));
    }
  } catch {
    // Ignore
  }

  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.category, category));
  const parsed = rows.map((row) => QuestionSchema.parse(row.data));

  try {
    await redis.set(CACHE_KEYS.questionsByCategory(category), parsed, {
      ex: CACHE_TTL.questions,
    });
  } catch {
    // Ignore
  }
  return parsed;
}

/** Récupère le cache d'un joueur (crée une ligne vide si absente). */
export async function getQuestionCache(playerId: string): Promise<QuestionCache> {
  const [row] = await db
    .select()
    .from(questionCaches)
    .where(eq(questionCaches.playerId, playerId))
    .limit(1);
  if (row) {
    return QuestionCacheSchema.parse({
      playerId: row.playerId,
      seenQuestions: row.seenQuestions,
      lastUpdated: row.lastUpdated,
    });
  }
  return { playerId, seenQuestions: {}, lastUpdated: null };
}

/** Persiste le cache d'un joueur (upsert). */
export async function saveQuestionCache(cache: QuestionCache): Promise<void> {
  const now = new Date();
  await db
    .insert(questionCaches)
    .values({
      playerId: cache.playerId,
      seenQuestions: cache.seenQuestions,
      lastUpdated: now,
    })
    .onConflictDoUpdate({
      target: questionCaches.playerId,
      set: { seenQuestions: cache.seenQuestions, lastUpdated: now },
    });
}

/** Upsert une question en base (utilisé par le script d'import). */
export async function upsertQuestion(question: Question): Promise<void> {
  await db
    .insert(questions)
    .values({
      id: question.id,
      kind: question.kind,
      category: question.category,
      theme: 'theme' in question ? question.theme : 'Débuter',
      data: question,
    })
    .onConflictDoUpdate({
      target: questions.id,
      set: {
        kind: question.kind,
        category: question.category,
        theme: 'theme' in question ? question.theme : 'Débuter',
        data: question,
      },
    });
}
