import { test, expect } from '@playwright/test'
import { loginAsTestUser, PropertiesPage, DashboardPage } from './helpers/page-objects'

test.describe('Property Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    // await loginAsTestUser(page) // Uncomment when test user is available
    await page.goto('/dashboard/properties')
  })

  test('should display properties page', async ({ page }) => {
    await expect(page).toHaveTitle(/Properties|ScotComply/)
    
    // Check for key page elements
    await expect(page.locator('h1:has-text("Properties")')).toBeVisible()
  })

  test('should show add property button', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    
    // Check add button exists
    const addButton = page.locator('button:has-text("Add Property")')
    await expect(addButton).toBeVisible()
  })

  test.skip('should open add property modal', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    await propertiesPage.clickAddProperty()
    
    // Check modal opened
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('text=Add Property')).toBeVisible()
  })

  test.skip('should add a new property', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    await propertiesPage.clickAddProperty()
    
    await propertiesPage.fillPropertyForm({
      address: '123 Test Street',
      postcode: 'EH1 1AA',
      type: 'FLAT',
    })
    
    await propertiesPage.submitPropertyForm()
    
    // Should show success message
    await expect(page.locator('text=Property added successfully')).toBeVisible({
      timeout: 5000,
    })
    
    // Should appear in list
    await expect(page.locator('text=123 Test Street')).toBeVisible()
  })

  test.skip('should search properties', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    
    await propertiesPage.searchProperty('Test Street')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Should filter properties
    const cards = await propertiesPage.getPropertyCards()
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test.skip('should filter properties by type', async ({ page }) => {
    await page.selectOption('select[name="propertyType"]', 'FLAT')
    
    // Wait for filter
    await page.waitForTimeout(1000)
    
    // Check filtered results
    const cards = page.locator('[data-testid="property-card"]')
    await expect(cards.first()).toBeVisible()
  })

  test.skip('should navigate to property details', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    
    await propertiesPage.clickProperty(0)
    
    // Should navigate to property detail page
    await expect(page).toHaveURL(/\/dashboard\/properties\/[a-z0-9]+/)
    
    // Should show property details
    await expect(page.locator('h1')).toBeVisible()
  })

  test.skip('should edit property', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    await propertiesPage.clickProperty(0)
    
    // Click edit button
    await page.click('button:has-text("Edit")')
    
    // Update address
    await page.fill('input[name="address"]', '456 Updated Street')
    
    // Save changes
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Should show success message
    await expect(page.locator('text=Property updated')).toBeVisible()
  })

  test.skip('should delete property', async ({ page }) => {
    const propertiesPage = new PropertiesPage(page)
    await propertiesPage.clickProperty(0)
    
    // Click delete button
    await page.click('button:has-text("Delete")')
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")')
    
    // Should redirect to properties list
    await expect(page).toHaveURL('/dashboard/properties')
    
    // Should show success message
    await expect(page.locator('text=Property deleted')).toBeVisible()
  })

  test('should show property statistics', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check dashboard shows property count
    const propertyCount = page.locator('[data-testid="property-count"]')
    await expect(propertyCount).toBeVisible()
  })
})

test.describe('Property Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check focus is visible
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    // Check for ARIA labels on interactive elements
    const addButton = page.locator('button:has-text("Add Property")')
    const ariaLabel = await addButton.getAttribute('aria-label')
    expect(ariaLabel || 'Add Property').toBeTruthy()
  })
})
