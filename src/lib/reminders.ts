// Replace this adapter with a remote service when a reminder backend is introduced.
// This MVP stores intent only: it never schedules or sends a notification.
export interface ReminderStore {
  load(): string[];
  save(ids: string[]): boolean;
}
const key = "your-economics-year:reminders:v1";
export const reminderStore: ReminderStore = {
  load() {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(value)
        ? [
            ...new Set(
              value.filter((id): id is string => typeof id === "string"),
            ),
          ]
        : [];
    } catch {
      return [];
    }
  },
  save(ids) {
    try {
      localStorage.setItem(key, JSON.stringify(ids));
      return true;
    } catch {
      return false;
    }
  },
};
