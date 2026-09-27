"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: "dark" | "light";
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "mhp-theme";

function resolveSystem(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [resolved, setResolved] = useState<"dark" | "light">("dark");

  const apply = useCallback((mode: ThemeMode) => {
    const next = mode === "system" ? resolveSystem() : mode;
    setResolved(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.classList.toggle("light", next === "light");
    root.dataset.theme = next;
  }, []);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || "dark";
    setThemeState(stored);
    apply(stored);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      if ((localStorage.getItem(STORAGE_KEY) as ThemeMode) === "system") apply("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [apply]);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      setThemeState(mode);
      localStorage.setItem(STORAGE_KEY, mode);
      apply(mode);
    },
    [apply]
  );

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}