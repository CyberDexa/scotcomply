'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Calendar,
  Mail,
  Phone,
  Globe,
  FileText,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { ScreeningStatus, RiskLevel, ReviewStatus, MatchDecision, MatchType } from '@prisma/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function AMLScreeningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AMLScreeningDetailContent params={params} />
}

function AMLScreeningDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [eddDialogOpen, setEddDialogOpen] = useState(false)
  const [eddNotes, setEddNotes] = useState('')
  const [reviewingMatchId, setReviewingMatchId] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  // Fetch screening details
  const { data: screening, isLoading, refetch } = trpc.aml.getById.useQuery(
    { id },
    { enabled: !!id }
  )

  // Mutations
  const reviewMatch = trpc.aml.reviewMatch.useMutation({
    onSuccess: () => {
      toast.success('Match reviewed successfully')
      refetch()
      setReviewingMatchId(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to review match')
    },
  })

  const completeEDD = trpc.aml.completeEDD.useMutation({
    onSuccess: () => {
      toast.success('EDD completed successfully')
      refetch()
      setEddDialogOpen(false)
      setEddNotes('')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete EDD')
    },
  })

  const updateReviewStatus = trpc.aml.updateReviewStatus.useMutation({
    onSuccess: () => {
      toast.success('Review status updated')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })

  const handleReviewMatch = (matchId: string, decision: MatchDecision, notes?: string) => {
    reviewMatch.mutate({ matchId, decision, reviewNotes: notes })
  }

  const handleCompleteEDD = () => {
    if (!eddNotes.trim()) {
      toast.error('EDD notes are required')
      return
    }
    completeEDD.mutate({ screeningId: id, eddNotes })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Shield className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!screening) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Screening Not Found</h2>
        <Button onClick={() => router.push('/dashboard/aml')}>
          Back to Screenings
        </Button>
      </div>
    )
  }

  const pendingMatches = screening.matches.filter(m => m.reviewStatus === ReviewStatus.PENDING)
  const reviewedMatches = screening.matches.filter(m => m.reviewStatus !== ReviewStatus.PENDING)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{screening.subjectName}</h1>
            <Badge variant="outline">{screening.subjectType}</Badge>
            {getStatusBadge(screening.status)}
            {screening.riskLevel && getRiskBadge(screening.riskLevel)}
          </div>
          <p className="text-muted-foreground">
            Screened on {new Date(screening.screeningDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Subject Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Risk Overview */}
          {screening.status === ScreeningStatus.COMPLETED && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-4xl font-bold">{screening.riskScore || 0}</div>
                    <div className="text-sm text-muted-foreground">Risk Score</div>
                  </div>
                  <div className="text-right">
                    {screening.riskLevel && getRiskBadge(screening.riskLevel)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${screening.sanctionsMatch ? 'bg-red-50 border border-red-200' : 'bg-muted'}`}>
                    <div className="text-sm font-medium mb-1">Sanctions</div>
                    <div className="flex items-center gap-2">
                      {screening.sanctionsMatch ? (
                        <><AlertCircle className="h-4 w-4 text-red-600" /> <span className="text-red-600">Match Found</span></>
                      ) : (
                        <><CheckCircle className="h-4 w-4 text-green-600" /> <span className="text-green-600">Clear</span></>
                      )}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${screening.pepMatch ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted'}`}>
                    <div className="text-sm font-medium mb-1">PEP</div>
                    <div className="flex items-center gap-2">
                      {screening.pepMatch ? (
                        <><AlertCircle className="h-4 w-4 text-yellow-600" /> <span className="text-yellow-600">Match Found</span></>
                      ) : (
                        <><CheckCircle className="h-4 w-4 text-green-600" /> <span className="text-green-600">Clear</span></>
                      )}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${screening.adverseMedia ? 'bg-orange-50 border border-orange-200' : 'bg-muted'}`}>
                    <div className="text-sm font-medium mb-1">Adverse Media</div>
                    <div className="flex items-center gap-2">
                      {screening.adverseMedia ? (
                        <><AlertCircle className="h-4 w-4 text-orange-600" /> <span className="text-orange-600">Match Found</span></>
                      ) : (
                        <><CheckCircle className="h-4 w-4 text-green-600" /> <span className="text-green-600">Clear</span></>
                      )}
                    </div>
                  </div>
                </div>

                {screening.eddRequired && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-orange-900 mb-1">Enhanced Due Diligence Required</div>
                        <p className="text-sm text-orange-800 mb-3">
                          This screening requires additional documentation due to elevated risk.
                        </p>
                        {!screening.eddCompleted ? (
                          <Button size="sm" onClick={() => setEddDialogOpen(true)}>
                            Complete EDD
                          </Button>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">EDD Completed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Matches */}
          {screening.matches && screening.matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screening Matches ({screening.matches.length})</CardTitle>
                <CardDescription>
                  Review each match and mark as accept (true positive) or reject (false positive)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMatches.length > 0 && (
                  <>
                    <div className="font-medium">Pending Review ({pendingMatches.length})</div>
                    {pendingMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onReview={handleReviewMatch}
                        isReviewing={reviewingMatchId === match.id}
                      />
                    ))}
                  </>
                )}

                {reviewedMatches.length > 0 && (
                  <>
                    <div className="font-medium mt-6">Reviewed ({reviewedMatches.length})</div>
                    {reviewedMatches.map(match => (
                      <MatchCard key={match.id} match={match} reviewed />
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit Log */}
          {screening.audits && screening.audits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Complete history of screening actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {screening.audits.map(audit => (
                    <div key={audit.id} className="flex gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">{audit.action.replace(/_/g, ' ')}</div>
                        <div className="text-muted-foreground">{audit.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(audit.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subject Info */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {screening.subjectType === 'INDIVIDUAL' ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Building className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{screening.subjectType}</span>
              </div>

              {screening.subjectEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{screening.subjectEmail}</span>
                </div>
              )}

              {screening.subjectPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{screening.subjectPhone}</span>
                </div>
              )}

              {screening.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>DOB: {new Date(screening.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}

              {screening.nationality && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{screening.nationality}</span>
                </div>
              )}

              {screening.companyNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Co. No: {screening.companyNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Review Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div>{getReviewStatusBadge(screening.reviewStatus)}</div>
              </div>

              {screening.reviewStatus === ReviewStatus.PENDING && pendingMatches.length === 0 && (
                <Button
                  className="w-full"
                  onClick={() => updateReviewStatus.mutate({
                    screeningId: id,
                    reviewStatus: ReviewStatus.APPROVED,
                  })}
                  disabled={updateReviewStatus.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Screening
                </Button>
              )}

              {screening.nextReviewDate && (
                <div className="text-sm text-muted-foreground">
                  Next review: {new Date(screening.nextReviewDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {screening.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{screening.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* EDD Dialog */}
      <Dialog open={eddDialogOpen} onOpenChange={setEddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Enhanced Due Diligence</DialogTitle>
            <DialogDescription>
              Document your enhanced due diligence findings and risk mitigation measures.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edd-notes">EDD Notes *</Label>
              <Textarea
                id="edd-notes"
                rows={6}
                placeholder="Document your findings, risk assessment, and any mitigation measures..."
                value={eddNotes}
                onChange={(e) => setEddNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include source of funds verification, purpose of relationship, expected activity, etc.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteEDD} disabled={completeEDD.isPending}>
              Complete EDD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Match Card Component
function MatchCard({ 
  match, 
  onReview, 
  isReviewing, 
  reviewed 
}: { 
  match: any
  onReview?: (matchId: string, decision: MatchDecision, notes?: string) => void
  isReviewing?: boolean
  reviewed?: boolean
}) {
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const getMatchTypeColor = (type: MatchType) => {
    switch (type) {
      case MatchType.SANCTIONS: return 'bg-red-100 text-red-800 border-red-200'
      case MatchType.PEP: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case MatchType.ADVERSE_MEDIA: return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${reviewed ? 'bg-muted/50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{match.entityName}</h4>
            <Badge className={getMatchTypeColor(match.matchType)}>
              {match.matchType.replace('_', ' ')}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>List: {match.listName}</div>
            {match.nationality && match.nationality.length > 0 && (
              <div>Nationality: {match.nationality.join(', ')}</div>
            )}
            {match.positions && match.positions.length > 0 && (
              <div>Positions: {match.positions.join(', ')}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{match.matchScore}</div>
          <div className="text-xs text-muted-foreground">Match Score</div>
        </div>
      </div>

      {reviewed ? (
        <div className="flex items-center gap-2">
          {match.decision === MatchDecision.ACCEPT ? (
            <Badge className="bg-red-100 text-red-800">Accepted (True Positive)</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">Rejected (False Positive)</Badge>
          )}
          {match.reviewNotes && (
            <span className="text-xs text-muted-foreground">• {match.reviewNotes}</span>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {showNotes && (
            <div className="space-y-2">
              <Label htmlFor={`notes-${match.id}`}>Review Notes</Label>
              <Textarea
                id={`notes-${match.id}`}
                rows={2}
                placeholder="Add notes about your decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!showNotes) {
                  setShowNotes(true)
                } else {
                  onReview?.(match.id, MatchDecision.ACCEPT, notes)
                }
              }}
              disabled={isReviewing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept Match
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!showNotes) {
                  setShowNotes(true)
                } else {
                  onReview?.(match.id, MatchDecision.REJECT, notes)
                }
              }}
              disabled={isReviewing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject Match
            </Button>
            {!showNotes && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNotes(true)}
              >
                Add Notes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getStatusBadge(status: ScreeningStatus) {
  const config = {
    [ScreeningStatus.PENDING]: { label: 'Pending', variant: 'secondary' as const },
    [ScreeningStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'default' as const },
    [ScreeningStatus.COMPLETED]: { label: 'Completed', variant: 'outline' as const },
    [ScreeningStatus.FAILED]: { label: 'Failed', variant: 'destructive' as const },
    [ScreeningStatus.REQUIRES_REVIEW]: { label: 'Requires Review', variant: 'secondary' as const },
  }

  const { label, variant } = config[status] || config[ScreeningStatus.PENDING]
  return <Badge variant={variant}>{label}</Badge>
}

function getRiskBadge(risk: RiskLevel) {
  const config = {
    [RiskLevel.LOW]: { label: 'Low Risk', className: 'bg-green-100 text-green-800' },
    [RiskLevel.MEDIUM]: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-800' },
    [RiskLevel.HIGH]: { label: 'High Risk', className: 'bg-orange-100 text-orange-800' },
    [RiskLevel.CRITICAL]: { label: 'Critical Risk', className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = config[risk] || config[RiskLevel.LOW]
  return <Badge className={className}>{label}</Badge>
}

function getReviewStatusBadge(status: ReviewStatus) {
  const config = {
    [ReviewStatus.PENDING]: { label: 'Pending', variant: 'secondary' as const, className: '' },
    [ReviewStatus.IN_REVIEW]: { label: 'In Review', variant: 'default' as const, className: '' },
    [ReviewStatus.APPROVED]: { label: 'Approved', variant: 'outline' as const, className: 'border-green-500 text-green-700' },
    [ReviewStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' as const, className: '' },
    [ReviewStatus.EDD_REQUIRED]: { label: 'EDD Required', variant: 'secondary' as const, className: 'border-orange-500 text-orange-700' },
  }

  const { label, variant, className } = config[status] || config[ReviewStatus.PENDING]
  return <Badge variant={variant} className={className || undefined}>{label}</Badge>
}
