'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

export default function CouncilComparisonPage() {
  const [selectedCouncils, setSelectedCouncils] = useState<string[]>([]);

  const { data: councils } = trpc.council.listCouncils.useQuery({ limit: 32 });
  const { data: comparison } = trpc.council.compareCouncils.useQuery(
    { councilIds: selectedCouncils },
    { enabled: selectedCouncils.length >= 2 }
  );

  const handleSelectCouncil = (councilId: string) => {
    if (selectedCouncils.includes(councilId)) {
      setSelectedCouncils(selectedCouncils.filter((id) => id !== councilId));
    } else if (selectedCouncils.length < 5) {
      setSelectedCouncils([...selectedCouncils, councilId]);
    }
  };

  const clearSelection = () => {
    setSelectedCouncils([]);
  };

  const getComparisonIcon = (value: number | null, avg: number) => {
    if (value === null) return <Minus className="h-4 w-4 text-gray-400" />;
    if (value < avg) return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (value > avg) return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return `£${value.toFixed(2)}`;
  };

  const formatDays = (days: number | null) => {
    if (days === null) return 'N/A';
    return `${days} days`;
  };

  // Calculate averages
  const avgRegistrationFee =
    comparison && comparison.length > 0
      ? comparison.reduce((sum, c) => sum + (c.registrationFee || 0), 0) / comparison.length
      : 0;
  const avgHMOFee =
    comparison && comparison.length > 0
      ? comparison.reduce((sum, c) => sum + (c.hmoFee || 0), 0) /
        comparison.filter((c) => c.hmoFee).length
      : 0;
  const avgProcessingTime =
    comparison && comparison.length > 0
      ? comparison.reduce((sum, c) => sum + (c.processingTimeDays || 0), 0) / comparison.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Councils</h1>
        <p className="text-muted-foreground">
          Side-by-side comparison of fees, requirements, and processing times
        </p>
      </div>

      {/* Council Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Councils to Compare</CardTitle>
          <CardDescription>Choose 2-5 councils for comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {councils?.map((council) => (
                <Button
                  key={council.id}
                  variant={selectedCouncils.includes(council.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectCouncil(council.id)}
                  disabled={
                    !selectedCouncils.includes(council.id) && selectedCouncils.length >= 5
                  }
                >
                  {council.councilName}
                  {selectedCouncils.includes(council.id) && (
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>

            {selectedCouncils.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <span className="text-sm">
                  {selectedCouncils.length} council{selectedCouncils.length > 1 ? 's' : ''}{' '}
                  selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && comparison.length >= 2 ? (
        <div className="space-y-6">
          {/* Fees Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Comparison</CardTitle>
              <CardDescription>Registration and licensing fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Council</th>
                      <th className="text-right p-3 font-medium">Registration Fee</th>
                      <th className="text-right p-3 font-medium">HMO License</th>
                      <th className="text-right p-3 font-medium">Renewal Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((council) => (
                      <tr key={council.id} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{council.councilName}</span>
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex items-center justify-end gap-2">
                            {getComparisonIcon(council.registrationFee, avgRegistrationFee)}
                            <span>{formatCurrency(council.registrationFee)}</span>
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex items-center justify-end gap-2">
                            {council.hmoFee
                              ? getComparisonIcon(council.hmoFee, avgHMOFee)
                              : null}
                            <span>{formatCurrency(council.hmoFee)}</span>
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <span>{formatCurrency(council.renewalFee)}</span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 font-semibold">
                      <td className="p-3">Average</td>
                      <td className="text-right p-3">{formatCurrency(avgRegistrationFee)}</td>
                      <td className="text-right p-3">{formatCurrency(avgHMOFee)}</td>
                      <td className="text-right p-3">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Processing Times */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Times</CardTitle>
              <CardDescription>Average application processing duration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Council</th>
                      <th className="text-right p-3 font-medium">Processing Time</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((council) => (
                      <tr key={council.id} className="border-b">
                        <td className="p-3">
                          <span className="font-medium">{council.councilName}</span>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex items-center justify-end gap-2">
                            {getComparisonIcon(council.processingTimeDays, avgProcessingTime)}
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDays(council.processingTimeDays)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {council.processingTimeDays &&
                          council.processingTimeDays < avgProcessingTime ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Faster
                            </Badge>
                          ) : council.processingTimeDays &&
                            council.processingTimeDays > avgProcessingTime ? (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Slower
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Average</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements Comparison</CardTitle>
              <CardDescription>Mandatory compliance requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Requirement</th>
                      {comparison.map((council) => (
                        <th key={council.id} className="text-center p-3 font-medium">
                          {council.councilName.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">Gas Safety Certificate</td>
                      {comparison.map((council) => (
                        <td key={council.id} className="text-center p-3">
                          {council.requiresGasSafety ? (
                            <CheckCircle2 className="inline h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="inline h-5 w-5 text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">EICR Certificate</td>
                      {comparison.map((council) => (
                        <td key={council.id} className="text-center p-3">
                          {council.requiresEICR ? (
                            <CheckCircle2 className="inline h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="inline h-5 w-5 text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">EPC Certificate</td>
                      {comparison.map((council) => (
                        <td key={council.id} className="text-center p-3">
                          {council.requiresEPC ? (
                            <CheckCircle2 className="inline h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="inline h-5 w-5 text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Legionella Assessment</td>
                      {comparison.map((council) => (
                        <td key={council.id} className="text-center p-3">
                          {council.requiresLegionella ? (
                            <CheckCircle2 className="inline h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="inline h-5 w-5 text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">PAT Testing</td>
                      {comparison.map((council) => (
                        <td key={council.id} className="text-center p-3">
                          {council.requiresPAT ? (
                            <CheckCircle2 className="inline h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="inline h-5 w-5 text-gray-300" />
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Get in touch with council departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {comparison.map((council) => (
                  <div key={council.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{council.councilName}</h3>
                        {council.councilArea && (
                          <p className="text-sm text-muted-foreground">{council.councilArea}</p>
                        )}
                      </div>
                    </div>

                    {council.population && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{council.population.toLocaleString()} residents</span>
                      </div>
                    )}

                    {council.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${council.contactEmail}`}
                          className="text-blue-600 hover:underline"
                        >
                          {council.contactEmail}
                        </a>
                      </div>
                    )}

                    {council.contactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${council.contactPhone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {council.contactPhone}
                        </a>
                      </div>
                    )}

                    {council.websiteUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={council.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    {council.contactAddress && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{council.contactAddress}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={`/dashboard/councils/${council.id}`}>View Details</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : selectedCouncils.length > 0 && selectedCouncils.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Select Another Council</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose at least one more council to start comparing
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Councils Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Select 2-5 councils from the list above to compare their fees and requirements
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
