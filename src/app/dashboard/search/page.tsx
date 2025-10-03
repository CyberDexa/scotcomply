'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedFilters, FilterValues } from '@/components/search/AdvancedFilters'
import { Search, Home, Award, ClipboardList, Wrench, Building, Calendar, ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const entityIcons = {
  PROPERTY: Home,
  CERTIFICATE: Award,
  REGISTRATION: ClipboardList,
  MAINTENANCE: Wrench,
  HMO: Building,
}

const entityColors = {
  PROPERTY: 'bg-blue-500',
  CERTIFICATE: 'bg-green-500',
  REGISTRATION: 'bg-purple-500',
  MAINTENANCE: 'bg-orange-500',
  HMO: 'bg-red-500',
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Search query
  const { data: searchResults, isLoading } = trpc.search.globalSearch.useQuery(
    {
      query: debouncedQuery,
      limit: 50,
    },
    {
      enabled: debouncedQuery.length > 0,
    }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleResetFilters = () => {
    setFilters({})
  }

  const getStatusBadge = (status: string | undefined, type: string) => {
    if (!status) return null

    if (type === 'CERTIFICATE') {
      const colors: Record<string, string> = {
        Valid: 'bg-green-100 text-green-800',
        'Expiring Soon': 'bg-amber-100 text-amber-800',
        Expired: 'bg-red-100 text-red-800',
      }
      return (
        <Badge variant="secondary" className={cn('shrink-0', colors[status])}>
          {status}
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="shrink-0">
        {status}
      </Badge>
    )
  }

  const filteredResults = searchResults?.results.filter((result) => {
    if (activeTab === 'all') return true
    return result.type.toLowerCase() === activeTab
  })

  const tabCounts = {
    all: searchResults?.total || 0,
    property: searchResults?.grouped.PROPERTY.length || 0,
    certificate: searchResults?.grouped.CERTIFICATE.length || 0,
    registration: searchResults?.grouped.REGISTRATION.length || 0,
    maintenance: searchResults?.grouped.MAINTENANCE.length || 0,
    hmo: searchResults?.grouped.HMO.length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
          <p className="text-muted-foreground">
            Search across all your properties, certificates, and compliance data
          </p>
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties, certificates, registrations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={handleResetFilters}
        />
      )}

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && debouncedQuery && searchResults && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                Found {searchResults.total} results for &quot;{debouncedQuery}&quot;
              </CardTitle>
              <CardDescription>
                {searchResults.grouped.PROPERTY.length} properties, {searchResults.grouped.CERTIFICATE.length}{' '}
                certificates, {searchResults.grouped.REGISTRATION.length} registrations,{' '}
                {searchResults.grouped.MAINTENANCE.length} maintenance requests, {searchResults.grouped.HMO.length}{' '}
                HMO licenses
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                All ({tabCounts.all})
              </TabsTrigger>
              <TabsTrigger value="property">
                Properties ({tabCounts.property})
              </TabsTrigger>
              <TabsTrigger value="certificate">
                Certificates ({tabCounts.certificate})
              </TabsTrigger>
              <TabsTrigger value="registration">
                Registrations ({tabCounts.registration})
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                Maintenance ({tabCounts.maintenance})
              </TabsTrigger>
              <TabsTrigger value="hmo">
                HMO ({tabCounts.hmo})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredResults && filteredResults.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No results found in this category
                  </CardContent>
                </Card>
              )}

              {filteredResults?.map((result) => {
                const Icon = entityIcons[result.type]
                return (
                  <Link key={result.id} href={result.url}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardContent className="flex items-start gap-4 p-6">
                        {/* Icon */}
                        <div className={cn('p-3 rounded-lg', entityColors[result.type])}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate">{result.title}</h3>
                            {result.badge && (
                              <Badge variant="secondary" className="shrink-0">
                                {result.badge}
                              </Badge>
                            )}
                          </div>
                          
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                          )}

                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-md bg-muted">
                              {result.type.replace('_', ' ')}
                            </span>
                            
                            {result.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(result.date), 'dd MMM yyyy')}
                              </span>
                            )}

                            {result.relevance && result.relevance > 0 && (
                              <span className="text-xs">
                                Relevance: {result.relevance}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(result.status, result.type)}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </TabsContent>
          </Tabs>
        </>
      )}

      {!isLoading && !debouncedQuery && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
            <p className="text-muted-foreground">
              Enter a search query above to find properties, certificates, registrations, and more.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tip: Use <kbd className="px-2 py-1 rounded bg-muted">Cmd+K</kbd> or{' '}
              <kbd className="px-2 py-1 rounded bg-muted">Ctrl+K</kbd> to quickly open search from anywhere
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && debouncedQuery && searchResults && searchResults.total === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              We couldn&apos;t find any results for &quot;{debouncedQuery}&quot;
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching for a property address, certificate type, or registration number
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
