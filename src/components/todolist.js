import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import "./TodoList.css";

const TodoList = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled"
  );
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0] 
  );

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks"));
    if (storedTasks) {
      setTasks(storedTasks);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Dark Mode Toggle
  useLayoutEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode ? "enabled" : "disabled");
  }, [darkMode]);

  // Request Notification Permission
  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  // Schedule a reminder
  const scheduleReminder = (task) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const taskDate = new Date(task.date);
    const now = new Date();

    if (taskDate.toDateString() === now.toDateString()) {
      new Notification("Task Reminder", {
        body: `Reminder: ${task.text} is due today!`,
      });
    } else {
      taskDate.setHours(9, 0, 0, 0);
      const timeUntilReminder = taskDate - now;

      if (timeUntilReminder > 0) {
        setTimeout(() => {
          new Notification("Task Reminder", {
            body: `Reminder: ${task.text} is due today!`,
          });
        }, timeUntilReminder);
      }
    }
  };

  // Add a new task and set a reminder
  const addTask = () => {
    if (input.trim() !== "") {
      const newTask = {
        text: input,
        completed: false,
        date: selectedDate,
      };
      setTasks([...tasks, newTask]);
      setInput(""); // Clear input field

      // Schedule reminder
      scheduleReminder(newTask);
    }
  };

  // Toggle task completion
  const toggleComplete = (taskText) => {
    setTasks(tasks.map(task =>
      task.text === taskText ? { ...task, completed: !task.completed } : task
    ));
  };

  // Move a task to the next day
  const moveToTomorrow = (taskText) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    setTasks(tasks.map(task =>
      task.text === taskText ? { ...task, date: tomorrowDate } : task
    ));
  };

  // Carry over incomplete tasks to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const updatedTasks = tasks.map((task) =>
      !task.completed && task.date < today ? { ...task, date: today } : task
    );
    setTasks(updatedTasks);
  }, [tasks]);

  // Alternative: If you plan to use carryOverTasks elsewhere
  /*
  const carryOverTasks = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const updatedTasks = tasks.map((task) =>
      !task.completed && task.date < today ? { ...task, date: today } : task
    );
    setTasks(updatedTasks);
  }, [tasks]);

  useEffect(() => {
    carryOverTasks();
  }, [carryOverTasks]);
  */

  // Request notification permission when the app loads
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="todo-container">
      <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
      </button>
      
      <h2>To-Do List</h2>

      {/* Task Input */}
      <div className="input-container">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
        />
        <button onClick={addTask}>Add</button>
      </div>

      {/* Group tasks by date */}
      {Object.entries(
        tasks.reduce((acc, task) => {
          acc[task.date] = acc[task.date] || [];
          acc[task.date].push(task);
          return acc;
        }, {})
      ).map(([date, taskList]) => (
        <div key={date} className="task-group">
          <h3>{date}</h3>
          <ul className="task-list">
            {/* Incomplete tasks */}
            {taskList
              .filter((task) => !task.completed)
              .map((task) => (
                <li key={task.text} className="task-item">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.text)}
                  />
                  {task.text}
                  <button className="move-btn" onClick={() => moveToTomorrow(task.text)}>
                    Move to Tomorrow
                  </button>
                </li>
              ))}
          </ul>

          {/* Completed Tasks */}
          {taskList.some((task) => task.completed) && (
            <>
              <h4>Completed Tasks</h4>
              <ul className="completed-tasks">
                {taskList
                  .filter((task) => task.completed)
                  .map((task) => (
                    <li key={task.text} className="completed">{task.text}</li>
                  ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default TodoList;
