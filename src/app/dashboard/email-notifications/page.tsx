'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  Shield,
  FileText,
  Loader2,
} from 'lucide-react'

export default function NotificationsPage() {
  const [sending, setSending] = useState<string | null>(null)

  // Temporary placeholder - email notifications will be re-implemented later
  const summary = {
    expiringCertificates: 0,
    expiringRegistrations: 0,
    expiringHMOLicenses: 0,
    fireSafetyAlerts: 0,
    totalPendingNotifications: 0,
  }

  const refetchSummary = () => {}

  const sendCertsMutation = {
    mutateAsync: async () => {
      alert('Email notification feature coming soon!')
      setSending(null)
    },
  }

  const sendRegsMutation = {
    mutateAsync: async () => {
      alert('Email notification feature coming soon!')
      setSending(null)
    },
  }

  const sendHMOMutation = {
    mutateAsync: async () => {
      alert('Email notification feature coming soon!')
      setSending(null)
    },
  }

  const sendFireSafetyMutation = {
    mutateAsync: async () => {
      alert('Email notification feature coming soon!')
      setSending(null)
    },
  }

  const handleSendCertificates = async () => {
    setSending('certificates')
    await sendCertsMutation.mutateAsync()
  }

  const handleSendRegistrations = async () => {
    setSending('registrations')
    await sendRegsMutation.mutateAsync()
  }

  const handleSendHMO = async () => {
    setSending('hmo')
    await sendHMOMutation.mutateAsync()
  }

  const handleSendFireSafety = async () => {
    setSending('fireSafety')
    await sendFireSafetyMutation.mutateAsync()
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Notifications</h1>
          <p className="text-gray-600 mt-1">
            Manage compliance reminders and email notifications
          </p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Pending Notifications
            </CardTitle>
            <CardDescription>
              Items that will trigger email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificates</p>
                  <p className="text-2xl font-bold">
                    {summary?.expiringCertificates || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registrations</p>
                  <p className="text-2xl font-bold">
                    {summary?.expiringRegistrations || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">HMO Licenses</p>
                  <p className="text-2xl font-bold">
                    {summary?.expiringHMOLicenses || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fire Safety</p>
                  <p className="text-2xl font-bold">
                    {summary?.fireSafetyAlerts || 0}
                  </p>
                </div>
              </div>
            </div>

            {summary && summary.totalPendingNotifications > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  You have <strong>{summary.totalPendingNotifications}</strong> item
                  {summary.totalPendingNotifications !== 1 ? 's' : ''} requiring attention.
                  Send notifications below to stay compliant.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certificate Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Certificate Expiry Notifications
              </CardTitle>
              <CardDescription>
                Sent 30 days before expiry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">When sent:</p>
                  <p className="text-muted-foreground">
                    When certificates are within 30 days of expiry
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">What it includes:</p>
                  <p className="text-muted-foreground">
                    Certificate type, property address, expiry date, renewal instructions
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendCertificates}
                disabled={
                  sending !== null ||
                  (summary?.expiringCertificates || 0) === 0
                }
                className="w-full"
              >
                {sending === 'certificates' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send {summary?.expiringCertificates || 0} Notification
                    {(summary?.expiringCertificates || 0) !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Registration Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                Registration Renewal Notifications
              </CardTitle>
              <CardDescription>
                Sent 60 days before expiry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">When sent:</p>
                  <p className="text-muted-foreground">
                    When registrations are within 60 days of expiry
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">What it includes:</p>
                  <p className="text-muted-foreground">
                    Council area, registration number, renewal process, legal requirements
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendRegistrations}
                disabled={
                  sending !== null ||
                  (summary?.expiringRegistrations || 0) === 0
                }
                className="w-full"
              >
                {sending === 'registrations' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send {summary?.expiringRegistrations || 0} Notification
                    {(summary?.expiringRegistrations || 0) !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* HMO Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                HMO License Renewal Notifications
              </CardTitle>
              <CardDescription>
                Sent 60 days before expiry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">When sent:</p>
                  <p className="text-muted-foreground">
                    When HMO licenses are within 60 days of expiry
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">What it includes:</p>
                  <p className="text-muted-foreground">
                    License details, occupancy limits, renewal checklist, penalties
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendHMO}
                disabled={
                  sending !== null ||
                  (summary?.expiringHMOLicenses || 0) === 0
                }
                className="w-full"
              >
                {sending === 'hmo' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send {summary?.expiringHMOLicenses || 0} Notification
                    {(summary?.expiringHMOLicenses || 0) !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Fire Safety Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Fire Safety Compliance Alerts
              </CardTitle>
              <CardDescription>
                Urgent: Sent immediately for non-compliant HMOs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">When sent:</p>
                  <p className="text-muted-foreground">
                    When HMO properties are marked fire safety non-compliant
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">What it includes:</p>
                  <p className="text-muted-foreground">
                    Requirements, penalties, action steps, professional contacts
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendFireSafety}
                disabled={
                  sending !== null ||
                  (summary?.fireSafetyAlerts || 0) === 0
                }
                variant="destructive"
                className="w-full"
              >
                {sending === 'fireSafety' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send {summary?.fireSafetyAlerts || 0} Alert
                    {(summary?.fireSafetyAlerts || 0) !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>How Email Notifications Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Automated Monitoring
                </h3>
                <p className="text-sm text-muted-foreground">
                  ScotComply automatically monitors all your compliance items and identifies
                  what needs attention based on expiry dates and compliance status.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Manual Sending
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the buttons above to manually send notification emails for any pending
                  items. This is useful for immediate reminders or testing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Smart Timing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Certificates: 30 days before expiry<br />
                  Registrations & HMO: 60 days before expiry<br />
                  Fire Safety: Immediate alerts
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Compliance Focused
                </h3>
                <p className="text-sm text-muted-foreground">
                  All notifications include legal requirements, penalties for non-compliance,
                  and clear action steps to help you stay compliant.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
