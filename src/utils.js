// Pure helpers (no React) so they are easy to unit test.
// RULE: every time value in this project is in SECONDS (a number).
// The original version mixed seconds, percentages and "00:00:10" strings,
// which was the root cause of the seek bugs.

export const MIN_CHAPTER_GAP = 3; // seconds

export const DEFAULT_CHAPTERS = [
  { label: "Introduction", start: 0 },
  { label: "Gameplay Mechanics", start: 10 },
  { label: "Character Introductions", start: 20 },
  { label: "Boss Battles", start: 30 },
  { label: "World Exploration", start: 40 },
  { label: "Conclusion", start: 50 },
];

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** 75 -> "1:15", 3725 -> "1:02:05" */
export const formatTime = (seconds) => {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

/** "1:15" -> 75, "00:01:15" -> 75, invalid -> null */
export const parseTimestamp = (text) => {
  const parts = String(text).trim().split(":").map(Number);
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => !Number.isInteger(p) || p < 0)) return null;
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts];
  if (m > 59 || s > 59) return null;
  return h * 3600 + m * 60 + s;
};

/** Index of the chapter that contains `time` (-1 if there are no chapters). */
export const getActiveChapterIndex = (chapters, time) => {
  let active = chapters.length ? 0 : -1;
  for (let i = 0; i < chapters.length; i += 1) {
    if (chapters[i].start <= time) active = i;
    else break;
  }
  return active;
};

/** Turns chapters into [{ start, end, label }] covering 0 -> duration. */
export const buildSegments = (chapters, duration) => {
  if (!duration) return [];
  if (!chapters.length) return [{ start: 0, end: duration, label: "" }];
  return chapters.map((chapter, i) => ({
    label: chapter.label,
    start: i === 0 ? 0 : chapter.start,
    end: i === chapters.length - 1 ? duration : chapters[i + 1].start,
  }));
};

/** Adds a chapter. Returns { chapters } or { error }. Never mutates. */
export const addChapter = (chapters, start, label, duration) => {
  const title = label.trim();
  const s = Math.floor(start);
  if (!title) return { error: "Give the chapter a title." };
  if (duration && s >= duration) {
    return { error: "That time is past the end of the video." };
  }
  if (chapters.some((c) => Math.abs(c.start - s) < MIN_CHAPTER_GAP)) {
    return { error: `Chapters must be at least ${MIN_CHAPTER_GAP}s apart.` };
  }
  const next = [...chapters, { label: title, start: s }].sort(
    (a, b) => a.start - b.start
  );
  return { chapters: next };
};

export const removeChapter = (chapters, start) =>
  start === 0 ? chapters : chapters.filter((c) => c.start !== start);

// "0:00 Intro", "00:10 - Gameplay", "1:05:30 | Finale"
const CHAPTER_LINE = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*[-–—:|]?\s*(.+?)\s*$/;

/**
 * Parses YouTube-style chapter text. Same rules YouTube uses:
 * at least 2 chapters, first one at 0:00, minimum gap between chapters.
 */
export const parseChapters = (text) => {
  const found = [];
  String(text)
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(CHAPTER_LINE);
      if (!match) return;
      const start = parseTimestamp(match[1]);
      if (start !== null) found.push({ label: match[2], start });
    });
  found.sort((a, b) => a.start - b.start);

  if (found.length < 2) {
    return { error: 'Add at least 2 lines like "0:00 Intro".' };
  }
  if (found[0].start !== 0) {
    return { error: "The first chapter must start at 0:00." };
  }
  for (let i = 1; i < found.length; i += 1) {
    if (found[i].start - found[i - 1].start < MIN_CHAPTER_GAP) {
      return {
        error: `Chapters must be at least ${MIN_CHAPTER_GAP}s apart (check ${formatTime(
          found[i].start
        )}).`,
      };
    }
  }
  return { chapters: found };
};
