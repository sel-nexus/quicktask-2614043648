import { useEffect, useState } from 'react';

const STORAGE_KEY = 'quicktask.tasks.v1';

/**
 * Restore a valid task list from browser storage.
 *
 * @returns {Array<{id: string, text: string, completed: boolean}>} Saved tasks, or an empty list.
 */
function loadTasks() {
  try {
    const storedTasks = window.localStorage.getItem(STORAGE_KEY);
    if (!storedTasks) return [];

    const parsedTasks = JSON.parse(storedTasks);
    if (!Array.isArray(parsedTasks)) return [];

    return parsedTasks.filter(
      (task) =>
        task &&
        typeof task.id === 'string' &&
        typeof task.text === 'string' &&
        task.text.trim().length > 0 &&
        typeof task.completed === 'boolean',
    );
  } catch {
    return [];
  }
}

/**
 * Render the single-page task manager and persist task changes locally.
 *
 * @returns {JSX.Element} The QuickTask application.
 */
export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [taskText, setTaskText] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, [tasks]);

  const completedCount = tasks.filter((task) => task.completed).length;

  /**
   * Add a trimmed task when the submitted text is not blank.
   *
   * @param {SubmitEvent} event - The task form submission event.
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();
    const text = taskText.trim();
    if (!text) return;

    setTasks((currentTasks) => [
      ...currentTasks,
      { id: window.crypto.randomUUID(), text, completed: false },
    ]);
    setTaskText('');
  }

  /**
   * Toggle one task's completion state.
   *
   * @param {string} taskId - The task identifier to update.
   * @returns {void}
   */
  function toggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  /**
   * Remove one task from the list.
   *
   * @param {string} taskId - The task identifier to remove.
   * @returns {void}
   */
  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <main className="page-shell">
      <section className="task-panel" aria-labelledby="page-title">
        <header className="page-header">
          <p className="page-kicker">A little more focus</p>
          <h1 id="page-title">QuickTask</h1>
          <p className="page-subtitle">Keep your day organized</p>
        </header>

        <form className="task-form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="new-task">
            Enter a task
          </label>
          <input
            id="new-task"
            className="task-input"
            type="text"
            placeholder="Enter a task"
            value={taskText}
            onChange={(event) => setTaskText(event.target.value)}
            autoComplete="off"
          />
          <button className="add-button" type="submit">
            Add Task
          </button>
        </form>

        <section className="list-section" aria-labelledby="list-heading">
          <div className="list-heading-row">
            <h2 id="list-heading">Your tasks</h2>
            <p className="task-count" aria-live="polite" aria-atomic="true">
              <span>{tasks.length} total</span>
              <span className="count-divider" aria-hidden="true">·</span>
              <span>{completedCount} completed</span>
            </p>
          </div>

          {tasks.length === 0 ? (
            <p className="empty-state">No tasks yet. Add your first task!</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li className="task-row" key={task.id}>
                  <label className="task-label">
                    <input
                      className="task-checkbox"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className={task.completed ? 'task-text is-complete' : 'task-text'}>
                      {task.text}
                    </span>
                  </label>
                  <button
                    className="delete-button"
                    type="button"
                    aria-label={`Delete ${task.text}`}
                    onClick={() => deleteTask(task.id)}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.7 9.5H6.2L5.5 6m2.5 2.5v4.5m4-4.5v4.5" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="panel-footer">
          <span>Just for you, right here in your browser.</span>
        </footer>
      </section>
    </main>
  );
}
