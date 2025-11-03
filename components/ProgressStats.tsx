"use client";

interface Props {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  totalCalories: number;
}

export default function ProgressStats({
  currentStreak,
  longestStreak,
  totalCompletedDays,
  totalCalories,
}: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded shadow text-center">
        <p className="font-semibold text-gray-600">Current Streak</p>
        <p className="text-2xl font-bold">{currentStreak} days</p>
      </div>
      <div className="p-4 bg-white rounded shadow text-center">
        <p className="font-semibold text-gray-600">Longest Streak</p>
        <p className="text-2xl font-bold">{longestStreak} days</p>
      </div>
      <div className="p-4 bg-white rounded shadow text-center">
        <p className="font-semibold text-gray-600">Completed Days</p>
        <p className="text-2xl font-bold">{totalCompletedDays}</p>
      </div>
      <div className="p-4 bg-white rounded shadow text-center">
        <p className="font-semibold text-gray-600">Calories Burned</p>
        <p className="text-2xl font-bold">{totalCalories}</p>
      </div>
    </div>
  );
}
