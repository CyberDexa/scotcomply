'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X, FileText, Home, ClipboardCheck, Wrench, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { cn } from '@/lib/utils'

const entityIcons = {
  PROPERTY: Home,
  CERTIFICATE: FileText,
  REGISTRATION: ClipboardCheck,
  MAINTENANCE: Wrench,
  HMO: Building2,
}

const entityColors = {
  PROPERTY: 'text-blue-600 bg-blue-50',
  CERTIFICATE: 'text-green-600 bg-green-50',
  REGISTRATION: 'text-purple-600 bg-purple-50',
  MAINTENANCE: 'text-orange-600 bg-orange-50',
  HMO: 'text-indigo-600 bg-indigo-50',
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Search query with debouncing
  const { data: searchResults, isLoading } = trpc.search.globalSearch.useQuery(
    { query, limit: 10 },
    { 
      enabled: query.length >= 2,
      staleTime: 30000, // Cache for 30 seconds
    }
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setSelectedIndex(0)
      }

      // Arrow navigation in results
      if (isOpen && searchResults?.results) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => 
            prev < searchResults.results.length - 1 ? prev + 1 : prev
          )
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        }
        if (e.key === 'Enter' && searchResults.results[selectedIndex]) {
          e.preventDefault()
          handleResultClick(searchResults.results[selectedIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchResults, selectedIndex])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && searchResults?.results) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, searchResults])

  const handleResultClick = (result: any) => {
    router.push(result.url)
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }

  const handleClear = () => {
    setQuery('')
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Search Button/Input */}
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 100)
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-64"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Search Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search properties, certificates, registrations..."
                  className="flex-1 text-base outline-none placeholder:text-gray-400"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={handleClear}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Results */}
              <div 
                ref={resultsRef}
                className="max-h-96 overflow-y-auto"
              >
                {query.length < 2 && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">Start typing to search</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Search across properties, certificates, registrations, and more
                    </p>
                  </div>
                )}

                {query.length >= 2 && !isLoading && searchResults?.results?.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )}

                {searchResults?.results && searchResults.results.length > 0 && (
                  <div className="py-2">
                    {searchResults.results.map((result: any, index: number) => {
                      const Icon = entityIcons[result.type as keyof typeof entityIcons]
                      const colorClass = entityColors[result.type as keyof typeof entityColors]
                      
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            'w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left',
                            selectedIndex === index && 'bg-blue-50'
                          )}
                        >
                          {/* Icon */}
                          <div className={cn('p-2 rounded-lg', colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">
                                {result.title}
                              </p>
                              {result.badge && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                  {result.badge}
                                </span>
                              )}
                            </div>
                            {result.subtitle && (
                              <p className="text-sm text-gray-600 truncate mt-0.5">
                                {result.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">
                                {result.type.charAt(0) + result.type.slice(1).toLowerCase()}
                              </span>
                              {result.status && (
                                <span className="text-xs text-gray-400">
                                  • {result.status}
                                </span>
                              )}
                              {result.date && (
                                <span className="text-xs text-gray-400">
                                  • {new Date(result.date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow hint */}
                          {selectedIndex === index && (
                            <div className="text-xs text-gray-400 flex items-center">
                              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">
                                ↵
                              </kbd>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {query.length >= 2 && searchResults?.results && searchResults.results.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑</kbd>
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded ml-1">↓</kbd>
                        <span className="ml-1">to navigate</span>
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</kbd>
                        <span className="ml-1">to select</span>
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">esc</kbd>
                        <span className="ml-1">to close</span>
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/search?q=${encodeURIComponent(query)}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all results →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
