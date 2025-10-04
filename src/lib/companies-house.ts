/**
 * UK Companies House API Integration
 * 
 * FREE API for verifying UK companies
 * API Key: Register at https://developer.company-information.service.gov.uk/
 * 
 * Rate Limits: 600 requests per 5 minutes (free tier)
 */

export interface CompanySearchResult {
  companyNumber: string
  companyName: string
  companyStatus: string
  companyType: string
  dateOfCreation: string
  registeredOfficeAddress: {
    addressLine1?: string
    addressLine2?: string
    locality?: string
    region?: string
    postalCode?: string
    country?: string
  }
  sicCodes?: string[]
  hasInsolvencyHistory?: boolean
  hasCharges?: boolean
}

export interface CompanyOfficer {
  name: string
  officerRole: string
  appointedOn: string
  resignedOn?: string
  nationality?: string
  dateOfBirth?: {
    month: number
    year: number
  }
  countryOfResidence?: string
}

export interface CompanyDetails extends CompanySearchResult {
  officers?: CompanyOfficer[]
  confirmationStatement?: {
    nextDue: string
    lastMadeUpTo: string
  }
  accounts?: {
    nextDue: string
    lastMadeUpTo: string
  }
}

/**
 * Companies House API Client
 */
class CompaniesHouseClient {
  private apiKey: string
  private baseUrl = 'https://api.company-information.service.gov.uk'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Search for companies by name
   */
  async searchCompanies(query: string, limit = 20): Promise<CompanySearchResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Companies House API error: ${response.status}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Error searching companies:', error)
      throw error
    }
  }

  /**
   * Get company details by company number
   */
  async getCompanyDetails(companyNumber: string): Promise<CompanyDetails | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Companies House API error: ${response.status}`)
      }

      const company = await response.json()
      
      // Get officers if available
      const officers = await this.getCompanyOfficers(companyNumber)

      return {
        companyNumber: company.company_number,
        companyName: company.company_name,
        companyStatus: company.company_status,
        companyType: company.type,
        dateOfCreation: company.date_of_creation,
        registeredOfficeAddress: {
          addressLine1: company.registered_office_address?.address_line_1,
          addressLine2: company.registered_office_address?.address_line_2,
          locality: company.registered_office_address?.locality,
          region: company.registered_office_address?.region,
          postalCode: company.registered_office_address?.postal_code,
          country: company.registered_office_address?.country,
        },
        sicCodes: company.sic_codes,
        hasInsolvencyHistory: company.has_insolvency_history,
        hasCharges: company.has_charges,
        officers,
        confirmationStatement: company.confirmation_statement
          ? {
              nextDue: company.confirmation_statement.next_due,
              lastMadeUpTo: company.confirmation_statement.last_made_up_to,
            }
          : undefined,
        accounts: company.accounts
          ? {
              nextDue: company.accounts.next_due,
              lastMadeUpTo: company.accounts.last_made_up_to,
            }
          : undefined,
      }
    } catch (error) {
      console.error('Error getting company details:', error)
      throw error
    }
  }

  /**
   * Get company officers (directors, secretaries)
   */
  async getCompanyOfficers(companyNumber: string): Promise<CompanyOfficer[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/company/${companyNumber}/officers`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`Companies House API error: ${response.status}`)
      }

      const data = await response.json()
      return (data.items || []).map((officer: any) => ({
        name: officer.name,
        officerRole: officer.officer_role,
        appointedOn: officer.appointed_on,
        resignedOn: officer.resigned_on,
        nationality: officer.nationality,
        dateOfBirth: officer.date_of_birth,
        countryOfResidence: officer.country_of_residence,
      }))
    } catch (error) {
      console.error('Error getting company officers:', error)
      return []
    }
  }

  /**
   * Verify if a company is active
   */
  async isCompanyActive(companyNumber: string): Promise<boolean> {
    try {
      const company = await this.getCompanyDetails(companyNumber)
      return company?.companyStatus === 'active'
    } catch (error) {
      console.error('Error checking company status:', error)
      return false
    }
  }

  /**
   * Check for red flags
   */
  async checkCompanyRedFlags(companyNumber: string): Promise<{
    hasRedFlags: boolean
    flags: string[]
  }> {
    try {
      const company = await this.getCompanyDetails(companyNumber)
      const flags: string[] = []

      if (!company) {
        flags.push('Company not found')
        return { hasRedFlags: true, flags }
      }

      // Check company status
      if (company.companyStatus !== 'active') {
        flags.push(`Company status: ${company.companyStatus}`)
      }

      // Check for insolvency
      if (company.hasInsolvencyHistory) {
        flags.push('Has insolvency history')
      }

      // Check for charges
      if (company.hasCharges) {
        flags.push('Has charges/mortgages registered')
      }

      // Check if very new (less than 6 months)
      const creationDate = new Date(company.dateOfCreation)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      if (creationDate > sixMonthsAgo) {
        flags.push('Newly incorporated (less than 6 months old)')
      }

      // Check for missing information
      if (!company.officers || company.officers.length === 0) {
        flags.push('No officers registered')
      }

      return {
        hasRedFlags: flags.length > 0,
        flags,
      }
    } catch (error) {
      console.error('Error checking company red flags:', error)
      return {
        hasRedFlags: true,
        flags: ['Error checking company information'],
      }
    }
  }
}

/**
 * Initialize Companies House client
 */
export function getCompaniesHouseClient(): CompaniesHouseClient | null {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY

  if (!apiKey) {
    console.warn('Companies House API key not configured. Set COMPANIES_HOUSE_API_KEY in environment variables.')
    return null
  }

  return new CompaniesHouseClient(apiKey)
}

/**
 * Verify a UK company
 */
export async function verifyUKCompany(companyNumber: string): Promise<{
  verified: boolean
  company?: CompanyDetails
  redFlags?: string[]
  error?: string
}> {
  try {
    const client = getCompaniesHouseClient()

    if (!client) {
      return {
        verified: false,
        error: 'Companies House API not configured',
      }
    }

    const company = await client.getCompanyDetails(companyNumber)

    if (!company) {
      return {
        verified: false,
        error: 'Company not found',
      }
    }

    const redFlagCheck = await client.checkCompanyRedFlags(companyNumber)

    return {
      verified: true,
      company,
      redFlags: redFlagCheck.flags,
    }
  } catch (error) {
    console.error('Error verifying UK company:', error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Search UK companies by name
 */
export async function searchUKCompanies(
  query: string
): Promise<CompanySearchResult[]> {
  try {
    const client = getCompaniesHouseClient()

    if (!client) {
      console.warn('Companies House API not configured')
      return []
    }

    return await client.searchCompanies(query)
  } catch (error) {
    console.error('Error searching UK companies:', error)
    return []
  }
}
