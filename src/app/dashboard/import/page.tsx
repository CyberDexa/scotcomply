'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Upload, Download, Info } from 'lucide-react'

type EntityType = 'PROPERTY' | 'CERTIFICATE' | 'REGISTRATION'

interface ParseError {
  row: number
  field: string
  message: string
}

interface ParsedData {
  totalRows: number
  validRows: number
  errorCount: number
  errors: ParseError[]
  preview: any[]
}

export default function BulkImportPage() {
  const router = useRouter()
  const [entityType, setEntityType] = useState<EntityType>('PROPERTY')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const parseCSV = trpc.bulk.parseCSV.useMutation()
  const importProperties = trpc.bulk.importProperties.useMutation()
  const importCertificates = trpc.bulk.importCertificates.useMutation()
  const importRegistrations = trpc.bulk.importRegistrations.useMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setImportResult(null)
    setParsedData(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      
      // Parse CSV for preview
      parseCSV.mutate(
        { csvContent: content, entityType },
        {
          onSuccess: (data) => {
            setParsedData(data)
          },
          onError: (error) => {
            alert(`Parse error: ${error.message}`)
          },
        }
      )
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvContent) {
      alert('Please upload a CSV file first')
      return
    }

    setIsUploading(true)
    try {
      let result
      if (entityType === 'PROPERTY') {
        result = await importProperties.mutateAsync({ csvContent })
      } else if (entityType === 'CERTIFICATE') {
        result = await importCertificates.mutateAsync({ csvContent })
      } else {
        result = await importRegistrations.mutateAsync({ csvContent })
      }

      setImportResult(result)
      if (result.errorCount === 0) {
        alert('Import completed successfully!')
        setTimeout(() => router.push('/dashboard/operations'), 2000)
      }
    } catch (error: any) {
      alert(`Import failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    let headers: string[] = []
    let sampleRows: string[][] = []
    let instructions: string[] = []

    if (entityType === 'PROPERTY') {
      headers = ['address', 'postcode', 'councilArea', 'propertyType', 'bedrooms', 'isHMO', 'hmoOccupancy', 'tenancyStatus']
      instructions = [
        '# Property Import Template',
        '# Instructions:',
        '# - address: Full property address (required)',
        '# - postcode: UK postcode format (required)',
        '# - councilArea: Scottish council area (required)',
        '# - propertyType: FLAT, HOUSE, BUNGALOW, TERRACED, SEMI_DETACHED, DETACHED',
        '# - bedrooms: Number of bedrooms (required)',
        '# - isHMO: true/false - Is this an HMO property?',
        '# - hmoOccupancy: Number of occupants (leave empty if not HMO)',
        '# - tenancyStatus: OCCUPIED, VACANT, NOTICE_PERIOD',
        '#',
      ]
      sampleRows = [
        ['123 Main St, Edinburgh', 'EH1 1AA', 'City of Edinburgh', 'FLAT', '2', 'false', '', 'OCCUPIED'],
        ['45 High Street, Glasgow', 'G1 2AB', 'Glasgow City', 'FLAT', '3', 'true', '5', 'OCCUPIED'],
        ['78 Park Road, Aberdeen', 'AB10 1XY', 'Aberdeen City', 'HOUSE', '4', 'false', '', 'VACANT'],
      ]
    } else if (entityType === 'CERTIFICATE') {
      headers = ['propertyAddress', 'certificateType', 'issueDate', 'expiryDate', 'providerName', 'providerContact', 'documentUrl', 'notes']
      instructions = [
        '# Certificate Import Template',
        '# Instructions:',
        '# - propertyAddress: Must match an existing property address exactly',
        '# - certificateType: GAS_SAFETY, EICR, EPC, PAT, LEGIONELLA',
        '# - issueDate: YYYY-MM-DD format (required)',
        '# - expiryDate: YYYY-MM-DD format (required)',
        '# - providerName: Name of certificate provider (required)',
        '# - providerContact: Phone or email (optional)',
        '# - documentUrl: URL to certificate document (optional)',
        '# - notes: Additional notes (optional)',
        '#',
      ]
      sampleRows = [
        ['123 Main St, Edinburgh', 'GAS_SAFETY', '2024-01-01', '2025-01-01', 'Gas Safe Ltd', '01234567890', 'https://example.com/cert1.pdf', 'Annual gas safety check'],
        ['45 High Street, Glasgow', 'EICR', '2024-02-15', '2029-02-15', 'Scottish Electricians', 'info@scotelec.com', '', 'Electrical inspection'],
        ['78 Park Road, Aberdeen', 'EPC', '2024-03-01', '2034-03-01', 'Energy Assessors Ltd', '01224555666', '', 'Energy Performance Certificate'],
      ]
    } else {
      headers = ['propertyAddress', 'councilArea', 'registrationNumber', 'applicationDate', 'expiryDate', 'renewalFee', 'status', 'notes']
      instructions = [
        '# Registration Import Template',
        '# Instructions:',
        '# - propertyAddress: Must match an existing property address exactly',
        '# - councilArea: Scottish council area (required)',
        '# - registrationNumber: Official registration number (required)',
        '# - applicationDate: YYYY-MM-DD format (required)',
        '# - expiryDate: YYYY-MM-DD format (required)',
        '# - renewalFee: Fee amount in GBP (required)',
        '# - status: PENDING, APPROVED, REJECTED, EXPIRED',
        '# - notes: Additional notes (optional)',
        '#',
      ]
      sampleRows = [
        ['123 Main St, Edinburgh', 'City of Edinburgh', 'REG123456', '2024-01-01', '2027-01-01', '89', 'APPROVED', 'Initial landlord registration'],
        ['45 High Street, Glasgow', 'Glasgow City', 'REG789012', '2024-02-01', '2027-02-01', '89', 'APPROVED', 'Renewal registration'],
        ['78 Park Road, Aberdeen', 'Aberdeen City', 'REG345678', '2024-03-01', '2027-03-01', '89', 'PENDING', 'Application submitted'],
      ]
    }

    // Build CSV content with instructions and samples
    const csvLines = [
      ...instructions,
      headers.join(','),
      ...sampleRows.map(row => row.join(',')),
    ]
    
    const csv = csvLines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityType.toLowerCase()}-import-template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
          <p className="mt-1 text-sm text-gray-600">
            Import multiple records from CSV files
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Entity Type Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Import Type
        </label>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => {
              setEntityType('PROPERTY')
              setParsedData(null)
              setImportResult(null)
            }}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              entityType === 'PROPERTY'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Properties</div>
            <div className="text-xs text-gray-600 mt-1">
              Import property records
            </div>
          </button>
          <button
            onClick={() => {
              setEntityType('CERTIFICATE')
              setParsedData(null)
              setImportResult(null)
            }}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              entityType === 'CERTIFICATE'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Certificates</div>
            <div className="text-xs text-gray-600 mt-1">
              Import certificate records
            </div>
          </button>
          <button
            onClick={() => {
              setEntityType('REGISTRATION')
              setParsedData(null)
              setImportResult(null)
            }}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              entityType === 'REGISTRATION'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Registrations</div>
            <div className="text-xs text-gray-600 mt-1">
              Import registration records
            </div>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Upload CSV File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Upload a file
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <span className="text-gray-600"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">CSV up to 10MB</p>
          </div>
          {csvFile && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Selected: <span className="font-medium">{csvFile.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {parsedData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Validation Results
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {parsedData.validRows}
                </div>
                <div className="text-sm text-green-700">Valid Records</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-900">
                  {parsedData.errorCount}
                </div>
                <div className="text-sm text-red-700">Errors Found</div>
              </div>
            </div>
          </div>

          {/* Errors Table */}
          {parsedData.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Validation Errors ({parsedData.errors.length})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Field
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.errors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
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
            </div>
          )}

          {/* Preview Valid Records */}
          {parsedData.preview.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Preview Valid Records (first 10)
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(parsedData.preview[0]).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.preview.map((record, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(record).map((value: any, vIdx) => (
                            <td
                              key={vIdx}
                              className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import Button */}
          {parsedData.validRows > 0 && (
            <div className="mt-6 flex items-start gap-3">
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium">Ready to import</p>
                    <p className="mt-1">
                      {parsedData.validRows} valid records will be imported.
                      {parsedData.errorCount > 0 && (
                        <> {parsedData.errorCount} rows have errors and will be skipped.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isUploading ? 'Importing...' : `Import ${parsedData.validRows} Records`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Import Complete
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {importResult.totalRows}
              </div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {importResult.successCount}
              </div>
              <div className="text-sm text-green-700">Imported</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-900">
                {importResult.errorCount}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Import Errors
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Field
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importResult.errors.map((error: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
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
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => router.push('/dashboard/operations')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              View Operation History
            </button>
            <button
              onClick={() => {
                setCsvFile(null)
                setCsvContent('')
                setParsedData(null)
                setImportResult(null)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
