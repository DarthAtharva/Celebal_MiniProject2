import React, { useState, useEffect, useCallback, useMemo } from "react";

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Error writing localStorage key "${key}":`, err);
    }
  }, [key, value]);

  return [value, setValue];
};

// Validation utility
const validateTask = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return { isValid: false, error: "Task cannot be empty" };
  if (trimmed.length > 200) return { isValid: false, error: "Task too long (max 200 characters)" };
  return { isValid: true, error: null };
};

// Task item component
const TaskItem = ({ task, onToggle, onRemove }) => (
  <li className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
    <div className="flex items-center space-x-4 flex-1">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:ring-2 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
        aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <span className={`flex-1 text-base font-medium leading-relaxed ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'} transition-all duration-200`}>
        {task.text}
      </span>
    </div>
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {new Date(task.createdAt).toLocaleDateString()}
      </span>
      <button
        onClick={() => onRemove(task.id)}
        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:ring-4 focus:ring-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:focus:ring-red-900/50 transition-all duration-200"
        aria-label={`Delete task "${task.text}"`}
      >
        Delete
      </button>
    </div>
  </li>
);

function App() {
  const [tasks, setTasks] = useLocalStorage("tasks", []);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addTask = useCallback(() => {
    const validation = validateTask(input);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    setIsLoading(true);
    try {
      const newTask = {
        id: Date.now() + Math.random(),
        text: input.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      setInput("");
      setError("");
    } catch {
      setError("Failed to add task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [input, setTasks]);

  const removeTask = useCallback((id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, [setTasks]);

  const toggleComplete = useCallback((id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, [setTasks]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    addTask();
  }, [addTask]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  }, [addTask]);

  const processedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    });
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });
  }, [tasks, filter, sortAsc]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(task => task.completed).length,
    active: tasks.filter(task => !task.completed).length
  }), [tasks]);

  return (
    // Outer container with flex for centering
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <span className="mr-3 text-4xl">📝</span>
                  Task Manager
                </h1>
                <p className="text-blue-100 text-lg mt-2 font-medium">
                  Stay organized and productive
                </p>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-white/10 rounded-lg px-4 py-3">
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-blue-100 text-sm font-medium">Total</div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-3">
                    <div className="text-2xl font-bold text-white">{stats.active}</div>
                    <div className="text-blue-100 text-sm font-medium">Active</div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-3">
                    <div className="text-2xl font-bold text-white">{stats.completed}</div>
                    <div className="text-blue-100 text-sm font-medium">Done</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Input */}
          <form onSubmit={handleSubmit} className="p-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <div className="space-y-6">
              <div>
                <label htmlFor="task-input" className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Add New Task
                </label>
                <div className="flex space-x-4">
                  <input
                    id="task-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What needs to be done?"
                    disabled={isLoading}
                    className="flex-1 block w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 text-lg py-4 px-5 disabled:opacity-50 transition-all duration-200"
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px] justify-center"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Adding...
                      </span>
                    ) : (
                      "Add Task"
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border-2 border-red-200 dark:border-red-800">
                  <p className="text-base text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>
          </form>

          {/* Filters and Sorting */}
          <div className="px-8 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div>
                  <label htmlFor="filter-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Filter Tasks
                  </label>
                  <select
                    id="filter-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 text-base py-3 px-4 min-w-[150px]"
                  >
                    <option value="all">All Tasks</option>
                    <option value="active">Active Tasks</option>
                    <option value="completed">Completed Tasks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Sort Order
                  </label>
                  <button
                    onClick={() => setSortAsc(prev => !prev)}
                    className="inline-flex items-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                  >
                    {sortAsc ? "Oldest First" : "Newest First"}
                    <span className={`ml-2 transform ${sortAsc ? 'rotate-180' : ''} transition-transform duration-200`}>
                      ▼
                    </span>
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {processedTasks.length} of {tasks.length} tasks
                </div>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="p-8">
            {processedTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  {filter === "all" ? "Get started by adding your first task above." : `No ${filter} tasks available.`}
                </p>
              </div>
            ) : (
              <ul className="space-y-4" role="list" aria-label="Task list">
                {processedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleComplete}
                    onRemove={removeTask}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {tasks.length > 0 && (
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-750 text-center border-t border-gray-200 dark:border-gray-700">
              <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                💾 All data is automatically saved to your browser's local storage
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
