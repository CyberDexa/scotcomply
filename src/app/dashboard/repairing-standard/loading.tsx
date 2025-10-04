'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, ClipboardCheck } from 'lucide-react'

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Repairing Standard Assessments</h1>
        <p className="text-gray-600 mt-2">
          Loading assessments...
        </p>
      </div>

      {/* Loading Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-100 rounded-t-lg" />
            <CardContent className="h-16 bg-gray-50" />
          </Card>
        ))}
      </div>

      {/* Loading Create Card */}
      <Card className="mb-8 animate-pulse">
        <CardHeader className="h-24 bg-gray-100 rounded-t-lg" />
        <CardContent className="h-20 bg-gray-50" />
      </Card>

      {/* Loading Assessments */}
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Loading your repairing standard assessments...
          </p>
        </div>
      </div>
    </div>
  )
}
