"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash, Dumbbell, Flame, Pencil } from "lucide-react"

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
  DialogClose,
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
import {
  getWorkoutDayById,
  getWorkoutsForDay,
  deleteWorkoutDay,
  addWarmup,
  updateWarmup,
  deleteWarmup,
} from "@/lib/workout-service"
import type { WorkoutDay, Workout, Warmup } from "@/lib/types"

export default function WorkoutDayPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [warmupDialogOpen, setWarmupDialogOpen] = useState(false)
  const [editWarmupDialogOpen, setEditWarmupDialogOpen] = useState(false)
  const [currentWarmup, setCurrentWarmup] = useState<Warmup | null>(null)
  const [newWarmup, setNewWarmup] = useState({
    description: "",
    duration: "",
  })

  useEffect(() => {
    const loadWorkoutDay = () => {
      const day = getWorkoutDayById(params.id)
      if (day) {
        setWorkoutDay(day)
        const dayWorkouts = getWorkoutsForDay(day.id)
        setWorkouts(dayWorkouts)
      } else {
        toast({
          title: "Workout day not found",
          description: "The requested workout day could not be found",
          variant: "destructive",
        })
        router.push("/")
      }
    }

    loadWorkoutDay()

    // Add event listener for storage changes
    window.addEventListener("storage", loadWorkoutDay)

    return () => {
      window.removeEventListener("storage", loadWorkoutDay)
    }
  }, [params.id, router, toast])

  const handleDeleteWorkoutDay = () => {
    if (!workoutDay) return

    deleteWorkoutDay(workoutDay.id)
    toast({
      title: "Workout day deleted",
      description: "The workout day has been removed from your records",
    })
    router.push("/")
  }

  const handleWarmupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewWarmup((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddWarmup = () => {
    if (!workoutDay) return

    if (!newWarmup.description || !newWarmup.duration) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      })
      return
    }

    const warmup: Warmup = {
      id: Date.now().toString(),
      description: newWarmup.description,
      duration: Number.parseInt(newWarmup.duration),
      date: new Date().toISOString(),
    }

    addWarmup(workoutDay.id, warmup)
    setNewWarmup({ description: "", duration: "" })
    setWarmupDialogOpen(false)

    toast({
      title: "Warmup added",
      description: "Your warmup has been added to this workout day",
    })
  }

  const handleEditWarmup = () => {
    if (!workoutDay || !currentWarmup) return

    if (!currentWarmup.description || !currentWarmup.duration) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      })
      return
    }

    updateWarmup(workoutDay.id, currentWarmup)
    setEditWarmupDialogOpen(false)

    toast({
      title: "Warmup updated",
      description: "Your warmup has been updated",
    })
  }

  const handleDeleteWarmup = (warmupId: string) => {
    if (!workoutDay) return

    deleteWarmup(workoutDay.id, warmupId)

    toast({
      title: "Warmup deleted",
      description: "The warmup has been removed",
    })
  }

  if (!workoutDay) {
    return (
      <div className="container mx-auto px-4 py-8 mobile-full">
        <div className="flex justify-center items-center h-64">
          <p>Loading workout day details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 mobile-full">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 mobile-stack">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {workoutDay.name}
        </h1>
        <div className="flex gap-2 flex-wrap mobile-stack">
          <Dialog open={warmupDialogOpen} onOpenChange={setWarmupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shadow-sm hover:shadow transition-all">
                <Flame className="mr-2 h-4 w-4 text-orange-500" />
                Add Warmup
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Warmup</DialogTitle>
                <DialogDescription>Log your warmup routine for this workout day</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g., Treadmill, Stretching"
                    value={newWarmup.description}
                    onChange={handleWarmupChange}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={newWarmup.duration}
                    onChange={handleWarmupChange}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddWarmup}>Save Warmup</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href={`/add-workout?dayId=${workoutDay.id}`}>
            <Button className="shadow-sm hover:shadow-md transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Add Workout
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shadow-sm hover:shadow transition-all">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this workout day. The workouts themselves will not be deleted. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWorkoutDay}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {workoutDay.warmups && workoutDay.warmups.length > 0 && (
        <Card className="mb-6 workout-day-card slide-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center">
                <Flame className="mr-2 h-5 w-5 text-orange-500" />
                Warmups
              </CardTitle>
            </div>
            <CardDescription>Warmup routines for this workout day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workoutDay.warmups.map((warmup) => (
                <div
                  key={warmup.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-br from-orange-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm"
                >
                  <div>
                    <p className="font-medium">{warmup.description}</p>
                    <p className="text-sm text-muted-foreground">{warmup.duration} minutes</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => {
                        setCurrentWarmup(warmup)
                        setEditWarmupDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleDeleteWarmup(warmup.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={editWarmupDialogOpen} onOpenChange={setEditWarmupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Warmup</DialogTitle>
            <DialogDescription>Update your warmup routine</DialogDescription>
          </DialogHeader>
          {currentWarmup && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={currentWarmup.description}
                  onChange={(e) => setCurrentWarmup({ ...currentWarmup, description: e.target.value })}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  value={currentWarmup.duration}
                  onChange={(e) =>
                    setCurrentWarmup({ ...currentWarmup, duration: Number.parseInt(e.target.value) || 0 })
                  }
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditWarmup}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="workout-card slide-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center">
              <Dumbbell className="mr-2 h-5 w-5 text-primary" />
              Workouts in {workoutDay.name}
            </CardTitle>
          </div>
          <CardDescription>All workouts for this day</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Dumbbell className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">No workouts added to this day yet</p>
              <Link href={`/add-workout?dayId=${workoutDay.id}`}>
                <Button className="shadow-sm hover:shadow-md transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Workout
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
