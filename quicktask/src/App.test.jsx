import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const STORAGE_KEY = 'quicktask.tasks.v1';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('QuickTask task lifecycle', () => {
  it('shows the requested empty state and zero counts initially', () => {
    render(<App />);

    expect(screen.getByText('No tasks yet. Add your first task!')).toBeInTheDocument();
    expect(screen.getByText('0 total')).toBeInTheDocument();
    expect(screen.getByText('0 completed')).toBeInTheDocument();
  });

  it('adds a trimmed task with the button and clears the input', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });

    await user.type(input, '  Plan the day  ');
    await user.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(screen.getByText('Plan the day')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(screen.getByText('1 total')).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
    });
  });

  it('adds a task with Enter and appends new tasks in insertion order', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });

    await user.type(input, 'First task{Enter}Second task{Enter}');

    const taskItems = screen.getAllByRole('listitem');
    expect(taskItems.map((item) => item.textContent)).toEqual([
      expect.stringContaining('First task'),
      expect.stringContaining('Second task'),
    ]);
    expect(input).toHaveValue('');
  });

  it.each(['', '   ', '      '])('rejects blank task text %j', async (text) => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });

    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await user.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText('No tasks yet. Add your first task!')).toBeInTheDocument();
    expect(input).toHaveValue(text);
  });

  it('toggles completion in both directions and updates the completed count', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });

    await user.type(input, 'Read a chapter{Enter}');
    const checkbox = screen.getByRole('checkbox', { name: 'Read a chapter' });
    const taskText = screen.getByText('Read a chapter');

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(taskText).toHaveClass('is-complete');
    expect(screen.getByText('1 completed')).toBeInTheDocument();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(taskText).not.toHaveClass('is-complete');
    expect(screen.getByText('0 completed')).toBeInTheDocument();
  });

  it('deletes the selected task and updates counts and the empty state', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });

    await user.type(input, 'Keep this{Enter}Remove this{Enter}');
    await user.click(screen.getByRole('checkbox', { name: 'Keep this' }));
    await user.click(screen.getByRole('button', { name: 'Delete Remove this' }));

    expect(screen.queryByText('Remove this')).not.toBeInTheDocument();
    expect(screen.getByText('Keep this')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Keep this' }));
    expect(screen.getByText('No tasks yet. Add your first task!')).toBeInTheDocument();
    expect(screen.getByText('0 total')).toBeInTheDocument();
    expect(screen.getByText('0 completed')).toBeInTheDocument();
  });

  it('restores valid saved tasks from LocalStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'saved-1', text: 'Saved task', completed: true }]),
    );

    render(<App />);

    expect(screen.getByText('Saved task')).toHaveClass('is-complete');
    expect(screen.getByRole('checkbox', { name: 'Saved task' })).toBeChecked();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
  });

  it('renders markup-like task text as inert text', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });
    const markupLikeText = '<img src=x onerror=alert(1)>';

    await user.type(input, markupLikeText);
    await user.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(screen.getByText(markupLikeText)).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('accepts a large task string and renders the complete text', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Enter a task' });
    const largeTask = 'A'.repeat(5000);

    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, largeTask);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await user.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(screen.getByText(largeTask)).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
  });

  it('treats non-array saved data as an empty task list', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 'not-a-list' }));

    render(<App />);

    expect(screen.getByText('No tasks yet. Add your first task!')).toBeInTheDocument();
    expect(screen.getByText('0 total')).toBeInTheDocument();
  });

  it('remains usable when browser storage reads and writes throw', async () => {
    const user = userEvent.setup();
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function getStoredItem(key) {
      if (key === STORAGE_KEY) throw new DOMException('Storage unavailable', 'SecurityError');
      return null;
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function setStoredItem(key) {
      if (key === STORAGE_KEY) throw new DOMException('Storage unavailable', 'QuotaExceededError');
    });

    render(<App />);
    expect(screen.getByText('No tasks yet. Add your first task!')).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Enter a task' });
    await user.type(input, 'Available for this session{Enter}');

    expect(screen.getByText('Available for this session')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it('ignores malformed and invalid saved task data without crashing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');
    const { unmount } = render(<App />);
    expect(screen.getByText('No tasks yet. Add your first task!')).toBeInTheDocument();

    unmount();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        null,
        { id: 'bad', text: 'Missing completion flag' },
        { id: 'good', text: 'Valid task', completed: false },
      ]),
    );
    render(<App />);

    expect(screen.getByText('Valid task')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
  });
});
