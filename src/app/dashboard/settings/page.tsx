'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Bell, User, Shield, Calendar } from 'lucide-react'

export default function SettingsPage() {
  const { data: preferences, isLoading, refetch } = trpc.notification.getPreferences.useQuery()
  const { data: profile } = trpc.user.getProfile.useQuery()
  const updatePreferences = trpc.notification.updatePreferences.useMutation()

  const [emailEnabled, setEmailEnabled] = useState(true)
  const [inAppEnabled, setInAppEnabled] = useState(true)
  const [certificateEnabled, setCertificateEnabled] = useState(true)
  const [assessmentEnabled, setAssessmentEnabled] = useState(true)
  const [hmoEnabled, setHmoEnabled] = useState(true)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [systemEnabled, setSystemEnabled] = useState(true)
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize state from fetched preferences
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled)
      setInAppEnabled(preferences.inAppEnabled)
      setCertificateEnabled(preferences.certificateExpiryEnabled)
      setAssessmentEnabled(preferences.assessmentDueEnabled)
      setHmoEnabled(preferences.hmoExpiryEnabled)
      setRegistrationEnabled(preferences.registrationExpiryEnabled)
      setSystemEnabled(preferences.systemAlertsEnabled)
      setFrequency(preferences.emailFrequency as 'immediate' | 'daily' | 'weekly')
    }
  }, [preferences])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await updatePreferences.mutateAsync({
        emailEnabled,
        inAppEnabled,
        certificateExpiryEnabled: certificateEnabled,
        assessmentDueEnabled: assessmentEnabled,
        hmoExpiryEnabled: hmoEnabled,
        registrationExpiryEnabled: registrationEnabled,
        systemAlertsEnabled: systemEnabled,
        emailFrequency: frequency,
      })

      setSaveSuccess(true)
      await refetch()

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and notification preferences</p>
      </div>

      {/* Profile Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Name</Label>
              <p className="text-gray-900 mt-1">{profile?.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <p className="text-gray-900 mt-1">{profile?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Role</Label>
              <p className="text-gray-900 mt-1 capitalize">{profile?.role.toLowerCase()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Member Since</Label>
              <p className="text-gray-900 mt-1">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Notification Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure when and how you receive compliance alerts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled" className="text-base font-medium">
                Enable Email Notifications
              </Label>
              <p className="text-sm text-gray-500">
                Receive automated emails about expiring certificates, registrations, and compliance alerts
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>

          {/* Enable/Disable In-App Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp-enabled" className="text-base font-medium">
                Enable In-App Notifications
              </Label>
              <p className="text-sm text-gray-500">
                Show notifications in the notification bell dropdown and history page
              </p>
            </div>
            <Switch
              id="inapp-enabled"
              checked={inAppEnabled}
              onCheckedChange={setInAppEnabled}
            />
          </div>

          {/* Email Notification Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-base font-medium">
              Email Notification Frequency
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Choose how often you want to receive email notifications
            </p>
            <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <SelectTrigger id="frequency" className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Immediate</p>
                      <p className="text-xs text-gray-500">Send emails as soon as notifications are created</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Daily</p>
                      <p className="text-xs text-gray-500">Receive notifications every morning at 9:00 AM</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Weekly</p>
                      <p className="text-xs text-gray-500">Receive a summary every Monday morning</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {saveSuccess && (
                <p className="text-sm text-green-600 font-medium">✓ Settings saved successfully</p>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Control which types of notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cert-enabled" className="text-base font-medium">
                Certificate Expiry Notifications
              </Label>
              <p className="text-sm text-gray-500">
                Gas Safety, EPC, EICR, and PAT certificates expiring within 30 days
              </p>
            </div>
            <Switch
              id="cert-enabled"
              checked={certificateEnabled}
              onCheckedChange={setCertificateEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hmo-enabled" className="text-base font-medium">
                HMO License Expiry Notifications
              </Label>
              <p className="text-sm text-gray-500">
                HMO licenses expiring within 60 days
              </p>
            </div>
            <Switch
              id="hmo-enabled"
              checked={hmoEnabled}
              onCheckedChange={setHmoEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reg-enabled" className="text-base font-medium">
                Registration Expiry Notifications
              </Label>
              <p className="text-sm text-gray-500">
                Landlord registrations expiring within 60 days
              </p>
            </div>
            <Switch
              id="reg-enabled"
              checked={registrationEnabled}
              onCheckedChange={setRegistrationEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="assess-enabled" className="text-base font-medium">
                Assessment Due Notifications
              </Label>
              <p className="text-sm text-gray-500">
                Overdue repairing standard assessments and action items
              </p>
            </div>
            <Switch
              id="assess-enabled"
              checked={assessmentEnabled}
              onCheckedChange={setAssessmentEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-enabled" className="text-base font-medium">
                System Alerts
              </Label>
              <p className="text-sm text-gray-500">
                Important system announcements and updates
              </p>
            </div>
            <Switch
              id="system-enabled"
              checked={systemEnabled}
              onCheckedChange={setSystemEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* What Gets Sent */}
      <Card>
        <CardHeader>
          <CardTitle>How Notifications Work</CardTitle>
          <CardDescription>Understanding the notification system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">In-App Notifications</p>
                <p className="text-sm text-blue-700">Appear in the bell icon dropdown and notification history page. Updated in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 flex-shrink-0">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-900">Email Notifications</p>
                <p className="text-sm text-purple-700">Sent to your email based on the frequency you select above.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 flex-shrink-0">
                <Bell className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-indigo-900">Automated Checks</p>
                <p className="text-sm text-indigo-700">System automatically checks for expiring items daily and creates notifications.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 flex-shrink-0">
                <Bell className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-orange-900">Priority Levels</p>
                <p className="text-sm text-orange-700">Notifications have priority levels (critical, high, normal, low) based on urgency.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
