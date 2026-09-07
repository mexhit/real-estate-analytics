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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import { isAxiosError } from "axios";
import { areasApi, type Area } from "@/api/areas";
import { jobsApi, type AreaPriceSnapshotJobResult } from "@/api/jobs";
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

  const [editingArea, setEditingArea] = React.useState<Area | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [deletingArea, setDeletingArea] = React.useState<Area | null>(null);
  const [reassignToAreaId, setReassignToAreaId] = React.useState<
    number | ""
  >("");
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [runningSnapshotJob, setRunningSnapshotJob] = React.useState(false);
  const [snapshotJobResult, setSnapshotJobResult] =
    React.useState<AreaPriceSnapshotJobResult | null>(null);
  const [snapshotJobError, setSnapshotJobError] = React.useState<
    string | null
  >(null);

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

  const openEditDialog = (area: Area) => {
    setEditingArea(area);
    setEditName(area.name);
    setEditError(null);
  };

  const closeEditDialog = () => {
    if (editing) {
      return;
    }
    setEditingArea(null);
  };

  const handleEditArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingArea) {
      return;
    }
    setEditError(null);
    setEditing(true);

    try {
      await areasApi.updateArea(editingArea.id, editName);
      setEditingArea(null);
      await fetchAreas();
    } catch (err) {
      setEditError(extractErrorMessage(err, "Failed to update area"));
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (area: Area) => {
    setDeletingArea(area);
    setReassignToAreaId("");
    setDeleteError(null);
  };

  const closeDeleteDialog = () => {
    if (deleting) {
      return;
    }
    setDeletingArea(null);
  };

  const handleDeleteArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deletingArea || reassignToAreaId === "") {
      return;
    }
    setDeleteError(null);
    setDeleting(true);

    try {
      await areasApi.deleteArea(deletingArea.id, reassignToAreaId);
      setDeletingArea(null);
      await fetchAreas();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "Failed to delete area"));
    } finally {
      setDeleting(false);
    }
  };

  const handleRunSnapshotJob = async () => {
    setSnapshotJobError(null);
    setRunningSnapshotJob(true);

    try {
      setSnapshotJobResult(await jobsApi.runAreaPriceSnapshot());
    } catch (err) {
      setSnapshotJobError(
        extractErrorMessage(err, "Failed to run price snapshot job"),
      );
    } finally {
      setRunningSnapshotJob(false);
    }
  };

  const reassignOptions = deletingArea
    ? areas.filter((area) => area.id !== deletingArea.id)
    : [];

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
          <Button component={Link} href="/settings" variant="outlined">
            Settings
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
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
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
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Edit area ${area.name}`}
                        size="small"
                        onClick={() => openEditDialog(area)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete area ${area.name}`}
                        size="small"
                        onClick={() => openDeleteDialog(area)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fff",
          mt: 3,
          p: 2,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Area Price Snapshot Job
          </Typography>
          <Button
            variant="outlined"
            onClick={handleRunSnapshotJob}
            disabled={runningSnapshotJob}
          >
            {runningSnapshotJob ? "Running..." : "Run now"}
          </Button>
        </Box>

        {snapshotJobError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {snapshotJobError}
          </Alert>
        )}

        {snapshotJobResult && snapshotJobResult.status === "skipped" && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Skipped: {snapshotJobResult.reason}
          </Alert>
        )}

        {snapshotJobResult && snapshotJobResult.status === "completed" && (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Area</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Properties
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Excluded
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {snapshotJobResult.areas.map((areaResult) => (
                  <TableRow key={areaResult.areaId} hover>
                    <TableCell>{areaResult.areaName}</TableCell>
                    <TableCell align="right">
                      {areaResult.propertyCount ?? "—"}
                    </TableCell>
                    <TableCell align="right">
                      {areaResult.excludedCount ?? "—"}
                    </TableCell>
                    <TableCell>
                      {areaResult.error && (
                        <Typography color="error" variant="body2">
                          {areaResult.error}
                        </Typography>
                      )}
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

      <Dialog
        open={editingArea !== null}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={handleEditArea}>
          <DialogTitle>Edit Area</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              {editError && <Alert severity="error">{editError}</Alert>}
              <TextField
                label="Name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
                fullWidth
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeEditDialog} disabled={editing}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editing || !editName.trim()}
            >
              {editing ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={deletingArea !== null}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={handleDeleteArea}>
          <DialogTitle>Delete Area</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              {deleteError && <Alert severity="error">{deleteError}</Alert>}
              <Typography>
                Are you sure you want to delete &ldquo;{deletingArea?.name}
                &rdquo;? Any properties assigned to it will be moved to the
                area you choose below.
              </Typography>
              {reassignOptions.length === 0 ? (
                <Alert severity="warning">
                  There&apos;s no other area to reassign properties to.
                  Create another area first.
                </Alert>
              ) : (
                <FormControl fullWidth required>
                  <InputLabel id="reassign-to-area-label">
                    Reassign properties to
                  </InputLabel>
                  <Select
                    labelId="reassign-to-area-label"
                    label="Reassign properties to"
                    value={reassignToAreaId}
                    onChange={(event) =>
                      setReassignToAreaId(event.target.value as number)
                    }
                  >
                    {reassignOptions.map((area) => (
                      <MenuItem key={area.id} value={area.id}>
                        {area.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="error"
              variant="contained"
              disabled={deleting || reassignToAreaId === ""}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
