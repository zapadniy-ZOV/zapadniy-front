import { useState, useEffect } from 'react';
import { User, GeoLocation } from '../types';
import { userService, socketService, interactionService } from '../services';

export function useNearbyUsers(currentLocation: GeoLocation | null, currentUserId: string | undefined, maxDistance: number = 5) {
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      if (!currentLocation) {
        setLoading(false);
        return;
      }

      try {
        const users = await userService.getUsersNearLocation(currentLocation, maxDistance);
        // Filter out the current user
        const filteredUsers = users.filter(user => user.id !== currentUserId);
        setNearbyUsers(filteredUsers);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch nearby users');
        setLoading(false);
      }
    };

    fetchNearbyUsers();

    // Set up socket listener for real-time updates
    if (socketService.isConnected()) {
      socketService.onUsersNearbyUpdate((users) => {
        const filteredUsers = users.filter(user => user.id !== currentUserId);
        setNearbyUsers(filteredUsers);
      });
    }

    // Update every 30 seconds as a fallback if socket doesn't work
    const interval = setInterval(fetchNearbyUsers, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [currentLocation, currentUserId, maxDistance]);

  const rateUser = async (userId: string, rating: number) => {
    try {
      // Pass the current user ID as the rater
      await userService.updateSocialRating(userId, rating, currentUserId);
      
      // Also record the like/dislike interaction
      if (currentUserId) {
        if (rating > 0) {
          await interactionService.recordLike(currentUserId, userId);
        } else {
          await interactionService.recordDislike(currentUserId, userId);
        }
      }
    } catch (err) {
      console.error('Failed to rate user or record interaction:', err); // Log the error
      setError('Failed to rate user or record interaction');
    }
  };

  return { nearbyUsers, loading, error, rateUser };
} 