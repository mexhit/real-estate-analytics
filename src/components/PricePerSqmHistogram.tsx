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

interface PricePerSqmHistogramProps {
  listings: DistributionListing[];
  avgPricePerSqm: number | null;
  currency: string | null;
  highlightProviderId: string | null;
}

interface Bucket {
  from: number;
  to: number;
  label: string;
  listings: DistributionListing[];
}

const TARGET_BUCKET_COUNT = 10;
const MAX_TOOLTIP_LISTINGS = 10;
const BAR_COLOR = "#2563eb";
const HIGHLIGHT_COLOR = "#f59e0b";
const AVERAGE_COLOR = "#dc2626";

function formatAmount(value: number, currency: string | null): string {
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

function buildBuckets(
  listings: DistributionListing[],
  currency: string | null,
): { buckets: Bucket[]; start: number; step: number } {
  const values = listings.map((listing) => listing.pricePerSqm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = niceStep(
    max > min ? (max - min) / TARGET_BUCKET_COUNT : max / TARGET_BUCKET_COUNT,
  );
  const start = Math.floor(min / step) * step;
  const count = Math.floor((max - start) / step) + 1;

  const buckets: Bucket[] = Array.from({ length: count }, (_, index) => {
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

function AverageLine({
  avgPricePerSqm,
  buckets,
  start,
  step,
}: {
  avgPricePerSqm: number;
  buckets: Bucket[];
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

const TooltipContext = React.createContext<{
  buckets: Bucket[];
  currency: string | null;
  highlightProviderId: string | null;
}>({ buckets: [], currency: null, highlightProviderId: null });

function BucketTooltip() {
  const { buckets, currency, highlightProviderId } =
    React.useContext(TooltipContext);
  const item = useItemTooltip<"bar">();
  const bucket = item ? buckets[item.identifier.dataIndex] : undefined;

  return (
    <ChartsTooltipContainer trigger="item">
      {bucket && (
        <Paper elevation={3} sx={{ p: 1.5, maxWidth: 360 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {bucket.label}/m²
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {bucket.listings.length}{" "}
            {bucket.listings.length === 1 ? "listing" : "listings"}
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
            {bucket.listings.slice(0, MAX_TOOLTIP_LISTINGS).map((listing) => (
              <Box
                component="li"
                key={listing.id}
                sx={{
                  fontSize: 13,
                  mb: 0.5,
                  fontWeight:
                    listing.providerId === highlightProviderId ? 700 : 400,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {listing.title}
                </Box>
                <Box component="span" sx={{ color: "text.secondary" }}>
                  {formatAmount(listing.priceAmount, currency)} ·{" "}
                  {listing.squareMeters} m² ·{" "}
                  {formatAmount(listing.pricePerSqm, currency)}/m²
                </Box>
              </Box>
            ))}
          </Box>
          {bucket.listings.length > MAX_TOOLTIP_LISTINGS && (
            <Typography variant="caption" color="text.secondary">
              +{bucket.listings.length - MAX_TOOLTIP_LISTINGS} more
            </Typography>
          )}
        </Paper>
      )}
    </ChartsTooltipContainer>
  );
}

export function PricePerSqmHistogram({
  listings,
  avgPricePerSqm,
  currency,
  highlightProviderId,
}: PricePerSqmHistogramProps) {
  const { buckets, start, step } = React.useMemo(
    () => buildBuckets(listings, currency),
    [listings, currency],
  );

  const highlightedBucketIndex = highlightProviderId
    ? buckets.findIndex((bucket) =>
        bucket.listings.some(
          (listing) => listing.providerId === highlightProviderId,
        ),
      )
    : -1;

  const HighlightableBar = React.useCallback(
    (props: BarProps) => {
      const color =
        props.dataIndex === highlightedBucketIndex
          ? HIGHLIGHT_COLOR
          : props.color;

      return (
        <BarElement
          {...props}
          color={color}
          style={{ ...props.style, fill: color }}
        />
      );
    },
    [highlightedBucketIndex],
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Price/m² distribution
      </Typography>
      <TooltipContext.Provider
        value={{ buckets, currency, highlightProviderId }}
      >
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
