# TTMC Web

Portage web du jeu de plateau TTMC (Flutter `flutter_ttmc`) vers **Next.js + Neon + Upstash + Vercel**. Aucune dépendance Firebase.

## Stack

| Couche | Techno |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** + **TypeScript strict** |
| Style | **Tailwind CSS v4** |
| Database | **Neon Postgres** (serverless, HTTP) + **drizzle-orm** |
| Cache / KV | **Upstash Redis** (HTTP REST) |
| Auth | Cookie HTTP-only signé avec **jose** (JWT HS256), pas d'OAuth en v1 |
| State | **Zustand** (auth store) + **TanStack Query** (polling + mutations) |
| Validation | **Zod** (schemas = source of truth des types) |
| Animations | **framer-motion** |
| Tests | **Vitest** |
| Déploiement | **Vercel** (région `cdg1`) |

Pas de WebSockets ni Server-Sent Events : le temps réel utilise un polling TanStack Query à 1 s sur `/api/rooms/[id]` (le cache Upstash absorbe la charge DB).

## Démarrage

```bash
npm install
cp .env.example .env.local
# remplir DATABASE_URL, UPSTASH_REDIS_REST_URL/TOKEN, SESSION_SECRET

npm run db:push          # crée les tables sur Neon
npm run import-questions:upload   # upload les 726 questions (nécessite DATABASE_URL)

npm run dev              # http://localhost:3000
```

### Obtenir les credentials

- **Neon Postgres** : https://console.neon.tech/ → projet → copier la `DATABASE_URL` (mode "Pooled connection")
- **Upstash Redis** : https://console.upstash.com/ → créer une DB Redis → onglet REST API → copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
- **Session secret** : `openssl rand -base64 32`

## Variables d'environnement

| Variable | Usage |
|---|---|
| `DATABASE_URL` | Connection string Postgres Neon (pooled) |
| `UPSTASH_REDIS_REST_URL` | URL REST Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST Upstash Redis |
| `SESSION_SECRET` | Clé HS256 pour signer les cookies de session (≥ 16 caractères) |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests unitaires Vitest |
| `npm run db:generate` | Génère une migration SQL depuis `src/lib/db/schema.ts` |
| `npm run db:push` | Applique directement le schéma sur la DB (dev) |
| `npm run db:studio` | Ouvre Drizzle Studio (explorateur de la DB) |
| `npm run import-questions:dry` | Parse + valide les JSON, affiche un rapport |
| `npm run import-questions:upload` | Upsert des 726 questions dans Neon |

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                        # Splash (redirect auth/home)
│   ├── providers.tsx                   # QueryClient + auth listener + time sync
│   ├── auth/page.tsx                   # Formulaire pseudo → POST /api/auth/anonymous
│   ├── home/page.tsx                   # Créer / Rejoindre
│   ├── lobby/[roomCode]/page.tsx       # Salle d'attente
│   ├── game/[roomId]/page.tsx          # Cœur du jeu (PhaseRenderer)
│   ├── scores/[roomId]/page.tsx        # Podium
│   └── api/                            # Route Handlers (17 routes)
│       ├── auth/{anonymous,me,signout}
│       ├── time                        # Sync horloge client
│       └── rooms/
│           ├── (create), /join, /by-code/[code]
│           └── [id]/{ready, leave, start, debuter/{answer,commit}, turn/{start,difficulty,reveal,answer,next}}
├── components/
│   ├── ui/                             # Button, Input
│   ├── game/                           # PhaseRenderer + 8 sous-composants
│   ├── lobby/                          # PlayerList, RoomCodeDisplay
│   └── home/                           # CreateRoomButton, JoinRoomDialog
└── lib/
    ├── db/                             # Drizzle schema + client Neon
    │   ├── schema.ts                   # 5 tables: players, game_rooms, room_players, questions, question_caches
    │   └── client.ts
    ├── redis/client.ts                 # Upstash Redis + helpers cache
    ├── auth/session.ts                 # JWT signé jose + cookie HTTP-only
    ├── api/                            # Logique serveur (repositories + services)
    │   ├── player-repo.ts
    │   ├── room-repo.ts                # Cache Upstash Redis transparent
    │   ├── question-repo.ts
    │   ├── game-service.ts             # Orchestration startTurn/selectDifficulty/submitAnswer/…
    │   └── client-actions.ts           # Wrappers fetch côté client
    ├── schemas/                        # Zod discriminated unions
    ├── game/                           # Fonctions pures: board-positions, game-logic, question-cache
    ├── hooks/                          # useAuth, useRoomStream (polling), useCountdown, useServerTime
    ├── stores/auth-store.ts            # Zustand
    └── utils/                          # cn, levenshtein, generate-room-code

drizzle/                                # Migrations SQL générées
src/data/
├── questions/                          # JSON sources (7 fichiers)
└── import/                             # Parsers de normalisation
scripts/import-questions.ts             # Seed Neon depuis les JSON
```

## Architecture temps réel

```
Client ─(polling 1s)─► GET /api/rooms/[id] ─► Upstash Redis (cache 30s)
                                             │ (miss)
                                             ▼
                                             Neon Postgres (drizzle)

Client ─(mutation)─► POST /api/rooms/[id]/turn/answer ─► game-service ─► Neon
                                                                       │
                                                                       ▼
                                                            Invalidation cache Redis
```

Le polling à 1 s est largement suffisant pour un jeu turn-based (30 s par question). Le cache Redis garantit que 99% des GET n'atteignent pas Postgres (TTL 30 s, invalidation sur mutation).

## Bugs gameplay corrigés

1. **Countdown skippable (bug #1)** — `useCountdown(phaseStartedAt, 5)` calcule depuis le timestamp serveur, tous les clients voient le même compteur. Voir `src/lib/hooks/useCountdown.ts`.
2. **Cache épuisé (bug #2)** — La logique correcte traite les difficultés 1-10 (vs 1-3 bugué). Une question n'est filtrée que quand les 10 niveaux ont été joués. Couvert par 9 tests dans `src/lib/game/question-cache.test.ts`.
3. **Race condition Débuter (bug #3)** — `phaseTransitionAt = now + 3s` côté serveur, commit déclenché par le host via `setTimeout`. Plus de blocage si un client est lent.
4. **Dérive timer client (bug #4)** — `src/lib/hooks/useServerTime.ts` mesure l'offset via `GET /api/time` à la connexion, re-sync toutes les 5 min. Toutes les fonctions de timing utilisent `serverNow()`.
5. **Parser Intrepide fragile (bug #5)** — Mapping par `lettre` au lieu d'index dans `src/data/import/normalize-intrepide.ts`.

## Banque de questions

Dernier `import-questions:dry` :
```
726 questions validées, 0 rejet
332 réponses nettoyées (logique parasite retirée par regex)
161 plages numériques extraites (answerRanges)
  standard   : 618  (improbable 160, mature 141, plaisir 146, scolaire 171)
  debuter    : 16
  final      : 87
  intrepide  : 5
```

## Déploiement Vercel

1. Importer le dossier `ttmc-web/` dans Vercel (framework Next.js auto-détecté)
2. Connecter une branche Neon + une DB Upstash Redis via les **Vercel Integrations** (ou copier manuellement les env vars)
3. Renseigner `SESSION_SECRET` (>=32 caractères, `openssl rand -base64 32`)
4. Région configurée dans `vercel.json` : `cdg1` (Paris)
5. Après le premier déploiement : `npm run db:push` en local pour créer les tables sur Neon, puis `npm run import-questions:upload` pour seeder les 726 questions
6. Plus rien à autoriser côté Firebase — le projet n'y dépend plus

## Tests E2E manuel

1. 2 navigateurs/onglets incognito → `/auth` → pseudo différent chacun
2. Joueur A crée une partie → code 4 chiffres affiché
3. Joueur B rejoint avec le code → apparaît dans la liste
4. Les deux cliquent "Je suis prêt" → A démarre la partie
5. Question Débuter : A et B répondent → transition automatique après 3 s
6. Au tour de A : choix difficulté → countdown 5 s synchronisé → OUI/NON → déplacement
7. Répéter jusqu'à la case 50 → question finale → écran scores

## Migration Firebase → Neon/Upstash (v2)

Historique : la v1 utilisait Firebase Firestore + Auth + Realtime Database. La v2 a retiré 100% de ces dépendances :
- **Firestore → Neon Postgres + Drizzle** (schéma typé, migrations versionnées)
- **Firestore listeners → TanStack Query polling** + cache Upstash Redis
- **Firebase Auth → cookie HTTP-only signé avec jose**
- **Realtime Database `.info/serverTimeOffset` → `GET /api/time`**
- `firestore.rules` supprimées, sécurité des routes côté serveur dans chaque Route Handler
