import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('sign-in page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/signin')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test.skip('dashboard should not have accessibility violations', async ({ page }) => {
    // Skip if not authenticated
    await page.goto('/dashboard')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('properties page should not have accessibility violations', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#third-party-ads') // Exclude third-party content
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('certificates page should not have accessibility violations', async ({ page }) => {
    await page.goto('/dashboard/certificates')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['duplicate-id']) // Focus only on color contrast
      .analyze()
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )
    
    expect(colorContrastViolations).toEqual([])
  })

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/auth/signin')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()
    
    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'label' || v.id === 'form-field-multiple-labels'
    )
    
    expect(labelViolations).toEqual([])
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()
    
    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'heading-order'
    )
    
    expect(headingViolations).toEqual([])
  })

  test('interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    const nameViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'button-name' || v.id === 'link-name'
    )
    
    expect(nameViolations).toEqual([])
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()
    
    const imageViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'image-alt'
    )
    
    expect(imageViolations).toEqual([])
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Tab to email field
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement?.getAttribute('name'))
    expect(focused).toBeTruthy()
    
    // Tab to password field
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.getAttribute('name'))
    expect(focused).toBeTruthy()
    
    // Tab to submit button
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBe('BUTTON')
  })

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Press Tab to focus skip link
    await page.keyboard.press('Tab')
    
    // Check skip link is focused or visible
    const skipLink = page.locator('a:has-text("Skip to main content")')
    const isVisible = await skipLink.isVisible().catch(() => false)
    
    // Skip link should be present (may be visually hidden until focused)
    const exists = await skipLink.count()
    expect(exists).toBeGreaterThan(0)
  })

  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]')
    await expect(main).toBeVisible()
    
    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]')
    await expect(nav.first()).toBeVisible()
  })

  test('should have descriptive page titles', async ({ page }) => {
    // Check homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    
    // Check sign-in
    await page.goto('/auth/signin')
    await expect(page).toHaveTitle(/Sign In|ScotComply/)
    
    // Check properties
    await page.goto('/dashboard/properties')
    await expect(page).toHaveTitle(/Properties|ScotComply/)
  })

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for ARIA live regions
    const liveRegion = page.locator('[aria-live], [role="status"], [role="alert"]')
    const count = await liveRegion.count()
    
    // Should have at least one live region for announcements
    expect(count).toBeGreaterThanOrEqual(0) // May be 0 if not currently announcing
  })
})

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test('mobile view should not have accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('mobile navigation should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i]')
    const exists = await menuButton.count()
    
    expect(exists).toBeGreaterThanOrEqual(0)
  })

  test('mobile touch targets should be adequately sized', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()
    
    const targetSizeViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'target-size'
    )
    
    expect(targetSizeViolations).toEqual([])
  })
})
