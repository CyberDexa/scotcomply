/**
 * Bulk Operations tRPC Router
 * Handles bulk import/export of properties, certificates, registrations
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

// ==================== VALIDATION SCHEMAS ====================

const PropertyImportSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  councilArea: z.string().min(1, 'Council area is required'),
  propertyType: z.enum(['FLAT', 'HOUSE', 'BUNGALOW', 'OTHER']).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  isHMO: z.string().optional(), // 'true' or 'false'
  hmoOccupancy: z.coerce.number().int().min(0).optional(),
  tenancyStatus: z.enum(['vacant', 'occupied', 'notice_period']).optional(),
})

const CertificateImportSchema = z.object({
  propertyAddress: z.string().min(1, 'Property address is required'),
  certificateType: z.enum(['GAS_SAFETY', 'EICR', 'EPC', 'PAT', 'LEGIONELLA']),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  providerName: z.string().min(1, 'Provider name is required'),
  providerContact: z.string().optional(),
  documentUrl: z.string().optional(),
  notes: z.string().optional(),
})

const RegistrationImportSchema = z.object({
  propertyAddress: z.string().min(1, 'Property address is required'),
  councilArea: z.string().min(1, 'Council area is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  applicationDate: z.string().min(1, 'Application date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  renewalFee: z.coerce.number().min(0),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
  notes: z.string().optional(),
})

// ==================== ROUTER ====================

export const bulkRouter = createTRPCRouter({
  // Parse and validate CSV for import preview
  parseCSV: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
        entityType: z.enum(['PROPERTY', 'CERTIFICATE', 'REGISTRATION']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Parse CSV
        const records = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })

        if (records.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'CSV file is empty',
          })
        }

        // Validate records based on entity type
        const schema =
          input.entityType === 'PROPERTY'
            ? PropertyImportSchema
            : input.entityType === 'CERTIFICATE'
            ? CertificateImportSchema
            : RegistrationImportSchema

        const validatedRecords: any[] = []
        const errors: { row: number; field: string; message: string }[] = []

        records.forEach((record, index) => {
          const result = schema.safeParse(record)
          if (result.success) {
            validatedRecords.push(result.data)
          } else {
            const zodErrors = result.error.issues
            zodErrors.forEach((error) => {
              errors.push({
                row: index + 2, // +2 because row 1 is headers, index is 0-based
                field: error.path.join('.'),
                message: error.message,
              })
            })
          }
        })

        return {
          totalRows: records.length,
          validRows: validatedRecords.length,
          errorCount: errors.length,
          errors: errors.slice(0, 100), // Limit to first 100 errors for display
          preview: validatedRecords.slice(0, 10), // First 10 valid records for preview
        }
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Failed to parse CSV: ${error.message}`,
        })
      }
    }),

  // Import properties from CSV
  importProperties: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Create import job
      const importJob = await ctx.prisma.importJob.create({
        data: {
          userId,
          entityType: 'PROPERTY',
          fileName: 'properties.csv',
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      })

      try {
        // Parse CSV
        const records = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })

        const errors: { row: number; field: string; message: string }[] = []
        let successCount = 0

        // Process each record
        for (let i = 0; i < records.length; i++) {
          const record = records[i]
          const result = PropertyImportSchema.safeParse(record)

          if (!result.success) {
            result.error.issues.forEach((error) => {
              errors.push({
                row: i + 2,
                field: error.path.join('.'),
                message: error.message,
              })
            })
            continue
          }

          try {
            // Create property
            await ctx.prisma.property.create({
              data: {
                ownerId: userId,
                address: result.data.address,
                postcode: result.data.postcode,
                councilArea: result.data.councilArea,
                propertyType: result.data.propertyType || 'OTHER',
                bedrooms: result.data.bedrooms || 0,
                isHMO: result.data.isHMO === 'true',
                hmoOccupancy: result.data.hmoOccupancy,
                tenancyStatus: result.data.tenancyStatus || 'vacant',
              },
            })

            successCount++
          } catch (error: any) {
            errors.push({
              row: i + 2,
              field: 'general',
              message: error.message || 'Failed to create property',
            })
          }
        }

        // Update import job
        await ctx.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: errors.length > 0 && successCount === 0 ? 'FAILED' : 'COMPLETED',
            totalRows: records.length,
            successCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            completedAt: new Date(),
          },
        })

        return {
          importJobId: importJob.id,
          totalRows: records.length,
          successCount,
          errorCount: errors.length,
          errors: errors.slice(0, 50),
        }
      } catch (error: any) {
        // Mark job as failed
        await ctx.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errors: [{ row: 0, field: 'general', message: error.message }],
          },
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Import failed: ${error.message}`,
        })
      }
    }),

  // Import certificates from CSV
  importCertificates: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const importJob = await ctx.prisma.importJob.create({
        data: {
          userId,
          entityType: 'CERTIFICATE',
          fileName: 'certificates.csv',
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      })

      try {
        const records = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })

        const errors: { row: number; field: string; message: string }[] = []
        let successCount = 0

        for (let i = 0; i < records.length; i++) {
          const record = records[i]
          const result = CertificateImportSchema.safeParse(record)

          if (!result.success) {
            result.error.issues.forEach((error) => {
              errors.push({
                row: i + 2,
                field: error.path.join('.'),
                message: error.message,
              })
            })
            continue
          }

          try {
            // Find property by address
            const property = await ctx.prisma.property.findFirst({
              where: {
                ownerId: userId,
                address: {
                  contains: result.data.propertyAddress,
                  mode: 'insensitive',
                },
              },
            })

            if (!property) {
              errors.push({
                row: i + 2,
                field: 'propertyAddress',
                message: `Property "${result.data.propertyAddress}" not found`,
              })
              continue
            }

            // Create certificate
            await ctx.prisma.certificate.create({
              data: {
                userId,
                propertyId: property.id,
                certificateType: result.data.certificateType,
                issueDate: new Date(result.data.issueDate),
                expiryDate: new Date(result.data.expiryDate),
                providerName: result.data.providerName,
                providerContact: result.data.providerContact,
                documentUrl: result.data.documentUrl,
                notes: result.data.notes,
              },
            })

            successCount++
          } catch (error: any) {
            errors.push({
              row: i + 2,
              field: 'general',
              message: error.message || 'Failed to create certificate',
            })
          }
        }

        await ctx.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: errors.length > 0 && successCount === 0 ? 'FAILED' : 'COMPLETED',
            totalRows: records.length,
            successCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            completedAt: new Date(),
          },
        })

        return {
          importJobId: importJob.id,
          totalRows: records.length,
          successCount,
          errorCount: errors.length,
          errors: errors.slice(0, 50),
        }
      } catch (error: any) {
        await ctx.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errors: [{ row: 0, field: 'general', message: error.message }],
          },
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Import failed: ${error.message}`,
        })
      }
    }),

  // Import registrations from CSV
  importRegistrations: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const importJob = await ctx.prisma.importJob.create({
        data: {
          userId,
          entityType: 'REGISTRATION',
          fileName: 'registrations.csv',
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      })

      try {
        const records = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })

        const errors: { row: number; field: string; message: string }[] = []
        let successCount = 0

        for (let i = 0; i < records.length; i++) {
          const record = records[i]
          const result = RegistrationImportSchema.safeParse(record)

          if (!result.success) {
            result.error.issues.forEach((error) => {
              errors.push({
                row: i + 2,
                field: error.path.join('.'),
                message: error.message,
              })
            })
            continue
          }

          try {
            // Find property
            const property = await ctx.prisma.property.findFirst({
              where: {
                ownerId: userId,
                address: {
                  contains: result.data.propertyAddress,
                  mode: 'insensitive',
                },
              },
            })

            if (!property) {
              errors.push({
                row: i + 2,
                field: 'propertyAddress',
                message: `Property "${result.data.propertyAddress}" not found`,
              })
              continue
            }

            // Create registration
            await ctx.prisma.landlordRegistration.create({
              data: {
                userId,
                propertyId: property.id,
                councilArea: result.data.councilArea,
                registrationNumber: result.data.registrationNumber,
                applicationDate: new Date(result.data.applicationDate),
                expiryDate: new Date(result.data.expiryDate),
                renewalFee: result.data.renewalFee,
                status: result.data.status,
                notes: result.data.notes,
              },
            })

            successCount++
          } catch (error: any) {
            errors.push({
              row: i + 2,
              field: 'general',
              message: error.message || 'Failed to create registration',
            })
          }
        }

        await ctx.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: errors.length > 0 && successCount === 0 ? 'FAILED' : 'COMPLETED',
            totalRows: records.length,
            successCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            completedAt: new Date(),
          },
        })

        return {
          importJobId: importJob.id,
          totalRows: records.length,
          successCount,
          errorCount: errors.length,
          errors: errors.slice(0, 50),
        }
      } catch (error: any) {
        await ctx.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errors: [{ row: 0, field: 'general', message: error.message }],
          },
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Import failed: ${error.message}`,
        })
      }
    }),

  // Get import job history
  getImportHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        entityType: z.enum(['PROPERTY', 'CERTIFICATE', 'REGISTRATION']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const jobs = await ctx.prisma.importJob.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.entityType && { entityType: input.entityType }),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      })

      let nextCursor: string | undefined
      if (jobs.length > input.limit) {
        const nextItem = jobs.pop()
        nextCursor = nextItem?.id
      }

      return {
        jobs,
        nextCursor,
      }
    }),

  // Get import job by ID
  getImportJob: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.importJob.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Import job not found',
        })
      }

      return job
    }),

  // Export properties to CSV
  exportProperties: protectedProcedure
    .input(
      z.object({
        propertyIds: z.array(z.string()).optional(), // If provided, export only these
      })
    )
    .mutation(async ({ ctx, input }) => {
      const properties = await ctx.prisma.property.findMany({
        where: {
          ownerId: ctx.session.user.id,
          ...(input.propertyIds && {
            id: { in: input.propertyIds },
          }),
        },
      })

      const records = properties.map((p: any) => ({
        address: p.address,
        postcode: p.postcode,
        councilArea: p.councilArea,
        propertyType: p.propertyType,
        bedrooms: p.bedrooms,
        isHMO: p.isHMO ? 'true' : 'false',
        hmoOccupancy: p.hmoOccupancy || '',
        tenancyStatus: p.tenancyStatus,
      }))

      const csv = stringify(records, {
        header: true,
        columns: [
          'address',
          'postcode',
          'councilArea',
          'propertyType',
          'bedrooms',
          'isHMO',
          'hmoOccupancy',
          'tenancyStatus',
        ],
      })

      return {
        csv,
        filename: `properties-${new Date().toISOString().split('T')[0]}.csv`,
        count: properties.length,
      }
    }),

  // Export certificates to CSV
  exportCertificates: protectedProcedure
    .input(
      z.object({
        certificateIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const certificates = await ctx.prisma.certificate.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.certificateIds && {
            id: { in: input.certificateIds },
          }),
        },
        include: {
          property: true,
        },
      })

      const records = certificates.map((c: any) => ({
        propertyAddress: c.property.address,
        certificateType: c.certificateType,
        issueDate: c.issueDate.toISOString().split('T')[0],
        expiryDate: c.expiryDate.toISOString().split('T')[0],
        providerName: c.providerName,
        providerContact: c.providerContact || '',
        documentUrl: c.documentUrl || '',
        notes: c.notes || '',
      }))

      const csv = stringify(records, {
        header: true,
        columns: [
          'propertyAddress',
          'certificateType',
          'issueDate',
          'expiryDate',
          'providerName',
          'providerContact',
          'documentUrl',
          'notes',
        ],
      })

      return {
        csv,
        filename: `certificates-${new Date().toISOString().split('T')[0]}.csv`,
        count: certificates.length,
      }
    }),

  // Export registrations to CSV
  exportRegistrations: protectedProcedure
    .input(
      z.object({
        registrationIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const registrations = await ctx.prisma.landlordRegistration.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.registrationIds && {
            id: { in: input.registrationIds },
          }),
        },
        include: {
          property: true,
        },
      })

      const records = registrations.map((r: any) => ({
        propertyAddress: r.property.address,
        councilArea: r.councilArea,
        registrationNumber: r.registrationNumber,
        applicationDate: r.applicationDate.toISOString().split('T')[0],
        expiryDate: r.expiryDate.toISOString().split('T')[0],
        renewalFee: r.renewalFee,
        status: r.status,
        notes: r.notes || '',
      }))

      const csv = stringify(records, {
        header: true,
        columns: [
          'propertyAddress',
          'councilArea',
          'registrationNumber',
          'applicationDate',
          'expiryDate',
          'renewalFee',
          'status',
          'notes',
        ],
      })

      return {
        csv,
        filename: `registrations-${new Date().toISOString().split('T')[0]}.csv`,
        count: registrations.length,
      }
    }),
})
