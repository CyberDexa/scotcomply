import { Page, expect } from '@playwright/test'

/**
 * Page Object Model for Authentication
 */
export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/signin')
  }

  async signIn(email: string, password: string) {
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')
  }

  async waitForDashboard() {
    await this.page.waitForURL('/dashboard')
  }

  async isAuthenticated() {
    const url = this.page.url()
    return url.includes('/dashboard')
  }
}

/**
 * Page Object Model for Dashboard
 */
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
  }

  async getPropertyCount() {
    const element = await this.page.locator('[data-testid="property-count"]')
    return element.textContent()
  }

  async navigateToProperties() {
    await this.page.click('a[href="/dashboard/properties"]')
    await this.page.waitForURL('/dashboard/properties')
  }

  async navigateToCertificates() {
    await this.page.click('a[href="/dashboard/certificates"]')
    await this.page.waitForURL('/dashboard/certificates')
  }

  async checkNotifications() {
    const badge = await this.page.locator('[data-testid="notification-badge"]')
    return badge.isVisible()
  }
}

/**
 * Page Object Model for Properties
 */
export class PropertiesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/properties')
  }

  async clickAddProperty() {
    await this.page.click('button:has-text("Add Property")')
  }

  async fillPropertyForm(data: {
    address: string
    postcode: string
    type?: string
  }) {
    await this.page.fill('input[name="address"]', data.address)
    await this.page.fill('input[name="postcode"]', data.postcode)
    
    if (data.type) {
      await this.page.selectOption('select[name="type"]', data.type)
    }
  }

  async submitPropertyForm() {
    await this.page.click('button[type="submit"]:has-text("Add")')
  }

  async searchProperty(query: string) {
    await this.page.fill('input[placeholder*="Search"]', query)
  }

  async getPropertyCards() {
    return this.page.locator('[data-testid="property-card"]')
  }

  async clickProperty(index: number = 0) {
    const cards = await this.getPropertyCards()
    await cards.nth(index).click()
  }
}

/**
 * Page Object Model for Certificates
 */
export class CertificatesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/certificates')
  }

  async clickAddCertificate() {
    await this.page.click('button:has-text("Add Certificate")')
  }

  async fillCertificateForm(data: {
    type: string
    issueDate: string
    expiryDate: string
    certificateNumber?: string
  }) {
    await this.page.selectOption('select[name="type"]', data.type)
    await this.page.fill('input[name="issueDate"]', data.issueDate)
    await this.page.fill('input[name="expiryDate"]', data.expiryDate)
    
    if (data.certificateNumber) {
      await this.page.fill('input[name="certificateNumber"]', data.certificateNumber)
    }
  }

  async submitCertificateForm() {
    await this.page.click('button[type="submit"]:has-text("Add")')
  }

  async getExpiringCertificates() {
    return this.page.locator('[data-testid="expiring-certificate"]')
  }

  async filterByType(type: string) {
    await this.page.selectOption('select[name="certificateType"]', type)
  }

  async filterByStatus(status: string) {
    await this.page.selectOption('select[name="status"]', status)
  }
}

/**
 * Page Object Model for Tenants
 */
export class TenantsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/tenants')
  }

  async clickAddTenant() {
    await this.page.click('button:has-text("Add Tenant")')
  }

  async fillTenantForm(data: {
    name: string
    email: string
    phone?: string
    moveInDate?: string
  }) {
    await this.page.fill('input[name="name"]', data.name)
    await this.page.fill('input[name="email"]', data.email)
    
    if (data.phone) {
      await this.page.fill('input[name="phone"]', data.phone)
    }
    
    if (data.moveInDate) {
      await this.page.fill('input[name="moveInDate"]', data.moveInDate)
    }
  }

  async submitTenantForm() {
    await this.page.click('button[type="submit"]:has-text("Add")')
  }

  async searchTenant(query: string) {
    await this.page.fill('input[placeholder*="Search"]', query)
  }
}

/**
 * Helper function to wait for API responses
 */
export async function waitForApiResponse(
  page: Page,
  endpoint: string,
  timeout: number = 5000
) {
  return page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  )
}

/**
 * Helper function to take screenshot with custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string
) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
}

/**
 * Helper function to check for console errors
 */
export async function checkConsoleErrors(page: Page) {
  const errors: string[] = []
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  return errors
}

/**
 * Helper function to login before tests
 */
export async function loginAsTestUser(page: Page) {
  const authPage = new AuthPage(page)
  await authPage.goto()
  await authPage.signIn('test@complyscot.com', 'TestPassword123!')
  await authPage.waitForDashboard()
}
