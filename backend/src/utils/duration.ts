/**
 * Parses a compact duration string (e.g. "15m", "30d", "12h", "45s", "2w")
 * into milliseconds. Keeps the codebase free of an extra runtime dependency for
 * something this small, and validates its input.
 */
const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

export function durationToMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d|w)$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration string: "${value}"`);
  const amount = Number(match[1]);
  const unit = match[2];
  return amount * UNIT_MS[unit];
}
