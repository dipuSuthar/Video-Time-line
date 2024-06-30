import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import Slider from "@mui/material/Slider";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Timeline from "./Timeline";
import "./video.css";

const Video = () => {
  const playerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isVideoComplete, setIsVideoComplete] = useState(false);
  const [indexOf, setIndexOf] = useState(0);
  const steps = [
    { label: "Introduction", timeDuration: "00:00:00" },
    { label: "Gameplay Mechanics", timeDuration: "00:00:10" },
    { label: "Character Introductions", timeDuration: "00:00:20" },
    { label: "Boss Battles", timeDuration: "00:00:30" },
    { label: "World Exploration", timeDuration: "00:00:40" },
    { label: "Conclusion", timeDuration: "00:00:50" },
  ];

  const convertTimeToSeconds = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
  };

  const findIndexByTimeDuration = (time) => {
    return steps.findIndex((step) => step.timeDuration === time);
  };

  useEffect(() => {
    const handleProgress = ({ playedSeconds }) => {
      if (
        playedSeconds !== undefined &&
        playerRef.current.getDuration() !== undefined
      ) {
        const progressPercentage =
          (playedSeconds / playerRef.current.getDuration()) * 100;
        setProgress(progressPercentage);
      }
    };

    let currentRef = playerRef.current;

    if (currentRef) {
      currentRef.onProgress = handleProgress;
    }

    return () => {
      if (currentRef) {
        currentRef.onProgress = null;
      }
    };
  }, [playerRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getDuration()) {
        const playedSeconds = playerRef.current.getCurrentTime();
        if (!isVideoComplete) {
          if (playedSeconds >= playerRef.current.getDuration()) {
            handlePlayPause();
            setProgress(0);
            setIsVideoComplete(true);
          } else if (isPlaying) {
            setProgress(playedSeconds);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isVideoComplete]);

  const handlePlayerReady = () => {
    const duration = playerRef.current.getDuration();
    setTotalDuration(duration);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteUnmute = () => {
    setIsMuted(!isMuted);
  };

  const handleSliderChange = (timeString) => {
    console.log("Time string:", convertTimeToSeconds(timeString));
    const time = convertTimeToSeconds(timeString);
    const seekTo = (time / 100) * playerRef.current.getDuration();
    console.log("Seek to (seconds):", seekTo);

    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      console.log("Video duration:", duration);
      if (seekTo <= duration) {
        playerRef.current.seekTo(seekTo, "seconds");
        console.log("Seek to percentage:", (seekTo / duration) * 100);
        setProgress((seekTo / duration) * 100);
      } else {
        console.warn("Seek time exceeds video duration.");
      }
    }
  };

  const handleSlider = (event, newValue) => {
    console.log(newValue);
    if (playerRef.current) {
      const secondToFormat = formatTime(newValue);
      console.log(secondToFormat);
      const findIndex = findIndexByTimeDuration(secondToFormat);
      const seekTo = (newValue / 100) * playerRef.current.getDuration();
      playerRef.current.seekTo(seekTo, "seconds");
      setProgress(newValue);
      setIndexOf(findIndex);
    }
  };

  const handleFullScreenToggle = () => {
    const videoElement = document.getElementById("video-container");
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen();
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  return (
    <Grid container>
      <Grid item sm={12} md={4}>
        <Timeline
          steps={steps}
          handleSliderChange={handleSliderChange}
          index={indexOf}
        />
      </Grid>
      <Grid item sm={12} md={8}>
        <div id="video-container" className={isFullScreen ? "fullscreen" : ""}>
          <div style={{ position: "relative", background: "#000" }}>
            <ReactPlayer
              ref={playerRef}
              url="https://media.w3.org/2010/05/sintel/trailer.mp4"
              width="100%"
              height={isFullScreen ? "100%" : "auto"}
              playing={isPlaying}
              muted={isMuted}
              onReady={handlePlayerReady}
              controls={false}
            />
            <div className="video-footer">
              <div
                style={{
                  position: "absolute",
                  bottom: isFullScreen ? "150px" : "45px",
                  left: isFullScreen ? "10px" : "",
                }}
              >
                <IconButton
                  sx={{ color: "#bdbdbd", fontSize: "35px" }}
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: isFullScreen ? "150px" : "45px",
                  right: "10px",
                }}
              >
                <IconButton
                  sx={{ color: "#bdbdbd", fontSize: "25px" }}
                  onClick={handleMuteUnmute}
                >
                  {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                </IconButton>
                <IconButton
                  style={{ color: "#bdbdbd" }}
                  onClick={handleFullScreenToggle}
                >
                  {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </div>

              <Slider
                sx={{
                  bottom: isFullScreen ? "100px" : "5px",
                  //   : isFullScreen
                  //   ? "45px"
                  //   : "25px",
                  left: "40%",
                  transform: "translateX(-50%)",
                  width: "80%",
                  color: "#bdbdbd",
                  height: "5px",
                  "& .MuiSlider-rail": { opacity: 0.58 },
                  "& .MuiSlider-markLabel": { color: "#fff", fontSize: "9px" },
                }}
                size="small"
                track="normal"
                max={totalDuration}
                marks={steps.map((chapter, index) => ({
                  value: convertTimeToSeconds(chapter.timeDuration),
                  label: (
                    <Tooltip
                      title={`${chapter.label} - ${chapter.timeDuration}`}
                      arrow
                    >
                      <span
                        className="mark-container"
                        style={{
                          cursor: "pointer",
                          position: "absolute",
                          bottom: !(index % 2) ? "30px" : "",
                          left: "50%",
                          transform: "translateX(-50%)",
                        }}
                      >
                        <span>
                          {chapter.label.includes(" ")
                            ? chapter.label.split(" ").map((word, i) => (
                                <React.Fragment key={i}>
                                  {word}
                                  <br />
                                </React.Fragment>
                              ))
                            : chapter.label}
                        </span>
                      </span>
                    </Tooltip>
                  ),
                }))}
                value={progress}
                onChange={handleSlider}
              />
              <div
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: -2,
                  color: "green",
                }}
              >
                <Typography
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    letterSpacing: 0.2,
                    color: "#fff",
                    position: "absolute",
                    bottom: isFullScreen ? "100px" : "20px",
                    left: isFullScreen ? "100px" : "10px",
                  }}
                >
                  {formatTime(progress)}
                </Typography>
                <Typography
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    letterSpacing: 0.2,
                    color: "#fff",
                    position: "absolute",
                    bottom: isFullScreen ? "100px" : "20px",
                    right: isFullScreen ? "100px" : "10px",
                  }}
                >
                  {formatTime(totalDuration)}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </Grid>
    </Grid>
  );
};

export default Video;
