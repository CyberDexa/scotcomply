'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataFreshnessBadge } from '@/components/ui/data-freshness-badge';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bell,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { AlertSeverity } from '@prisma/client';

export default function CouncilDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [councilId, setCouncilId] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setCouncilId(resolvedParams.id);
    });
  }, [params]);

  const { data: council } = trpc.council.getCouncilById.useQuery(
    { id: councilId! },
    { enabled: !!councilId }
  );
  const { data: changes } = trpc.council.listChanges.useQuery(
    { councilId: councilId!, limit: 20 },
    { enabled: !!councilId }
  );

  if (!councilId || !council) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Loading council details...</h3>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{council.councilName}</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">{council.councilArea}</p>
            <DataFreshnessBadge lastScraped={council.lastScraped} />
          </div>
        </div>
        <div className="flex gap-2">
          {council.websiteUrl && (
            <Button variant="outline" asChild>
              <a href={council.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                Visit Website
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/councils/compare?councils=${council.id}`}>
              <Building2 className="mr-2 h-4 w-4" />
              Compare
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Fee</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{council.registrationFee?.toFixed(2) || 'N/A'}
            </div>
            {council.renewalFee && (
              <p className="text-xs text-muted-foreground">
                Renewal: £{council.renewalFee.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HMO License</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{council.hmoFee?.toFixed(2) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Licensing fee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {council.processingTimeDays || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Days (average)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{council._count.alerts}</div>
            <p className="text-xs text-muted-foreground">
              {council._count.changes} changes tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({council.alerts.length})</TabsTrigger>
          <TabsTrigger value="changes">Change History ({changes?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Get in touch with the council</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {council.population && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Population</p>
                      <p className="text-sm text-muted-foreground">
                        {council.population.toLocaleString()} residents
                      </p>
                    </div>
                  </div>
                )}

                {council.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a
                        href={`mailto:${council.contactEmail}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {council.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {council.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <a
                        href={`tel:${council.contactPhone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {council.contactPhone}
                      </a>
                    </div>
                  </div>
                )}

                {council.contactAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Office Address</p>
                      <p className="text-sm text-muted-foreground">{council.contactAddress}</p>
                    </div>
                  </div>
                )}

                {council.officeHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Office Hours</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {council.officeHours}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fees Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Fees & Charges</CardTitle>
                <CardDescription>Registration and licensing costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {council.registrationFee && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Landlord Registration</span>
                    <span className="text-sm font-bold">
                      £{council.registrationFee.toFixed(2)}
                    </span>
                  </div>
                )}

                {council.renewalFee && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Registration Renewal</span>
                    <span className="text-sm font-bold">£{council.renewalFee.toFixed(2)}</span>
                  </div>
                )}

                {council.hmoFee && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">HMO License</span>
                    <span className="text-sm font-bold">£{council.hmoFee.toFixed(2)}</span>
                  </div>
                )}

                {council.processingTimeDays && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Processing Time</span>
                    <span className="text-sm font-bold">{council.processingTimeDays} days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>
                Mandatory documents and certificates for {council.councilName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  {council.requiresGasSafety ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">Gas Safety Certificate</p>
                    <p className="text-xs text-muted-foreground">
                      {council.requiresGasSafety ? 'Required' : 'Not required'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  {council.requiresEICR ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">EICR Certificate</p>
                    <p className="text-xs text-muted-foreground">
                      {council.requiresEICR ? 'Required' : 'Not required'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  {council.requiresEPC ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">EPC Certificate</p>
                    <p className="text-xs text-muted-foreground">
                      {council.requiresEPC ? 'Required' : 'Not required'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  {council.requiresLegionella ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">Legionella Risk Assessment</p>
                    <p className="text-xs text-muted-foreground">
                      {council.requiresLegionella ? 'Required' : 'Not required'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  {council.requiresPAT ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">PAT Testing</p>
                    <p className="text-xs text-muted-foreground">
                      {council.requiresPAT ? 'Required' : 'Not required'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Regulatory alerts for {council.councilName}</CardDescription>
            </CardHeader>
            <CardContent>
              {council.alerts && council.alerts.length > 0 ? (
                <div className="space-y-3">
                  {council.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity === AlertSeverity.CRITICAL ||
                            alert.severity === AlertSeverity.HIGH ? (
                              <AlertTriangle className="mr-1 h-3 w-3" />
                            ) : (
                              <Bell className="mr-1 h-3 w-3" />
                            )}
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.category.replace(/_/g, ' ')}</Badge>
                        </div>
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Effective: {new Date(alert.effectiveDate).toLocaleDateString()}
                          </span>
                          {alert.sourceUrl && (
                            <a
                              href={alert.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              View Source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Active Alerts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are currently no active alerts for this council.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changes Tab */}
        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>Recent regulatory and fee changes</CardDescription>
            </CardHeader>
            <CardContent>
              {changes && changes.length > 0 ? (
                <div className="space-y-3">
                  {changes.map((change) => (
                    <div key={change.id} className="rounded-lg border p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{change.changeType.replace(/_/g, ' ')}</Badge>
                          {(change.impactLevel === 'HIGH' || change.impactLevel === 'CRITICAL') && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {change.impactLevel} Impact
                            </Badge>
                          )}
                          {change.affectsExisting && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Affects Existing
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{change.title}</h3>
                        {change.description && (
                          <p className="text-sm text-muted-foreground">{change.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Effective: {new Date(change.effectiveDate).toLocaleDateString()}
                          </span>
                          {change.oldValue && change.newValue && (
                            <span className="flex items-center gap-2">
                              <TrendingUp className="h-3 w-3" />
                              {change.oldValue} → {change.newValue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Changes Recorded</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are no recorded changes for this council.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
