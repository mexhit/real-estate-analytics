"use client";

import * as React from "react";
import { Alert, Box, Paper, Skeleton, Typography } from "@mui/material";
import { BarChart, BarElement, type BarProps } from "@mui/x-charts/BarChart";
import type { NewPropertySeriesPoint } from "@/api/properties";

interface NewPropertiesChartProps {
  data: NewPropertySeriesPoint[];
  loading: boolean;
  error: string | null;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekdayIndex(date: string | undefined) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return Number.isNaN(weekday) ? null : weekday;
}

function isMondayDate(date: string | undefined) {
  return getWeekdayIndex(date) === 1;
}

function formatDateLabel(date: string) {
  const weekday = getWeekdayIndex(date);
  return weekday === null ? date : `${date} ${WEEKDAY_LABELS[weekday]}`;
}

export function NewPropertiesChart({
  data,
  loading,
  error,
}: NewPropertiesChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [focusedPoint, setFocusedPoint] =
    React.useState<NewPropertySeriesPoint | null>(null);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const maxVisibleLabels = width < 520 ? 4 : width < 800 ? 8 : 12;
  const labelStep = Math.max(1, Math.ceil(data.length / maxVisibleLabels));
  const dataset: Array<Record<string, string | number>> = data.map((point) => ({
    date: point.date,
    count: point.count,
  }));

  const AccessibleBar = React.useCallback(
    (props: BarProps) => {
      const point = data[props.dataIndex];
      const isMonday = isMondayDate(point?.date);
      const label = point
        ? `${formatDateLabel(point.date)}: ${point.count} new ${point.count === 1 ? "property" : "properties"}${isMonday ? " (start of week)" : ""}`
        : "New properties";
      const color = isMonday ? "#f59e0b" : props.color;
      return (
        <g
          tabIndex={0}
          role="img"
          aria-label={label}
          onFocus={() => setFocusedPoint(point ?? null)}
          onBlur={() => setFocusedPoint(null)}
        >
          <title>{label}</title>
          <BarElement
            {...props}
            color={color}
            style={{ ...props.style, fill: color }}
          />
        </g>
      );
    },
    [data],
  );

  return (
    <Paper
      ref={containerRef}
      elevation={0}
      sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        backgroundColor: "rgba(255,255,255,0.9)",
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={1}>
        New properties — last 120 days
      </Typography>
      {loading ? (
        <Skeleton
          variant="rounded"
          height={320}
          aria-label="Loading New Property chart"
        />
      ) : error ? (
        <Alert severity="error">
          Could not load New Property activity: {error}
        </Alert>
      ) : (
        <>
          <BarChart
            height={320}
            dataset={dataset}
            xAxis={[
              {
                dataKey: "date",
                scaleType: "band",
                tickLabelInterval: (_value, index) => index % labelStep === 0,
                valueFormatter: (value: string) => formatDateLabel(value),
              },
            ]}
            series={[
              {
                dataKey: "count",
                label: "New properties",
                valueFormatter: (value) => `${value ?? 0}`,
                color: "#2563eb",
              },
            ]}
            slots={{ bar: AccessibleBar }}
            grid={{ horizontal: true }}
            hideLegend
            margin={{ left: 42, right: 16, top: 12, bottom: 52 }}
          />
          <Box minHeight={24} mt={0.5} aria-live="polite">
            {focusedPoint && (
              <Typography variant="body2" color="text.secondary">
                {formatDateLabel(focusedPoint.date)}: {focusedPoint.count} new{" "}
                {focusedPoint.count === 1 ? "property" : "properties"}
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}
