import { render as preactRender, type RenderResult } from '@testing-library/preact';
import type { ComponentType } from 'preact';

/**
 * Custom render function for Preact components in tests.
 * Wraps @testing-library/preact render with default options.
 */
export function renderWithDefaults(
  Component: ComponentType,
  options?: any
): RenderResult {
  return preactRender(Component, options);
}

/**
 * Helper to create mock API responses for testing.
 * Use in tests to mock fetch() calls.
 * 
 * Example:
 *   const mockResponse = mockApiResponse({ datos: [...] }, 200);
 *   global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);
 */
export function mockApiResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status === 200,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

/**
 * Helper to wait for async state updates in tests.
 * Use after user interactions that trigger async effects.
 * 
 * Example:
 *   await user.click(button);
 *   await waitFor(() => {
 *     expect(screen.getByText('Loaded')).toBeInTheDocument();
 *   });
 */
export { waitFor, screen } from '@testing-library/preact';

/**
 * Helper to create FormData for API tests.
 * cinemas-henry getMovies() uses FormData.
 */
export function createFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  return formData;
}

/**
 * Helper to generate mock Cine objects (cinema).
 * Used in NavDropdown tests.
 */
export function createMockCine(overrides?: Partial<any>) {
  return {
    value: 'cine-1',
    label: 'Cinema Downtown',
    dominio: 'https://cine1.com',
    ...overrides,
  };
}

/**
 * Helper to generate mock Movie objects.
 * Used in component tests that display movies.
 */
export function createMockMovie(overrides?: Partial<any>) {
  return {
    id: 'mov-1',
    title: 'Test Movie',
    duration: 120,
    genre: 'Action',
    classification: 'PG-13',
    billboard: true,
    trailer: 'https://youtube.com/watch?v=test',
    director: 'Test Director',
    actors: 'Test Actor',
    synopsis: 'Test synopsis',
    type: 'Largometraje',
    img_primary: 'https://example.com/poster.jpg',
    img_secondary: 'https://example.com/poster-alt.jpg',
    releaseDate: '2026-05-28',
    showtimes: [],
    ...overrides,
  };
}
