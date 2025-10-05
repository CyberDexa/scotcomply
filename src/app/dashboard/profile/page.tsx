'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Shield, Calendar, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: session } = useSession()
  const { data: profile, isLoading, refetch } = trpc.user.getProfile.useQuery()
  const updateProfile = trpc.user.updateProfile.useMutation()

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    businessName: '',
  })

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phoneNumber: profile.landlordProfile?.phoneNumber || '',
        address: profile.landlordProfile?.address || '',
        businessName: profile.landlordProfile?.businessName || '',
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateProfile.mutateAsync(formData)
      await refetch()
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and account details</p>
      </div>

      <div className="grid gap-6">
        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your basic account details and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="h-4 w-4" />
                  Account Role
                </Label>
                <Input
                  value={session?.user?.role || 'LANDLORD'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
                <p className="text-xs text-gray-500">Role is assigned by admin</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <Input
                  value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+44 7700 900000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, Edinburgh, EH1 1AA"
                />
              </div>

              {session?.user?.role === 'LANDLORD' && (
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Name (Optional)
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="ABC Property Lettings Ltd"
                  />
                  <p className="text-xs text-gray-500">
                    If you operate as a business, enter your company name
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: profile?.name || '',
                      phoneNumber: profile?.landlordProfile?.phoneNumber || '',
                      address: profile?.landlordProfile?.address || '',
                      businessName: profile?.landlordProfile?.businessName || '',
                    })
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-900">Need More Options?</CardTitle>
            <CardDescription className="text-indigo-700">
              Additional settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="link"
              className="text-indigo-600 hover:text-indigo-700 p-0 h-auto"
              onClick={() => window.location.href = '/dashboard/settings'}
            >
              → Go to Advanced Settings
            </Button>
            <br />
            <Button
              variant="link"
              className="text-indigo-600 hover:text-indigo-700 p-0 h-auto"
              onClick={() => window.location.href = '/dashboard/settings-enhanced'}
            >
              → Notification Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
