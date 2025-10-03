'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { trpc } from '@/lib/trpc-client'
import Link from 'next/link'
import {
  Wrench,
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

const categories = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HEATING', label: 'Heating' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'DOORS_WINDOWS', label: 'Doors & Windows' },
  { value: 'FLOORING', label: 'Flooring' },
  { value: 'WALLS_CEILING', label: 'Walls & Ceiling' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'GARDEN', label: 'Garden' },
  { value: 'OTHER', label: 'Other' },
]

const priorities = [
  { value: 'LOW', label: 'Low', description: 'Non-urgent, can wait several days' },
  {
    value: 'MEDIUM',
    label: 'Medium',
    description: 'Should be addressed within a few days',
  },
  {
    value: 'HIGH',
    label: 'High',
    description: 'Urgent, needs attention within 24 hours',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency',
    description: 'Critical issue requiring immediate attention',
  },
]

function NewMaintenanceRequestForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    category: 'PLUMBING' as any,
    priority: 'MEDIUM' as any,
    title: '',
    description: '',
    location: '',
    images: [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  // Pre-fill property from query params
  useEffect(() => {
    const propertyId = searchParams.get('propertyId')
    if (propertyId) {
      setFormData(prev => ({ ...prev, propertyId }))
    }
  }, [searchParams])

  // Fetch properties
  const { data: properties } = trpc.property.list.useQuery({})

  // Create mutation
  const createMutation = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      setSuccessMessage('Maintenance request created successfully!')
      setTimeout(() => {
        router.push('/dashboard/maintenance')
      }, 2000)
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    },
  })

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.propertyId) {
      newErrors.propertyId = 'Property is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.priority) {
      newErrors.priority = 'Priority is required'
    }
    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    if (!formData.description || formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    createMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/maintenance"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Maintenance
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            New Maintenance Request
          </h1>
          <p className="mt-2 text-gray-600">
            Report a maintenance issue for your property
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Property Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property *
            </label>
            <select
              value={formData.propertyId}
              onChange={(e) =>
                setFormData({ ...formData, propertyId: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.propertyId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a property</option>
              {properties?.properties?.map((property: any) => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
            {errors.propertyId && (
              <p className="mt-1 text-sm text-red-600">{errors.propertyId}</p>
            )}
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <div className="space-y-3">
              {priorities.map((priority) => (
                <div
                  key={priority.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.priority === priority.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, priority: priority.value as any })
                  }
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as any,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">
                        {priority.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {priority.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
            )}
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              placeholder="Brief summary of the issue"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              maxLength={200}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.title.length}/200 characters
            </p>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              placeholder="Detailed description of the maintenance issue..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Kitchen, Bathroom, Bedroom 2"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Image Upload Placeholder */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Image upload coming soon
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/maintenance"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewMaintenanceRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    }>
      <NewMaintenanceRequestForm />
    </Suspense>
  )
}
