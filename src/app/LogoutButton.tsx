"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { authApi } from "@/api/auth";
import { clearAuthToken } from "@/api/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await authApi.logout();
    } finally {
      clearAuthToken();
      router.replace("/login");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      disabled={loading}
      aria-label="Logout"
      sx={{
        textTransform: "none",
        borderRadius: 2,
        flexShrink: 0,
        minWidth: { xs: 44, sm: 64 },
        minHeight: { xs: 44, sm: 0 },
        px: { xs: 0, sm: 1.25 },
        "& .MuiButton-startIcon": {
          mr: { xs: 0, sm: 1 },
          ml: { xs: 0, sm: -0.5 },
        },
      }}
    >
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        {loading ? "Logging out..." : "Logout"}
      </Box>
    </Button>
  );
}
