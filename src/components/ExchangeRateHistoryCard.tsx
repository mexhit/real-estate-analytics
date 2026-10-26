"use client";

import * as React from "react";
import {
  Alert,
  Box,
  ButtonBase,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import dayjs from "dayjs";
import {
  exchangeRatesApi,
  type LatestExchangeRates,
  type RateCurrency,
  type RateHistory,
  type RateHistoryRange,
} from "@/api/exchange-rates";
import { TrendArrow } from "@/components/TrendArrow";

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

interface ExchangeRateHistoryCardProps {
  latest: LatestExchangeRates | null;
  latestLoading: boolean;
  latestError: string | null;
}

const CURRENCY_ACCENT: Record<RateCurrency, string> = {
  EUR: "#fbbf24",
  USD: "#60a5fa",
};

export function ExchangeRateHistoryCard({
  latest,
  latestLoading,
  latestError,
}: ExchangeRateHistoryCardProps) {
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
        gridColumn: { xs: "1 / -1", md: "span 9" },
        p: 2.5,
        borderRadius: 2,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        color: "#fff",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={1.5}
        mb={1.5}
      >
        <Stack direction="row" gap={1.5}>
          {(["EUR", "USD"] as const).map((value) => {
            const rate = latest?.rates[value];
            const selected = value === currency;
            return (
              <ButtonBase
                key={value}
                onClick={() => setCurrency(value)}
                aria-pressed={selected}
                sx={{
                  display: "block",
                  textAlign: "left",
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  minWidth: 150,
                  border: "1px solid",
                  borderColor: selected
                    ? CURRENCY_ACCENT[value]
                    : "rgba(148, 163, 184, 0.3)",
                  backgroundColor: selected
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  opacity: selected ? 1 : 0.7,
                  "&:hover": { opacity: 1 },
                }}
              >
                <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                  {value} / ALL sell
                </Typography>
                {latestLoading ? (
                  <Skeleton width={90} height={40} />
                ) : (
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{ color: CURRENCY_ACCENT[value], lineHeight: 1.2 }}
                    >
                      {latestError || !rate ? "—" : rate.buy.toFixed(2)}
                    </Typography>
                    {rate && (
                      <TrendArrow trend={rate.buyTrend} size={20} onDark />
                    )}
                  </Stack>
                )}
                {rate && (
                  <Stack direction="row" alignItems="center" gap={0.25}>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Buy {rate.sell.toFixed(2)}
                    </Typography>
                    <TrendArrow trend={rate.sellTrend} size={14} onDark />
                  </Stack>
                )}
              </ButtonBase>
            );
          })}
        </Stack>
        <Stack alignItems="flex-end" gap={0.5}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={range}
            onChange={(_, value: RateHistoryRange | null) =>
              value && setRange(value)
            }
          >
            {(Object.keys(RANGE_LABELS) as RateHistoryRange[]).map((value) => (
              <ToggleButton key={value} value={value} sx={toggleSx}>
                {RANGE_LABELS[value]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {latest?.fetchedAt && (
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Updated {dayjs(latest.fetchedAt).format("MMM D, HH:mm")}
            </Typography>
          )}
        </Stack>
      </Stack>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : loading ? (
        <Skeleton variant="rounded" height={150} />
      ) : points.length === 0 ? (
        <Box
          height={150}
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
          height={150}
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
              color: CURRENCY_ACCENT[currency],
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
