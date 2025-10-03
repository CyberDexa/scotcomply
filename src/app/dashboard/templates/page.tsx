'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  FileType,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data: templates, isLoading, refetch } = trpc.template.list.useQuery({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    includeDefaults: true,
  })

  const { data: categories } = trpc.template.getCategories.useQuery()

  const duplicateMutation = trpc.template.duplicate.useMutation({
    onSuccess: () => refetch(),
  })

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => refetch(),
  })

  const handleDuplicate = async (id: string) => {
    await duplicateMutation.mutateAsync({ id })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteMutation.mutateAsync({ id })
    }
  }

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      tenant_notices: 'Tenant Notices',
      compliance_reports: 'Compliance Reports',
      maintenance: 'Maintenance',
      legal: 'Legal',
      custom: 'Custom',
    }
    return categoryMap[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      tenant_notices: 'bg-blue-100 text-blue-800',
      compliance_reports: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      legal: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800',
    }
    return colorMap[category] || 'bg-gray-100 text-gray-800'
  }

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage reusable document templates for tenant communications
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories?.map((category) => (
          <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCategoryFilter(category.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{category.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{category.count}</p>
                </div>
                <FileType className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="tenant_notices">Tenant Notices</SelectItem>
                  <SelectItem value="compliance_reports">Compliance Reports</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredTemplates && filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge className={getCategoryColor(template.category)}>
                    {getCategoryName(template.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    <p>Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}</p>
                    <p className="text-xs mt-1">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/templates/${template.id}/generate`} className="flex-1">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Generate
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template.id)}
                      disabled={duplicateMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.isDefault && (
                      <>
                        <Link href={`/dashboard/templates/${template.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'No templates match your filters'
                : 'Get started by creating your first template'}
            </p>
            <Link href="/dashboard/templates/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
