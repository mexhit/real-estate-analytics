import * as React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Box p={3} textAlign="center">
      <CircularProgress />
      <Typography mt={2}>Loading properties...</Typography>
    </Box>
  );
}
