"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Dumbbell, Plus, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getWorkouts } from "@/lib/workout-service"
import type { Workout } from "@/lib/types"

export default function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([])

  useEffect(() => {
    const loadWorkouts = () => {
      const data = getWorkouts()
      setWorkouts(data)

      // Update stats
      document.getElementById("total-workouts")!.textContent = data.length.toString()

      if (data.length > 0) {
        const lastWorkoutName = data.reduce(
          (latest, workout) => {
            if (!latest || !latest.date) return workout
            if (!workout.date) return latest
            return new Date(workout.date) > new Date(latest.date) ? workout : latest
          },
          null as Workout | null,
        )?.name

        document.getElementById("last-workout")!.textContent = lastWorkoutName || "-"

        // Find most frequent workout
        const workoutCounts = data.reduce(
          (counts, workout) => {
            counts[workout.name] = (counts[workout.name] || 0) + 1
            return counts
          },
          {} as Record<string, number>,
        )

        let mostFrequent = ""
        let highestCount = 0

        Object.entries(workoutCounts).forEach(([name, count]) => {
          if (count > highestCount) {
            mostFrequent = name
            highestCount = count
          }
        })

        document.getElementById("frequent-workout")!.textContent = mostFrequent || "-"
      }
    }

    loadWorkouts()

    // Add event listener for storage changes
    window.addEventListener("storage", loadWorkouts)

    return () => {
      window.removeEventListener("storage", loadWorkouts)
    }
  }, [])

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <div className="bg-primary/10 p-3 rounded-full mb-3">
          <Dumbbell className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground mb-4">No workouts added yet</p>
        <Link href="/add-workout">
          <Button className="shadow-sm hover:shadow-md transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Workout
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <div key={workout.id} className="relative">
          <Link href={`/workout/${workout.id}`}>
            <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all duration-200 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm hover:shadow-md pr-12">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{workout.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {workout.history && workout.history.length > 0
                      ? `${workout.history.length} entries`
                      : "No entries yet"}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {workout.history && workout.history.length > 0 && (
                  <div className="text-lg font-semibold mr-2">
                    {workout.history[workout.history.length - 1].weight} lbs
                  </div>
                )}
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Link>
          <Link
            href={`/edit-workout/${workout.id}`}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
          >
            <Pencil className="h-4 w-4 text-primary" />
          </Link>
        </div>
      ))}
    </div>
  )
}
