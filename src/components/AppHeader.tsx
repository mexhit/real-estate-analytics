"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  Typography,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { LogoutButton } from "@/app/LogoutButton";

export const WARM_BG = "#f4f2ee";
export const BORDER = "#e4e0d8";
export const ACCENT = "#0f6b57";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: <DashboardOutlinedIcon /> },
  { label: "Properties", href: "/properties", icon: <ApartmentOutlinedIcon /> },
  { label: "Areas", href: "/areas", icon: <LocationOnOutlinedIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsOutlinedIcon /> },
];

export function AppHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const activeHref = NAV_ITEMS.find((item) => isActive(item.href))?.href;

  return (
    <>
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.5, sm: 3 },
          px: { xs: 2, sm: 3 },
          py: 1.5,
          bgcolor: "#fff",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1.25}
          sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 0 }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 2,
              bgcolor: ACCENT,
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <HomeOutlinedIcon fontSize="small" />
          </Box>
          <Typography fontWeight={700} noWrap>
            Listings Monitor
          </Typography>
        </Box>
        <Box
          component="nav"
          aria-label="Primary"
          sx={{ display: { xs: "none", sm: "flex" }, gap: 0.5, flexGrow: 1 }}
        >
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

      <Paper
        component="nav"
        aria-label="Primary"
        className="mobile-bottom-nav"
        elevation={0}
        square
        sx={{
          display: { xs: "block", sm: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          borderTop: `1px solid ${BORDER}`,
          pb: "env(safe-area-inset-bottom)",
          bgcolor: "#fff",
        }}
      >
        <BottomNavigation showLabels value={activeHref ?? false}>
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.href}
              component={Link}
              href={item.href}
              value={item.href}
              label={item.label}
              icon={item.icon}
              sx={{
                minWidth: 0,
                "&.Mui-selected": { color: ACCENT },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
}
