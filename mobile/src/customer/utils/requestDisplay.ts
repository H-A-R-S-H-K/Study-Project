import type { RequestStatus } from '../../types/domain';

/** Palette-agnostic status → colour intent (resolved against the theme by callers). */
export const STATUS_TONE: Record<RequestStatus, 'primary' | 'tertiary' | 'error' | 'muted'> = {
  open: 'primary',
  matched: 'tertiary',
  in_progress: 'tertiary',
  completed: 'muted',
  cancelled: 'error',
  expired: 'muted',
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  open: 'Open',
  matched: 'Matched',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export interface SchedulePreset {
  key: string;
  label: string;
  toISO: () => string;
}

/**
 * Quick scheduling options — avoids pulling in a native date-picker dependency
 * while still capturing a concrete future time. "Tomorrow morning" = 8 AM.
 */
export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { key: 'in1h', label: 'In 1 hour', toISO: () => new Date(Date.now() + 3_600_000).toISOString() },
  {
    key: 'in3h',
    label: 'In 3 hours',
    toISO: () => new Date(Date.now() + 3 * 3_600_000).toISOString(),
  },
  {
    key: 'tmrw_am',
    label: 'Tomorrow 8 AM',
    toISO: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    key: 'tmrw_pm',
    label: 'Tomorrow 5 PM',
    toISO: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(17, 0, 0, 0);
      return d.toISOString();
    },
  },
];

export function formatSchedule(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
