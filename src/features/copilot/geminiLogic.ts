/**
 * Simulated Copilot generation for the in-document "edit" flow (rewrite/shorten/etc. a selection).
 * The "create a job" flow no longer uses this file — it calls the real backend via `copilotApi.ts`.
 */

export function trunc(s: string, n: number): string {
  s = String(s);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function shortenText(t: string): string {
  const words = t.split(/\s+/);
  if (words.length <= 8) return t;
  return (
    words
      .slice(0, Math.max(6, Math.round(words.length * 0.6)))
      .join(" ")
      .replace(/[,;:]+$/, "") + "."
  );
}

export function friendlyRewrite(t: string): string {
  return (
    t
      .replace(/\bMust have\b/i, "You should have")
      .replace(/\bmust have\b/gi, "should have")
      .replace(/\bis required\b/gi, "would be great to have")
      .replace(/\bshall\b/gi, "will") + " (we care more about what you can do than a checklist match)."
  );
}

export function generateEditResponse(prompt: string, selText?: string | null): string {
  const p = prompt.toLowerCase();
  if (selText) {
    if (/concise|shorter|short/.test(p)) return shortenText(selText);
    if (/friendl|casual|less corporate|warm/.test(p)) return friendlyRewrite(selText);
    if (/remote/.test(p))
      return selText.replace(/\.?$/, "") + ". Open to remote candidates, with flexibility on working-hours overlap.";
    return `Here’s a revised version based on “${prompt}”:\n\n` + friendlyRewrite(selText);
  }
  return `Added a new section based on your request: “${prompt}”. Review it below and insert it wherever fits — it’s appended to the end of the document by default.`;
}

export const CREATE_CHIPS = [
  "We need a Growth Lead who can build our marketing function from zero, based in Ho Chi Minh City",
  "Senior backend engineer, strong on distributed systems, hybrid role in Hanoi",
  "HR Lead to set up recruiting and HR infrastructure for a brand-new business unit",
];
export const EDIT_SELECTION_CHIPS = [
  "Make this more concise",
  "Rewrite in a friendlier, less corporate tone",
  "Add a note about remote-work flexibility",
];
export const EDIT_CHIPS = [
  "Add a short section about team culture",
  "Summarize the compensation philosophy in one sentence",
  "Add a note about visa/relocation support",
];
