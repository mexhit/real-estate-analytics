"use client";

import * as React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { BarChart, BarElement, type BarProps } from "@mui/x-charts/BarChart";
import {
  ChartsTooltipContainer,
  useItemTooltip,
} from "@mui/x-charts/ChartsTooltip";
import { useDrawingArea, useXScale } from "@mui/x-charts/hooks";
import type { DistributionListing } from "@/api/areas";

export interface PricePerSqmBucket {
  from: number;
  to: number;
  label: string;
  listings: DistributionListing[];
}

export interface PricePerSqmBuckets {
  buckets: PricePerSqmBucket[];
  start: number;
  step: number;
}

interface PricePerSqmHistogramProps {
  histogram: PricePerSqmBuckets;
  avgPricePerSqm: number | null;
  currency: string | null;
  highlightedBucketIndex: number;
  selectedBucketIndex: number | null;
  onSelectBucket: (index: number | null) => void;
}

const TARGET_BUCKET_COUNT = 10;
const BAR_COLOR = "#2563eb";
const SELECTED_COLOR = "#1e3a8a";
const HIGHLIGHT_COLOR = "#f59e0b";
const AVERAGE_COLOR = "#dc2626";

export function formatAmount(value: number, currency: string | null): string {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
  const symbol = currency === "EUR" ? "€" : (currency ?? "");

  return symbol ? `${amount} ${symbol}` : amount;
}

// Rounds a raw width up to 1, 2, 2.5 or 5 × a power of ten.
function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 100;

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const multiplier = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rawStep)!;

  return multiplier * magnitude;
}

export function buildPricePerSqmBuckets(
  listings: DistributionListing[],
  currency: string | null,
): PricePerSqmBuckets {
  const values = listings.map((listing) => listing.pricePerSqm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = niceStep(
    max > min ? (max - min) / TARGET_BUCKET_COUNT : max / TARGET_BUCKET_COUNT,
  );
  const start = Math.floor(min / step) * step;
  const count = Math.floor((max - start) / step) + 1;

  const buckets: PricePerSqmBucket[] = Array.from({ length: count }, (_, index) => {
    const from = start + index * step;
    const to = from + step;

    return {
      from,
      to,
      label: `${formatAmount(from, currency)} – ${formatAmount(to, currency)}`,
      listings: [],
    };
  });

  for (const listing of listings) {
    const index = Math.min(
      count - 1,
      Math.floor((listing.pricePerSqm - start) / step),
    );
    buckets[index].listings.push(listing);
  }

  for (const bucket of buckets) {
    bucket.listings.sort((a, b) => a.pricePerSqm - b.pricePerSqm);
  }

  return { buckets, start, step };
}

export function findHighlightedBucketIndex(
  buckets: PricePerSqmBucket[],
  highlightProviderId: string | null,
): number {
  if (!highlightProviderId) return -1;

  return buckets.findIndex((bucket) =>
    bucket.listings.some(
      (listing) => listing.providerId === highlightProviderId,
    ),
  );
}

function AverageLine({
  avgPricePerSqm,
  buckets,
  start,
  step,
}: {
  avgPricePerSqm: number;
  buckets: PricePerSqmBucket[];
  start: number;
  step: number;
}) {
  const xScale = useXScale<"band">();
  const { top, height } = useDrawingArea();
  const position = (avgPricePerSqm - start) / step;
  const index = Math.floor(position);

  if (index < 0 || index >= buckets.length) return null;

  const bandStart = xScale(buckets[index].label);
  if (bandStart == null) return null;

  const x = bandStart + (position - index) * xScale.bandwidth();

  return (
    <line
      x1={x}
      x2={x}
      y1={top}
      y2={top + height}
      stroke={AVERAGE_COLOR}
      strokeWidth={2}
      strokeDasharray="6 4"
    />
  );
}

const TooltipContext = React.createContext<PricePerSqmBucket[]>([]);

function BucketTooltip() {
  const buckets = React.useContext(TooltipContext);
  const item = useItemTooltip<"bar">();
  const bucket = item ? buckets[item.identifier.dataIndex] : undefined;

  return (
    <ChartsTooltipContainer trigger="item">
      {bucket && (
        <Paper elevation={3} sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {bucket.label}/m²
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p">
            {bucket.listings.length}{" "}
            {bucket.listings.length === 1 ? "listing" : "listings"}
          </Typography>
          {bucket.listings.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Click to see listings
            </Typography>
          )}
        </Paper>
      )}
    </ChartsTooltipContainer>
  );
}

export function PricePerSqmHistogram({
  histogram: { buckets, start, step },
  avgPricePerSqm,
  currency,
  highlightedBucketIndex,
  selectedBucketIndex,
  onSelectBucket,
}: PricePerSqmHistogramProps) {
  const HighlightableBar = React.useCallback(
    (props: BarProps) => {
      let color = props.color;
      if (props.dataIndex === selectedBucketIndex) color = SELECTED_COLOR;
      if (props.dataIndex === highlightedBucketIndex) color = HIGHLIGHT_COLOR;

      return (
        <BarElement
          {...props}
          color={color}
          style={{ ...props.style, fill: color, cursor: "pointer" }}
        />
      );
    },
    [highlightedBucketIndex, selectedBucketIndex],
  );

  const handleItemClick = (_: unknown, { dataIndex }: { dataIndex: number }) => {
    if (dataIndex === selectedBucketIndex) {
      onSelectBucket(null);
    } else if (buckets[dataIndex]?.listings.length) {
      onSelectBucket(dataIndex);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Price/m² distribution
      </Typography>
      <TooltipContext.Provider value={buckets}>
        <BarChart
          height={300}
          dataset={buckets.map((bucket) => ({
            label: bucket.label,
            count: bucket.listings.length,
          }))}
          xAxis={[
            {
              dataKey: "label",
              scaleType: "band",
              categoryGapRatio: 0.05,
              valueFormatter: (value: string, context) =>
                context.location === "tick"
                  ? formatAmount(
                      buckets.find((bucket) => bucket.label === value)?.from ??
                        0,
                      currency,
                    )
                  : value,
            },
          ]}
          yAxis={[{ tickMinStep: 1, label: "Listings" }]}
          series={[{ dataKey: "count", color: BAR_COLOR }]}
          slots={{ bar: HighlightableBar, tooltip: BucketTooltip }}
          grid={{ horizontal: true }}
          onItemClick={handleItemClick}
          hideLegend
          margin={{ left: 8, right: 16, top: 12, bottom: 8 }}
        >
          {avgPricePerSqm != null && (
            <AverageLine
              avgPricePerSqm={avgPricePerSqm}
              buckets={buckets}
              start={start}
              step={step}
            />
          )}
        </BarChart>
      </TooltipContext.Provider>
      {avgPricePerSqm != null && (
        <Typography variant="caption" color="text.secondary">
          <Box component="span" sx={{ color: AVERAGE_COLOR }}>
            ┆
          </Box>{" "}
          Area average: {formatAmount(avgPricePerSqm, currency)}/m²
          {highlightedBucketIndex >= 0 && (
            <>
              {" · "}
              <Box component="span" sx={{ color: HIGHLIGHT_COLOR }}>
                ■
              </Box>{" "}
              Range containing the highlighted listing
            </>
          )}
        </Typography>
      )}
    </Paper>
  );
}
