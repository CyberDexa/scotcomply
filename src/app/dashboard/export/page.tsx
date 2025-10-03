'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Download, FileText, CheckCircle, Calendar, Filter } from 'lucide-react'

type EntityType = 'PROPERTY' | 'CERTIFICATE' | 'REGISTRATION'

interface DateRange {
  from: string
  to: string
}

export default function ExportPage() {
  const [entityType, setEntityType] = useState<EntityType>('PROPERTY')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: '',
    to: '',
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])

  const exportProperties = trpc.bulk.exportProperties.useMutation()
  const exportCertificates = trpc.bulk.exportCertificates.useMutation()
  const exportRegistrations = trpc.bulk.exportRegistrations.useMutation()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      let result

      if (entityType === 'PROPERTY') {
        result = await exportProperties.mutateAsync({})
      } else if (entityType === 'CERTIFICATE') {
        result = await exportCertificates.mutateAsync({})
      } else {
        result = await exportRegistrations.mutateAsync({})
      }

      // Download CSV
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      window.URL.revokeObjectURL(url)

      // Add to export history
      const newExport = {
        id: Date.now().toString(),
        entityType,
        filename: result.filename,
        count: result.count,
        timestamp: new Date(),
      }
      setExportHistory([newExport, ...exportHistory])

      alert(`Successfully exported ${result.count} ${entityType.toLowerCase()}s`)
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
        <p className="mt-1 text-sm text-gray-600">
          Export your compliance data to CSV format
        </p>
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Export Configuration
        </h2>

        {/* Entity Type Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Data Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setEntityType('PROPERTY')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  entityType === 'PROPERTY'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Properties</div>
                <div className="text-xs text-gray-600 mt-1">
                  Export all properties
                </div>
              </button>
              <button
                onClick={() => setEntityType('CERTIFICATE')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  entityType === 'CERTIFICATE'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Certificates</div>
                <div className="text-xs text-gray-600 mt-1">
                  Export all certificates
                </div>
              </button>
              <button
                onClick={() => setEntityType('REGISTRATION')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  entityType === 'REGISTRATION'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Registrations</div>
                <div className="text-xs text-gray-600 mt-1">
                  Export all registrations
                </div>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <label className="block text-sm font-medium text-gray-900">
                Filters (Optional)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, from: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="From"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, to: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  {entityType === 'PROPERTY' && (
                    <>
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                    </>
                  )}
                  {entityType === 'CERTIFICATE' && (
                    <>
                      <option value="valid">Valid</option>
                      <option value="expiring">Expiring Soon</option>
                      <option value="expired">Expired</option>
                    </>
                  )}
                  {entityType === 'REGISTRATION' && (
                    <>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : `Export ${entityType}s`}
            </button>
          </div>
        </div>
      </div>

      {/* Export Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Export Format: CSV</p>
            <p className="mt-1">
              Your data will be exported in CSV format, compatible with Excel,
              Google Sheets, and other spreadsheet applications.
            </p>
          </div>
        </div>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Exports
          </h2>
          <div className="space-y-3">
            {exportHistory.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {exp.filename}
                    </div>
                    <div className="text-sm text-gray-600">
                      {exp.count} {exp.entityType.toLowerCase()}s exported
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {exp.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Export Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Export
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setEntityType('PROPERTY')
              handleExport()
            }}
            disabled={isExporting}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <div className="font-semibold text-gray-900">All Properties</div>
            <div className="text-sm text-gray-600 mt-1">
              Export complete property list
            </div>
          </button>

          <button
            onClick={() => {
              setEntityType('CERTIFICATE')
              handleExport()
            }}
            disabled={isExporting}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <div className="font-semibold text-gray-900">All Certificates</div>
            <div className="text-sm text-gray-600 mt-1">
              Export complete certificate list
            </div>
          </button>

          <button
            onClick={() => {
              setEntityType('REGISTRATION')
              handleExport()
            }}
            disabled={isExporting}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-6 h-6 text-orange-600 mb-2" />
            <div className="font-semibold text-gray-900">
              All Registrations
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Export complete registration list
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
