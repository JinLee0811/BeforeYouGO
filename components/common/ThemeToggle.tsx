import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has dark mode preference
    if (typeof window !== "undefined") {
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleDarkMode}
      className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
      aria-label='Toggle dark mode'>
      {darkMode ? (
        <SunIcon className='h-5 w-5 text-gray-600 dark:text-gray-300' />
      ) : (
        <MoonIcon className='h-5 w-5 text-gray-600 dark:text-gray-300' />
      )}
    </button>
  );
}
