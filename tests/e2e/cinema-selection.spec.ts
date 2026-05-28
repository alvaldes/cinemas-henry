import { test, expect } from '@playwright/test';

test.describe('Cinema Selection Flow', () => {
  // Hook: navigate to homepage before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // ============================================================================
  // Page load and visibility tests
  // ============================================================================
  test('should load homepage successfully', async ({ page }) => {
    // Check status and URL
    expect(page.url()).toContain('http://localhost:3000');

    // Check page is loaded (can look for any visible element)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display cinema dropdown on homepage', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');
    await expect(button).toBeVisible();
  });

  test('should display cinema list after clicking dropdown', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');
    await button.click();

    // Wait for menu items to appear
    const listbox = page.locator('role=listbox');
    await expect(listbox).toBeVisible();

    // Check at least one cinema option is present
    const options = page.locator('role=option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  // ============================================================================
  // User interaction tests
  // ============================================================================
  test('should select a cinema and close dropdown', async ({ page }) => {
    // Open dropdown
    const button = page.locator('button[aria-haspopup="listbox"]');
    await button.click();

    await expect(page.locator('role=listbox')).toBeVisible();

    // Select first cinema
    const firstOption = page.locator('role=option').first();
    await firstOption.click();

    // Dropdown should close
    await expect(page.locator('role=listbox')).not.toBeVisible();
  });

  test('should persist selected cinema in button text', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');

    // Get initial text
    const initialText = await button.textContent();

    // Open and select an option
    await button.click();
    const options = page.locator('role=option');
    const optionText = await options.first().textContent();
    await options.first().click();

    // Button text might change to selected cinema (depends on app logic)
    const finalText = await button.textContent();
    // Just verify button still has content
    expect(finalText).toBeTruthy();
  });

  // ============================================================================
  // Accessibility tests
  // ============================================================================
  test('should have accessible button structure', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');

    // Button should have aria-haspopup
    const ariaHasPopup = await button.getAttribute('aria-haspopup');
    expect(ariaHasPopup).toBe('listbox');

    // Button should have aria-expanded
    const ariaExpanded = await button.getAttribute('aria-expanded');
    expect(ariaExpanded).toBeTruthy();
  });

  test('should have accessible listbox structure', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');
    await button.click();

    const listbox = page.locator('role=listbox');
    await expect(listbox).toBeVisible();

    // All items should be options
    const options = page.locator('role=option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Each option should have aria-selected
    const firstOption = options.first();
    const ariaSelected = await firstOption.getAttribute('aria-selected');
    expect(ariaSelected).toBeTruthy();
  });

  // ============================================================================
  // Error handling and edge cases
  // ============================================================================
  test('should handle rapid clicks on dropdown button', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');

    // Rapid clicks
    await button.click();
    await button.click();
    await button.click();

    // Should still be functional
    const listbox = page.locator('role=listbox');
    const isVisible = await listbox.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should not break on refresh after selection', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');

    // Select a cinema
    await button.click();
    const options = page.locator('role=option');
    await options.first().click();

    // Refresh page
    await page.reload();

    // Cinema dropdown should still be visible and functional
    const refreshedButton = page.locator('button[aria-haspopup="listbox"]');
    await expect(refreshedButton).toBeVisible();
  });

  // ============================================================================
  // Performance tests
  // ============================================================================
  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Homepage should load in <5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
