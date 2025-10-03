'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  BellOff,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AlertSeverity, AlertStatus, AlertCategory, AlertType } from '@prisma/client';

export default function CouncilIntelligencePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(AlertStatus.ACTIVE);

  // Fetch data
  const { data: stats } = trpc.council.getCouncilStats.useQuery();
  const { data: unreadCount } = trpc.council.getUnreadAlertsCount.useQuery();
  const { data: alertsData } = trpc.council.listAlerts.useQuery({
    severity: selectedSeverity !== 'all' ? (selectedSeverity as AlertSeverity) : undefined,
    category: selectedCategory !== 'all' ? (selectedCategory as AlertCategory) : undefined,
    status: selectedStatus as AlertStatus,
    limit: 50,
  });
  const { data: recentChanges } = trpc.council.listChanges.useQuery({
    limit: 10,
  });
  const { data: upcomingChanges } = trpc.council.getUpcomingChanges.useQuery({
    daysAhead: 30,
  });

  const acknowledgeAlertMutation = trpc.council.acknowledgeAlert.useMutation();

  const handleAcknowledgeAlert = async (alertId: string, dismiss: boolean = false) => {
    try {
      await acknowledgeAlertMutation.mutateAsync({
        alertId,
        dismissed: dismiss,
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case AlertSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case AlertSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case AlertSeverity.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case AlertSeverity.INFO:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.HIGH:
        return <AlertTriangle className="h-4 w-4" />;
      case AlertSeverity.MEDIUM:
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Council Intelligence</h1>
          <p className="text-muted-foreground">
            Track regulatory changes and alerts across Scottish councils
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Alert Preferences
          </a>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Councils</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCouncils || 0}</div>
            <p className="text-xs text-muted-foreground">Scottish local authorities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {unreadCount || 0} unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentChanges || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Reg. Fee</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats?.avgRegistrationFee?.toFixed(0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              HMO: £{stats?.avgHMOFee?.toFixed(0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Changes */}
      {upcomingChanges && upcomingChanges.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Upcoming Changes (Next 30 Days)
            </CardTitle>
            <CardDescription>
              {upcomingChanges.length} change{upcomingChanges.length > 1 ? 's' : ''} taking effect soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingChanges.slice(0, 5).map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {change.council.councilName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {change.changeType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium">{change.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Effective: {new Date(change.effectiveDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regulatory Alerts</CardTitle>
              <CardDescription>
                Stay informed about council changes and requirements
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/councils/compare">
                <Filter className="mr-2 h-4 w-4" />
                Compare Councils
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value={AlertSeverity.CRITICAL}>Critical</SelectItem>
                <SelectItem value={AlertSeverity.HIGH}>High</SelectItem>
                <SelectItem value={AlertSeverity.MEDIUM}>Medium</SelectItem>
                <SelectItem value={AlertSeverity.LOW}>Low</SelectItem>
                <SelectItem value={AlertSeverity.INFO}>Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={AlertCategory.FEES}>Fees</SelectItem>
                <SelectItem value={AlertCategory.COMPLIANCE}>Compliance</SelectItem>
                <SelectItem value={AlertCategory.LANDLORD_REGISTRATION}>Registration</SelectItem>
                <SelectItem value={AlertCategory.HMO_LICENSING}>HMO Licensing</SelectItem>
                <SelectItem value={AlertCategory.CERTIFICATES}>Certificates</SelectItem>
                <SelectItem value={AlertCategory.GENERAL}>General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AlertStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={AlertStatus.EXPIRED}>Expired</SelectItem>
                <SelectItem value={AlertStatus.ARCHIVED}>Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {alertsData?.alerts && alertsData.alerts.length > 0 ? (
              alertsData.alerts
                .filter((alert) =>
                  searchQuery
                    ? alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      alert.description.toLowerCase().includes(searchQuery.toLowerCase())
                    : true
                )
                .map((alert) => {
                  const isRead = alert.acknowledgements && alert.acknowledgements.length > 0;
                  const isDismissed = isRead && alert.acknowledgements[0].dismissedAt;

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        isDismissed ? 'bg-gray-50 opacity-60' : 'bg-white'
                      } ${
                        !isRead && !isDismissed ? 'border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {getSeverityIcon(alert.severity)}
                              <span className="ml-1">{alert.severity}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.category.replace(/_/g, ' ')}
                            </Badge>
                            {alert.council && (
                              <Badge variant="secondary" className="text-xs">
                                {alert.council.councilName}
                              </Badge>
                            )}
                            {!isRead && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                New
                              </Badge>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold">{alert.title}</h3>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground">{alert.description}</p>

                          {/* Footer */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Effective: {new Date(alert.effectiveDate).toLocaleDateString()}
                            </span>
                            {alert.expiryDate && (
                              <span>
                                Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                            <span>{alert.viewCount} views</span>
                            {alert.sourceUrl && (
                              <a
                                href={alert.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                Source <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {!isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id, false)}
                              disabled={acknowledgeAlertMutation.isPending}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Mark Read
                            </Button>
                          )}
                          {!isDismissed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id, true)}
                              disabled={acknowledgeAlertMutation.isPending}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No alerts found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are no alerts matching your current filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      {recentChanges && recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Council Changes</CardTitle>
            <CardDescription>Latest updates from local authorities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {change.council.councilName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {change.changeType.replace(/_/g, ' ')}
                      </Badge>
                      {change.impactLevel === 'HIGH' || change.impactLevel === 'CRITICAL' ? (
                        <Badge className="bg-red-100 text-red-800 text-xs border-red-200">
                          {change.impactLevel} Impact
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-medium">{change.title}</p>
                    {change.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{change.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Effective: {new Date(change.effectiveDate).toLocaleDateString()}
                      </span>
                      {change.oldValue && change.newValue && (
                        <span>
                          {change.oldValue} → {change.newValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
