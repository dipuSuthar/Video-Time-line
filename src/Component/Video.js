import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player"; // use react-player@2.x
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Snackbar from "@mui/material/Snackbar";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import LinkIcon from "@mui/icons-material/Link";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SpeedIcon from "@mui/icons-material/Speed";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import ProgressBar from "./ProgressBar";
import Timeline from "./Timeline";
import useLocalStorage, { saveJSON, loadJSON } from "./useLocalStorage";
import {
  DEFAULT_CHAPTERS,
  addChapter,
  clamp,
  formatTime,
  getActiveChapterIndex,
  parseChapters,
  removeChapter,
} from "./utils";
import "./video.css";

const VIDEO_URL = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const STORAGE = {
  chapters: `vt:chapters:${VIDEO_URL}`,
  progress: `vt:progress:${VIDEO_URL}`,
};

const Video = () => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const lastSaved = useRef(0);
  const initialized = useRef(false);

  const [storedChapters, setStoredChapters] = useLocalStorage(
    STORAGE.chapters,
    DEFAULT_CHAPTERS
  );
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0); // seconds, the single source of truth
  const [buffered, setBuffered] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateAnchor, setRateAnchor] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [toast, setToast] = useState("");

  // Guard against corrupted localStorage data.
  const chapters = useMemo(
    () =>
      Array.isArray(storedChapters) && storedChapters.length
        ? storedChapters
        : DEFAULT_CHAPTERS,
    [storedChapters]
  );
  // Ignore chapters that start after the video ends.
  const visibleChapters = useMemo(
    () => (duration ? chapters.filter((c) => c.start < duration) : chapters),
    [chapters, duration]
  );
  const activeIndex = getActiveChapterIndex(visibleChapters, currentTime);
  const activeChapter = visibleChapters[activeIndex];

  /* ---------- core actions ---------- */

  const seek = useCallback(
    (time) => {
      if (!playerRef.current || !duration) return;
      const target = clamp(time, 0, duration);
      playerRef.current.seekTo(target, "seconds");
      setCurrentTime(target);
      setEnded(false);
    },
    [duration]
  );

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const togglePlay = useCallback(() => {
    revealControls();
    if (ended) {
      seek(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [ended, seek, revealControls]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen?.();
  }, []);

  const goToChapter = useCallback(
    (delta) => {
      if (!visibleChapters.length) return;
      let target = activeIndex + delta;
      // Like YouTube: "previous" restarts the current chapter first.
      if (delta < 0 && currentTime - visibleChapters[activeIndex].start > 3) {
        target = activeIndex;
      }
      target = clamp(target, 0, visibleChapters.length - 1);
      seek(visibleChapters[target].start);
    },
    [visibleChapters, activeIndex, currentTime, seek]
  );

  /* ---------- player events ---------- */

  const handleReady = () => {
    if (initialized.current) return;
    initialized.current = true;
    const total = playerRef.current.getDuration();
    // Priority: ?t=90 share link, then last watched position.
    const fromLink = Number(new URLSearchParams(window.location.search).get("t"));
    const saved = Number(loadJSON(STORAGE.progress, 0));
    const start = fromLink > 0 ? fromLink : saved;
    if (start > 1 && start < total - 2) {
      playerRef.current.seekTo(start, "seconds");
      setCurrentTime(start);
    }
  };

  const handleProgress = ({ playedSeconds, loadedSeconds }) => {
    setCurrentTime(playedSeconds);
    setBuffered(loadedSeconds);
    const now = Date.now();
    if (now - lastSaved.current > 2000) {
      saveJSON(STORAGE.progress, playedSeconds);
      lastSaved.current = now;
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setEnded(true);
    setControlsVisible(true);
    saveJSON(STORAGE.progress, 0);
  };

  useEffect(() => {
    const onChange = () =>
      setIsFullScreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ---------- keyboard shortcuts ---------- */

  const handleKeyDown = (e) => {
    const tag = e.target.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    revealControls();

    switch (e.key) {
      case " ":
        if (tag === "BUTTON") return; // let the button handle its own click
        e.preventDefault();
        togglePlay();
        break;
      case "k":
      case "K":
        togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        seek(currentTime - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        seek(currentTime + 5);
        break;
      case "ArrowUp":
        e.preventDefault();
        setMuted(false);
        setVolume((v) => clamp(v + 0.05, 0, 1));
        break;
      case "ArrowDown":
        e.preventDefault();
        setVolume((v) => clamp(v - 0.05, 0, 1));
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "n":
      case "N":
        goToChapter(1);
        break;
      case "p":
      case "P":
        goToChapter(-1);
        break;
      default:
        // 0-9 jumps to 0%-90% of the video
        if (/^[0-9]$/.test(e.key)) seek((Number(e.key) / 10) * duration);
    }
  };

  /* ---------- chapter editing (called by Timeline) ---------- */

  const handleAddChapter = (label) => {
    const result = addChapter(chapters, currentTime, label, duration);
    if (result.error) return result.error;
    setStoredChapters(result.chapters);
    return null;
  };

  const handleImportChapters = (text) => {
    const result = parseChapters(text);
    if (result.error) return result.error;
    setStoredChapters(result.chapters);
    return null;
  };

  const handleRemoveChapter = (start) =>
    setStoredChapters((prev) => removeChapter(prev, start));

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?t=${Math.floor(
      currentTime
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast(`Link copied. Opens at ${formatTime(currentTime)}`);
    } catch {
      setToast(url);
    }
  };

  /* ---------- render ---------- */

  const showControls = controlsVisible || !playing || Boolean(rateAnchor);
  const effectiveMuted = muted || volume === 0;

  return (
    <Grid container spacing={2} sx={{ p: { xs: 1, md: 2 } }}>
      <Grid item xs={12} md={8}>
        <div
          ref={containerRef}
          className="vt-container"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseMove={revealControls}
          onMouseLeave={() => playing && setControlsVisible(false)}
        >
          <div className={`vt-stage ${playing && !showControls ? "hide-cursor" : ""}`}>
            <ReactPlayer
              ref={playerRef}
              url={VIDEO_URL}
              width="100%"
              height="100%"
              controls={false}
              playsinline
              playing={playing}
              muted={effectiveMuted}
              volume={volume}
              playbackRate={rate}
              progressInterval={250}
              onReady={handleReady}
              onDuration={setDuration}
              onProgress={handleProgress}
              onEnded={handleEnded}
              onBuffer={() => setBuffering(true)}
              onBufferEnd={() => setBuffering(false)}
              onError={() => setError(true)}
            />

            {/* Click anywhere on the video to play/pause, double-click for fullscreen */}
            <div
              className="vt-click-layer"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />

            <div className="vt-center">
              {error && <span className="vt-error">Video failed to load.</span>}
              {!error && buffering && <CircularProgress sx={{ color: "#fff" }} />}
              {!error && !buffering && ended && (
                <ReplayIcon sx={{ color: "#fff", fontSize: 64 }} />
              )}
            </div>

            <div className={`vt-controls ${showControls ? "" : "hidden"}`}>
              <ProgressBar
                chapters={visibleChapters}
                duration={duration}
                currentTime={currentTime}
                buffered={buffered}
                onSeek={seek}
              />

              <div className="vt-row">
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={() => goToChapter(-1)}
                  aria-label="Previous chapter"
                  title="Previous chapter (P)"
                >
                  <SkipPreviousIcon />
                </IconButton>
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  title={playing ? "Pause (K)" : "Play (K)"}
                >
                  {ended ? <ReplayIcon /> : playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={() => goToChapter(1)}
                  aria-label="Next chapter"
                  title="Next chapter (N)"
                >
                  <SkipNextIcon />
                </IconButton>

                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={toggleMute}
                  aria-label={effectiveMuted ? "Unmute" : "Mute"}
                  title="Mute (M)"
                >
                  {effectiveMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Slider
                  className="vt-volume"
                  size="small"
                  min={0}
                  max={1}
                  step={0.05}
                  value={effectiveMuted ? 0 : volume}
                  onChange={(_, v) => {
                    setVolume(v);
                    setMuted(false);
                  }}
                  aria-label="Volume"
                  sx={{ color: "#fff" }}
                />

                <span className="vt-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                {activeChapter && (
                  <span className="vt-chapter-name">{activeChapter.label}</span>
                )}

                <span className="vt-spacer" />

                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={copyShareLink}
                  aria-label="Copy link at current time"
                  title="Copy link at this time"
                >
                  <LinkIcon />
                </IconButton>
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={(e) => setRateAnchor(e.currentTarget)}
                  aria-label="Playback speed"
                  title="Playback speed"
                >
                  <SpeedIcon />
                </IconButton>
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={toggleFullscreen}
                  aria-label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                  title="Fullscreen (F)"
                >
                  {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </div>
            </div>
          </div>

          {/* container => the menu stays visible while in fullscreen */}
          <Menu
            anchorEl={rateAnchor}
            open={Boolean(rateAnchor)}
            onClose={() => setRateAnchor(null)}
            container={() => containerRef.current}
          >
            {RATES.map((r) => (
              <MenuItem
                key={r}
                selected={r === rate}
                onClick={() => {
                  setRate(r);
                  setRateAnchor(null);
                }}
              >
                {r === 1 ? "Normal" : `${r}x`}
              </MenuItem>
            ))}
          </Menu>
        </div>

        <p className="vt-hint">
          Shortcuts: Space/K play, ←/→ ±5s, ↑/↓ volume, M mute, F fullscreen, N/P
          next/previous chapter, 0-9 jump to %.
        </p>
      </Grid>

      <Grid item xs={12} md={4}>
        <Timeline
          chapters={visibleChapters}
          activeIndex={activeIndex}
          currentTime={currentTime}
          duration={duration}
          onSelect={seek}
          onAdd={handleAddChapter}
          onRemove={handleRemoveChapter}
          onImport={handleImportChapters}
          onReset={() => setStoredChapters(DEFAULT_CHAPTERS)}
        />
      </Grid>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2500}
        onClose={() => setToast("")}
        message={toast}
      />
    </Grid>
  );
};

export default Video;
