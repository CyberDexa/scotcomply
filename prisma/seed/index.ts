import { PrismaClient } from '@prisma/client'
import { scottishCouncils } from './councils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Seed Scottish Councils
  console.log('📍 Seeding Scottish councils...')
  for (const council of scottishCouncils) {
    await prisma.councilData.upsert({
      where: { councilName: council.councilName },
      update: {
        websiteUrl: council.websiteUrl,
        landlordRegUrl: council.landlordRegUrl,
        hmoLicenseUrl: council.hmoLicenseUrl,
        registrationFee: council.registrationFee,
        renewalFee: council.renewalFee,
        hmoFee: council.hmoFee,
        processingTimeDays: council.processingTimeDays,
        contactEmail: council.contactEmail,
        contactPhone: council.contactPhone,
      },
      create: {
        councilName: council.councilName,
        councilArea: (council as any).councilArea || council.councilName.replace(' Council', ''),
        websiteUrl: council.websiteUrl,
        landlordRegUrl: council.landlordRegUrl,
        hmoLicenseUrl: council.hmoLicenseUrl,
        registrationFee: council.registrationFee,
        renewalFee: council.renewalFee,
        hmoFee: council.hmoFee,
        processingTimeDays: council.processingTimeDays,
        contactEmail: council.contactEmail,
        contactPhone: council.contactPhone,
      },
    })
  }
  console.log('✅ Seeded Scottish councils')

  // Create demo landlord user
  console.log('👤 Creating demo landlord user...')
  const { hash } = await import('bcryptjs')
  const passwordHash = await hash('password123', 12)

  const demoLandlord = await prisma.user.upsert({
    where: { email: 'demo@landlord.com' },
    update: {},
    create: {
      email: 'demo@landlord.com',
      passwordHash,
      name: 'Demo Landlord',
      role: 'LANDLORD',
      landlordProfile: {
        create: {
          phoneNumber: '07700 900000',
          address: '123 Demo Street, Edinburgh, EH1 1AA',
          businessName: 'Demo Property Management',
          portfolioSize: 3,
          preferredMethod: 'email',
        },
      },
    },
    include: {
      landlordProfile: true,
    },
  })
  console.log('✅ Created demo landlord:', demoLandlord.email)

  // Create demo agent user
  console.log('🏢 Creating demo agent user...')
  const demoAgent = await prisma.user.upsert({
    where: { email: 'demo@agent.com' },
    update: {},
    create: {
      email: 'demo@agent.com',
      passwordHash,
      name: 'Demo Agent',
      role: 'AGENT',
      agentProfile: {
        create: {
          agencyName: 'Demo Letting Agency',
          licenseNumber: 'LARN1234567',
          phoneNumber: '0131 123 4567',
          address: '456 Agency Road, Glasgow, G1 1AA',
          clientCount: 10,
          subscriptionPlan: 'professional',
        },
      },
    },
    include: {
      agentProfile: true,
    },
  })
  console.log('✅ Created demo agent:', demoAgent.email)

  // Create sample properties for demo landlord
  console.log('🏠 Creating sample properties...')
  
  const property1 = await prisma.property.create({
    data: {
      ownerId: demoLandlord.id,
      address: '10 Royal Mile, Edinburgh',
      postcode: 'EH1 2PB',
      councilArea: 'City of Edinburgh Council',
      propertyType: 'flat',
      bedrooms: 2,
      isHMO: false,
      tenancyStatus: 'occupied',
    },
  })

  const property2 = await prisma.property.create({
    data: {
      ownerId: demoLandlord.id,
      address: '45 Sauchiehall Street, Glasgow',
      postcode: 'G2 3AT',
      councilArea: 'Glasgow City Council',
      propertyType: 'flat',
      bedrooms: 3,
      isHMO: true,
      hmoOccupancy: 4,
      tenancyStatus: 'occupied',
    },
  })

  const property3 = await prisma.property.create({
    data: {
      ownerId: demoLandlord.id,
      address: '22 Union Street, Aberdeen',
      postcode: 'AB10 1BA',
      councilArea: 'Aberdeen City Council',
      propertyType: 'house',
      bedrooms: 4,
      isHMO: false,
      tenancyStatus: 'vacant',
    },
  })

  console.log('✅ Created 3 sample properties')

  // Create sample certificates
  console.log('📜 Creating sample certificates...')
  
  const today = new Date()
  const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
  const fiveYearsFromNow = new Date(today.getTime() + 5 * 365 * 24 * 60 * 60 * 1000)
  const tenYearsFromNow = new Date(today.getTime() + 10 * 365 * 24 * 60 * 60 * 1000)
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Property 1 certificates
  await prisma.certificate.createMany({
    data: [
      {
        userId: demoLandlord.id,
        propertyId: property1.id,
        certificateType: 'gas_safety',
        issueDate: today,
        expiryDate: oneYearFromNow,
        providerName: 'ABC Gas Services',
        providerContact: '0131 555 0100',
        status: 'valid',
      },
      {
        userId: demoLandlord.id,
        propertyId: property1.id,
        certificateType: 'eicr',
        issueDate: today,
        expiryDate: fiveYearsFromNow,
        providerName: 'Edinburgh Electrical',
        providerContact: '0131 555 0200',
        status: 'valid',
      },
      {
        userId: demoLandlord.id,
        propertyId: property1.id,
        certificateType: 'epc',
        issueDate: today,
        expiryDate: tenYearsFromNow,
        providerName: 'Energy Assessors Ltd',
        providerContact: '0131 555 0300',
        status: 'valid',
      },
    ],
  })

  // Property 2 certificates (one expiring soon)
  await prisma.certificate.createMany({
    data: [
      {
        userId: demoLandlord.id,
        propertyId: property2.id,
        certificateType: 'gas_safety',
        issueDate: new Date(today.getTime() - 335 * 24 * 60 * 60 * 1000),
        expiryDate: thirtyDaysFromNow,
        providerName: 'Glasgow Gas Safe',
        providerContact: '0141 555 0100',
        status: 'expiring_soon',
      },
      {
        userId: demoLandlord.id,
        propertyId: property2.id,
        certificateType: 'eicr',
        issueDate: today,
        expiryDate: fiveYearsFromNow,
        providerName: 'Glasgow Electrical Services',
        providerContact: '0141 555 0200',
        status: 'valid',
      },
    ],
  })

  console.log('✅ Created sample certificates')

  // Create landlord registration
  console.log('📋 Creating landlord registrations...')
  
  await prisma.landlordRegistration.createMany({
    data: [
      {
        userId: demoLandlord.id,
        propertyId: property1.id,
        councilArea: 'City of Edinburgh Council',
        registrationNumber: 'EDI-123456/01',
        applicationDate: new Date('2023-01-15'),
        approvalDate: new Date('2023-02-20'),
        expiryDate: new Date('2026-02-20'),
        status: 'approved',
        renewalFee: 88,
      },
      {
        userId: demoLandlord.id,
        propertyId: property2.id,
        councilArea: 'Glasgow City Council',
        registrationNumber: 'GLA-789012/01',
        applicationDate: new Date('2023-03-10'),
        approvalDate: new Date('2023-05-15'),
        expiryDate: new Date('2026-05-15'),
        status: 'approved',
        renewalFee: 88,
      },
    ],
  })

  console.log('✅ Created landlord registrations')

  // Create HMO license
  console.log('🏢 Creating HMO license...')
  
  await prisma.hMOLicense.create({
    data: {
      userId: demoLandlord.id,
      propertyId: property2.id,
      licenseNumber: 'HMO-GLA-2023-456',
      applicationDate: new Date('2023-04-01'),
      approvalDate: new Date('2023-06-15'),
      expiryDate: new Date('2026-06-15'),
      occupancyLimit: 4,
      councilArea: 'Glasgow City Council',
      status: 'approved',
      annualFee: 2100,
      fireSafetyCompliant: true,
      lastInspectionDate: new Date('2024-09-10'),
    },
  })

  console.log('✅ Created HMO license')

  console.log('✅ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
