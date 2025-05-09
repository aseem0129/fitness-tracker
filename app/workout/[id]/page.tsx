"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getWorkoutById, addWorkoutEntry, deleteWorkout } from "@/lib/workout-service"
import { WorkoutProgressChart } from "@/components/workout-progress-chart"
import type { Workout, WorkoutEntry } from "@/lib/types"

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [newEntry, setNewEntry] = useState({
    sets: "",
    reps: "",
    weight: "",
    date: formatDateForInput(new Date()),
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  // Format date as YYYY-MM-DD for input field
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const loadWorkout = () => {
      const data = getWorkoutById(params.id)
      if (data) {
        setWorkout(data)
      } else {
        toast({
          title: "Workout not found",
          description: "The requested workout could not be found",
          variant: "destructive",
        })
        router.push("/")
      }
    }

    loadWorkout()

    // Add event listener for storage changes
    window.addEventListener("storage", loadWorkout)

    return () => {
      window.removeEventListener("storage", loadWorkout)
    }
  }, [params.id, router, toast])

  const handleEntryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewEntry((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddEntry = () => {
    if (!workout) return

    if (!newEntry.sets || !newEntry.reps || !newEntry.weight || !newEntry.date) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse the date input value (YYYY-MM-DD)
      const [year, month, day] = newEntry.date.split("-").map(Number)

      // Create a date object with the correct values (month is 0-indexed in JS Date)
      const entryDate = new Date(year, month - 1, day)

      // Get current time for the timestamp
      const now = new Date()
      entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())

      const entry: WorkoutEntry = {
        sets: Number.parseInt(newEntry.sets),
        reps: Number.parseInt(newEntry.reps),
        weight: Number.parseFloat(newEntry.weight),
        date: entryDate.toISOString(),
      }

      const updatedWorkout = addWorkoutEntry(workout.id, entry)
      setWorkout(updatedWorkout)

      // Keep the same date but reset other fields
      setNewEntry({
        sets: "",
        reps: "",
        weight: "",
        date: newEntry.date, // Keep the same date for consecutive entries
      })

      setDialogOpen(false)

      toast({
        title: "Entry added",
        description: "Your workout progress has been updated",
      })
    } catch (error) {
      console.error("Date parsing error:", error)
      toast({
        title: "Error adding entry",
        description: "There was a problem with the date format. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteWorkout = () => {
    if (!workout) return

    deleteWorkout(workout.id)
    toast({
      title: "Workout deleted",
      description: "The workout has been removed from your records",
    })
    router.push("/")
  }

  if (!workout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading workout details...</p>
        </div>
      </div>
    )
  }

  // Group entries by date for display - using only the date part (YYYY-MM-DD)
  const entriesByDate = workout.history
    ? workout.history.reduce<Record<string, WorkoutEntry[]>>((acc, entry) => {
        // Extract just the date part in local time
        const date = new Date(entry.date)
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
          date.getDate(),
        ).padStart(2, "0")}`

        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(entry)
        return acc
      }, {})
    : {}

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{workout.name}</h1>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Entry</DialogTitle>
                <DialogDescription>Log your latest {workout.name} workout to track your progress.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" value={newEntry.date} onChange={handleEntryChange} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sets">Sets</Label>
                    <Input
                      id="sets"
                      name="sets"
                      type="number"
                      min="1"
                      placeholder="3"
                      value={newEntry.sets}
                      onChange={handleEntryChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      name="reps"
                      type="number"
                      min="1"
                      placeholder="10"
                      value={newEntry.reps}
                      onChange={handleEntryChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="135"
                      value={newEntry.weight}
                      onChange={handleEntryChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddEntry}>Save Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this workout and all its history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWorkout}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Progress Chart
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <Info className="mr-1 h-3 w-3" /> Click on dots to view details
              </span>
            </CardTitle>
            <CardDescription>
              Track your average weight progression over time. Each point shows the average weight for that day.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <WorkoutProgressChart workout={workout} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workout History</CardTitle>
            <CardDescription>Your logged {workout.name} workouts</CardDescription>
          </CardHeader>
          <CardContent>
            {workout.history && workout.history.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(entriesByDate)
                  .sort(([dateA], [dateB]) => {
                    // Parse the date strings (YYYY-MM-DD)
                    const [yearA, monthA, dayA] = dateA.split("-").map(Number)
                    const [yearB, monthB, dayB] = dateB.split("-").map(Number)

                    // Create Date objects (month is 0-indexed in JS Date)
                    const dateObjA = new Date(yearA, monthA - 1, dayA)
                    const dateObjB = new Date(yearB, monthB - 1, dayB)

                    return dateObjB.getTime() - dateObjA.getTime()
                  })
                  .map(([dateStr, entries]) => {
                    // Parse the date string (YYYY-MM-DD)
                    const [year, month, day] = dateStr.split("-").map(Number)

                    // Create a Date object (month is 0-indexed in JS Date)
                    const date = new Date(year, month - 1, day)

                    return (
                      <div key={dateStr} className="space-y-2">
                        <h3 className="font-medium text-lg">{date.toLocaleDateString()}</h3>
                        <div className="space-y-2 pl-2">
                          {entries
                            .sort((a, b) => b.weight - a.weight)
                            .map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {entry.sets} sets × {entry.reps} reps
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(entry.date).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <div className="text-xl font-bold">{entry.weight} lbs</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground mb-4">No workout history yet</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Entry</DialogTitle>
                      <DialogDescription>Log your first {workout.name} workout to start tracking.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-date">Date</Label>
                        <Input
                          id="first-date"
                          name="date"
                          type="date"
                          value={newEntry.date}
                          onChange={handleEntryChange}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first-sets">Sets</Label>
                          <Input
                            id="first-sets"
                            name="sets"
                            type="number"
                            min="1"
                            placeholder="3"
                            value={newEntry.sets}
                            onChange={handleEntryChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="first-reps">Reps</Label>
                          <Input
                            id="first-reps"
                            name="reps"
                            type="number"
                            min="1"
                            placeholder="10"
                            value={newEntry.reps}
                            onChange={handleEntryChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="first-weight">Weight (lbs)</Label>
                          <Input
                            id="first-weight"
                            name="weight"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="135"
                            value={newEntry.weight}
                            onChange={handleEntryChange}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddEntry}>Save Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
