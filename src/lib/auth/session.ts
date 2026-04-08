import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

/**
 * Auth simplifiée par cookie HTTP-only signé.
 *
 * Remplace Firebase Auth anonyme : chaque joueur reçoit un UUID stable à sa première
 * connexion. Le UUID est stocké dans un cookie signé (HS256) avec `SESSION_SECRET`.
 * Aucun password, aucun OAuth — correspond au flow "pseudo anonyme" du Flutter.
 */

const COOKIE_NAME = 'ttmc_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

interface SessionPayload extends Record<string, unknown> {
  playerId: string;
  iat?: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET non défini ou trop court (minimum 16 caractères). Générer avec `openssl rand -base64 32`.',
    );
  }
  return new TextEncoder().encode(secret);
}

/** Crée et signe un JWT session pour un playerId donné. */
export async function createSessionToken(playerId: string): Promise<string> {
  const token = await new SignJWT({ playerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setSubject(playerId)
    .sign(getSecret());
  return token;
}

/** Vérifie un token et retourne le playerId s'il est valide, sinon null. */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const typed = payload as SessionPayload;
    return typeof typed.playerId === 'string' ? typed.playerId : null;
  } catch {
    return null;
  }
}

/** Pose le cookie de session dans la réponse en cours. */
export async function setSessionCookie(playerId: string): Promise<void> {
  const token = await createSessionToken(playerId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Lit le playerId depuis le cookie (côté Server Components / Route Handlers). */
export async function getSessionPlayerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Supprime le cookie de session (sign out). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Génère un nouvel ID de joueur (nanoid de 21 caractères, équivalent UUID en sécurité). */
export function generatePlayerId(): string {
  return nanoid();
}
