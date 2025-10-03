'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  FileText,
  Shield,
  ClipboardCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [unreadFilter, setUnreadFilter] = useState<boolean>(false)

  // Get notifications
  const { data: notificationsData, isLoading, refetch } = trpc.notification.list.useQuery({
    limit: 100,
    unreadOnly: unreadFilter,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  })

  const notifications = notificationsData?.notifications || []

  // Get unread count
  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery()

  // Mutations
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  })

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  })

  const deleteNotificationMutation = trpc.notification.deleteNotification.useMutation({
    onSuccess: () => refetch(),
  })

  const deleteAllReadMutation = trpc.notification.deleteAllRead.useMutation({
    onSuccess: () => refetch(),
  })

  const handleMarkAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync({ notificationId: id })
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync()
  }

  const handleDelete = async (id: string) => {
    await deleteNotificationMutation.mutateAsync({ notificationId: id })
  }

  const handleDeleteAllRead = async () => {
    if (confirm('Are you sure you want to delete all read notifications?')) {
      await deleteAllReadMutation.mutateAsync()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'certificate_expiring':
        return <FileText className="h-4 w-4" />
      case 'hmo_expiring':
        return <Shield className="h-4 w-4" />
      case 'registration_expiring':
        return <ClipboardCheck className="h-4 w-4" />
      case 'assessment_due':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const filteredNotifications = notifications.filter((notification: any) => {
    const matchesSearch =
      searchQuery === '' ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const unreadCount = unreadData?.count || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button onClick={handleDeleteAllRead} variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete all read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter((n: any) => n.priority === 'high' || n.priority === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Read</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter((n: any) => n.read).length}
                </p>
              </div>
              <CheckCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="certificate_expiring">Certificates</SelectItem>
                  <SelectItem value="hmo_expiring">HMO Licenses</SelectItem>
                  <SelectItem value="registration_expiring">Registrations</SelectItem>
                  <SelectItem value="assessment_due">Assessments</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={unreadFilter ? 'unread' : 'all'} onValueChange={(value) => setUnreadFilter(value === 'unread')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">{notification.message}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {notification.type.replace('_', ' ')}
                        </span>
                      </div>

                      {notification.link && (
                        <Link href={notification.link}>
                          <Button variant="link" className="p-0 h-auto mt-2">
                            View details
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      disabled={deleteNotificationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">
              {searchQuery || typeFilter !== 'all' || unreadFilter
                ? 'No notifications match your filters'
                : "You're all caught up!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
