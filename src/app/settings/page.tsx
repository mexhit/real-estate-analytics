"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { isAxiosError } from "axios";
import {
  AI_PROVIDERS,
  settingsApi,
  type AiProviderType,
} from "@/api/settings";
import { LogoutButton } from "@/app/LogoutButton";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
}

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [aiProvider, setAiProvider] = React.useState<AiProviderType | "">("");

  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    const fetchAiProvider = async () => {
      try {
        setLoading(true);
        const { aiProvider } = await settingsApi.getAiProvider();
        setAiProvider(aiProvider);
      } catch (err) {
        setLoadError(extractErrorMessage(err, "Failed to load AI Provider"));
      } finally {
        setLoading(false);
      }
    };

    void fetchAiProvider();
  }, []);

  const handleSave = async () => {
    if (!aiProvider) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await settingsApi.updateAiProvider(aiProvider);
      setAiProvider(updated.aiProvider);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(extractErrorMessage(err, "Failed to update AI Provider"));
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {loadError}</Typography>
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
          Settings
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button component={Link} href="/" variant="outlined">
            Dashboard
          </Button>
          <Button component={Link} href="/properties" variant="outlined">
            Properties
          </Button>
          <Button component={Link} href="/areas" variant="outlined">
            Areas
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
          p: 3,
          maxWidth: 480,
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={0.5}>
          AI Provider
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          The external AI service used for property metadata extraction and
          Area resolution. Switching takes effect immediately for new
          extraction work.
        </Typography>

        {loading ? (
          <Box textAlign="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {saveSuccess && (
              <Alert severity="success" onClose={() => setSaveSuccess(false)}>
                AI Provider updated to {aiProvider}.
              </Alert>
            )}
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <FormControl fullWidth size="small">
              <InputLabel id="ai-provider-label">AI Provider</InputLabel>
              <Select
                labelId="ai-provider-label"
                label="AI Provider"
                value={aiProvider}
                onChange={(event) => {
                  setAiProvider(event.target.value as AiProviderType);
                  setSaveSuccess(false);
                  setSaveError(null);
                }}
              >
                {AI_PROVIDERS.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || !aiProvider}
                sx={{ textTransform: "none" }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
