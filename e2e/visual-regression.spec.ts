import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('homepage should match screenshot', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('sign-in page should match screenshot', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page).toHaveScreenshot('signin-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test.skip('dashboard should match screenshot', async ({ page }) => {
    // Skip if not authenticated
    await page.goto('/dashboard')
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('properties page should match screenshot', async ({ page }) => {
    await page.goto('/dashboard/properties')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('properties-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('certificates page should match screenshot', async ({ page }) => {
    await page.goto('/dashboard/certificates')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('certificates-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('responsive mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('responsive tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('dark mode (if supported)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})

test.describe('Component Visual Tests', () => {
  test.skip('property card component', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    const card = page.locator('[data-testid="property-card"]').first()
    await expect(card).toHaveScreenshot('property-card.png')
  })

  test.skip('certificate card component', async ({ page }) => {
    await page.goto('/dashboard/certificates')
    
    const card = page.locator('[data-testid="certificate-card"]').first()
    await expect(card).toHaveScreenshot('certificate-card.png')
  })

  test.skip('navigation menu', async ({ page }) => {
    await page.goto('/dashboard')
    
    const nav = page.locator('nav').first()
    await expect(nav).toHaveScreenshot('navigation-menu.png')
  })

  test.skip('notification bell', async ({ page }) => {
    await page.goto('/dashboard')
    
    const notificationBell = page.locator('[data-testid="notification-button"]')
    await expect(notificationBell).toHaveScreenshot('notification-bell.png')
  })
})
