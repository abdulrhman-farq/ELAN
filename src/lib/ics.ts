/** Build a Google Calendar "add event" URL. Dates are ISO strings. */
export function googleCalendarUrl(opts: { title: string; startIso: string; endIso: string; details?: string; location?: string }): string {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.startIso)}/${fmt(opts.endIso)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
