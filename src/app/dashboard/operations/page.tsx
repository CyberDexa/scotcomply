'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Database
} from 'lucide-react'

interface ImportJob {
  id: string
  entityType: string
  fileName: string
  status: string
  totalRows: number
  successCount: number
  errorCount: number
  errors: any
  createdAt: Date
  completedAt: Date | null
}

export default function OperationsPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  const { data: importJobs, isLoading } = trpc.bulk.getImportHistory.useQuery({
    cursor,
    limit: 20,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-gray-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return config[status as keyof typeof config] || config.PENDING
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatEntityType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operation History</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track all import and export operations with detailed logs
        </p>
      </div>

      {/* Summary Cards */}
      {importJobs && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {importJobs.jobs.length}
                </div>
                <div className="text-sm text-gray-600">Total Operations</div>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {importJobs.jobs.filter((j: any) => j.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {importJobs.jobs.filter((j: any) => j.status === 'FAILED').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {importJobs.jobs.reduce((sum: number, j: any) => sum + (j.successCount || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Records Imported</div>
              </div>
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Operations List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Import Operations
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading operations...</p>
            </div>
          </div>
        ) : importJobs && importJobs.jobs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {importJobs.jobs.map((job: any) => (
              <div key={job.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(job.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formatEntityType(job.entityType)} Import
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {job.fileName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(job.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-3 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {job.totalRows || 0}
                        </div>
                        <div className="text-xs text-gray-600">Total Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">
                          {job.successCount || 0}
                        </div>
                        <div className="text-xs text-gray-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">
                          {job.errorCount || 0}
                        </div>
                        <div className="text-xs text-gray-600">Errors</div>
                      </div>
                    </div>

                    {/* Errors Section */}
                    {job.errors && job.errors.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() =>
                            setExpandedJobId(
                              expandedJobId === job.id ? null : job.id
                            )
                          }
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {expandedJobId === job.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {expandedJobId === job.id
                            ? 'Hide Errors'
                            : `View ${job.errors.length} Error${
                                job.errors.length > 1 ? 's' : ''
                              }`}
                        </button>

                        {expandedJobId === job.id && (
                          <div className="mt-3 border border-red-200 rounded-lg overflow-hidden">
                            <div className="max-h-64 overflow-y-auto">
                              <table className="min-w-full divide-y divide-red-200">
                                <thead className="bg-red-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">
                                      Row
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">
                                      Field
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">
                                      Error Message
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-red-100">
                                  {job.errors.map((error: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-red-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {error.row}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {error.field}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {error.message}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion Time */}
                    {job.completedAt && (
                      <div className="mt-3 text-xs text-gray-500">
                        Completed at {formatDate(job.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No operations yet
            </h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Import operations will appear here once you start using the bulk
              import feature.
            </p>
          </div>
        )}

        {/* Pagination */}
        {importJobs && importJobs.nextCursor && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
            <button
              onClick={() => setCursor(importJobs.nextCursor)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
