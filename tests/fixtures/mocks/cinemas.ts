/**
 * Mock cinema (cine) data for testing.
 * Shape matches src/lib/types.ts Cine interface.
 */

export const mockCinemas = [
  {
    value: 'cine-downtown',
    label: 'Cinema Downtown',
    dominio: 'https://downtown-cinema.com',
  },
  {
    value: 'cine-mall',
    label: 'Cinema Mall',
    dominio: 'https://mall-cinema.com',
  },
  {
    value: 'cine-uptown',
    label: 'Cinema Uptown',
    dominio: 'https://uptown-cinema.com',
  },
];

/**
 * Get a single mock cinema by value.
 */
export function getMockCinemaByValue(value: string) {
  return mockCinemas.find((c) => c.value === value);
}

/**
 * Get all mock cinemas (for dropdown rendering tests).
 */
export function getAllMockCinemas() {
  return [...mockCinemas];
}
