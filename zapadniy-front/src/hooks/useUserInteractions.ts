import { useState, useEffect, useCallback } from 'react';
import { interactionService, Interaction } from '../services';

export type InteractionDirection = 'sent' | 'received';

export function useUserInteractions(userId: string | null | undefined, initialDirection: InteractionDirection = 'received') {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<InteractionDirection>(initialDirection);

  const fetchInteractions = useCallback(async (currentUserId: string, currentDirection: InteractionDirection) => {
    if (!currentUserId) {
      setInteractions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedInteractions = await interactionService.getUserInteractions(currentUserId, currentDirection);
      setInteractions(fetchedInteractions);
    } catch (err) {
      console.error(`Failed to fetch ${currentDirection} interactions:`, err);
      setError(`Failed to fetch ${currentDirection} interactions`);
      setInteractions([]); // Clear interactions on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchInteractions(userId, direction);
    }
  }, [userId, direction, fetchInteractions]);

  // Function to manually refresh interactions
  const refreshInteractions = () => {
    if (userId) {
      fetchInteractions(userId, direction);
    }
  };

  return { 
    interactions, 
    loading, 
    error, 
    direction, 
    setDirection, 
    refreshInteractions 
  };
} 