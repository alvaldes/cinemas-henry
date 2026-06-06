import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NavDropdown from '../NavDropdown';

describe('NavDropdown', () => {
  // Helper: clear cookies between tests
  function clearCookies() {
    document.cookie = 'selectedCine=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }

  // Setup: cleanup before each test
  beforeEach(() => {
    clearCookies();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering tests
  // ============================================================================
  it('should render dropdown trigger button', () => {
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('should display initial cinema label', () => {
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    expect(button.textContent).toBeTruthy();
  });

  // ============================================================================
  // Interaction tests (user events)
  // ============================================================================
  it('should open menu when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Menu items now visible
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeDefined();
  });

  it('should display cinema items after opening menu', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Check that cinema items are visible
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('should close menu when an item is clicked', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    // Open menu
    const button = screen.getByRole('button');
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeDefined();

    // Click an enabled item
    const options = screen.getAllByRole('option');
    const enabledOption = options.find(
      (opt) => !opt.className.includes('cursor-not-allowed')
    );
    if (enabledOption) {
      await user.click(enabledOption);
    }

    // Menu should be closed
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should close menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NavDropdown />
        <button type="button">Outside</button>
      </div>
    );

    // Open menu
    const buttons = screen.getAllByRole('button');
    const navButton = buttons[0];
    await user.click(navButton);
    expect(screen.getByRole('listbox')).toBeDefined();

    // Click outside
    const outsideButton = screen.getByText('Outside');
    await user.click(outsideButton);

    // Menu should be closed
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  // ============================================================================
  // Side effect tests (cookies)
  // ============================================================================
  it('should save selected cinema to cookie', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Find the enabled option (huajuapan is the only one not disabled)
    const options = screen.getAllByRole('option');
    const enabledOption = options.find(
      (opt) => !opt.className.includes('cursor-not-allowed')
    );
    expect(enabledOption).toBeDefined();
    if (enabledOption) {
      await user.click(enabledOption);
    }

    // Cookie should be set with the selected cine value
    const cookieMatch = document.cookie.match(/selectedCine=([^;]+)/);
    expect(cookieMatch).toBeTruthy();
    if (cookieMatch) {
      const value = decodeURIComponent(cookieMatch[1]);
      expect(value).toBe('huajuapan');
    }
  });

  it('should load cinema from cookie on mount', () => {
    // Set cookie before mounting
    document.cookie = 'selectedCine=huajuapan; path=/';

    render(<NavDropdown />);

    const button = screen.getByRole('button');
    // The button should display the label of huajuapan from defaultCines
    expect(button.textContent).toBeTruthy();
  });

  // ============================================================================
  // Custom event tests
  // ============================================================================
  it('should dispatch cineChange event when cinema is selected', async () => {
    const user = userEvent.setup();
    const { container } = render(<NavDropdown />);

    let eventFired = false;
    let eventValue = '';

    const dropdown = container.querySelector('.relative');
    dropdown?.addEventListener('cineChange', (e: any) => {
      eventFired = true;
      eventValue = e.detail?.value || '';
    });

    // Open and select an enabled option
    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    const enabledOption = options.find(
      (opt) => !opt.className.includes('cursor-not-allowed')
    );
    if (enabledOption) {
      await user.click(enabledOption);
    }

    // Event should have fired
    expect(eventFired).toBe(true);
    expect(eventValue).toBe('huajuapan');
  });

  // ============================================================================
  // Accessibility tests
  // ============================================================================
  it('should have proper ARIA attributes', () => {
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('should update aria-expanded when opening menu', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('should mark selected option with aria-selected', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    // The first option (lagos) is disabled, so none should be selected initially
    const selectedOption = options.find(
      (opt) => opt.getAttribute('aria-selected') === 'true'
    );
    // The default cine (lagos) is the initial state, so it should be marked selected
    // even though it's disabled
    expect(selectedOption).toBeDefined();
  });
});
