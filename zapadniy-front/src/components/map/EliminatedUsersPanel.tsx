import React, { useState, useEffect } from "react";
import { User, GeoLocation } from "../../types";
import { regionService } from "../../services/regionService";

interface EliminatedUsersPanelProps {
  regionId: string | null;
  isVisible: boolean;
  onClose: () => void;
  onActivityPathGenerated?: (path: GeoLocation[] | null) => void;
}

const EliminatedUsersPanel: React.FC<EliminatedUsersPanelProps> = ({
  regionId,
  isVisible,
  onClose,
  onActivityPathGenerated,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState({ min: 0, max: 1 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (regionId && isVisible) {
      fetchEliminatedUsers();
    }
    if (!isVisible) {
      setSelectedUser(null);
      onActivityPathGenerated?.(null);
    }
  }, [regionId, isVisible, onActivityPathGenerated]);

  const fetchEliminatedUsers = async () => {
    if (!regionId) return;

    setLoading(true);
    setError(null);
    try {
      const eliminatedUsers = await regionService.getEliminatedUsers(regionId);
      setUsers(eliminatedUsers);
    } catch (err) {
      setError("Failed to fetch eliminated users");
      console.error("Error fetching eliminated users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newTimeRange = {
      ...timeRange,
      [name]: parseFloat(value),
    };

    if (name === "min" && parseFloat(value) > timeRange.max) {
      newTimeRange.max = parseFloat(value);
    }
    if (name === "max" && parseFloat(value) < timeRange.min) {
      newTimeRange.min = parseFloat(value);
    }
    
    setTimeRange(newTimeRange);

    if (selectedUser) {
      fetchUserActivity(selectedUser, newTimeRange);
    }
  };

  const fetchUserActivity = async (user: User, currentViewTimeRange: {min: number, max: number}) => {
    if (!user.id || !user.currentLocation) {
      console.error("Selected user has no ID or initial location to plot path.");
      onActivityPathGenerated?.(null);
      return;
    }
    setError(null);
    console.log(`[fetchUserActivity] Called with user: ${user.id}, timeRange:`, currentViewTimeRange);

    try {
      const cacheBuster = `&_cb=${new Date().getTime()}`;
      const response = await fetch(
        `/user-activity-api/user/${user.id}?min=${currentViewTimeRange.min}&max=${currentViewTimeRange.max}${cacheBuster}`
      );
      console.log(`[fetchUserActivity] Response status: ${response.status}, ok: ${response.ok}`);

      if (!response.ok) {
        if (response.status === 404) {
          try {
            const errorText = await response.text();
            console.log("[fetchUserActivity] 404 error text:", errorText);
            if (errorText.startsWith("No data found for user")) {
              onActivityPathGenerated?.(null);
              return;
            }
          } catch (textError) {
            console.error("[fetchUserActivity] Failed to parse 404 error text:", textError);
          }
        }
        console.error(`[fetchUserActivity] Error fetching: ${response.status} ${response.statusText}`);
        setError(`Failed to fetch user activity (HTTP ${response.status}).`);
        onActivityPathGenerated?.(null);
        return;
      }

      const activityData = await response.json();
      console.log("[fetchUserActivity] Received activityData:", activityData);

      if (activityData && activityData.data && Array.isArray(activityData.data) && activityData.data.length > 0) {
        const path: GeoLocation[] = [{ ...user.currentLocation }];
        let currentLat = user.currentLocation.latitude;
        let currentLon = user.currentLocation.longitude;

        for (const move of activityData.data) {
          if (typeof move.dx === 'number' && typeof move.dy === 'number') {
            currentLon += move.dx;
            currentLat += move.dy;
            path.push({ latitude: currentLat, longitude: currentLon });
          }
        }
        console.log("[fetchUserActivity] Path generated with points:", path.length);
        onActivityPathGenerated?.(path);
      } else {
        console.log("[fetchUserActivity] No data points in activityData or unexpected format. Clearing path.");
        onActivityPathGenerated?.(null);
      }
    } catch (err) {
      console.error("[fetchUserActivity] Network or JSON parsing error:", err);
      setError("Failed to fetch user activity due to a network or data parsing issue.");
      onActivityPathGenerated?.(null);
    }
  };
  
  useEffect(() => {
    if (!selectedUser) {
        onActivityPathGenerated?.(null);
    }
  }, [selectedUser, onActivityPathGenerated]);

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4 overflow-y-auto z-[1001]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Eliminated Users</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                name="min"
                min="0"
                max="1"
                step="0.01"
                value={timeRange.min}
                onChange={handleTimeRangeChange}
                className="w-full"
              />
              <input
                type="range"
                name="max"
                min="0"
                max="1"
                step="0.01"
                value={timeRange.max}
                onChange={handleTimeRangeChange}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{timeRange.min.toFixed(2)}</span>
              <span>{timeRange.max.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-3 rounded cursor-pointer ${
                  selectedUser?.id === user.id
                    ? "bg-blue-100 border border-blue-300"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  fetchUserActivity(user, timeRange);
                }}
              >
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-gray-500">
                  Social Rating: {user.socialRating}
                </div>
                <div className="text-sm text-gray-500">
                  Status: {user.status}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EliminatedUsersPanel;
