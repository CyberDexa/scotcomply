'use client'

import dynamic from 'next/dynamic'
import { useSession, signOut } from 'next-auth/react'
import { trpc } from '@/lib/trpc-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, LogOut, Settings, User, CheckCheck, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// Lazy load GlobalSearch component (only loads when header is rendered)
const GlobalSearch = dynamic(
  () => import('@/components/search/GlobalSearch').then(mod => ({ default: mod.GlobalSearch })),
  { ssr: false }
)

export function Header() {
  const { data: session } = useSession()

  // Get unread count
  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Get recent notifications
  const { data: notifications, refetch: refetchNotifications } = trpc.notification.getRecent.useQuery(
    { limit: 5 },
    {
      refetchInterval: 30000,
    }
  )

  // Mark as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications()
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications()
    },
  })

  const handleNotificationClick = async (notificationId: string, link?: string) => {
    await markAsReadMutation.mutateAsync({ notificationId })
    if (link) {
      window.location.href = link
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const unreadCount = unreadData?.count || 0

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {session?.user?.name || 'User'}
        </p>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md mx-6">
        <GlobalSearch />
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-96" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notifications && notifications.length > 0 ? (
              <>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification: any) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{notification.title}</p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        {notification.link && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications" className="text-center w-full justify-center">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="py-6 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                <AvatarFallback>
                  {session?.user?.name ? getInitials(session.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                  Role: {session?.user?.role?.toLowerCase()}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
