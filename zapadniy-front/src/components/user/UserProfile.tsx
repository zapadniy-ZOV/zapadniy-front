import React from 'react';
import { User, SocialStatus } from '../../types';
import { IdentificationIcon, MapPinIcon, ClockIcon, PaperAirplaneIcon, InboxArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useUserInteractions, InteractionDirection } from '../../hooks/useUserInteractions';
import { Interaction } from '../../services/interactionService';

interface UserProfileProps {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const STATUS_DESCRIPTIONS = {
  [SocialStatus.LOW]: 'Your social rating is concerning. Immediate improvement required.',
  [SocialStatus.REGULAR]: 'Your social rating is acceptable. Continue being a good citizen.',
  [SocialStatus.IMPORTANT]: 'You are an important member of society. Special privileges granted.',
  [SocialStatus.VIP]: 'You are a VIP citizen. Maximum privileges and government protection.'
};

const STATUS_COLORS = {
  [SocialStatus.LOW]: 'bg-red-100 text-red-800 border-red-300',
  [SocialStatus.REGULAR]: 'bg-blue-100 text-blue-800 border-blue-300',
  [SocialStatus.IMPORTANT]: 'bg-purple-100 text-purple-800 border-purple-300',
  [SocialStatus.VIP]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const UserProfile: React.FC<UserProfileProps> = ({ user, loading, error }) => {
  const { 
    interactions, 
    loading: interactionsLoading, 
    error: interactionsError, 
    direction, 
    setDirection,
    refreshInteractions
  } = useUserInteractions(user?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">User profile not available.</p>
      </div>
    );
  }

  const lastUpdateTime = new Date(user.lastLocationUpdateTimestamp).toLocaleTimeString();

  const formatInteractionTimestamp = (timestamp: number) => {
    return new Date(timestamp / 1000000).toLocaleString();
  };

  return (
    <div className="card p-6">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
          <IdentificationIcon className="w-12 h-12 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold">{user.fullName}</h2>
        <p className="text-gray-500">@{user.username}</p>
        
        <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold border ${STATUS_COLORS[user.status]}`}>
          {user.status}
        </div>
        
        <div className="mt-6 w-full">
          <div className="relative pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-200 text-gray-600">
                  Social Rating
                </span>
              </div>
              <div>
                <span 
                  className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                    user.socialRating < 30 ? 'bg-red-200 text-red-600' : 
                    user.socialRating < 70 ? 'bg-yellow-200 text-yellow-600' : 
                    'bg-green-200 text-green-600'
                  }`}
                >
                  {user.socialRating}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 mt-1">
              <div 
                style={{ width: `${user.socialRating}%` }} 
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  user.socialRating < 30 ? 'bg-red-500' : 
                  user.socialRating < 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
              ></div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-2 text-center">
          {STATUS_DESCRIPTIONS[user.status]}
        </p>
        
        <div className="mt-6 w-full bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">
              Current Location: ({user.currentLocation.latitude.toFixed(4)}, {user.currentLocation.longitude.toFixed(4)})
            </span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Last Updated: {lastUpdateTime}</span>
          </div>
        </div>
      </div>

      {/* User Interactions Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">User Interactions</h3>
          <button 
            onClick={refreshInteractions} 
            className="p-1 text-gray-500 hover:text-gray-700" 
            title="Refresh Interactions"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex space-x-2 mb-4 border-b border-gray-200">
          <button 
            onClick={() => setDirection('received')} 
            className={`py-2 px-4 font-medium text-sm rounded-t-md flex items-center gap-2 ${direction === 'received' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <InboxArrowDownIcon className="h-5 w-5" /> Received
          </button>
          <button 
            onClick={() => setDirection('sent')} 
            className={`py-2 px-4 font-medium text-sm rounded-t-md flex items-center gap-2 ${direction === 'sent' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <PaperAirplaneIcon className="h-5 w-5" /> Sent
          </button>
        </div>

        {interactionsLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading interactions...</p>
          </div>
        )}

        {interactionsError && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {interactionsError}
          </div>
        )}

        {!interactionsLoading && !interactionsError && interactions.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">No {direction} interactions found.</p>
          </div>
        )}

        {!interactionsLoading && !interactionsError && interactions.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {interactions.map((interaction: Interaction, index: number) => (
              <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${ 
                      interaction.type === 'like' ? 'bg-green-100 text-green-700' : 
                      interaction.type === 'dislike' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700' 
                    }`}>
                      {interaction.type}
                    </span>
                    {direction === 'received' && <p className="text-sm text-gray-700 mt-1">From: <span className="font-medium">User {interaction.userId}</span></p>}
                    {direction === 'sent' && <p className="text-sm text-gray-700 mt-1">To: <span className="font-medium">User {interaction.reportedUserId}</span></p>}
                  </div>
                  <p className="text-xs text-gray-400">{formatInteractionTimestamp(interaction.timestamp)}</p>
                </div>
                {interaction.message && interaction.type === 'report' && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">Message: {interaction.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 