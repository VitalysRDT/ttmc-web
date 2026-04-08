/**
 * Nettoyage des réponses contenant de la logique de jeu parasite.
 *
 * Exemples à nettoyer :
 *   "Putréfaction (si tu as propose avilissement, tu avances de 17 cases)"
 *     vers "Putréfaction", alternates: ["avilissement"]
 *   "38 notes (propositions entre 37 et 39 notes acceptees)"
 *     vers "38 notes", range: {min: 37, max: 39, unit: "notes"}
 */

export interface CleanedAnswer {
  /** Réponse principale sans parenthèses de logique. */
  answer: string;
  /** Alternatives mentionnées dans la parenthèse parasite, si détectées. */
  alternates?: string[];
}

/**
 * Regex qui matche une parenthèse terminale contenant des mots-clés de logique
 * de jeu (case, avance, recule, perds, gagnes, accepté, etc.).
 */
const GAME_LOGIC_PARENTHESIS =
  /\s*\([^)]*?(?:case|avance|recule|perd|gagne|accept|tu\s+(?:as|dois|vas)|propos)[^)]*\)\s*/gi;

/**
 * Nettoie une réponse en retirant les parenthèses de logique de jeu et en extrayant
 * les alternatives mentionnées.
 */
export function cleanAnswer(raw: string): CleanedAnswer {
  if (!raw) return { answer: '' };
  const alternates: string[] = [];

  // Capture les alternatives mentionnées avec "propose X" ou "dit X"
  const altRegex = /(?:propos[éeé]s?|dit|r[ée]pondu)\s+([a-zà-ÿ\s,-]+?)(?=,|\)|\s+tu|\s+vous|\s+on|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = altRegex.exec(raw))) {
    const alt = match[1]?.trim();
    if (alt && alt.length > 1) alternates.push(alt);
  }

  // Retire les parenthèses parasites
  const cleaned = raw.replace(GAME_LOGIC_PARENTHESIS, ' ').trim().replace(/\s+/g, ' ');

  return {
    answer: cleaned,
    alternates: alternates.length > 0 ? alternates : undefined,
  };
}
