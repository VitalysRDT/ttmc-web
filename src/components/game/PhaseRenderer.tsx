'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';
import { DifficultySelector } from './DifficultySelector';
import { HonorButtons } from './HonorButtons';
import { CategoryBadge } from './CategoryBadge';
import { IntrepideAnswerCard } from './IntrepideAnswerCard';
import { IntrepideInstructionCard } from './IntrepideInstructionCard';
import { ModifierCategoryPicker } from './ModifierCategoryPicker';
import { useGameActions } from '@/lib/hooks/useGameActions';
import { SQUARE_CATEGORIES, CATEGORY_LABELS } from '@/lib/game/board-positions';
import type { GameRoom } from '@/lib/schemas/game-room.schema';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  room: GameRoom;
  currentPlayer: Player;
}

export function PhaseRenderer({ room, currentPlayer }: Props) {
  const actions = useGameActions();
  const state = room.gameState;

  const isCurrentPlayer = state?.currentPlayerId === currentPlayer.id;
  const isHost = room.hostId === currentPlayer.id;
  const currentPlayerName =
    room.players.find((p) => p.id === state?.currentPlayerId)?.pseudo ?? 'Joueur';
  const turn = state?.currentTurn;

  if (!state) return null;

  switch (state.currentPhase) {
    case 'debuter_question':
      return <DebuterPhaseView room={room} currentPlayer={currentPlayer} />;

    case 'waiting_to_start': {
      const currentPos = state.playerPositions[state.currentPlayerId] ?? 0;
      const nextCategory = SQUARE_CATEGORIES[currentPos] ?? 'improbable';
      return (
        <div className="flex w-full flex-col items-start gap-5">
          <div className="kicker">§ 04 · À table</div>
          <h1
            className="font-serif italic"
            style={{
              margin: 0,
              fontWeight: 500,
              fontSize: 'clamp(40px, 6vw, 72px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
            }}
          >
            {isCurrentPlayer ? (
              <>
                À toi,{' '}
                <span style={{ color: 'var(--color-accent)' }}>
                  {currentPlayerName}
                </span>
                .
              </>
            ) : (
              <>
                {currentPlayerName}{' '}
                <span style={{ color: 'var(--color-accent)' }}>réfléchit</span>.
              </>
            )}
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 22,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span className="kicker">Case {currentPos}/50</span>
            <span
              style={{ width: 1, height: 18, background: 'var(--color-rule)' }}
            />
            <span className="kicker">Prochaine catégorie</span>
            <CategoryBadge category={nextCategory} />
          </div>
          {isCurrentPlayer ? (
            <Button
              variant="accent"
              size="lg"
              onClick={() =>
                actions.startTurn(room.id).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
            >
              Tirer une carte →
            </Button>
          ) : (
            <p
              className="font-serif italic"
              style={{ color: 'var(--color-ink-3)', fontSize: 18 }}
            >
              En attente du joueur…
            </p>
          )}
        </div>
      );
    }

    case 'selecting_difficulty':
      if (!turn || turn.question.kind !== 'standard') return null;
      return (
        <div className="flex w-full flex-col items-start gap-6">
          <div className="kicker">§ 05 · Tu mises combien ?</div>
          <DifficultySelector
            question={turn.question}
            disabled={!isCurrentPlayer}
            minDifficulty={state.pendingModifier?.minDifficulty ?? 1}
            maxDifficulty={state.pendingModifier?.maxDifficulty ?? 10}
            onConfirm={(d) =>
              actions.selectDifficulty(room.id, d).catch((err) =>
                alert(err instanceof Error ? err.message : String(err)),
              )
            }
          />
          {!isCurrentPlayer && (
            <p
              className="font-serif italic"
              style={{ color: 'var(--color-ink-3)', fontSize: 16 }}
            >
              {currentPlayerName} choisit sa mise…
            </p>
          )}
        </div>
      );

    case 'modifier_category_select':
      if (!state.pendingModifier) return null;
      return (
        <ModifierCategoryPicker
          roomId={room.id}
          pending={state.pendingModifier}
          isCurrentPlayer={isCurrentPlayer}
          currentPlayerName={currentPlayerName}
        />
      );

    case 'reading_question':
      if (!turn) return null;
      return (
        <div className="flex w-full flex-col items-start gap-6">
          <div className="kicker">§ 06 · Lecture & réflexion</div>
          <h1
            className="font-serif italic"
            style={{
              margin: 0,
              fontWeight: 500,
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
            }}
          >
            {isCurrentPlayer ? (
              <>
                Lis. Réfléchis.{' '}
                <span style={{ color: 'var(--color-accent)' }}>Réponds</span>.
              </>
            ) : (
              <>{currentPlayerName} réfléchit…</>
            )}
          </h1>
          <QuestionCard
            question={turn.question}
            difficulty={turn.selectedDifficulty}
            showAnswer={false}
          />
          {isCurrentPlayer ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-start gap-3"
            >
              <Button
                variant="accent"
                size="lg"
                onClick={() =>
                  actions.revealAnswer(room.id).catch((err) =>
                    alert(err instanceof Error ? err.message : String(err)),
                  )
                }
              >
                J&apos;ai ma réponse · afficher →
              </Button>
              {turn.question.kind === 'intrepide' && (
                <button
                  type="button"
                  onClick={() =>
                    actions.skipCard(room.id).catch((err) =>
                      alert(err instanceof Error ? err.message : String(err)),
                    )
                  }
                  className="btn btn-ghost"
                  style={{ fontSize: 10 }}
                >
                  ↻ Carte infaisable — changer
                </button>
              )}
            </motion.div>
          ) : (
            <p
              className="font-serif italic"
              style={{ color: 'var(--color-ink-3)', fontSize: 18 }}
            >
              Tu peux observer, tu ne peux pas souffler.
            </p>
          )}
        </div>
      );

    case 'answering':
      if (!turn) return null;
      if (turn.question.kind === 'intrepide') {
        const isInstructionVariant =
          turn.question.variant === 'modifier' ||
          turn.question.variant === 'action';
        return (
          <div className="flex w-full flex-col items-start gap-6">
            <div className="kicker">§ 07 · Déclaration</div>
            {isInstructionVariant ? (
              <IntrepideInstructionCard
                question={turn.question}
                roomId={room.id}
                isCurrentPlayer={isCurrentPlayer}
                currentPlayerName={currentPlayerName}
              />
            ) : (
              <IntrepideAnswerCard
                question={turn.question}
                roomId={room.id}
                isCurrentPlayer={isCurrentPlayer}
                currentPlayerName={currentPlayerName}
              />
            )}
          </div>
        );
      }
      return (
        <div className="flex w-full flex-col items-start gap-6">
          <div className="kicker">§ 07 · Déclaration</div>
          <h1
            className="font-serif italic"
            style={{
              margin: 0,
              fontWeight: 500,
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
            }}
          >
            {isCurrentPlayer ? (
              <>
                Tu as trouvé{' '}
                <span style={{ color: 'var(--color-accent)' }}>?</span>
              </>
            ) : (
              <>{currentPlayerName} déclare…</>
            )}
          </h1>
          <p
            style={{
              color: 'var(--color-ink-2)',
              fontSize: 16,
              lineHeight: 1.55,
              maxWidth: 420,
              margin: 0,
            }}
          >
            C&apos;est une déclaration <i>d&apos;honneur</i>. Personne ne vérifiera
            à ta place. Sois honnête — le jeu perd tout si tu triches.
          </p>
          <QuestionCard
            question={turn.question}
            difficulty={turn.selectedDifficulty}
            showAnswer
          />
          {isCurrentPlayer ? (
            <HonorButtons
              difficulty={
                turn.question.kind === 'standard'
                  ? turn.selectedDifficulty
                  : undefined
              }
              onCorrect={() =>
                actions.submitAnswer(room.id, true).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
              onIncorrect={() =>
                actions.submitAnswer(room.id, false).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
            />
          ) : (
            <p
              className="font-serif italic"
              style={{ color: 'var(--color-ink-3)', fontSize: 18 }}
            >
              {currentPlayerName} déclare sa réponse…
            </p>
          )}
        </div>
      );

    case 'revealing_answer': {
      if (!turn) return null;
      const isIntrepideInstruction =
        turn.question.kind === 'intrepide' &&
        (turn.question.variant === 'modifier' ||
          turn.question.variant === 'action');
      const intrepideCorrect =
        turn.question.kind === 'intrepide' && turn.subItemAnswers
          ? Object.values(turn.subItemAnswers).filter(Boolean).length
          : null;
      const advanced =
        intrepideCorrect ??
        (turn.question.kind === 'standard' ? turn.selectedDifficulty : 0);
      const pendingMod = state.pendingModifier;
      const isModifierMiniTurn =
        pendingMod !== null && turn.question.kind === 'standard';
      const isFinalKind = turn.question.kind === 'final';

      let verdictWord: string;
      let verdictSub: string;
      let verdictColor: string;

      if (isFinalKind) {
        if (turn.isCorrect) {
          verdictWord = 'Victoire.';
          verdictSub = `${currentPlayerName} remporte la partie. Case 50 franchie.`;
          verdictColor = 'var(--color-accent)';
        } else {
          verdictWord = 'Pas encore.';
          verdictSub = `${currentPlayerName} reste sur la case 50. Nouvelle tentative au prochain tour.`;
          verdictColor = 'var(--color-ink-2)';
        }
      } else if (isIntrepideInstruction) {
        verdictWord = 'Carte appliquée.';
        verdictSub = 'La règle s\u2019applique immédiatement pour la suite.';
        verdictColor = 'var(--color-cat-intrepide)';
      } else if (isModifierMiniTurn && !turn.isCorrect) {
        if (pendingMod!.kind === 'nib') {
          verdictWord = 'Tu perds.';
          verdictSub = `NIB raté : ${currentPlayerName} est hors course.`;
          verdictColor = 'var(--color-accent)';
        } else {
          verdictWord = 'Dommage.';
          verdictSub = `Recul de ${turn.selectedDifficulty} case${
            turn.selectedDifficulty > 1 ? 's' : ''
          } sur le plateau.`;
          verdictColor = 'var(--color-accent)';
        }
      } else if (advanced > 0) {
        verdictWord = 'Juste.';
        verdictSub = `${currentPlayerName} avance de ${advanced} case${
          advanced > 1 ? 's' : ''
        } sur le plateau. Au joueur suivant.`;
        verdictColor = 'var(--color-ink)';
      } else {
        verdictWord = 'Dommage.';
        verdictSub = `${currentPlayerName} reste sur place. Le pion ne bouge pas.`;
        verdictColor = 'var(--color-accent)';
      }

      return (
        <div className="grid w-full gap-10 md:grid-cols-[1.1fr_1fr] items-start">
          <div>
            <div className="kicker">§ 08 · Verdict</div>
            <div style={{ position: 'relative', marginTop: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif italic"
                style={{
                  fontSize: 'clamp(120px, 18vw, 220px)',
                  lineHeight: 0.85,
                  fontWeight: 500,
                  color: verdictColor,
                  letterSpacing: '-0.04em',
                }}
              >
                {verdictWord}
              </motion.div>
              <div
                className="font-mono"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 20,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: 10,
                  letterSpacing: '0.24em',
                  color: 'var(--color-ink-3)',
                  textTransform: 'uppercase',
                }}
              >
                VERDICT · TOUR DE {currentPlayerName.toUpperCase()}
              </div>
            </div>
            <p
              style={{
                color: 'var(--color-ink-2)',
                fontSize: 17,
                lineHeight: 1.5,
                maxWidth: 460,
                marginTop: 12,
              }}
            >
              {verdictSub}
            </p>
            {isHost && (
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    actions.nextTurn(room.id).catch((err) =>
                      alert(err instanceof Error ? err.message : String(err)),
                    )
                  }
                >
                  Tour suivant →
                </Button>
              </div>
            )}
            {!isHost && (
              <p
                className="font-mono"
                style={{
                  marginTop: 24,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: 'var(--color-ink-3)',
                  textTransform: 'uppercase',
                }}
              >
                En attente de l&apos;hôte…
              </p>
            )}
          </div>
          <QuestionCard
            question={turn.question}
            difficulty={turn.selectedDifficulty}
            showAnswer
          />
        </div>
      );
    }

    case 'turn_complete':
      return (
        <div className="flex flex-col items-start gap-4">
          <div className="kicker">Tour terminé</div>
          <p
            className="font-serif italic"
            style={{ fontSize: 24, color: 'var(--color-ink-2)' }}
          >
            Passage au joueur suivant…
          </p>
        </div>
      );
  }
}

function DebuterPhaseView({
  room,
  currentPlayer,
}: {
  room: GameRoom;
  currentPlayer: Player;
}) {
  const actions = useGameActions();
  const state = room.gameState!;
  const turn = state.currentTurn;
  const [loading, setLoading] = useState<string | null>(null);
  if (!turn || turn.question.kind !== 'debuter') return null;

  const selectedId = state.firstCorrectDebuterId;
  const selectedPlayer = selectedId
    ? room.players.find((p) => p.id === selectedId) ?? null
    : null;

  const handleSelect = async (playerId: string) => {
    setLoading(playerId);
    try {
      await actions.selectStartingPlayer(room.id, playerId);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
      setLoading(null);
    }
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-start gap-6">
      <div>
        <div className="kicker">§ 00 · Début de partie</div>
        <h1
          className="font-serif italic"
          style={{
            margin: '10px 0 6px',
            fontWeight: 500,
            fontSize: 'clamp(40px, 5vw, 56px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
          }}
        >
          Qui <span style={{ color: 'var(--color-accent)' }}>commence</span> ?
        </h1>
        <p
          style={{
            color: 'var(--color-ink-2)',
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          Appliquez l&apos;instruction puis désignez le joueur qui démarre.
        </p>
      </div>

      <div className="paper-card w-full p-7">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <CategoryBadge category="debuter" />
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--color-ink-3)',
            }}
          >
            CARTE #{turn.question.numero}
          </span>
        </div>
        <hr className="rule-thick" />
        <p
          className="font-serif"
          style={{
            margin: '20px 0 0',
            fontSize: 24,
            lineHeight: 1.35,
            color: 'var(--color-ink)',
          }}
        >
          {turn.question.textePrincipal}
        </p>
        {turn.question.texteSecondaire && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              border: '1px solid var(--color-rule)',
              background: 'var(--color-paper)',
            }}
          >
            <div className="kicker">En cas d&apos;égalité</div>
            <p
              className="font-serif italic"
              style={{
                marginTop: 6,
                fontSize: 16,
                color: 'var(--color-ink-2)',
                lineHeight: 1.5,
              }}
            >
              {turn.question.texteSecondaire}
            </p>
          </div>
        )}
      </div>

      {selectedPlayer ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="paper-card-raised w-full p-6"
          style={{ textAlign: 'center', borderColor: 'var(--color-accent)' }}
        >
          <div className="kicker kicker-accent">Commence la partie</div>
          <div
            className="font-serif italic"
            style={{
              fontSize: 40,
              fontWeight: 500,
              marginTop: 4,
              color: 'var(--color-ink)',
            }}
          >
            🏆 {selectedPlayer.pseudo}
          </div>
        </motion.div>
      ) : (
        <div className="w-full">
          <div className="kicker mb-3">Désigne le joueur qui démarre</div>
          <hr className="rule" style={{ marginBottom: 10 }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {room.players.map((p) => (
              <li
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 2px',
                  borderBottom: '1px solid var(--color-rule)',
                }}
              >
                <span
                  className="font-serif italic"
                  style={{ fontSize: 24, fontWeight: 500 }}
                >
                  {p.pseudo}
                  {p.id === currentPlayer.id && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.16em',
                        color: 'var(--color-ink-3)',
                        marginLeft: 8,
                        textTransform: 'uppercase',
                      }}
                    >
                      (toi)
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleSelect(p.id)}
                  disabled={loading !== null}
                  className="btn btn-primary"
                >
                  {loading === p.id ? '…' : 'Commence →'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
