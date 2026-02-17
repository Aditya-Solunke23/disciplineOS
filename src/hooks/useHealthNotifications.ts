import { useEffect, useRef, useState, useCallback } from "react";

export type ReminderType = "water" | "stretch" | "exercise";

interface ReminderConfig {
  enabled: boolean;
  intervalMinutes: number;
}

const DEFAULT_CONFIG: Record<ReminderType, ReminderConfig> = {
  water: { enabled: false, intervalMinutes: 30 },
  stretch: { enabled: false, intervalMinutes: 45 },
  exercise: { enabled: false, intervalMinutes: 60 },
};

const LABELS: Record<ReminderType, { title: string; body: string; icon: string }> = {
  water: { title: "💧 Hydration Reminder", body: "Time to drink a glass of water!", icon: "💧" },
  stretch: { title: "🧘 Stretch Break", body: "Stand up and stretch for a few minutes.", icon: "🧘" },
  exercise: { title: "🏃 Movement Reminder", body: "Time to get some exercise in!", icon: "🏃" },
};

const STORAGE_KEY = "disciplineos-health-reminders";

function loadConfig(): Record<ReminderType, ReminderConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_CONFIG;
}

export function useHealthNotifications() {
  const [config, setConfig] = useState<Record<ReminderType, ReminderConfig>>(loadConfig);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const intervals = useRef<Record<string, ReturnType<typeof setInterval> | null>>({
    water: null,
    stretch: null,
    exercise: null,
  });

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied";
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, []);

  const sendNotification = useCallback((type: ReminderType) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const label = LABELS[type];
    new Notification(label.title, { body: label.body, icon: label.icon });
  }, []);

  const updateConfig = useCallback((type: ReminderType, updates: Partial<ReminderConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, [type]: { ...prev[type], ...updates } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Manage intervals
  useEffect(() => {
    const types: ReminderType[] = ["water", "stretch", "exercise"];
    types.forEach((type) => {
      if (intervals.current[type]) {
        clearInterval(intervals.current[type]!);
        intervals.current[type] = null;
      }
      const cfg = config[type];
      if (cfg.enabled && permission === "granted") {
        intervals.current[type] = setInterval(() => {
          sendNotification(type);
        }, cfg.intervalMinutes * 60 * 1000);
      }
    });

    return () => {
      types.forEach((type) => {
        if (intervals.current[type]) clearInterval(intervals.current[type]!);
      });
    };
  }, [config, permission, sendNotification]);

  return { config, updateConfig, permission, requestPermission };
}
