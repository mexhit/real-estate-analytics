"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Typography } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { LogoutButton } from "@/app/LogoutButton";

export const WARM_BG = "#f4f2ee";
export const BORDER = "#e4e0d8";
export const ACCENT = "#0f6b57";

const NAV_ITEMS = [
  { label: "Properties", href: "/properties" },
  { label: "Dashboard", href: "/" },
  { label: "Areas", href: "/areas" },
  { label: "Settings", href: "/settings" },
];

export function AppHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        px: 3,
        py: 1.5,
        bgcolor: "#fff",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.25}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: ACCENT,
            color: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <HomeOutlinedIcon fontSize="small" />
        </Box>
        <Typography fontWeight={700}>Listings Monitor</Typography>
      </Box>
      <Box component="nav" display="flex" gap={0.5} flexGrow={1}>
        {NAV_ITEMS.map((item) => (
          <Box
            key={item.href}
            component={Link}
            href={item.href}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              fontSize: 15,
              fontWeight: isActive(item.href) ? 600 : 500,
              color: isActive(item.href) ? "#171717" : "#55524c",
              bgcolor: isActive(item.href) ? WARM_BG : "transparent",
              textDecoration: "none",
              "&:hover": { bgcolor: WARM_BG },
            }}
          >
            {item.label}
          </Box>
        ))}
      </Box>
      <LogoutButton />
    </Box>
  );
}
