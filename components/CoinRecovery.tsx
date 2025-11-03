"use client";

import { useState } from "react";
import { fetcher, getAuthHeaders } from "@/lib/api";

interface Props {
  onRecover: () => void;
}

export default function CoinRecovery({ onRecover }: Props) {
  const [recovering, setRecovering] = useState(false);
  const token = localStorage.getItem("farr_token");

  const handleRecover = async () => {
    if (!token) return alert("Unauthorized");
    setRecovering(true);

    try {
      await fetcher("/api/activity/recover", {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      alert("Day recovered successfully!");
      onRecover();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("An unknown error occurred");
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow text-center">
      <h2 className="font-semibold text-gray-700 mb-2">Recover Missed Day</h2>
      <button
        className={`bg-green-500 text-white px-4 py-2 rounded ${recovering ? "opacity-50" : ""}`}
        onClick={handleRecover}
        disabled={recovering}
      >
        {recovering ? "Recovering..." : "Spend Coin to Recover"}
      </button>
    </div>
  );
}
