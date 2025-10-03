'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Filter, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterValues {
  // Property filters
  councilArea?: string
  propertyType?: string
  tenancyStatus?: string
  isHMO?: boolean
  minBedrooms?: number
  maxBedrooms?: number

  // Certificate filters
  certificateType?: string
  certificateStatus?: string
  expiringInDays?: number

  // Registration filters
  registrationStatus?: string

  // Maintenance filters
  maintenanceStatus?: string
  maintenancePriority?: string
  maintenanceCategory?: string

  // Date range
  dateFrom?: string
  dateTo?: string
}

interface AdvancedFiltersProps {
  entityType?: string
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  onReset: () => void
}

export function AdvancedFilters({ entityType = 'all', filters, onFiltersChange, onReset }: AdvancedFiltersProps) {
  const [openSections, setOpenSections] = useState<string[]>(['property'])

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  const updateFilter = (key: keyof FilterValues, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const removeFilter = (key: keyof FilterValues) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const activeFilterCount = Object.keys(filters).length

  const showPropertyFilters = entityType === 'all' || entityType === 'property'
  const showCertificateFilters = entityType === 'all' || entityType === 'certificate'
  const showRegistrationFilters = entityType === 'all' || entityType === 'registration'
  const showMaintenanceFilters = entityType === 'all' || entityType === 'maintenance'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Advanced Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
        <CardDescription>Refine your search with advanced filtering options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Filter - Always visible */}
        <Collapsible
          open={openSections.includes('dateRange')}
          onOpenChange={() => toggleSection('dateRange')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-accent">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">Date Range</span>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', openSections.includes('dateRange') && 'rotate-180')}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4 px-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Property Filters */}
        {showPropertyFilters && (
          <Collapsible
            open={openSections.includes('property')}
            onOpenChange={() => toggleSection('property')}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-accent">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold">Property Filters</span>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', openSections.includes('property') && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="councilArea">Council Area</Label>
                <Input
                  id="councilArea"
                  placeholder="e.g., City of Edinburgh"
                  value={filters.councilArea || ''}
                  onChange={(e) => updateFilter('councilArea', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={filters.propertyType || ''} onValueChange={(value) => updateFilter('propertyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat</SelectItem>
                    <SelectItem value="HOUSE">House</SelectItem>
                    <SelectItem value="BUNGALOW">Bungalow</SelectItem>
                    <SelectItem value="TERRACED">Terraced</SelectItem>
                    <SelectItem value="SEMI_DETACHED">Semi-Detached</SelectItem>
                    <SelectItem value="DETACHED">Detached</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenancyStatus">Tenancy Status</Label>
                <Select value={filters.tenancyStatus || ''} onValueChange={(value) => updateFilter('tenancyStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="VACANT">Vacant</SelectItem>
                    <SelectItem value="NOTICE_PERIOD">Notice Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBedrooms">Min Bedrooms</Label>
                  <Input
                    id="minBedrooms"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.minBedrooms || ''}
                    onChange={(e) => updateFilter('minBedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBedrooms">Max Bedrooms</Label>
                  <Input
                    id="maxBedrooms"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={filters.maxBedrooms || ''}
                    onChange={(e) => updateFilter('maxBedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isHMO"
                  checked={filters.isHMO || false}
                  onCheckedChange={(checked) => updateFilter('isHMO', checked)}
                />
                <Label htmlFor="isHMO" className="cursor-pointer">
                  HMO Properties Only
                </Label>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Certificate Filters */}
        {showCertificateFilters && (
          <Collapsible
            open={openSections.includes('certificate')}
            onOpenChange={() => toggleSection('certificate')}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-accent">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-semibold">Certificate Filters</span>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', openSections.includes('certificate') && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="certificateType">Certificate Type</Label>
                <Select value={filters.certificateType || ''} onValueChange={(value) => updateFilter('certificateType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GAS_SAFETY">Gas Safety</SelectItem>
                    <SelectItem value="EICR">EICR</SelectItem>
                    <SelectItem value="EPC">EPC</SelectItem>
                    <SelectItem value="PAT">PAT</SelectItem>
                    <SelectItem value="LEGIONELLA">Legionella</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateStatus">Status</Label>
                <Select value={filters.certificateStatus || ''} onValueChange={(value) => updateFilter('certificateStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VALID">Valid</SelectItem>
                    <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiringInDays">Expiring In (days)</Label>
                <Input
                  id="expiringInDays"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={filters.expiringInDays || ''}
                  onChange={(e) => updateFilter('expiringInDays', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Registration Filters */}
        {showRegistrationFilters && (
          <Collapsible
            open={openSections.includes('registration')}
            onOpenChange={() => toggleSection('registration')}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-accent">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="font-semibold">Registration Filters</span>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', openSections.includes('registration') && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="registrationStatus">Status</Label>
                <Select value={filters.registrationStatus || ''} onValueChange={(value) => updateFilter('registrationStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Maintenance Filters */}
        {showMaintenanceFilters && (
          <Collapsible
            open={openSections.includes('maintenance')}
            onOpenChange={() => toggleSection('maintenance')}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-accent">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="font-semibold">Maintenance Filters</span>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', openSections.includes('maintenance') && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceStatus">Status</Label>
                <Select value={filters.maintenanceStatus || ''} onValueChange={(value) => updateFilter('maintenanceStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenancePriority">Priority</Label>
                <Select value={filters.maintenancePriority || ''} onValueChange={(value) => updateFilter('maintenancePriority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceCategory">Category</Label>
                <Select value={filters.maintenanceCategory || ''} onValueChange={(value) => updateFilter('maintenanceCategory', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLUMBING">Plumbing</SelectItem>
                    <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                    <SelectItem value="HEATING">Heating</SelectItem>
                    <SelectItem value="STRUCTURAL">Structural</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="gap-1">
                  <span className="text-xs">
                    {key}: {String(value)}
                  </span>
                  <button
                    onClick={() => removeFilter(key as keyof FilterValues)}
                    className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
