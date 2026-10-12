"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { PieChart } from "@mui/x-charts/PieChart";
import dayjs, { type Dayjs } from "dayjs";
import { propertiesApi, type AreaDistributionPoint } from "@/api/properties";

const UNRESOLVED_COLOR = "#94a3b8";
const GOLDEN_ANGLE = 137.508;

interface Slice {
  id: string;
  areaId: number | null;
  label: string;
  value: number;
  color: string;
}

function toSlices(points: AreaDistributionPoint[]): Slice[] {
  return points.map((point, index) => ({
    id: point.areaId === null ? "unresolved" : String(point.areaId),
    areaId: point.areaId,
    label: point.areaId === null ? "Unresolved" : (point.name ?? "Unknown"),
    value: point.count,
    color:
      point.areaId === null
        ? UNRESOLVED_COLOR
        : `hsl(${Math.round((index * GOLDEN_ANGLE) % 360)}, 62%, 52%)`,
  }));
}

export function AreaDistributionChart() {
  const router = useRouter();
  const [fromDate, setFromDate] = React.useState<Dayjs | null>(() =>
    dayjs().startOf("day"),
  );
  const [toDate, setToDate] = React.useState<Dayjs | null>(() =>
    dayjs().endOf("day"),
  );
  const [points, setPoints] = React.useState<AreaDistributionPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchDistribution = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await propertiesApi.getAreaDistribution({
          fromDate: fromDate ? fromDate.startOf("day").valueOf() : undefined,
          toDate: toDate ? toDate.endOf("day").valueOf() : undefined,
        });
        if (!cancelled) setPoints(res);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchDistribution();
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate]);

  const slices = React.useMemo(() => toSlices(points), [points]);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const percent = (value: number) =>
    total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%";

  const openArea = (slice: Slice) => {
    if (slice.areaId !== null) {
      router.push(`/areas/${slice.areaId}/contributing-listings`);
    }
  };

  return (
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
            Properties by area
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? "Loading..." : `${total} listings`}
            {" · click an area to open its price-snapshot listings"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <DatePicker
            label="From date"
            value={fromDate}
            onChange={setFromDate}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="To date"
            value={toDate}
            onChange={setToDate}
            slotProps={{ textField: { size: "small" } }}
          />
        </Stack>
      </Box>

      {error ? (
        <Box px={2.5} pb={2.5}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : loading ? (
        <Box px={2.5} pb={2.5}>
          <Skeleton variant="rounded" height={480} />
        </Box>
      ) : slices.length === 0 ? (
        <Box px={2.5} pb={3}>
          <Typography color="text.secondary">
            No listings in this date range.
          </Typography>
        </Box>
      ) : (
        <Box
          px={2.5}
          pb={2.5}
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap={2}
          alignItems={{ xs: "stretch", md: "flex-start" }}
        >
          <Box sx={{ flex: "1 1 60%", minWidth: 0, height: 480 }}>
            <PieChart
              hideLegend
              height={480}
              series={[
                {
                  data: slices.map((slice) => ({
                    id: slice.id,
                    label: slice.label,
                    value: slice.value,
                    color: slice.color,
                  })),
                  outerRadius: 220,
                  paddingAngle: 0.5,
                  highlightScope: { fade: "global", highlight: "item" },
                  valueFormatter: ({ value }) =>
                    `${value} (${percent(value)})`,
                },
              ]}
              onItemClick={(_, identifier) => {
                const slice = slices[identifier.dataIndex];
                if (slice) openArea(slice);
              }}
            />
          </Box>
          <Box sx={{ flex: "1 1 40%", maxHeight: 480, overflowY: "auto" }}>
            {slices.map((slice) => (
              <Box
                key={slice.id}
                onClick={() => openArea(slice)}
                display="flex"
                alignItems="center"
                gap={1}
                px={1}
                py={0.75}
                sx={{
                  borderRadius: 1,
                  cursor: slice.areaId === null ? "default" : "pointer",
                  "&:hover": {
                    bgcolor:
                      slice.areaId === null
                        ? "transparent"
                        : "rgba(148, 163, 184, 0.14)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: slice.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                  {slice.label}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {slice.value}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ width: 52, textAlign: "right" }}
                >
                  {percent(slice.value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
