import { NextResponse } from 'next/server';

/**
 * Endpoint de référence pour synchroniser l'horloge client avec le serveur.
 * Remplace `.info/serverTimeOffset` de Firebase Realtime Database (fix bug #4).
 * Le client calcule son offset = serverTs - Date.now() à la connexion.
 */
export async function GET() {
  return NextResponse.json({ serverTime: Date.now() });
}
