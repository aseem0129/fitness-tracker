import Link from "next/link"
import { Dumbbell, Plus, Calendar, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import WorkoutList from "@/components/workout-list"
import WorkoutDayList from "@/components/workout-day-list"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 mobile-full">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4 mobile-stack">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Fitness Tracker
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap mobile-stack">
          <Link href="/add-workout-day">
            <Button variant="outline" className="shadow-sm hover:shadow transition-all">
              <Calendar className="mr-2 h-4 w-4" />
              Add Workout Day
            </Button>
          </Link>
          <Link href="/add-workout">
            <Button className="shadow-sm hover:shadow-md transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Add Workout
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 fade-in">
        <Card className="workout-day-card col-span-full md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Workout Days
              </CardTitle>
              <CardDescription>Organize your workouts by day or muscle group</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WorkoutDayList />
          </CardContent>
        </Card>

        <Card className="workout-card col-span-full md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center">
                <Dumbbell className="mr-2 h-5 w-5 text-primary" />
                Your Workouts
              </CardTitle>
              <CardDescription>Track and manage your workout routines</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WorkoutList />
          </CardContent>
        </Card>

        <Card className="stats-card col-span-full md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
              <CardDescription>Overview of your fitness journey</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground">Total Workouts</div>
                  <div className="text-2xl font-bold" id="total-workouts">
                    0
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground">Last Workout</div>
                  <div className="text-2xl font-bold" id="last-workout">
                    -
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Most Frequent Workout</div>
                <div className="text-2xl font-bold" id="frequent-workout">
                  -
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
