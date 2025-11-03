"use client";

interface Props {
  totalCompletedDays: number;
}

export default function StreaksBatches({ totalCompletedDays }: Props) {
  const getBatch = () => {
    if (totalCompletedDays >= 365) return "Yearly Sports Freak Batch 🏆";
    if (totalCompletedDays >= 30) return "Consistent Player Batch 🎖️";
    if (totalCompletedDays >= 7) return "Beginner Batch 🥇";
    if (totalCompletedDays >= 1) return "Welcome Batch 👋";
    return "No batch earned yet";
  };

  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="font-semibold text-gray-700 mb-2">Your Batches</h2>
      <p className="text-lg font-bold">{getBatch()}</p>
    </div>
  );
}
