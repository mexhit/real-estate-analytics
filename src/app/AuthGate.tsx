"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { getAuthToken } from "@/api/client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const hasToken = Boolean(getAuthToken());

    if (!hasToken && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (hasToken && pathname === "/login") {
      router.replace("/");
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return children;
}
