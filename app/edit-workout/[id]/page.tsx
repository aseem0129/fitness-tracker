"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getWorkoutById, updateWorkout, getWorkoutDays } from "@/lib/workout-service"
import type { Workout, WorkoutDay } from "@/lib/types"

export default function EditWorkoutPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [formData, setFormData] = useState({
    name: "",
    dayId: "",
  })

  useEffect(() => {
    // Load workout
    const data = getWorkoutById(params.id)
    if (data) {
      setWorkout(data)
      setFormData({
        name: data.name,
        dayId: data.dayId || "",
      })
    } else {
      toast({
        title: "Workout not found",
        description: "The requested workout could not be found",
        variant: "destructive",
      })
      router.push("/")
    }

    // Load workout days
    const days = getWorkoutDays()
    setWorkoutDays(days)
  }, [params.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDayChange = (value: string) => {
    setFormData((prev) => ({ ...prev, dayId: value === "none" ? "" : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!workout) return

    // Validate form
    if (!formData.name) {
      toast({
        title: "Missing information",
        description: "Please enter a name for the workout",
        variant: "destructive",
      })
      return
    }

    // Update workout
    const updatedWorkout: Workout = {
      ...workout,
      name: formData.name,
      dayId: formData.dayId || undefined,
    }

    updateWorkout(updatedWorkout)

    toast({
      title: "Workout updated",
      description: "Your workout has been successfully updated",
    })

    router.push(`/workout/${workout.id}`)
  }

  if (!workout) {
    return (
      <div className="container mx-auto px-4 py-8 mobile-full">
        <div className="flex justify-center items-center h-64">
          <p>Loading workout details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 mobile-full">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mx-auto max-w-md gradient-card slide-in">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Edit Workout</CardTitle>
          </div>
          <CardDescription>Update your workout details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayId">Workout Day (Optional)</Label>
              <Select value={formData.dayId || "none"} onValueChange={handleDayChange}>
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

            <Button type="submit" className="w-full shadow-sm hover:shadow-md transition-all">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
