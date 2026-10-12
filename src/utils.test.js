import {
  DEFAULT_CHAPTERS,
  addChapter,
  buildSegments,
  formatTime,
  getActiveChapterIndex,
  parseChapters,
  parseTimestamp,
  removeChapter,
} from "./utils";

describe("time helpers", () => {
  test("formatTime", () => {
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(3725)).toBe("1:02:05");
    expect(formatTime(NaN)).toBe("0:00");
  });

  test("parseTimestamp", () => {
    expect(parseTimestamp("1:15")).toBe(75);
    expect(parseTimestamp("00:01:15")).toBe(75);
    expect(parseTimestamp("1:75")).toBeNull();
    expect(parseTimestamp("abc")).toBeNull();
  });
});

describe("chapters", () => {
  test("active chapter follows current time", () => {
    expect(getActiveChapterIndex(DEFAULT_CHAPTERS, 0)).toBe(0);
    expect(getActiveChapterIndex(DEFAULT_CHAPTERS, 29.9)).toBe(2);
    expect(getActiveChapterIndex(DEFAULT_CHAPTERS, 51)).toBe(5);
    expect(getActiveChapterIndex([], 5)).toBe(-1);
  });

  test("segments cover the whole video", () => {
    const seg = buildSegments(DEFAULT_CHAPTERS, 52);
    expect(seg[0].start).toBe(0);
    expect(seg[seg.length - 1].end).toBe(52);
  });

  test("addChapter validates input and never mutates", () => {
    const before = [...DEFAULT_CHAPTERS];
    expect(addChapter(DEFAULT_CHAPTERS, 15, "Mid", 52).chapters).toHaveLength(7);
    expect(addChapter(DEFAULT_CHAPTERS, 11, "Too close", 52).error).toBeTruthy();
    expect(addChapter(DEFAULT_CHAPTERS, 60, "Past end", 52).error).toBeTruthy();
    expect(addChapter(DEFAULT_CHAPTERS, 15, "  ", 52).error).toBeTruthy();
    expect(DEFAULT_CHAPTERS).toEqual(before);
  });

  test("first chapter can't be removed", () => {
    expect(removeChapter(DEFAULT_CHAPTERS, 0)).toHaveLength(6);
    expect(removeChapter(DEFAULT_CHAPTERS, 10)).toHaveLength(5);
  });

  test("parseChapters accepts YouTube-style text and enforces its rules", () => {
    const ok = parseChapters("0:00 Intro\n00:10 - Gameplay\n1:05 | Finale");
    expect(ok.chapters).toHaveLength(3);
    expect(ok.chapters[2].start).toBe(65);
    expect(parseChapters("0:05 A\n0:20 B").error).toBeTruthy(); // must start at 0:00
    expect(parseChapters("0:00 A").error).toBeTruthy(); // needs 2+
    expect(parseChapters("0:00 A\n0:01 B").error).toBeTruthy(); // too close
  });
});
