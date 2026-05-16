"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Today, TrendingDown, TrendingUp } from "@mui/icons-material";
import dayjs from "dayjs";
import { propertiesApi } from "@/api/properties";
import { LogoutButton } from "@/app/LogoutButton";

interface Product {
  id: number;
  providerId: string;
  title: string;
  description: string;
  price: number;
  url: string;
  createdAt: number;
  firstPrice: string;
  lastPrice: string;
}

interface DashboardMetric {
  label: string;
  value: string;
  accent: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [todayPostedTotal, setTodayPostedTotal] = React.useState(0);
  const [todayPriceChangedTotal, setTodayPriceChangedTotal] = React.useState(0);
  const [todayPriceChangedProperties, setTodayPriceChangedProperties] =
    React.useState<Product[]>([]);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      const todayStart = dayjs().startOf("day").valueOf();
      const todayEnd = dayjs().endOf("day").valueOf();

      try {
        setLoading(true);
        const [todayRes, todayPriceChangedRes] = await Promise.all([
          propertiesApi.getPaginatedProperties({
            limit: 1,
            page: 1,
            fromDate: todayStart,
            toDate: todayEnd,
          }),
          propertiesApi.getPaginatedProperties({
            limit: 8,
            page: 1,
            fromDate: todayStart,
            toDate: todayEnd,
            onlyPriceChanged: true,
          }),
        ]);

        setTodayPostedTotal(todayRes.total);
        setTodayPriceChangedTotal(todayPriceChangedRes.total);
        setTodayPriceChangedProperties(todayPriceChangedRes.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  function formatDate(date: number | string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "-";

    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);

    return `${formatted} €`;
  }

  function parsePriceToNumber(price: string | null | undefined): number | null {
    if (!price) return null;

    const numeric = price.replace(/[^\d]/g, "");

    if (!numeric) return null;

    return Number(numeric);
  }

  const todayPriceChangedWithDiff = todayPriceChangedProperties.map((p) => {
    const firstPriceNum = parsePriceToNumber(p.firstPrice);
    const lastPriceNum = parsePriceToNumber(p.lastPrice);

    if (firstPriceNum != null && lastPriceNum != null) {
      if (lastPriceNum > firstPriceNum) {
        return {
          ...p,
          priceChangeType: "increased" as const,
          priceDiff: lastPriceNum - firstPriceNum,
        };
      }

      if (lastPriceNum < firstPriceNum) {
        return {
          ...p,
          priceChangeType: "decreased" as const,
          priceDiff: firstPriceNum - lastPriceNum,
        };
      }
    }

    return {
      ...p,
      priceChangeType: "unchanged" as const,
      priceDiff: 0,
    };
  });

  const dashboardMetrics: DashboardMetric[] = [
    {
      label: "Posted today",
      value: String(todayPostedTotal),
      accent: "#0f766e",
    },
    {
      label: "Price changes today",
      value: String(todayPriceChangedTotal),
      accent: "#b45309",
    },
    {
      label: "Change rate",
      value:
        todayPostedTotal > 0
          ? `${Math.round((todayPriceChangedTotal / todayPostedTotal) * 100)}%`
          : "0%",
      accent: "#2563eb",
    },
  ];

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      p={{ xs: 2, md: 3 }}
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 44%, #f8fafc 100%)",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        mb={2}
        flexWrap="wrap"
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Property Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Track today&apos;s new listings and price movement in one view.
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Button component={Link} href="/properties" variant="outlined">
            Properties
          </Button>
          <LogoutButton />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(12, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 7" } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
              height: "100%",
            }}
          >
            {dashboardMetrics.map((metric) => (
              <Paper
                key={metric.label}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid rgba(148, 163, 184, 0.22)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  minHeight: 132,
                }}
              >
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {metric.label}
                </Typography>
                {loading ? (
                  <CircularProgress size={22} />
                ) : (
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    sx={{ color: metric.accent, lineHeight: 1.1 }}
                  >
                    {metric.value}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: "1 / -1", md: "span 5" },
            p: 2.5,
            borderRadius: 2,
            border: "1px solid rgba(148, 163, 184, 0.22)",
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 132,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Today sx={{ color: "#60a5fa" }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Today&apos;s focus
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Review today&apos;s properties with price movement, then jump to
              the full list.
            </Typography>
          </Box>
          <Box
            mt={2}
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
            gap={2}
            flexWrap="wrap"
          >
            <Typography variant="h4" fontWeight={700}>
              {loading ? "..." : todayPriceChangedTotal}
            </Typography>
            <Button
              component={Link}
              href="/properties"
              variant="contained"
              sx={{
                backgroundColor: "#2563eb",
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Open properties
            </Button>
          </Box>
        </Paper>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148, 163, 184, 0.22)",
          backgroundColor: "rgba(255,255,255,0.9)",
          overflow: "hidden",
        }}
      >
        <Box
          px={2.5}
          py={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Price changes in today&apos;s posts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Listings first posted today where the latest price differs from the
              first captured price.
            </Typography>
          </Box>
          <Chip
            label={loading ? "Loading..." : `${todayPriceChangedTotal} tracked today`}
            sx={{ borderRadius: 2 }}
          />
        </Box>

        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        ) : todayPriceChangedWithDiff.length === 0 ? (
          <Box px={2.5} py={3}>
            <Typography color="text.secondary">
              No price changes detected on properties posted today.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Property</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    First price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    Latest price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    Change
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>
                    Posted
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayPriceChangedWithDiff.map((property) => (
                  <TableRow key={`today-${property.id}`} hover>
                    <TableCell sx={{ minWidth: 320 }}>
                      <Typography fontWeight={600} noWrap>
                        {property.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {property.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{property.firstPrice || "-"}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {property.lastPrice || property.price}
                    </TableCell>
                    <TableCell>
                      {property.priceChangeType === "decreased" ? (
                        <Chip
                          icon={<TrendingDown />}
                          label={`-${formatPrice(property.priceDiff)}`}
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<TrendingUp />}
                          label={`+${formatPrice(property.priceDiff)}`}
                          color="error"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell color="text.secondary">
                      {formatDate(property.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
