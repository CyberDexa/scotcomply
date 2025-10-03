import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import prisma from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

// Schema for saved searches
const SavedSearchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  entityType: z.enum(['PROPERTY', 'CERTIFICATE', 'REGISTRATION', 'MAINTENANCE', 'HMO', 'ALL']),
  query: z.string(),
  filters: z.record(z.string(), z.any()).optional(),
})

// Search result interface for unified response
type SearchResultItem = {
  id: string
  type: 'PROPERTY' | 'CERTIFICATE' | 'REGISTRATION' | 'MAINTENANCE' | 'HMO'
  title: string
  subtitle?: string
  status?: string
  badge?: string
  date?: Date
  url: string
  relevance?: number
}

export const searchRouter = createTRPCRouter({
  // Global search across all entities
  globalSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        entityTypes: z
          .array(z.enum(['PROPERTY', 'CERTIFICATE', 'REGISTRATION', 'MAINTENANCE', 'HMO']))
          .optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { query, entityTypes, limit } = input
      const searchTerm = query.toLowerCase()

      const results: SearchResultItem[] = []

      // Search Properties
      if (!entityTypes || entityTypes.includes('PROPERTY')) {
        const properties = await prisma.property.findMany({
          where: {
            ownerId: userId,
            OR: [
              { address: { contains: searchTerm, mode: 'insensitive' } },
              { postcode: { contains: searchTerm, mode: 'insensitive' } },
              { councilArea: { contains: searchTerm, mode: 'insensitive' } },
              { propertyType: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        properties.forEach((prop) => {
          results.push({
            id: prop.id,
            type: 'PROPERTY',
            title: prop.address,
            subtitle: `${prop.postcode} • ${prop.councilArea}`,
            badge: prop.propertyType,
            status: prop.tenancyStatus || undefined,
            url: `/dashboard/properties/${prop.id}`,
            relevance: calculateRelevance(query, [prop.address, prop.postcode, prop.councilArea]),
          })
        })
      }

      // Search Certificates
      if (!entityTypes || entityTypes.includes('CERTIFICATE')) {
        const certificates = await prisma.certificate.findMany({
          where: {
            property: { ownerId: userId },
            OR: [
              { certificateType: { contains: searchTerm, mode: 'insensitive' } },
              { providerName: { contains: searchTerm, mode: 'insensitive' } },
              { property: { address: { contains: searchTerm, mode: 'insensitive' } } },
            ],
          },
          include: { property: true },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        certificates.forEach((cert) => {
          const daysUntilExpiry = Math.floor(
            (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          let status = 'Valid'
          if (daysUntilExpiry < 0) status = 'Expired'
          else if (daysUntilExpiry <= 30) status = 'Expiring Soon'

          results.push({
            id: cert.id,
            type: 'CERTIFICATE',
            title: `${cert.certificateType} Certificate`,
            subtitle: cert.property.address,
            badge: cert.providerName,
            status,
            date: cert.expiryDate,
            url: `/dashboard/certificates/${cert.id}`,
            relevance: calculateRelevance(query, [
              cert.certificateType,
              cert.providerName,
              cert.property.address,
            ]),
          })
        })
      }

      // Search Registrations
      if (!entityTypes || entityTypes.includes('REGISTRATION')) {
        const registrations = await prisma.landlordRegistration.findMany({
          where: {
            userId,
            OR: [
              { registrationNumber: { contains: searchTerm, mode: 'insensitive' } },
              { councilArea: { contains: searchTerm, mode: 'insensitive' } },
              { status: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        registrations.forEach((reg) => {
          results.push({
            id: reg.id,
            type: 'REGISTRATION',
            title: `Registration ${reg.registrationNumber}`,
            subtitle: reg.councilArea,
            badge: `£${reg.renewalFee}`,
            status: reg.status,
            date: reg.expiryDate,
            url: `/dashboard/registrations/${reg.id}`,
            relevance: calculateRelevance(query, [
              reg.registrationNumber,
              reg.councilArea,
              reg.status,
            ]),
          })
        })
      }

      // Search Maintenance Requests
      if (!entityTypes || entityTypes.includes('MAINTENANCE')) {
        const maintenance = await prisma.maintenanceRequest.findMany({
          where: {
            property: { ownerId: userId },
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              { property: { address: { contains: searchTerm, mode: 'insensitive' } } },
            ],
          },
          include: { property: true },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        maintenance.forEach((req) => {
          results.push({
            id: req.id,
            type: 'MAINTENANCE',
            title: req.title,
            subtitle: req.property.address,
            badge: req.category,
            status: req.status,
            date: req.createdAt,
            url: `/dashboard/maintenance/${req.id}`,
            relevance: calculateRelevance(query, [
              req.title,
              req.description,
              req.category,
              req.property.address,
            ]),
          })
        })
      }

      // Search HMO Licenses
      if (!entityTypes || entityTypes.includes('HMO')) {
        const hmoLicenses = await prisma.hMOLicense.findMany({
          where: {
            property: { ownerId: userId },
            OR: [
              { licenseNumber: { contains: searchTerm, mode: 'insensitive' } },
              { councilArea: { contains: searchTerm, mode: 'insensitive' } },
              { property: { address: { contains: searchTerm, mode: 'insensitive' } } },
            ],
          },
          include: { property: true },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        hmoLicenses.forEach((hmo) => {
          results.push({
            id: hmo.id,
            type: 'HMO',
            title: `HMO License ${hmo.licenseNumber}`,
            subtitle: hmo.property.address,
            badge: hmo.councilArea,
            status: hmo.status,
            date: hmo.expiryDate,
            url: `/dashboard/hmo/${hmo.id}`,
            relevance: calculateRelevance(query, [
              hmo.licenseNumber,
              hmo.property.address,
            ]),
          })
        })
      }

      // Sort by relevance
      results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0))

      // Group by type
      const grouped = {
        PROPERTY: results.filter((r) => r.type === 'PROPERTY'),
        CERTIFICATE: results.filter((r) => r.type === 'CERTIFICATE'),
        REGISTRATION: results.filter((r) => r.type === 'REGISTRATION'),
        MAINTENANCE: results.filter((r) => r.type === 'MAINTENANCE'),
        HMO: results.filter((r) => r.type === 'HMO'),
      }

      // Track search
      await prisma.searchHistory.create({
        data: {
          userId,
          query,
          resultsCount: results.length,
          entityTypes: entityTypes?.join(',') || 'ALL',
        },
      })

      return {
        results: results.slice(0, limit),
        grouped,
        total: results.length,
        query,
      }
    }),

  // Property-specific search with advanced filters
  searchProperties: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        councilArea: z.string().optional(),
        propertyType: z.enum(['FLAT', 'HOUSE', 'BUNGALOW', 'TERRACED', 'SEMI_DETACHED', 'DETACHED']).optional(),
        tenancyStatus: z.enum(['OCCUPIED', 'VACANT', 'NOTICE_PERIOD']).optional(),
        isHMO: z.boolean().optional(),
        minBedrooms: z.number().optional(),
        maxBedrooms: z.number().optional(),
        complianceStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'EXPIRING_SOON']).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { query, councilArea, propertyType, tenancyStatus, isHMO, minBedrooms, maxBedrooms, limit, cursor } = input

      const where: any = { ownerId: userId }

      // Text search
      if (query) {
        where.OR = [
          { address: { contains: query, mode: 'insensitive' } },
          { postcode: { contains: query, mode: 'insensitive' } },
          { councilArea: { contains: query, mode: 'insensitive' } },
        ]
      }

      // Filters
      if (councilArea) where.councilArea = councilArea
      if (propertyType) where.propertyType = propertyType
      if (tenancyStatus) where.tenancyStatus = tenancyStatus
      if (isHMO !== undefined) where.isHMO = isHMO
      if (minBedrooms !== undefined) where.bedrooms = { gte: minBedrooms }
      if (maxBedrooms !== undefined) where.bedrooms = { ...where.bedrooms, lte: maxBedrooms }

      const properties = await prisma.property.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: {
          certificates: {
            select: {
              id: true,
              certificateType: true,
              expiryDate: true,
            },
          },
          hmoLicenses: {
            select: {
              id: true,
              status: true,
              expiryDate: true,
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (properties.length > limit) {
        const nextItem = properties.pop()
        nextCursor = nextItem!.id
      }

      return {
        properties,
        nextCursor,
      }
    }),

  // Certificate-specific search
  searchCertificates: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        certificateType: z.enum(['GAS_SAFETY', 'EICR', 'EPC', 'PAT', 'LEGIONELLA']).optional(),
        status: z.enum(['VALID', 'EXPIRING_SOON', 'EXPIRED']).optional(),
        propertyId: z.string().optional(),
        expiringInDays: z.number().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { query, certificateType, status, propertyId, expiringInDays, limit, cursor } = input

      const where: any = {
        property: { ownerId: userId },
      }

      if (query) {
        where.OR = [
          { certificateType: { contains: query, mode: 'insensitive' } },
          { providerName: { contains: query, mode: 'insensitive' } },
          { property: { address: { contains: query, mode: 'insensitive' } } },
        ]
      }

      if (certificateType) where.certificateType = certificateType
      if (propertyId) where.propertyId = propertyId

      // Status filter
      if (status === 'EXPIRED') {
        where.expiryDate = { lt: new Date() }
      } else if (status === 'EXPIRING_SOON') {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        where.expiryDate = { gte: new Date(), lte: futureDate }
      } else if (status === 'VALID') {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        where.expiryDate = { gt: futureDate }
      }

      // Expiring in X days
      if (expiringInDays) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + expiringInDays)
        where.expiryDate = { gte: new Date(), lte: futureDate }
      }

      const certificates = await prisma.certificate.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { expiryDate: 'asc' },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (certificates.length > limit) {
        const nextItem = certificates.pop()
        nextCursor = nextItem!.id
      }

      return {
        certificates,
        nextCursor,
      }
    }),

  // Saved searches
  saveSearch: protectedProcedure
    .input(SavedSearchSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const savedSearch = await prisma.savedSearch.create({
        data: {
          userId,
          name: input.name,
          entityType: input.entityType,
          query: input.query,
          filters: input.filters || {},
        },
      })

      return savedSearch
    }),

  getSavedSearches: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return savedSearches
  }),

  deleteSavedSearch: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const savedSearch = await prisma.savedSearch.findFirst({
        where: { id: input.id, userId },
      })

      if (!savedSearch) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        })
      }

      await prisma.savedSearch.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Recent searches
  getRecentSearches: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const recentSearches = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        distinct: ['query'],
      })

      return recentSearches
    }),

  // Quick filters
  getExpiringItems: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + input.days)

      const [certificates, registrations, hmoLicenses] = await Promise.all([
        prisma.certificate.findMany({
          where: {
            property: { ownerId: userId },
            expiryDate: { gte: new Date(), lte: futureDate },
          },
          include: { property: true },
          orderBy: { expiryDate: 'asc' },
        }),
        prisma.landlordRegistration.findMany({
          where: {
            userId,
            expiryDate: { gte: new Date(), lte: futureDate },
          },
          orderBy: { expiryDate: 'asc' },
        }),
        prisma.hMOLicense.findMany({
          where: {
            property: { ownerId: userId },
            expiryDate: { gte: new Date(), lte: futureDate },
          },
          include: { property: true },
          orderBy: { expiryDate: 'asc' },
        }),
      ])

      return {
        certificates,
        registrations,
        hmoLicenses,
        total: certificates.length + registrations.length + hmoLicenses.length,
      }
    }),

  getNonCompliantItems: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [expiredCertificates, expiredRegistrations, expiredHMO] = await Promise.all([
      prisma.certificate.findMany({
        where: {
          property: { ownerId: userId },
          expiryDate: { lt: new Date() },
        },
        include: { property: true },
        orderBy: { expiryDate: 'desc' },
      }),
      prisma.landlordRegistration.findMany({
        where: {
          userId,
          expiryDate: { lt: new Date() },
        },
        orderBy: { expiryDate: 'desc' },
      }),
      prisma.hMOLicense.findMany({
        where: {
          property: { ownerId: userId },
          expiryDate: { lt: new Date() },
        },
        include: { property: true },
        orderBy: { expiryDate: 'desc' },
      }),
    ])

    return {
      expiredCertificates,
      expiredRegistrations,
      expiredHMO,
      total: expiredCertificates.length + expiredRegistrations.length + expiredHMO.length,
    }
  }),
})

// Helper function to calculate relevance score
function calculateRelevance(query: string, fields: (string | null)[]): number {
  const queryLower = query.toLowerCase()
  let score = 0

  fields.forEach((field) => {
    if (!field) return
    const fieldLower = field.toLowerCase()

    // Exact match
    if (fieldLower === queryLower) {
      score += 100
    }
    // Starts with
    else if (fieldLower.startsWith(queryLower)) {
      score += 50
    }
    // Contains
    else if (fieldLower.includes(queryLower)) {
      score += 25
    }
    // Word match
    const words = fieldLower.split(/\s+/)
    if (words.some((word) => word.startsWith(queryLower))) {
      score += 10
    }
  })

  return score
}
