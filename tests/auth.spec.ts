import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
	test('landing page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Your AI Portrait Studio');
	});

	test('signup page loads', async ({ page }) => {
		await page.goto('/auth/signup');
		await expect(page.locator('h1')).toContainText('Create Account');
	});

	test('login page loads', async ({ page }) => {
		await page.goto('/auth/login');
		await expect(page.locator('h1')).toContainText('Welcome Back');
	});

	test('signup requires email and password', async ({ page }) => {
		await page.goto('/auth/signup');
		await page.click('button[type="submit"]');
		// HTML5 validation should prevent submission
		await expect(page.locator('input[name="email"]')).toBeVisible();
	});

	test('password must be at least 8 characters', async ({ page }) => {
		await page.goto('/auth/signup');
		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="password"]', 'short');
		await page.click('button[type="submit"]');
		// Should show error about password length
		await expect(page.getByText('8 characters')).toBeVisible();
	});
});

test.describe('App redirects', () => {
	test('unauthenticated user redirects to login', async ({ page }) => {
		await page.goto('/app');
		await page.waitForURL('**/auth/login');
	});

	test('unauthenticated user cannot access onboarding', async ({ page }) => {
		await page.goto('/app/onboarding');
		await page.waitForURL('**/auth/login');
	});

	test('unauthenticated user cannot access generate', async ({ page }) => {
		await page.goto('/app/generate');
		await page.waitForURL('**/auth/login');
	});

	test('unauthenticated user cannot access gallery', async ({ page }) => {
		await page.goto('/app/gallery');
		await page.waitForURL('**/auth/login');
	});
});

test.describe('App state machine (authenticated)', () => {
	// Note: These tests require a test user account
	// Run with BASE_URL pointing to a test environment

	test.skip('user with no balance redirects to billing', async ({ page }) => {
		// TODO: Create test user with no balance
		// Log in as test user
		// Navigate to /app
		// Should redirect to /app/billing
	});

	test.skip('user with balance but no model sees onboarding', async ({ page }) => {
		// TODO: Create test user with balance but no model
		// Log in as test user
		// Navigate to /app
		// Should redirect to /app/onboarding
		// Should NOT redirect loop
	});

	test.skip('user with model in training sees training page', async ({ page }) => {
		// TODO: Create test user with training model
		// Navigate to /app
		// Should redirect to /app/training
	});

	test.skip('user with completed model can generate', async ({ page }) => {
		// TODO: Create test user with completed model
		// Navigate to /app
		// Should see /app/generate
	});
});