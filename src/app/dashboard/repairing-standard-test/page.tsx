'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function RepairingStandardTestPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const results: any = {}

    // Test 1: Check if page loads
    results.pageLoads = true

    // Test 2: Check localStorage
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      results.localStorage = true
    } catch (e) {
      results.localStorage = false
      results.localStorageError = String(e)
    }

    // Test 3: Check session storage
    try {
      const session = localStorage.getItem('session')
      results.hasSession = !!session
      results.sessionData = session ? 'Found' : 'Not found'
    } catch (e) {
      results.sessionError = String(e)
    }

    // Test 4: Try to fetch from API
    try {
      const response = await fetch('/api/trpc/property.list?input={"limit":1}')
      results.apiReachable = response.ok
      results.apiStatus = response.status
      if (!response.ok) {
        results.apiError = await response.text()
      }
    } catch (e) {
      results.apiFetchError = String(e)
    }

    setTestResults(results)
    setTesting(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Repairing Standard - Diagnostics</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {testing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Running tests...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(testResults).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{key}</span>
                  <div className="flex items-center gap-2">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )
                    ) : (
                      <span className="text-sm text-gray-600">{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button onClick={runTests} className="mt-4" disabled={testing}>
            {testing ? 'Running...' : 'Run Tests Again'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div>User Agent: {navigator.userAgent}</div>
            <div>URL: {window.location.href}</div>
            <div>Protocol: {window.location.protocol}</div>
            <div>Host: {window.location.host}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
