// Light or dark. Until someone taps the switch the site follows the device; after that it
// keeps their choice in this browser. index.html applies the same rule before the page draws,
// so it never flashes the wrong colours: keep the two in step.
export type Theme = "light" | "dark";

const key = "your-economics-year:theme:v1";
// The browser bar colour on phones: the paper of each theme.
const barColour: Record<Theme, string> = { light: "#FDFCF9", dark: "#13171E" };

export function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(key, theme);
  } catch {
    // Private mode: the switch still works until the page is closed.
  }
}

export const deviceDark = () => window.matchMedia("(prefers-color-scheme: dark)");

export function currentTheme(): Theme {
  const shown = document.documentElement.dataset.theme;
  if (shown === "light" || shown === "dark") return shown;
  return savedTheme() ?? (deviceDark().matches ? "dark" : "light");
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", barColour[theme]);
}
