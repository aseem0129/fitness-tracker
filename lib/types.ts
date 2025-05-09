export interface WorkoutEntry {
  sets: number
  reps: number
  weight: number
  date: string
}

export interface Workout {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  date: string
  history?: WorkoutEntry[]
  dayId?: string // Reference to the parent workout day
}

export interface WorkoutDay {
  id: string
  name: string
  date: string
  workouts: string[] // Array of workout IDs
  warmups?: Warmup[]
}

export interface Warmup {
  id: string
  description: string
  duration: number // in minutes
  date: string
}

export interface WorkoutSet {
  reps: number
  weight: number
}

export interface MultiSetWorkout {
  id: string
  name: string
  sets: WorkoutSet[]
  date: string
  dayId?: string
}
