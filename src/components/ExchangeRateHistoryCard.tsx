"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ShowChart } from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import dayjs from "dayjs";
import {
  exchangeRatesApi,
  type RateCurrency,
  type RateHistory,
  type RateHistoryRange,
} from "@/api/exchange-rates";

const RANGE_LABELS: Record<RateHistoryRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Weekly",
};

const toggleSx = {
  textTransform: "none",
  color: "rgba(255,255,255,0.7)",
  borderColor: "rgba(148, 163, 184, 0.3)",
  "&.Mui-selected": {
    color: "#fff",
    backgroundColor: "rgba(37, 99, 235, 0.6)",
  },
} as const;

export function ExchangeRateHistoryCard() {
  const [currency, setCurrency] = React.useState<RateCurrency>("EUR");
  const [range, setRange] = React.useState<RateHistoryRange>("today");
  const [history, setHistory] = React.useState<RateHistory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    exchangeRatesApi
      .getHistory(currency, range)
      .then((result) => {
        if (!cancelled) setHistory(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currency, range]);

  const points = history?.points ?? [];
  const labelFormat = range === "week" ? "ddd D" : "HH:mm";

  return (
    <Paper
      elevation={0}
      sx={{
        gridColumn: { xs: "1 / -1", md: "span 8" },
        p: 2.5,
        borderRadius: 2,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        color: "#fff",
        minHeight: 132,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        mb={1.5}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ShowChart sx={{ color: "#60a5fa" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            {currency} / ALL sell rate
          </Typography>
        </Stack>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={currency}
          onChange={(_, value: RateCurrency | null) =>
            value && setCurrency(value)
          }
        >
          {(["EUR", "USD"] as const).map((value) => (
            <ToggleButton key={value} value={value} sx={toggleSx}>
              {value}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={range}
        onChange={(_, value: RateHistoryRange | null) =>
          value && setRange(value)
        }
        sx={{ mb: 1 }}
      >
        {(Object.keys(RANGE_LABELS) as RateHistoryRange[]).map((value) => (
          <ToggleButton key={value} value={value} sx={toggleSx}>
            {RANGE_LABELS[value]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : loading ? (
        <Skeleton variant="rounded" height={200} />
      ) : points.length === 0 ? (
        <Box
          height={200}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            No rates for this period
          </Typography>
        </Box>
      ) : (
        <LineChart
          height={240}
          dataset={points.map((point) => ({
            at: new Date(point.at),
            // The Rate Source's "buy" is the rate the user sells at.
            sell: point.buy,
          }))}
          xAxis={[
            {
              dataKey: "at",
              scaleType: "time",
              valueFormatter: (value: Date) => dayjs(value).format(labelFormat),
            },
          ]}
          yAxis={[
            {
              width: 56,
              valueFormatter: (v: number) => v.toFixed(2),
              domainLimit: (min: number, max: number) => {
                const pad = Math.max((max - min) * 0.2, 0.05);
                return { min: min - pad, max: max + pad };
              },
            },
          ]}
          grid={{ horizontal: true }}
          series={[
            {
              dataKey: "sell",
              color: currency === "EUR" ? "#fbbf24" : "#60a5fa",
              curve: "stepAfter",
              showMark: points.length <= 12,
              valueFormatter: (v: number | null) => v?.toFixed(2) ?? "",
            },
          ]}
          sx={{
            "& .MuiLineElement-root": { strokeWidth: 3 },
            "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
              stroke: "#94a3b8",
            },
            "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-tickLabel tspan": {
              fill: "#e2e8f0 !important",
            },
            "& .MuiChartsGrid-line": {
              stroke: "rgba(148, 163, 184, 0.25)",
            },
          }}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        />
      )}
    </Paper>
  );
}
