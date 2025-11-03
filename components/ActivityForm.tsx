"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { fetcher, getAuthHeaders } from "@/lib/api";

interface Props {
  onSubmit: () => void;
}

type DurationUnit = "number" | "minutes";
type ExerciseType =
  | "Upper Limbs"
  | "Swimming"
  | "Rock Climbing"
  | "Rowing"
  | "Throwing Ball"
  | "Resistance Band"
  | "Pushups"
  | "Bicep Curls"
  | "Handstands"
  | "Arm Bike"
  | "Lower Limbs"
  | "Running"
  | "Walking Lunges"
  | "Romanian Deadlifts"
  | "Squats"
  | "Calf Raises"
  | "Cycling"
  | "Jumping"
  | "Soccer"
  | "Basketball"
  | "Core"
  | "Planks"
  | "Sit-ups"
  | "Russian Twists"
  | "Good Mornings"
  | "Medicine Ball"
  | "Misc Sports"
  | "Martial Arts"
  | "Dancing"
  | "Volleyball"
  | "Badminton";

export default function ActivityForm({ onSubmit }: Props) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>("Upper Limbs");
  const [duration, setDuration] = useState<number>(0);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("number");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const token = localStorage.getItem("farr_token");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return alert("Unauthorized");

    const formData = new FormData();
    formData.append("exerciseType", exerciseType);
    formData.append("duration", duration.toString());
    formData.append("durationUnit", durationUnit);
    if (imageFile) formData.append("image", imageFile);

    try {
      await fetcher("/api/activity/submit", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: formData,
      });
      onSubmit();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  return (
    <form className="mb-6 p-4 border rounded-md" onSubmit={handleSubmit}>
      <h2 className="font-semibold mb-2">Submit Daily Activity</h2>

      <select
        value={exerciseType}
        onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
        className="border p-2 rounded mb-2 w-full"
      >
        <option value="Upper Limbs">Upper Limbs</option>
        <option value="Lower Limbs">Lower Limbs</option>
        <option value="Core">Core</option>
        <option value="Misc Sports">Misc Sports</option>
        <option value="Swimming">Swimming</option>
        <option value="Rock Climbing">Rock Climbing</option>
        <option value="Rowing">Rowing</option>
        <option value="Throwing Ball">Throwing Ball</option>
        <option value="Resistance Band">Resistance Band</option>
        <option value="Pushups">Pushups</option>
        <option value="Bicep Curls">Bicep Curls</option>
        <option value="Handstands">Handstands</option>
        <option value="Arm Bike">Arm Bike</option>
        <option value="Running">Running</option>
        <option value="Walking Lunges">Walking Lunges</option>
        <option value="Romanian Deadlifts">Romanian Deadlifts</option>
        <option value="Squats">Squats</option>
        <option value="Calf Raises">Calf Raises</option>
        <option value="Cycling">Cycling</option>
        <option value="Jumping">Jumping</option>
        <option value="Soccer">Soccer</option>
        <option value="Basketball">Basketball</option>
        <option value="Planks">Planks</option>
        <option value="Sit-ups">Sit-ups</option>
        <option value="Russian Twists">Russian Twists</option>
        <option value="Good Mornings">Good Mornings</option>
        <option value="Medicine Ball">Medicine Ball</option>
        <option value="Martial Arts">Martial Arts</option>
        <option value="Dancing">Dancing</option>
        <option value="Volleyball">Volleyball</option>
        <option value="Badminton">Badminton</option>
      </select>

      <input
        type="number"
        placeholder="Duration"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="border p-2 rounded mb-2 w-full"
        required
      />

      <select
        value={durationUnit}
        onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
        className="border p-2 rounded mb-2 w-full"
      >
        <option value="number">Number</option>
        <option value="minutes">Minutes</option>
      </select>

      <input type="file" onChange={handleFileChange} className="mb-2" />

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Submit
      </button>
    </form>
  );
}
