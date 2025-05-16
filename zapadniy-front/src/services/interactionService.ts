import api from './api';
import { User } from '../types'; // Assuming User type might be useful, though not directly in request bodies

// Define the structure of an interaction record based on API docs
export interface Interaction {
  userId: string;
  reportedUserId: string;
  type: 'report' | 'like' | 'dislike';
  message: string;
  timestamp: number; // UnixNano timestamp
}

// Define request body types for clarity
interface ReportRequestBody {
  userId: string;
  reportedUserId: string;
  message: string;
}

interface LikeDislikeRequestBody {
  userId: string;
  reportedUserId: string;
}

export const interactionService = {
  recordReport: async (userId: string, reportedUserId: string, message: string): Promise<Interaction> => {
    const requestBody: ReportRequestBody = { userId, reportedUserId, message };
    // The vite.config.js proxies /user-report-api to the actual service.
    // The API description shows paths like /app/report
    const response = await api.post('../user-report-api/app/report', requestBody);
    return response.data;
  },

  recordLike: async (userId: string, likedUserId: string): Promise<Interaction> => {
    const requestBody: LikeDislikeRequestBody = { userId, reportedUserId: likedUserId };
    const response = await api.post('../user-report-api/app/like', requestBody);
    return response.data;
  },

  recordDislike: async (userId: string, dislikedUserId: string): Promise<Interaction> => {
    const requestBody: LikeDislikeRequestBody = { userId, reportedUserId: dislikedUserId };
    const response = await api.post('../user-report-api/app/dislike', requestBody);
    return response.data;
  },

  getUserInteractions: async (userId: string, direction: 'sent' | 'received'): Promise<Interaction[]> => {
    const response = await api.get(`../user-report-api/app/user/${userId}/interactions/${direction}`);
    return response.data;
  },
}; 