/**
 * Génère un code de salle à 4 chiffres (0000-9999).
 * La vérification d'unicité doit être faite côté appelant en queryant Firestore.
 */
export function generateRoomCode(): string {
  const n = Math.floor(Math.random() * 10000);
  return n.toString().padStart(4, '0');
}
