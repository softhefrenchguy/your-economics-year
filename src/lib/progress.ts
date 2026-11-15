// What the student has ticked off and their notes on it. Stored in this browser only, like
// the saved list: no account, nothing sent anywhere.
import type { ProgressMap } from "./plan";

const key = "your-economics-year:progress:v1";

export const progressStore = {
  load(): ProgressMap {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
      if (!value || typeof value !== "object" || Array.isArray(value)) return {};
      const clean: ProgressMap = {};
      for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
        if (!entry || typeof entry !== "object") continue;
        const { done, note, doneOn } = entry as Record<string, unknown>;
        clean[id] = {
          done: done === true,
          note: typeof note === "string" ? note : "",
          doneOn: typeof doneOn === "string" ? doneOn : "",
        };
      }
      return clean;
    } catch {
      return {};
    }
  },
  save(progress: ProgressMap): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(progress));
      return true;
    } catch {
      return false;
    }
  },
};
