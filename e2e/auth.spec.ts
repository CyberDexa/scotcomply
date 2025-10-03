import { test, expect } from '@playwright/test'
import { AuthPage, DashboardPage } from './helpers/page-objects'

test.describe('Authentication Flow', () => {
  test('should load the sign-in page', async ({ page }) => {
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    // Check page title
    await expect(page).toHaveTitle(/Sign In|ScotComply/)
    
    // Check form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    // Click submit without filling fields
    await page.click('button[type="submit"]')
    
    // Should show validation messages
    await expect(page.locator('text=Email is required')).toBeVisible({
      timeout: 2000,
    })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    await authPage.signIn('invalid@example.com', 'wrongpassword')
    
    // Should show error message
    await expect(
      page.locator('text=/Invalid credentials|Sign in failed/i')
    ).toBeVisible({ timeout: 5000 })
  })

  test.skip('should successfully sign in with valid credentials', async ({ page }) => {
    // Skip if no test user is configured
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    await authPage.signIn('test@complyscot.com', 'TestPassword123!')
    
    // Should redirect to dashboard
    await authPage.waitForDashboard()
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Should show user info
    await expect(page.locator('text=test@complyscot.com')).toBeVisible()
  })

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Click sign-up link
    await page.click('a:has-text("Sign up")')
    
    // Should navigate to sign-up page
    await expect(page).toHaveURL(/\/auth\/signup/)
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Click forgot password link
    await page.click('a:has-text("Forgot password")')
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
  })

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})

test.describe('Session Management', () => {
  test.skip('should maintain session after page reload', async ({ page }) => {
    const authPage = new AuthPage(page)
    await authPage.goto()
    await authPage.signIn('test@complyscot.com', 'TestPassword123!')
    await authPage.waitForDashboard()
    
    // Reload page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test.skip('should sign out successfully', async ({ page }) => {
    const authPage = new AuthPage(page)
    await authPage.goto()
    await authPage.signIn('test@complyscot.com', 'TestPassword123!')
    await authPage.waitForDashboard()
    
    // Click sign out
    await page.click('button:has-text("Sign out")')
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})
