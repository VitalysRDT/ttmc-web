'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createRoom } from '@/lib/api/client-actions';

export function CreateRoomButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const room = await createRoom();
      router.push(`/lobby/${room.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={handleCreate} loading={loading}>
        CRÉER UNE PARTIE
      </Button>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}
