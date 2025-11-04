"use client";

import { useState, useEffect } from "react";
import { fetcher, getAuthHeaders } from "@/lib/api";
import ActivityForm from "@/components/ActivityForm";
import ProgressStats from "@/components/ProgressStats";
import StreaksBatches from "@/components/StreaksBatches";
import CoinRecovery from "@/components/CoinRecovery";

interface ActivityType {
  _id: string;
  exerciseType: string;
  duration: number;
  durationUnit: string;
  caloriesBurned: number;
  date: string;
  imageUrl: string;
}

export default function Dashboard() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("farr_token");
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchActivities = async () => {
      try {
        const data = await fetcher("/api/activity/me", {
          headers: getAuthHeaders(token),
        });

        if (isMounted) {
          setActivities(data.activities);
          setCurrentStreak(data.currentStreak);
          setLongestStreak(data.longestStreak);
          setTotalCompletedDays(data.totalCompletedDays);
          setTotalCalories(data.totalCalories);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching activities:", err);
          setError("Failed to load activities. Please try again later.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button
          onClick={() => location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to Farr Dashboard</h1>

      <ActivityForm onSubmit={() => void 0} />

      <ProgressStats
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalCompletedDays={totalCompletedDays}
        totalCalories={totalCalories}
      />

      <StreaksBatches totalCompletedDays={totalCompletedDays} />

      <CoinRecovery onRecover={() => void 0} />

      {activities.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Your Recent Activities</h2>
          <ul className="space-y-2">
            {activities.map((activity) => (
              <li
                key={activity._id}
                className="p-3 border rounded-lg shadow-sm hover:bg-gray-50"
              >
                <p className="font-medium">{activity.exerciseType}</p>
                <p className="text-sm text-gray-600">
                  {activity.duration} {activity.durationUnit} | {activity.caloriesBurned} kcal
                </p>
                <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 mt-6 text-center">No activities found yet. Add one to get started!</p>
      )}
    </div>
  );
}
