"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs";
import { isAxiosError } from "axios";
import { areasApi, type Area } from "@/api/areas";
import { LogoutButton } from "@/app/LogoutButton";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
}

export default function AreasPage() {
  const [areas, setAreas] = React.useState<Area[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newAreaName, setNewAreaName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const fetchAreas = React.useCallback(async () => {
    try {
      setLoading(true);
      setAreas(await areasApi.getAreas());
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load areas"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchAreas();
  }, [fetchAreas]);

  const openDialog = () => {
    setNewAreaName("");
    setCreateError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (creating) {
      return;
    }
    setDialogOpen(false);
  };

  const handleCreateArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await areasApi.createArea(newAreaName);
      setDialogOpen(false);
      await fetchAreas();
    } catch (err) {
      setCreateError(extractErrorMessage(err, "Failed to create area"));
    } finally {
      setCreating(false);
    }
  };

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Areas
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button component={Link} href="/" variant="outlined">
            Dashboard
          </Button>
          <Button component={Link} href="/properties" variant="outlined">
            Properties
          </Button>
          <LogoutButton />
        </Box>
      </Box>

      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fff",
        }}
      >
        <Box display="flex" justifyContent="flex-end" p={2} pb={loading || areas.length === 0 ? 2 : 0}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openDialog}
            sx={{ textTransform: "none" }}
          >
            Add Area
          </Button>
        </Box>

        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress />
          </Box>
        ) : areas.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">No Areas</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id} hover>
                    <TableCell>{area.name}</TableCell>
                    <TableCell>{area.key}</TableCell>
                    <TableCell>
                      {dayjs(area.createdAt).format("DD MMM YYYY")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreateArea}>
          <DialogTitle>Add Area</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              {createError && <Alert severity="error">{createError}</Alert>}
              <TextField
                label="Name"
                value={newAreaName}
                onChange={(event) => setNewAreaName(event.target.value)}
                required
                fullWidth
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={creating}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating || !newAreaName.trim()}
            >
              {creating ? "Adding..." : "Add"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
