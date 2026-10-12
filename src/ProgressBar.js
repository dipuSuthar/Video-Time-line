import React, { useCallback, useRef, useState } from "react";
import { buildSegments, clamp, formatTime, getActiveChapterIndex } from "./utils";

/**
 * YouTube-style segmented progress bar.
 * - one segment per chapter (width proportional to its length)
 * - buffered + played fill per segment
 * - hover preview (time + chapter title)
 * - drag to scrub using Pointer Events (works for mouse, touch and pen)
 */
const ProgressBar = ({ chapters, duration, currentTime, buffered, onSeek }) => {
  const barRef = useRef(null);
  const [hover, setHover] = useState(null); // { ratio, time }
  const [scrubTime, setScrubTime] = useState(null); // number while dragging

  const scrubbing = scrubTime !== null;
  const shownTime = scrubbing ? scrubTime : currentTime;
  const segments = buildSegments(chapters, duration);

  const readPointer = useCallback(
    (event) => {
      const rect = barRef.current.getBoundingClientRect();
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      return { ratio, time: ratio * duration };
    },
    [duration]
  );

  const handlePointerDown = (event) => {
    if (!duration) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setScrubTime(readPointer(event).time);
  };

  const handlePointerMove = (event) => {
    if (!duration) return;
    const pointer = readPointer(event);
    setHover(pointer);
    if (scrubbing) setScrubTime(pointer.time);
  };

  const handlePointerUp = (event) => {
    if (!scrubbing) return;
    onSeek(readPointer(event).time);
    setScrubTime(null);
  };

  const hoverChapter = hover
    ? chapters[getActiveChapterIndex(chapters, hover.time)]
    : null;

  return (
    <div
      ref={barRef}
      className={`pb ${scrubbing ? "scrubbing" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(shownTime)}
      aria-valuetext={`${formatTime(shownTime)} of ${formatTime(duration)}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setScrubTime(null)}
      onPointerLeave={() => setHover(null)}
    >
      <div className="pb-track">
        {segments.map((seg) => {
          const length = seg.end - seg.start;
          const played = clamp((shownTime - seg.start) / length, 0, 1) * 100;
          const loaded = clamp((buffered - seg.start) / length, 0, 1) * 100;
          return (
            <div
              key={seg.start}
              className="pb-seg"
              style={{ flexGrow: length, flexBasis: 0 }}
            >
              <div className="pb-buffer" style={{ width: `${loaded}%` }} />
              <div className="pb-played" style={{ width: `${played}%` }} />
            </div>
          );
        })}
      </div>

      {duration > 0 && (
        <div
          className="pb-thumb"
          style={{ left: `${(shownTime / duration) * 100}%` }}
        />
      )}

      {hover && (
        <div
          className="pb-tip"
          style={{ left: `${clamp(hover.ratio * 100, 8, 92)}%` }}
        >
          {hoverChapter && <div>{hoverChapter.label}</div>}
          <strong>{formatTime(hover.time)}</strong>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProgressBar);
