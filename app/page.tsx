"use client";

import { useState, useEffect } from "react";
import { FlowAppComponent } from "@/components/flow-app";
import Navigation from "@/components/Navigation";

export default function Page() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Handle dark mode
  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode !== null) {
      setIsDarkMode(JSON.parse(storedDarkMode));
    }

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen">
      <FlowAppComponent isDarkMode={isDarkMode} />
    </div>
  );
}