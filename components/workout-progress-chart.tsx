"use client"

import { useState, useCallback } from "react"
import { Line, LineChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { addWorkoutEntry, updateWorkoutEntry, deleteWorkoutEntry } from "@/lib/workout-service"
import type { Workout, WorkoutEntry } from "@/lib/types"

interface WorkoutProgressChartProps {
  workout: Workout
}

export function WorkoutProgressChart({ workout }: WorkoutProgressChartProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<WorkoutEntry[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("view")
  const [newEntry, setNewEntry] = useState({
    sets: "",
    reps: "",
    weight: "",
  })
  const [editingEntry, setEditingEntry] = useState<{ entry: WorkoutEntry; index: number } | null>(null)

  // If no history, show empty state
  if (!workout.history || workout.history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-muted-foreground">No data to display yet</p>
        <p className="text-sm text-muted-foreground">Add workout entries to see your progress</p>
      </div>
    )
  }

  // Group entries by date for the chart - using only the date part (YYYY-MM-DD)
  const entriesByDate = workout.history.reduce<Record<string, WorkoutEntry[]>>((acc, entry) => {
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

  // Prepare data for the chart - one point per date with the average weight
  const chartData = Object.entries(entriesByDate)
    .map(([dateStr, entries]) => {
      // Parse the date string (YYYY-MM-DD)
      const [year, month, day] = dateStr.split("-").map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed in JS Date

      // Calculate average weight for this date
      const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0)
      const avgWeight = totalWeight / entries.length

      return {
        dateKey: dateStr,
        date: date.toISOString(),
        displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
        weight: Number.parseFloat(avgWeight.toFixed(1)), // Round to 1 decimal place
        fullDate: date.toLocaleDateString(),
        entries: entries,
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Handle point click - defined outside of the return statement
  const handlePointClick = useCallback((data: any) => {
    setSelectedDate(data?.fullDate || null)
    setSelectedEntries(data?.entries || [])
    setDialogOpen(!!data)
    setActiveTab("view")
  }, [])

  const handleAddEntry = () => {
    if (!selectedDate) return

    if (!newEntry.sets || !newEntry.reps || !newEntry.weight) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse the selected date
      const dateParts = selectedDate.split("/")
      const month = Number.parseInt(dateParts[0]) - 1 // JS months are 0-indexed
      const day = Number.parseInt(dateParts[1])
      const year = new Date().getFullYear() // Assume current year if not provided

      const entryDate = new Date(year, month, day)

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

      // Update the selected entries
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const updatedEntries =
        updatedWorkout.history?.filter((entry) => {
          const entryDate = new Date(entry.date)
          const entryDateKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(
            entryDate.getDate(),
          ).padStart(2, "0")}`
          return entryDateKey === dateKey
        }) || []

      setSelectedEntries(updatedEntries)
      setNewEntry({ sets: "", reps: "", weight: "" })
      setActiveTab("view")

      toast({
        title: "Entry added",
        description: "Your workout entry has been added",
      })
    } catch (error) {
      console.error("Error adding entry:", error)
      toast({
        title: "Error adding entry",
        description: "There was a problem adding your entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEntry = () => {
    if (!editingEntry) return

    try {
      const updatedEntry: WorkoutEntry = {
        ...editingEntry.entry,
        sets: Number.parseInt(editingEntry.entry.sets.toString()),
        reps: Number.parseInt(editingEntry.entry.reps.toString()),
        weight: Number.parseFloat(editingEntry.entry.weight.toString()),
      }

      // Find the index of this entry in the workout history
      const entryIndex =
        workout.history?.findIndex(
          (e) =>
            e.date === editingEntry.entry.date &&
            e.sets === editingEntry.entry.sets &&
            e.reps === editingEntry.entry.reps &&
            e.weight === editingEntry.entry.weight,
        ) || -1

      if (entryIndex === -1) {
        throw new Error("Entry not found")
      }

      const updatedWorkout = updateWorkoutEntry(workout.id, entryIndex, updatedEntry)

      // Update the selected entries
      const date = new Date(updatedEntry.date)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`

      const updatedEntries =
        updatedWorkout.history?.filter((entry) => {
          const entryDate = new Date(entry.date)
          const entryDateKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(
            entryDate.getDate(),
          ).padStart(2, "0")}`
          return entryDateKey === dateKey
        }) || []

      setSelectedEntries(updatedEntries)
      setEditingEntry(null)
      setActiveTab("view")

      toast({
        title: "Entry updated",
        description: "Your workout entry has been updated",
      })
    } catch (error) {
      console.error("Error updating entry:", error)
      toast({
        title: "Error updating entry",
        description: "There was a problem updating your entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEntry = (index: number) => {
    try {
      // Find the entry in the workout history
      const entry = selectedEntries[index]
      const entryIndex =
        workout.history?.findIndex(
          (e) => e.date === entry.date && e.sets === entry.sets && e.reps === entry.reps && e.weight === entry.weight,
        ) || -1

      if (entryIndex === -1) {
        throw new Error("Entry not found")
      }

      const updatedWorkout = deleteWorkoutEntry(workout.id, entryIndex)

      // Update the selected entries
      const date = new Date(entry.date)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`

      const updatedEntries =
        updatedWorkout.history?.filter((entry) => {
          const entryDate = new Date(entry.date)
          const entryDateKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(
            entryDate.getDate(),
          ).padStart(2, "0")}`
          return entryDateKey === dateKey
        }) || []

      setSelectedEntries(updatedEntries)

      toast({
        title: "Entry deleted",
        description: "Your workout entry has been deleted",
      })

      // If no more entries for this date, close the dialog
      if (updatedEntries.length === 0) {
        setDialogOpen(false)
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Error deleting entry",
        description: "There was a problem deleting your entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full h-full">
      <ChartContainer
        config={{
          weight: {
            label: "Avg Weight (lbs)",
            color: "hsl(var(--primary))",
          },
        }}
        className="h-full"
      >
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
          className="w-full overflow-visible"
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              handlePointClick(data.activePayload[0].payload)
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} tickMargin={10} domain={["dataMin - 5", "dataMax + 5"]} width={40} />
          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(value, name) => [`${value} lbs`, "Avg Weight"]}
            labelFormatter={(label, items) => {
              const item = items[0]
              if (item && item.payload) {
                return item.payload.fullDate
              }
              return label
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--color-weight)"
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={800}
            dot={{
              r: 5,
              fill: "var(--color-weight)",
              strokeWidth: 2,
              stroke: "var(--color-weight)",
              cursor: "pointer",
            }}
            activeDot={{
              r: 7,
              fill: "var(--color-weight)",
              strokeWidth: 2,
              stroke: "white",
              cursor: "pointer",
              onClick: (data) => {
                if (data && data.payload) {
                  handlePointClick(data.payload)
                }
              },
            }}
          />
        </LineChart>
      </ChartContainer>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sets for {selectedDate}</DialogTitle>
            <DialogDescription>All {workout.name} sets performed on this date</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="add">Add Set</TabsTrigger>
              <TabsTrigger value="edit" disabled={!editingEntry}>
                Edit Set
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4 py-4">
              <div className="max-h-[60vh] overflow-y-auto space-y-3">
                {selectedEntries
                  .sort((a, b) => b.weight - a.weight)
                  .map((entry, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {entry.sets} sets × {entry.reps} reps
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold">{entry.weight} lbs</div>
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingEntry({ entry, index })
                              setActiveTab("edit")
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-primary"
                            >
                              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                              <path d="m15 5 4 4"></path>
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteEntry(index)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-destructive"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="add" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sets">Sets</Label>
                    <Input
                      id="sets"
                      type="number"
                      min="1"
                      placeholder="3"
                      value={newEntry.sets}
                      onChange={(e) => setNewEntry({ ...newEntry, sets: e.target.value })}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      type="number"
                      min="1"
                      placeholder="10"
                      value={newEntry.reps}
                      onChange={(e) => setNewEntry({ ...newEntry, reps: e.target.value })}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="135"
                      value={newEntry.weight}
                      onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <Button onClick={handleAddEntry} className="w-full">
                  Add Set
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4 py-4">
              {editingEntry && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-sets">Sets</Label>
                      <Input
                        id="edit-sets"
                        type="number"
                        min="1"
                        value={editingEntry.entry.sets}
                        onChange={(e) =>
                          setEditingEntry({
                            ...editingEntry,
                            entry: { ...editingEntry.entry, sets: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-reps">Reps</Label>
                      <Input
                        id="edit-reps"
                        type="number"
                        min="1"
                        value={editingEntry.entry.reps}
                        onChange={(e) =>
                          setEditingEntry({
                            ...editingEntry,
                            entry: { ...editingEntry.entry, reps: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-weight">Weight (lbs)</Label>
                      <Input
                        id="edit-weight"
                        type="number"
                        min="0"
                        step="0.5"
                        value={editingEntry.entry.weight}
                        onChange={(e) =>
                          setEditingEntry({
                            ...editingEntry,
                            entry: { ...editingEntry.entry, weight: Number.parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingEntry(null)
                        setActiveTab("view")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleEditEntry}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
