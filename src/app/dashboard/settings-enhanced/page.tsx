'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { usePreferences } from '@/contexts/PreferencesContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Bell,
  Settings as SettingsIcon,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
} from 'lucide-react'

export default function EnhancedSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { updatePreferences: updateContextPreferences } = usePreferences()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch user settings
  const { data: settings, isLoading, refetch } = trpc.settings.getSettings.useQuery()
  const { data: stats } = trpc.settings.getStats.useQuery()

  // Mutations
  const updateProfile = trpc.settings.updateProfile.useMutation()
  const updateNotifications = trpc.settings.updateNotifications.useMutation()
  const updatePreferences = trpc.settings.updatePreferences.useMutation()
  const changePassword = trpc.settings.changePassword.useMutation()
  const deleteAccount = trpc.settings.deleteAccount.useMutation()

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
    postcode: '',
  })

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    emailNotificationsEnabled: true,
    emailFrequency: 'daily' as 'daily' | 'weekly' | 'disabled',
  })

  // Preferences form state
  const [preferencesForm, setPreferencesForm] = useState({
    timezone: 'Europe/London',
    language: 'en',
    theme: 'light' as 'light' | 'dark' | 'system',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GBP',
  })

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    password: '',
    confirmation: '',
  })

  // Initialize forms when settings load
  useState(() => {
    if (settings) {
      setProfileForm({
        name: settings.name || '',
        phone: settings.phone || '',
        company: settings.company || '',
        address: settings.address || '',
        postcode: settings.postcode || '',
      })
      setNotificationForm({
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        emailFrequency: settings.emailFrequency as 'daily' | 'weekly' | 'disabled',
      })
      setPreferencesForm({
        timezone: settings.timezone || 'Europe/London',
        language: settings.language || 'en',
        theme: settings.theme as 'light' | 'dark' | 'system',
        dateFormat: settings.dateFormat || 'DD/MM/YYYY',
        currency: settings.currency || 'GBP',
      })
    }
  })

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setSuccessMessage('')
    } else {
      setSuccessMessage(message)
      setErrorMessage('')
    }
    setTimeout(() => {
      setSuccessMessage('')
      setErrorMessage('')
    }, 3000)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateProfile.mutateAsync(profileForm)
      await refetch()
      showMessage('Profile updated successfully')
    } catch (error: any) {
      showMessage(error.message || 'Failed to update profile', true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateNotifications.mutateAsync(notificationForm)
      await refetch()
      showMessage('Notification preferences updated')
    } catch (error: any) {
      showMessage(error.message || 'Failed to update notifications', true)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updatePreferences.mutateAsync(preferencesForm)
      await refetch()
      
      // Update preferences context to apply changes immediately
      updateContextPreferences(preferencesForm)
      
      showMessage('Preferences updated successfully')
    } catch (error: any) {
      showMessage(error.message || 'Failed to update preferences', true)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showMessage('New passwords do not match', true)
      return
    }

    if (securityForm.newPassword.length < 8) {
      showMessage('New password must be at least 8 characters', true)
      return
    }

    setIsSaving(true)
    try {
      await changePassword.mutateAsync({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      })
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showMessage('Password changed successfully')
    } catch (error: any) {
      showMessage(error.message || 'Failed to change password', true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.confirmation !== 'DELETE MY ACCOUNT') {
      showMessage('Please type the exact confirmation text', true)
      return
    }

    if (!confirm('Are you absolutely sure? This action cannot be undone.')) {
      return
    }

    setIsSaving(true)
    try {
      await deleteAccount.mutateAsync({
        password: deleteConfirmation.password,
        confirmation: deleteConfirmation.confirmation,
      })
      router.push('/auth/signin')
    } catch (error: any) {
      showMessage(error.message || 'Failed to delete account', true)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile, preferences, and security settings
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={settings?.email || ''}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder="+44 7700 900000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={profileForm.company}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, company: e.target.value })
                        }
                        placeholder="Property Management Ltd"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, address: e.target.value })
                        }
                        placeholder="123 High Street, Edinburgh"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={profileForm.postcode}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, postcode: e.target.value })
                        }
                        placeholder="EH1 1AA"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Profile'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Avatar Upload Placeholder */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Upload a profile picture (coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <Button variant="outline" disabled>
                      Upload Image
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG or GIF (max. 2MB)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive compliance notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                  <div className="space-y-6">
                    {/* Email Notifications Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-enabled" className="text-base font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-gray-500">
                          Receive automated emails about compliance deadlines
                        </p>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={notificationForm.emailNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          setNotificationForm({
                            ...notificationForm,
                            emailNotificationsEnabled: checked,
                          })
                        }
                      />
                    </div>

                    {/* Email Frequency */}
                    {notificationForm.emailNotificationsEnabled && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <Label htmlFor="frequency">Email Frequency</Label>
                        <Select
                          value={notificationForm.emailFrequency}
                          onValueChange={(value: any) =>
                            setNotificationForm({
                              ...notificationForm,
                              emailFrequency: value,
                            })
                          }
                        >
                          <SelectTrigger id="frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">
                              Daily - Receive emails every day
                            </SelectItem>
                            <SelectItem value="weekly">
                              Weekly - Receive a weekly summary
                            </SelectItem>
                            <SelectItem value="disabled">
                              Disabled - No email notifications
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Notification Types Info */}
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Certificate Expiry</p>
                            <p className="text-xs text-gray-600">
                              Alerts 30, 14, and 7 days before expiry
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Registration Expiry</p>
                            <p className="text-xs text-gray-600">
                              Alerts 60, 30, and 14 days before expiry
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">HMO License Expiry</p>
                            <p className="text-xs text-gray-600">
                              Alerts 60, 30, and 14 days before expiry
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Maintenance Requests</p>
                            <p className="text-xs text-gray-600">
                              Instant alerts for new and emergency requests
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Assessment Due</p>
                            <p className="text-xs text-gray-600">
                              Alerts for overdue repairing standard items
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Preferences'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>
                  Customize how information is displayed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Theme */}
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={preferencesForm.theme}
                        onValueChange={(value: any) =>
                          setPreferencesForm({ ...preferencesForm, theme: value })
                        }
                      >
                        <SelectTrigger id="theme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark (coming soon)</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferencesForm.timezone}
                        onValueChange={(value) =>
                          setPreferencesForm({ ...preferencesForm, timezone: value })
                        }
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/London">
                            London (GMT/BST)
                          </SelectItem>
                          <SelectItem value="Europe/Dublin">Dublin (GMT/IST)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="America/New_York">
                            New York (EST)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={preferencesForm.dateFormat}
                        onValueChange={(value) =>
                          setPreferencesForm({ ...preferencesForm, dateFormat: value })
                        }
                      >
                        <SelectTrigger id="dateFormat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={preferencesForm.currency}
                        onValueChange={(value) =>
                          setPreferencesForm({ ...preferencesForm, currency: value })
                        }
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferencesForm.language}
                        onValueChange={(value) =>
                          setPreferencesForm({ ...preferencesForm, language: value })
                        }
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="gd">Gaelic (coming soon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Preferences'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={securityForm.currentPassword}
                            onChange={(e) =>
                              setSecurityForm({
                                ...securityForm,
                                currentPassword: e.target.value,
                              })
                            }
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                current: !showPasswords.current,
                              })
                            }
                            className="absolute right-3 top-2.5"
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={securityForm.newPassword}
                            onChange={(e) =>
                              setSecurityForm({
                                ...securityForm,
                                newPassword: e.target.value,
                              })
                            }
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                new: !showPasswords.new,
                              })
                            }
                            className="absolute right-3 top-2.5"
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Must be at least 8 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={securityForm.confirmPassword}
                            onChange={(e) =>
                              setSecurityForm({
                                ...securityForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                confirm: !showPasswords.confirm,
                              })
                            }
                            className="absolute right-3 top-2.5"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security (coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-gray-500">Not enabled</p>
                    </div>
                    <Button variant="outline" disabled>
                      Enable 2FA
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Permanently delete your account and all data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 mb-4">
                      <strong>Warning:</strong> This action cannot be undone. All your
                      properties, certificates, and compliance data will be permanently
                      deleted.
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="deletePassword">Confirm Password</Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          value={deleteConfirmation.password}
                          onChange={(e) =>
                            setDeleteConfirmation({
                              ...deleteConfirmation,
                              password: e.target.value,
                            })
                          }
                          placeholder="Enter your password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm">
                          Type <strong>DELETE MY ACCOUNT</strong> to confirm
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmation.confirmation}
                          onChange={(e) =>
                            setDeleteConfirmation({
                              ...deleteConfirmation,
                              confirmation: e.target.value,
                            })
                          }
                          placeholder="DELETE MY ACCOUNT"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={
                        !deleteConfirmation.password ||
                        deleteConfirmation.confirmation !== 'DELETE MY ACCOUNT' ||
                        isSaving
                      }
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Stats Tab */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
                <CardDescription>Overview of your account usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Properties</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats?.properties || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Certificates</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.certificates || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Registrations</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats?.registrations || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">HMO Licenses</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {stats?.hmoLicenses || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Maintenance</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {stats?.maintenanceRequests || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Assessments</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats?.assessments || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Notifications</p>
                    <p className="text-3xl font-bold text-pink-600">
                      {stats?.notifications || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Account Age</p>
                    <p className="text-3xl font-bold text-gray-600">
                      {stats?.accountAge || 0}
                      <span className="text-sm font-normal ml-1">days</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium">{settings?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium">
                        {settings?.createdAt
                          ? new Date(settings.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Account ID</span>
                      <span className="text-sm font-mono">{settings?.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
