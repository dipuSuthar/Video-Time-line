import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Video from "./Video";

const App = () => (
  <>
    <CssBaseline />
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight={700} sx={{ px: { xs: 1, md: 2 } }}>
        Video Timeline
      </Typography>
      <Video />
    </Container>
  </>
);

export default App;
