'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, use } from 'react'
import { trpc } from '@/lib/trpc-client'
import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export default function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [noteContent, setNoteContent] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateData, setUpdateData] = useState({
    assignedTo: '',
    estimatedCost: 0,
    scheduledDate: '',
  })

  // Fetch request details
  const { data: request, isLoading, refetch } = trpc.maintenance.getById.useQuery({
    id: id,
  })

  // Update status mutation
  const updateStatusMutation = trpc.maintenance.updateStatus.useMutation({
    onSuccess: () => {
      refetch()
      setSelectedStatus('')
    },
  })

  // Add note mutation
  const addNoteMutation = trpc.maintenance.addNote.useMutation({
    onSuccess: () => {
      refetch()
      setNoteContent('')
    },
  })

  // Update mutation
  const updateMutation = trpc.maintenance.update.useMutation({
    onSuccess: () => {
      refetch()
      setShowUpdateForm(false)
    },
  })

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <p className="mt-4 text-gray-600">Request not found</p>
        </div>
      </div>
    )
  }

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      updateStatusMutation.mutate({
        id: id,
        status: selectedStatus as any,
      })
    }
  }

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNoteMutation.mutate({
        maintenanceRequestId: id,
        content: noteContent,
      })
    }
  }

  const handleUpdate = () => {
    updateMutation.mutate({
      id: id,
      assignedTo: updateData.assignedTo || undefined,
      estimatedCost: updateData.estimatedCost || undefined,
      scheduledDate: updateData.scheduledDate
        ? new Date(updateData.scheduledDate)
        : undefined,
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800'
      case 'ACKNOWLEDGED':
        return 'bg-yellow-100 text-yellow-800'
      case 'SUBMITTED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/maintenance"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Maintenance
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {request.title}
              </h1>
              <p className="mt-2 text-gray-600">{request.property.address}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getPriorityColor(
                  request.priority
                )}`}
              >
                {request.priority}
              </span>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                  request.status
                )}`}
              >
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Request Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <p className="mt-1 text-gray-900">
                    {request.category.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <p className="mt-1 text-gray-900">{request.description}</p>
                </div>
                {request.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {request.location}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Submitted
                  </label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Notes & Updates
              </h2>

              {/* Add Note Form */}
              <div className="mb-6">
                <textarea
                  placeholder="Add a note or update..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {request.notes && request.notes.length > 0 ? (
                  request.notes.map((note: any) => (
                    <div key={note.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-gray-900">{note.content}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No notes yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Update Status
              </h2>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-3"
              >
                <option value="">Select status...</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updateStatusMutation.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>

            {/* Details Update Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Request Information
              </h2>
              {!showUpdateForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned To
                    </label>
                    <p className="mt-1 text-gray-900">
                      {request.assignedTo || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Cost
                    </label>
                    <p className="mt-1 text-gray-900">
                      {request.estimatedCost
                        ? `£${request.estimatedCost}`
                        : 'Not estimated'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scheduled Date
                    </label>
                    <p className="mt-1 text-gray-900">
                      {request.scheduledDate
                        ? new Date(request.scheduledDate).toLocaleDateString()
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUpdateForm(true)
                      setUpdateData({
                        assignedTo: request.assignedTo || '',
                        estimatedCost: request.estimatedCost
                          ? Number(request.estimatedCost)
                          : 0,
                        scheduledDate: request.scheduledDate
                          ? new Date(request.scheduledDate)
                              .toISOString()
                              .split('T')[0]
                          : '',
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Edit Details
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={updateData.assignedTo}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, assignedTo: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost (£)
                    </label>
                    <input
                      type="number"
                      value={updateData.estimatedCost}
                      onChange={(e) =>
                        setUpdateData({
                          ...updateData,
                          estimatedCost: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={updateData.scheduledDate}
                      onChange={(e) =>
                        setUpdateData({
                          ...updateData,
                          scheduledDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowUpdateForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {request.scheduledDate && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Scheduled
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.scheduledDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {request.completedAt && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Completed
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
