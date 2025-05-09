import type { Workout, WorkoutEntry, WorkoutDay, Warmup } from "./types"

const WORKOUTS_STORAGE_KEY = "fitness-tracker-workouts"
const WORKOUT_DAYS_STORAGE_KEY = "fitness-tracker-workout-days"

// Get all workouts
export function getWorkouts(): Workout[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(WORKOUTS_STORAGE_KEY)
  return storedData ? JSON.parse(storedData) : []
}

// Get all workout days
export function getWorkoutDays(): WorkoutDay[] {
  if (typeof window === "undefined") return []

  const storedData = localStorage.getItem(WORKOUT_DAYS_STORAGE_KEY)
  return storedData ? JSON.parse(storedData) : []
}

// Get a specific workout by ID
export function getWorkoutById(id: string): Workout | null {
  const workouts = getWorkouts()
  return workouts.find((workout) => workout.id === id) || null
}

// Get a specific workout day by ID
export function getWorkoutDayById(id: string): WorkoutDay | null {
  const days = getWorkoutDays()
  return days.find((day) => day.id === id) || null
}

// Get workouts for a specific day
export function getWorkoutsForDay(dayId: string): Workout[] {
  const day = getWorkoutDayById(dayId)
  if (!day) return []

  const workouts = getWorkouts()
  return workouts.filter((workout) => day.workouts.includes(workout.id))
}

// Add a new workout day
export function addWorkoutDay(day: WorkoutDay): WorkoutDay {
  const days = getWorkoutDays()
  days.push(day)
  saveWorkoutDays(days)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))

  return day
}

// Update a workout day
export function updateWorkoutDay(day: WorkoutDay): WorkoutDay {
  const days = getWorkoutDays()
  const index = days.findIndex((d) => d.id === day.id)

  if (index !== -1) {
    days[index] = day
    saveWorkoutDays(days)

    // Trigger storage event for other components to update
    window.dispatchEvent(new Event("storage"))
  }

  return day
}

// Add a warmup to a workout day
export function addWarmup(dayId: string, warmup: Warmup): void {
  const days = getWorkoutDays()
  const dayIndex = days.findIndex((d) => d.id === dayId)

  if (dayIndex === -1) return

  if (!days[dayIndex].warmups) {
    days[dayIndex].warmups = []
  }

  days[dayIndex].warmups.push(warmup)
  saveWorkoutDays(days)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))
}

// Update a warmup
export function updateWarmup(dayId: string, warmup: Warmup): void {
  const days = getWorkoutDays()
  const dayIndex = days.findIndex((d) => d.id === dayId)

  if (dayIndex === -1 || !days[dayIndex].warmups) return

  const warmupIndex = days[dayIndex].warmups.findIndex((w) => w.id === warmup.id)

  if (warmupIndex !== -1) {
    days[dayIndex].warmups[warmupIndex] = warmup
    saveWorkoutDays(days)

    // Trigger storage event for other components to update
    window.dispatchEvent(new Event("storage"))
  }
}

// Delete a warmup
export function deleteWarmup(dayId: string, warmupId: string): void {
  const days = getWorkoutDays()
  const dayIndex = days.findIndex((d) => d.id === dayId)

  if (dayIndex === -1 || !days[dayIndex].warmups) return

  days[dayIndex].warmups = days[dayIndex].warmups.filter((w) => w.id !== warmupId)
  saveWorkoutDays(days)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))
}

// Add a workout to a day
export function addWorkoutToDay(dayId: string, workoutId: string): void {
  const days = getWorkoutDays()
  const dayIndex = days.findIndex((d) => d.id === dayId)

  if (dayIndex === -1) return

  if (!days[dayIndex].workouts.includes(workoutId)) {
    days[dayIndex].workouts.push(workoutId)
    saveWorkoutDays(days)

    // Update the workout with the dayId reference
    const workouts = getWorkouts()
    const workoutIndex = workouts.findIndex((w) => w.id === workoutId)
    if (workoutIndex !== -1) {
      workouts[workoutIndex].dayId = dayId
      saveWorkouts(workouts)
    }

    // Trigger storage event for other components to update
    window.dispatchEvent(new Event("storage"))
  }
}

// Add a new workout
export function addWorkout(workout: Workout): void {
  const workouts = getWorkouts()

  // Initialize history with the first entry
  const newWorkout: Workout = {
    ...workout,
    history: [
      {
        sets: workout.sets,
        reps: workout.reps,
        weight: workout.weight,
        date: workout.date,
      },
    ],
  }

  workouts.push(newWorkout)
  saveWorkouts(workouts)

  // If this workout belongs to a day, add it to that day
  if (workout.dayId) {
    addWorkoutToDay(workout.dayId, newWorkout.id)
  }

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))
}

// Update a workout
export function updateWorkout(workout: Workout): void {
  const workouts = getWorkouts()
  const index = workouts.findIndex((w) => w.id === workout.id)

  if (index !== -1) {
    workouts[index] = workout
    saveWorkouts(workouts)

    // Trigger storage event for other components to update
    window.dispatchEvent(new Event("storage"))
  }
}

// Add a new entry to an existing workout
export function addWorkoutEntry(workoutId: string, entry: WorkoutEntry): Workout {
  const workouts = getWorkouts()
  const workoutIndex = workouts.findIndex((w) => w.id === workoutId)

  if (workoutIndex === -1) throw new Error("Workout not found")

  if (!workouts[workoutIndex].history) {
    workouts[workoutIndex].history = []
  }

  // Always add the new entry (don't overwrite existing entries with same date)
  workouts[workoutIndex].history!.push(entry)
  saveWorkouts(workouts)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))

  return workouts[workoutIndex]
}

// Update a workout entry
export function updateWorkoutEntry(workoutId: string, entryIndex: number, updatedEntry: WorkoutEntry): Workout {
  const workouts = getWorkouts()
  const workoutIndex = workouts.findIndex((w) => w.id === workoutId)

  if (workoutIndex === -1) throw new Error("Workout not found")
  if (!workouts[workoutIndex].history) throw new Error("Workout has no history")
  if (entryIndex < 0 || entryIndex >= workouts[workoutIndex].history.length) {
    throw new Error("Entry index out of bounds")
  }

  workouts[workoutIndex].history[entryIndex] = updatedEntry
  saveWorkouts(workouts)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))

  return workouts[workoutIndex]
}

// Delete a workout entry
export function deleteWorkoutEntry(workoutId: string, entryIndex: number): Workout {
  const workouts = getWorkouts()
  const workoutIndex = workouts.findIndex((w) => w.id === workoutId)

  if (workoutIndex === -1) throw new Error("Workout not found")
  if (!workouts[workoutIndex].history) throw new Error("Workout has no history")
  if (entryIndex < 0 || entryIndex >= workouts[workoutIndex].history.length) {
    throw new Error("Entry index out of bounds")
  }

  workouts[workoutIndex].history.splice(entryIndex, 1)
  saveWorkouts(workouts)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))

  return workouts[workoutIndex]
}

// Get all entries for a specific date
export function getEntriesByDate(workoutId: string, date: string): WorkoutEntry[] {
  const workout = getWorkoutById(workoutId)
  if (!workout || !workout.history) return []

  // Compare only the date part (YYYY-MM-DD)
  const targetDate = date.split("T")[0]

  return workout.history.filter((entry) => {
    const entryDate = new Date(entry.date).toISOString().split("T")[0]
    return entryDate === targetDate
  })
}

// Delete a workout
export function deleteWorkout(workoutId: string): void {
  let workouts = getWorkouts()
  const workout = workouts.find((w) => w.id === workoutId)

  // Remove the workout
  workouts = workouts.filter((w) => w.id !== workoutId)
  saveWorkouts(workouts)

  // If the workout was part of a day, remove it from that day
  if (workout && workout.dayId) {
    const days = getWorkoutDays()
    const dayIndex = days.findIndex((d) => d.id === workout.dayId)

    if (dayIndex !== -1) {
      days[dayIndex].workouts = days[dayIndex].workouts.filter((id) => id !== workoutId)
      saveWorkoutDays(days)
    }
  }

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))
}

// Delete a workout day
export function deleteWorkoutDay(dayId: string): void {
  let days = getWorkoutDays()
  days = days.filter((d) => d.id !== dayId)
  saveWorkoutDays(days)

  // Trigger storage event for other components to update
  window.dispatchEvent(new Event("storage"))
}

// Save workouts to localStorage
function saveWorkouts(workouts: Workout[]): void {
  localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts))
}

// Save workout days to localStorage
function saveWorkoutDays(days: WorkoutDay[]): void {
  localStorage.setItem(WORKOUT_DAYS_STORAGE_KEY, JSON.stringify(days))
}
