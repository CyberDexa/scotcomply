import { type Property, type Certificate, type Lease, type Tenant, type Transaction } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export const createMockProperty = (overrides?: Partial<Property>): Property => {
  return {
    id: 'prop-1',
    ownerId: 'test-user-id',
    address: '123 Test Street',
    postcode: 'EH1 1AA',
    councilArea: 'Edinburgh',
    propertyType: 'FLAT',
    bedrooms: 2,
    isHMO: false,
    hmoOccupancy: null,
    tenancyStatus: 'occupied',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export const createMockCertificate = (overrides?: Partial<Certificate>): Certificate => {
  return {
    id: 'cert-1',
    propertyId: 'prop-1',
    userId: 'test-user-id',
    certificateType: 'EICR',
    providerName: 'Test Electrician Ltd',
    providerContact: '07700900000',
    issueDate: new Date('2023-01-01'),
    expiryDate: new Date('2028-01-01'),
    status: 'valid',
    documentUrl: 'https://example.com/cert.pdf',
    notes: null,
    reminderSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export const createMockTenant = (overrides?: Partial<Tenant>): Tenant => {
  return {
    id: 'tenant-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    passwordHash: '$2a$10$test.hash.value',
    phone: '07700900000',
    propertyId: 'prop-1',
    leaseStartDate: new Date('2024-01-01'),
    leaseEndDate: new Date('2025-01-01'),
    depositAmount: new Decimal(1200),
    rentAmount: new Decimal(1200),
    isActive: true,
    emailVerified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export const createMockLease = (overrides?: Partial<Lease>): Lease => {
  return {
    id: 'lease-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-01-01'),
    rentAmount: new Decimal(1200),
    paymentDay: 1,
    paymentFrequency: 'MONTHLY',
    depositAmount: new Decimal(1200),
    status: 'ACTIVE',
    documentUrl: null,
    terms: null,
    renewalDate: null,
    noticeGiven: false,
    noticeDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    id: 'txn-1',
    propertyId: 'prop-1',
    tenantId: null,
    type: 'INCOME',
    category: 'RENT',
    amount: new Decimal(1200),
    date: new Date('2024-01-01'),
    description: 'Monthly rent payment',
    reference: 'RENT-JAN-2024',
    paymentMethod: 'BANK_TRANSFER',
    receiptUrl: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
