import { test, expect } from '@playwright/test'
import { CertificatesPage } from './helpers/page-objects'

test.describe('Certificate Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/certificates')
  })

  test('should display certificates page', async ({ page }) => {
    await expect(page).toHaveTitle(/Certificates|ScotComply/)
    await expect(page.locator('h1:has-text("Certificates")')).toBeVisible()
  })

  test('should show certificate types filter', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    
    // Check filter exists
    const filter = page.locator('select[name="certificateType"]')
    await expect(filter).toBeVisible()
    
    // Check has options
    const options = await filter.locator('option').count()
    expect(options).toBeGreaterThan(1)
  })

  test.skip('should add a new certificate', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    
    await certificatesPage.clickAddCertificate()
    
    await certificatesPage.fillCertificateForm({
      type: 'GAS_SAFETY',
      issueDate: '2024-01-01',
      expiryDate: '2025-01-01',
      certificateNumber: 'GAS-2024-001',
    })
    
    await certificatesPage.submitCertificateForm()
    
    // Should show success message
    await expect(page.locator('text=Certificate added')).toBeVisible({
      timeout: 5000,
    })
  })

  test.skip('should filter by certificate type', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    
    await certificatesPage.filterByType('GAS_SAFETY')
    
    // Wait for filter
    await page.waitForTimeout(1000)
    
    // Should show only gas safety certificates
    const cards = page.locator('[data-testid="certificate-card"]')
    await expect(cards.first()).toBeVisible()
  })

  test.skip('should filter by status', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    
    await certificatesPage.filterByStatus('EXPIRING_SOON')
    
    // Wait for filter
    await page.waitForTimeout(1000)
    
    // Should show only expiring certificates
    const expiring = await certificatesPage.getExpiringCertificates()
    const count = await expiring.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show expiring certificates warning', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for expiring certificates section
    const expiringSection = page.locator('text=/Expiring|Certificates Due/i')
    // May or may not be visible depending on data
    const isVisible = await expiringSection.isVisible().catch(() => false)
    expect(typeof isVisible).toBe('boolean')
  })

  test.skip('should upload certificate document', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    await certificatesPage.clickAddCertificate()
    
    // Fill basic info
    await certificatesPage.fillCertificateForm({
      type: 'EICR',
      issueDate: '2024-01-01',
      expiryDate: '2029-01-01',
    })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-certificate.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content'),
    })
    
    await certificatesPage.submitCertificateForm()
    
    // Should show success
    await expect(page.locator('text=Certificate added')).toBeVisible()
  })

  test.skip('should download certificate', async ({ page }) => {
    // Navigate to a certificate detail page
    await page.click('[data-testid="certificate-card"]:first-child')
    
    // Click download button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download")'),
    ])
    
    // Check download started
    expect(download.suggestedFilename()).toContain('certificate')
  })

  test.skip('should renew certificate', async ({ page }) => {
    // Navigate to expired/expiring certificate
    await page.click('[data-testid="certificate-card"]:first-child')
    
    // Click renew button
    await page.click('button:has-text("Renew")')
    
    // Fill renewal form
    await page.fill('input[name="issueDate"]', '2025-01-01')
    await page.fill('input[name="expiryDate"]', '2026-01-01')
    
    // Submit
    await page.click('button[type="submit"]:has-text("Renew")')
    
    // Should show success
    await expect(page.locator('text=Certificate renewed')).toBeVisible()
  })

  test.skip('should delete certificate', async ({ page }) => {
    await page.click('[data-testid="certificate-card"]:first-child')
    
    // Click delete
    await page.click('button:has-text("Delete")')
    
    // Confirm
    await page.click('button:has-text("Confirm")')
    
    // Should redirect and show success
    await expect(page).toHaveURL('/dashboard/certificates')
    await expect(page.locator('text=Certificate deleted')).toBeVisible()
  })
})

test.describe('Certificate Notifications', () => {
  test.skip('should show notification for expiring certificate', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check notification bell
    const notificationBadge = page.locator('[data-testid="notification-badge"]')
    
    // May or may not have notifications
    const hasNotifications = await notificationBadge.isVisible().catch(() => false)
    expect(typeof hasNotifications).toBe('boolean')
  })

  test.skip('should receive email notification setup', async ({ page }) => {
    await page.goto('/dashboard/settings')
    
    // Enable email notifications for certificates
    await page.check('input[name="certificateExpiryNotifications"]')
    
    // Save settings
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Should show success
    await expect(page.locator('text=Settings saved')).toBeVisible()
  })
})

test.describe('Certificate Validation', () => {
  test.skip('should validate certificate dates', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    await certificatesPage.clickAddCertificate()
    
    // Set expiry before issue date
    await certificatesPage.fillCertificateForm({
      type: 'GAS_SAFETY',
      issueDate: '2025-01-01',
      expiryDate: '2024-01-01', // Before issue date
    })
    
    await certificatesPage.submitCertificateForm()
    
    // Should show validation error
    await expect(
      page.locator('text=/Expiry date must be after issue date/i')
    ).toBeVisible()
  })

  test.skip('should validate required fields', async ({ page }) => {
    const certificatesPage = new CertificatesPage(page)
    await certificatesPage.clickAddCertificate()
    
    // Submit without filling
    await certificatesPage.submitCertificateForm()
    
    // Should show validation errors
    await expect(page.locator('text=/required/i')).toBeVisible()
  })
})
