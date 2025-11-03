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
  const token = localStorage.getItem("farr_token"); // Example token storage

  const fetchActivities = async () => {
    if (!token) return;
    const data = await fetcher("/api/activity/me", {
      headers: getAuthHeaders(token),
    });
    setActivities(data.activities);
    setCurrentStreak(data.currentStreak);
    setLongestStreak(data.longestStreak);
    setTotalCompletedDays(data.totalCompletedDays);
    setTotalCalories(data.totalCalories);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to Farr Dashboard</h1>

      {/* Activity submission form */}
      <ActivityForm onSubmit={fetchActivities} />

      {/* Progress stats */}
      <ProgressStats
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalCompletedDays={totalCompletedDays}
        totalCalories={totalCalories}
      />

      {/* Streaks and Batches */}
      <StreaksBatches totalCompletedDays={totalCompletedDays} />

      {/* Coin recovery */}
      <CoinRecovery onRecover={fetchActivities} />
    </div>
  );
}
