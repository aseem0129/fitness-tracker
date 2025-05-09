"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Plus, Trash, Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { addWorkout, getWorkoutDays } from "@/lib/workout-service"
import type { WorkoutDay, WorkoutSet } from "@/lib/types"

export default function AddWorkoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [workoutData, setWorkoutData] = useState({
    name: "",
    date: formatDateForInput(new Date()),
    dayId: searchParams.get("dayId") || "",
  })
  const [sets, setSets] = useState<WorkoutSet[]>([{ reps: 0, weight: 0 }])

  useEffect(() => {
    // Load workout days for the dropdown
    const days = getWorkoutDays()
    setWorkoutDays(days)
  }, [])

  // Format date as YYYY-MM-DD for input field
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setWorkoutData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDayChange = (value: string) => {
    setWorkoutData((prev) => ({ ...prev, dayId: value === "none" ? "" : value }))
  }

  const handleSetChange = (index: number, field: keyof WorkoutSet, value: number) => {
    const newSets = [...sets]
    newSets[index][field] = value
    setSets(newSets)
  }

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }])
  }

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      const newSets = [...sets]
      newSets.splice(index, 1)
      setSets(newSets)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!workoutData.name || !workoutData.date || sets.some((set) => set.reps <= 0)) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields and ensure all sets have values",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse the date input value (YYYY-MM-DD)
      const [year, month, day] = workoutData.date.split("-").map(Number)

      // Create a date object with the correct values (month is 0-indexed in JS Date)
      const workoutDate = new Date(year, month - 1, day)

      // Get current time for the timestamp
      const now = new Date()
      workoutDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())

      // Use the first set as the main workout data
      const firstSet = sets[0]

      // Add workout
      addWorkout({
        id: Date.now().toString(),
        name: workoutData.name,
        sets: sets.length,
        reps: firstSet.reps,
        weight: firstSet.weight,
        date: workoutDate.toISOString(),
        dayId: workoutData.dayId || undefined,
      })

      toast({
        title: "Workout added",
        description: "Your workout has been successfully logged",
      })

      // Redirect to the workout day page if a day was selected
      if (workoutData.dayId) {
        router.push(`/workout-day/${workoutData.dayId}`)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Date parsing error:", error)
      toast({
        title: "Error adding workout",
        description: "There was a problem with the date format. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 mobile-full">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mx-auto max-w-md gradient-card slide-in">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Add New Workout</CardTitle>
          </div>
          <CardDescription>Log your workout details to track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Bench Press, Squat"
                value={workoutData.name}
                onChange={handleChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayId">Workout Day (Optional)</Label>
              <Select value={workoutData.dayId || "none"} onValueChange={handleDayChange}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select a workout day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workoutDays.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={workoutData.date}
                onChange={handleChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Sets</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSet} className="h-8 px-2 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Set
                </Button>
              </div>

              {sets.map((set, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-accent/20">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`reps-${index}`} className="text-xs">
                        Reps
                      </Label>
                      <Input
                        id={`reps-${index}`}
                        type="number"
                        min="1"
                        value={set.reps || ""}
                        onChange={(e) => handleSetChange(index, "reps", Number.parseInt(e.target.value) || 0)}
                        className="h-8 border-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`weight-${index}`} className="text-xs">
                        Weight (lbs)
                      </Label>
                      <Input
                        id={`weight-${index}`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight || ""}
                        onChange={(e) => handleSetChange(index, "weight", Number.parseFloat(e.target.value) || 0)}
                        className="h-8 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {sets.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(index)}
                      className="h-8 w-8 rounded-full flex-shrink-0"
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full shadow-sm hover:shadow-md transition-all">
              Save Workout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
