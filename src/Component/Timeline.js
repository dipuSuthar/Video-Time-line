import React, { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { clamp, formatTime } from "./utils";

const Timeline = ({
  chapters,
  activeIndex,
  currentTime,
  duration,
  onSelect,
  onAdd,
  onRemove,
  onImport,
  onReset,
}) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState("");
  const [bulk, setBulk] = useState("");
  const [error, setError] = useState("");

  const submitAdd = () => {
    const problem = onAdd(label);
    setError(problem || "");
    if (!problem) setLabel("");
  };

  const submitImport = () => {
    const problem = onImport(bulk);
    setError(problem || "");
    if (!problem) setBulk("");
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 1.5,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Chapters ({chapters.length})
        </Typography>
        <Button size="small" onClick={() => setEditing((v) => !v)}>
          {editing ? "Done" : "Edit"}
        </Button>
      </Box>

      <List dense sx={{ maxHeight: 340, overflowY: "auto" }}>
        {chapters.map((chapter, i) => {
          const end = i < chapters.length - 1 ? chapters[i + 1].start : duration;
          const inChapter =
            i === activeIndex && end > chapter.start
              ? clamp(((currentTime - chapter.start) / (end - chapter.start)) * 100, 0, 100)
              : 0;
          return (
            <ListItem
              key={chapter.start}
              disablePadding
              secondaryAction={
                editing && i !== 0 ? (
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={`Delete chapter ${chapter.label}`}
                    onClick={() => onRemove(chapter.start)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                ) : null
              }
            >
              <ListItemButton
                selected={i === activeIndex}
                onClick={() => onSelect(chapter.start)}
                sx={{ display: "block", pr: editing ? 6 : 2 }}
              >
                <ListItemText
                  primary={`${i + 1}. ${chapter.label}`}
                  secondary={formatTime(chapter.start)}
                  primaryTypographyProps={{
                    fontWeight: i === activeIndex ? 600 : 400,
                  }}
                />
                {i === activeIndex && (
                  <LinearProgress
                    variant="determinate"
                    value={inChapter}
                    sx={{ mt: 0.5, height: 3, borderRadius: 2 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {editing && (
        <Box sx={{ p: 2, pt: 0, display: "grid", gap: 1.5 }}>
          {error && (
            <Alert severity="warning" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              label="New chapter title"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
            />
            <Button variant="contained" onClick={submitAdd} sx={{ whiteSpace: "nowrap" }}>
              Add at {formatTime(currentTime)}
            </Button>
          </Box>

          <TextField
            size="small"
            multiline
            minRows={3}
            label="Paste chapters (YouTube format)"
            placeholder={"0:00 Intro\n0:10 Gameplay\n0:20 Characters"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={submitImport} disabled={!bulk.trim()}>
              Import
            </Button>
            <Button color="inherit" onClick={onReset}>
              Reset to default
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Timeline;
