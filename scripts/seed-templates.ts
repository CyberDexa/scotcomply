import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultTemplates = [
  {
    name: 'Tenant Notice - Property Inspection',
    description: 'Formal notice to tenant for upcoming property inspection',
    category: 'tenant_notices',
    content: `Dear {{tenantName}},

This letter is to inform you that we will be conducting a routine property inspection at:

**Property Address:** {{propertyAddress}}
**Inspection Date:** {{inspectionDate}}
**Inspection Time:** {{inspectionTime}}

This inspection is being carried out in accordance with your tenancy agreement and Scottish letting regulations. The purpose is to ensure the property is being maintained in good condition and to identify any necessary repairs or maintenance.

A landlord or authorized representative will attend. The inspection typically takes 30-45 minutes. Please ensure access to all rooms including storage areas.

If the proposed date is inconvenient, please contact us at least 48 hours before the inspection to arrange an alternative time.

Thank you for your cooperation.

Best regards,
{{landlordName}}
{{landlordContact}}`,
    variables: ['tenantName', 'propertyAddress', 'inspectionDate', 'inspectionTime', 'landlordName', 'landlordContact'],
  },
  {
    name: 'Rent Increase Notice',
    description: 'Formal notice of rent increase (Scottish requirements)',
    category: 'tenant_notices',
    content: `Dear {{tenantName}},

RE: Rent Increase Notice - {{propertyAddress}}

I am writing to inform you of an increase to your rent in accordance with your tenancy agreement and the Rent (Scotland) Act 1984.

**Current Monthly Rent:** £{{currentRent}}
**New Monthly Rent:** £{{newRent}}
**Effective Date:** {{effectiveDate}}

This represents an increase of £{{increaseAmount}} per month ({{percentageIncrease}}%).

This rent increase reflects current market rates in the area and increased costs of property maintenance. In Scotland, rent increases for private residential tenancies must:

- Be fair and open market rent
- Not be applied more than once per year
- Provide at least 3 months' notice

If you wish to refer this rent increase to a Rent Officer for determination, you may do so within 21 days of receiving this notice. You can contact your local Rent Service Scotland office for more information.

If you have any questions or concerns, please don't hesitate to contact me.

Best regards,
{{landlordName}}
{{landlordContact}}`,
    variables: ['tenantName', 'propertyAddress', 'currentRent', 'newRent', 'increaseAmount', 'percentageIncrease', 'effectiveDate', 'landlordName', 'landlordContact'],
  },
  {
    name: 'Maintenance Notice - Non-Emergency',
    description: 'Notice to tenant about planned maintenance work',
    category: 'maintenance',
    content: `Dear {{tenantName}},

RE: Planned Maintenance - {{propertyAddress}}

This letter is to inform you of planned maintenance work at your property:

**Nature of Work:** {{workDescription}}
**Scheduled Date:** {{workDate}}
**Estimated Duration:** {{duration}}
**Contractor:** {{contractorName}}

The work is necessary to {{workReason}}. We will ensure minimal disruption and the property will be left clean and tidy.

Access to the property will be required. If you are unable to be present, please let us know and we can arrange for a key to be collected and returned securely.

If the proposed date is unsuitable, please contact us as soon as possible to discuss alternative arrangements.

Thank you for your understanding and cooperation.

Best regards,
{{landlordName}}
{{landlordContact}}`,
    variables: ['tenantName', 'propertyAddress', 'workDescription', 'workDate', 'duration', 'contractorName', 'workReason', 'landlordName', 'landlordContact'],
  },
  {
    name: 'Lease Renewal Offer',
    description: 'Offer to renew tenancy agreement',
    category: 'tenant_notices',
    content: `Dear {{tenantName}},

RE: Tenancy Renewal - {{propertyAddress}}

Your current tenancy agreement is due to end on {{currentEndDate}}. We would like to offer you the opportunity to renew your tenancy for a further term.

**Proposed Renewal Details:**
- New Term Length: {{newTermLength}}
- New Start Date: {{newStartDate}}
- New End Date: {{newEndDate}}
- Monthly Rent: £{{rentAmount}}

We have enjoyed having you as a tenant and hope you will choose to continue renting the property. To accept this renewal offer, please respond by {{responseDeadline}}.

If you wish to discuss any terms or have questions about the renewal, please contact me at your earliest convenience.

Best regards,
{{landlordName}}
{{landlordContact}}`,
    variables: ['tenantName', 'propertyAddress', 'currentEndDate', 'newTermLength', 'newStartDate', 'newEndDate', 'rentAmount', 'responseDeadline', 'landlordName', 'landlordContact'],
  },
  {
    name: 'Gas Safety Certificate - Annual Inspection',
    description: 'Notice for mandatory annual gas safety inspection',
    category: 'compliance_reports',
    content: `Dear {{tenantName}},

RE: Annual Gas Safety Inspection - {{propertyAddress}}

As your landlord, I am legally required to arrange an annual gas safety check of all gas appliances, fittings, and flues at your property.

**Inspection Details:**
- Date: {{inspectionDate}}
- Time: {{inspectionTime}}
- Engineer: {{engineerName}}
- Company: {{companyName}}

The engineer will carry a valid Gas Safe Register ID card which you may check. The inspection typically takes 1-2 hours depending on the number of appliances.

This inspection is a legal requirement under the Gas Safety (Installation and Use) Regulations 1998. Please ensure someone over 18 is present to allow access.

If you cannot accommodate this date, please contact me immediately to arrange an alternative within the next 7 days.

A copy of the Gas Safety Certificate will be provided to you within 28 days of the inspection.

Best regards,
{{landlordName}}
{{landlordContact}}`,
    variables: ['tenantName', 'propertyAddress', 'inspectionDate', 'inspectionTime', 'engineerName', 'companyName', 'landlordName', 'landlordContact'],
  },
  {
    name: 'Property Compliance Report',
    description: 'Summary of property compliance status',
    category: 'compliance_reports',
    content: `PROPERTY COMPLIANCE REPORT

**Property Address:** {{propertyAddress}}
**Report Date:** {{reportDate}}
**Landlord:** {{landlordName}}

**COMPLIANCE STATUS SUMMARY**

Gas Safety Certificate:
- Status: {{gasSafetyStatus}}
- Issue Date: {{gasSafetyIssueDate}}
- Expiry Date: {{gasSafetyExpiryDate}}

Electrical Installation Condition Report (EICR):
- Status: {{eicrStatus}}
- Issue Date: {{eicrIssueDate}}
- Expiry Date: {{eicrExpiryDate}}

Energy Performance Certificate (EPC):
- Status: {{epcStatus}}
- Rating: {{epcRating}}
- Expiry Date: {{epcExpiryDate}}

Landlord Registration:
- Status: {{registrationStatus}}
- Council: {{council}}
- Registration Number: {{registrationNumber}}
- Expiry Date: {{registrationExpiryDate}}

{{hmoSection}}

**ACTIONS REQUIRED:**
{{actionsRequired}}

**NOTES:**
{{notes}}

This report was generated automatically by ScotComply.

Report Generated: {{generationDate}}`,
    variables: ['propertyAddress', 'reportDate', 'landlordName', 'gasSafetyStatus', 'gasSafetyIssueDate', 'gasSafetyExpiryDate', 'eicrStatus', 'eicrIssueDate', 'eicrExpiryDate', 'epcStatus', 'epcRating', 'epcExpiryDate', 'registrationStatus', 'council', 'registrationNumber', 'registrationExpiryDate', 'hmoSection', 'actionsRequired', 'notes', 'generationDate'],
  },
]

async function seedTemplates() {
  console.log('🌱 Seeding default templates...')

  try {
    // Find the first user (for development purposes)
    const user = await prisma.user.findFirst()

    if (!user) {
      console.error('❌ No user found. Please create a user first.')
      return
    }

    console.log(`📝 Creating templates for user: ${user.email}`)

    for (const template of defaultTemplates) {
      const existing = await prisma.documentTemplate.findFirst({
        where: {
          name: template.name,
          isDefault: true,
        },
      })

      if (existing) {
        console.log(`⏭️  Template "${template.name}" already exists, skipping...`)
        continue
      }

      await prisma.documentTemplate.create({
        data: {
          userId: user.id,
          name: template.name,
          description: template.description,
          category: template.category,
          content: template.content,
          variables: template.variables,
          isPublic: true,
          isDefault: true,
          metadata: {},
        },
      })

      console.log(`✅ Created template: ${template.name}`)
    }

    console.log('🎉 Template seeding complete!')
  } catch (error) {
    console.error('❌ Error seeding templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTemplates()
