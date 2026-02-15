import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'e2e/.auth/user.json'

/**
 * Authentication setup for e2e tests.
 *
 * Since MOVD Pro uses magic link auth, we have two options:
 * 1. Set a test session cookie directly (faster, used here)
 * 2. Use a test-only auth bypass endpoint
 *
 * For local testing, ensure you have a valid session cookie value
 * in the PLAYWRIGHT_SESSION_TOKEN env var, or the test will be skipped.
 */
setup('authenticate', async ({ page, context }) => {
  const sessionToken = process.env.PLAYWRIGHT_SESSION_TOKEN

  if (!sessionToken) {
    console.log('⚠️  PLAYWRIGHT_SESSION_TOKEN not set - tests will run unauthenticated')
    console.log('   To authenticate: export PLAYWRIGHT_SESSION_TOKEN=<your session token>')
    console.log('   Get token from browser DevTools > Application > Cookies > movd_pro_session')
    return
  }

  // Set the session cookie
  await context.addCookies([
    {
      name: 'movd_pro_session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])

  // Verify authentication works
  await page.goto('/clients')

  // Should not redirect to login
  await expect(page).not.toHaveURL(/\/login/)

  // Save auth state
  await context.storageState({ path: AUTH_FILE })
})
