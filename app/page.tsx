"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plane } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    
    if (token) {
      // User is logged in, redirect to dashboard
      router.push("/dashboard")
    } else {
      // User is not logged in, redirect to login
      router.push("/auth/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-600 rounded-full">
            <Plane className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">GlobeTrotter</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
