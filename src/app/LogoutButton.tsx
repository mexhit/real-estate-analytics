"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
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
      sx={{ textTransform: "none", borderRadius: 2 }}
    >
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
