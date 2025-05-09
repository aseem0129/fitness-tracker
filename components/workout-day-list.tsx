"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Calendar, Plus, Flame } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getWorkoutDays, getWorkoutsForDay } from "@/lib/workout-service"
import type { WorkoutDay } from "@/lib/types"

export default function WorkoutDayList() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])

  useEffect(() => {
    const loadWorkoutDays = () => {
      const data = getWorkoutDays()
      setWorkoutDays(data)
    }

    loadWorkoutDays()

    // Add event listener for storage changes
    window.addEventListener("storage", loadWorkoutDays)

    return () => {
      window.removeEventListener("storage", loadWorkoutDays)
    }
  }, [])

  if (workoutDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <div className="bg-primary/10 p-3 rounded-full mb-3">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground mb-4">No workout days added yet</p>
        <Link href="/add-workout-day">
          <Button className="shadow-sm hover:shadow-md transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Workout Day
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workoutDays.map((day) => {
        const workouts = getWorkoutsForDay(day.id)
        const hasWarmups = day.warmups && day.warmups.length > 0

        return (
          <Link key={day.id} href={`/workout-day/${day.id}`}>
            <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all duration-200 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{day.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {workouts.length} {workouts.length === 1 ? "workout" : "workouts"}
                    </p>
                    {hasWarmups && (
                      <div className="flex items-center text-sm text-orange-500">
                        <Flame className="h-3 w-3 mr-1" />
                        <span>
                          {day.warmups.length} warmup{day.warmups.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
