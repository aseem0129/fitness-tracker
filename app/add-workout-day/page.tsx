"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { addWorkoutDay } from "@/lib/workout-service"
import type { WorkoutDay } from "@/lib/types"

export default function AddWorkoutDayPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [workoutDayData, setWorkoutDayData] = useState({
    name: "",
    date: formatDateForInput(new Date()),
  })

  // Format date as YYYY-MM-DD for input field
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setWorkoutDayData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!workoutDayData.name) {
      toast({
        title: "Missing information",
        description: "Please enter a name for the workout day",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse the date input value (YYYY-MM-DD)
      const [year, month, day] = workoutDayData.date.split("-").map(Number)

      // Create a date object with the correct values (month is 0-indexed in JS Date)
      const workoutDate = new Date(year, month - 1, day)

      // Get current time for the timestamp
      const now = new Date()
      workoutDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())

      // Add workout day
      const newWorkoutDay: WorkoutDay = {
        id: Date.now().toString(),
        name: workoutDayData.name,
        date: workoutDate.toISOString(),
        workouts: [],
      }

      addWorkoutDay(newWorkoutDay)

      toast({
        title: "Workout day added",
        description: "Your workout day has been successfully created",
      })

      router.push("/")
    } catch (error) {
      console.error("Date parsing error:", error)
      toast({
        title: "Error adding workout day",
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
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Add New Workout Day</CardTitle>
          </div>
          <CardDescription>Create a workout day to organize your exercises</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Day Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Back & Biceps, Leg Day"
                value={workoutDayData.name}
                onChange={handleChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Day Created On</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={workoutDayData.date}
                onChange={handleChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <Button type="submit" className="w-full shadow-sm hover:shadow-md transition-all">
              Create Workout Day
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
