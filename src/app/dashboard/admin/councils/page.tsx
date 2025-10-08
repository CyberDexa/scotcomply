'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataFreshnessBadge } from '@/components/ui/data-freshness-badge'
import {
  RefreshCw,
  Edit,
  Check,
  X,
  AlertCircle,
  Shield,
  Activity,
  Database,
  Loader2,
  Calendar,
  Search,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatLastScraped } from '@/lib/data-freshness'

export default function AdminCouncilsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCouncil, setEditingCouncil] = useState<any>(null)
  const [syncingCouncils, setSyncingCouncils] = useState<Set<string>>(new Set())
  const [syncingAll, setSyncingAll] = useState(false)
  const { toast } = useToast()

  const { data: councils, refetch: refetchCouncils } = trpc.council.listCouncils.useQuery({
    limit: 100,
  })

  const updateCouncilMutation = trpc.council.updateCouncil.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Council data updated successfully',
      })
      setEditingCouncil(null)
      refetchCouncils()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const filteredCouncils = councils?.filter((council) =>
    council.councilName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSyncCouncil = async (councilId: string, councilName: string) => {
    setSyncingCouncils((prev) => new Set(prev).add(councilId))

    try {
      const response = await fetch('/api/admin/sync-council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ councilId }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Sync Complete',
          description: result.changes?.length
            ? `Found ${result.changes.length} change(s) for ${councilName}`
            : `No changes detected for ${councilName}`,
        })
        refetchCouncils()
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSyncingCouncils((prev) => {
        const next = new Set(prev)
        next.delete(councilId)
        return next
      })
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)

    try {
      const response = await fetch('/api/admin/sync-all-councils', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Bulk Sync Complete',
          description: `${result.successful}/${result.total} councils synced successfully. ${result.changes} changes detected.`,
        })
        refetchCouncils()
      } else {
        toast({
          title: 'Bulk Sync Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Bulk Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSyncingAll(false)
    }
  }

  const handleSaveEdit = () => {
    if (!editingCouncil) return

    updateCouncilMutation.mutate({
      id: editingCouncil.id,
      data: {
        registrationFee: parseFloat(editingCouncil.registrationFee),
        renewalFee: editingCouncil.renewalFee ? parseFloat(editingCouncil.renewalFee) : null,
        hmoFee: editingCouncil.hmoFee ? parseFloat(editingCouncil.hmoFee) : null,
        processingTimeDays: parseInt(editingCouncil.processingTimeDays),
        contactEmail: editingCouncil.contactEmail || null,
        contactPhone: editingCouncil.contactPhone || null,
        landlordRegUrl: editingCouncil.landlordRegUrl || null,
        hmoLicenseUrl: editingCouncil.hmoLicenseUrl || null,
      },
    })
  }

  const getLastScrapedStats = () => {
    if (!councils) return { fresh: 0, aging: 0, stale: 0, never: 0 }

    const now = new Date()
    return councils.reduce(
      (acc, council) => {
        if (!council.lastScraped) {
          acc.never++
        } else {
          const daysSince = Math.floor(
            (now.getTime() - new Date(council.lastScraped).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSince < 7) acc.fresh++
          else if (daysSince < 30) acc.aging++
          else acc.stale++
        }
        return acc
      },
      { fresh: 0, aging: 0, stale: 0, never: 0 }
    )
  }

  const stats = getLastScrapedStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold tracking-tight">Admin: Council Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage council data, trigger manual syncs, and monitor scraping status
          </p>
        </div>
        <Button onClick={handleSyncAll} disabled={syncingAll} size="lg">
          {syncingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing All...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All Councils
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Councils</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{councils?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Scottish authorities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fresh Data</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fresh}</div>
            <p className="text-xs text-muted-foreground">Verified &lt;7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aging Data</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.aging}</div>
            <p className="text-xs text-muted-foreground">7-30 days old</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stale/Never</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.stale + stats.never}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search councils..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Councils Table */}
      <Card>
        <CardHeader>
          <CardTitle>Council Data Management</CardTitle>
          <CardDescription>
            View scraping status, manually sync, or edit council information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Council</TableHead>
                  <TableHead>Last Scraped</TableHead>
                  <TableHead className="text-right">Registration Fee</TableHead>
                  <TableHead className="text-right">HMO Fee</TableHead>
                  <TableHead className="text-right">Processing Days</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouncils?.map((council) => (
                  <TableRow key={council.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{council.councilName}</span>
                        <span className="text-xs text-muted-foreground">{council.councilArea}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DataFreshnessBadge lastScraped={council.lastScraped} />
                    </TableCell>
                    <TableCell className="text-right">
                      £{council.registrationFee?.toFixed(2) || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {council.hmoFee ? `£${council.hmoFee.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {council.processingTimeDays || 'N/A'} days
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncCouncil(council.id, council.councilName)}
                          disabled={syncingCouncils.has(council.id)}
                        >
                          {syncingCouncils.has(council.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCouncil({ ...council })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit {council.councilName}</DialogTitle>
                              <DialogDescription>
                                Update council information. Changes will override scraped data.
                              </DialogDescription>
                            </DialogHeader>
                            {editingCouncil?.id === council.id && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="registrationFee">Registration Fee (£)</Label>
                                    <Input
                                      id="registrationFee"
                                      type="number"
                                      step="0.01"
                                      value={editingCouncil.registrationFee || ''}
                                      onChange={(e) =>
                                        setEditingCouncil({
                                          ...editingCouncil,
                                          registrationFee: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="renewalFee">Renewal Fee (£)</Label>
                                    <Input
                                      id="renewalFee"
                                      type="number"
                                      step="0.01"
                                      value={editingCouncil.renewalFee || ''}
                                      onChange={(e) =>
                                        setEditingCouncil({
                                          ...editingCouncil,
                                          renewalFee: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="hmoFee">HMO License Fee (£)</Label>
                                    <Input
                                      id="hmoFee"
                                      type="number"
                                      step="0.01"
                                      value={editingCouncil.hmoFee || ''}
                                      onChange={(e) =>
                                        setEditingCouncil({
                                          ...editingCouncil,
                                          hmoFee: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="processingTimeDays">Processing Days</Label>
                                    <Input
                                      id="processingTimeDays"
                                      type="number"
                                      value={editingCouncil.processingTimeDays || ''}
                                      onChange={(e) =>
                                        setEditingCouncil({
                                          ...editingCouncil,
                                          processingTimeDays: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Contact Email</Label>
                                    <Input
                                      id="contactEmail"
                                      type="email"
                                      value={editingCouncil.contactEmail || ''}
                                      onChange={(e) =>
                                        setEditingCouncil({
                                          ...editingCouncil,
                                          contactEmail: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Contact Phone</Label>
                                    <Input
                                      id="contactPhone"
                                      type="tel"
                                      value={editingCouncil.contactPhone || ''}
                                      onChange={(e) =>
                                        setEditingCouncil({
                                          ...editingCouncil,
                                          contactPhone: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="landlordRegUrl">Landlord Registration URL</Label>
                                  <Input
                                    id="landlordRegUrl"
                                    type="url"
                                    value={editingCouncil.landlordRegUrl || ''}
                                    onChange={(e) =>
                                      setEditingCouncil({
                                        ...editingCouncil,
                                        landlordRegUrl: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="hmoLicenseUrl">HMO License URL</Label>
                                  <Input
                                    id="hmoLicenseUrl"
                                    type="url"
                                    value={editingCouncil.hmoLicenseUrl || ''}
                                    onChange={(e) =>
                                      setEditingCouncil({
                                        ...editingCouncil,
                                        hmoLicenseUrl: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEditingCouncil(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveEdit}
                                disabled={updateCouncilMutation.isPending}
                              >
                                {updateCouncilMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Changes'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
