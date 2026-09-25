"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  TablePagination,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  areasApi,
  type Area,
  type ContributingListingsDistribution,
  type ContributingListingsSummary,
} from "@/api/areas";
import { propertiesApi, type UpdatePropertyPayload } from "@/api/properties";
import { LogoutButton } from "@/app/LogoutButton";
import {
  buildPricePerSqmBuckets,
  findHighlightedBucketIndex,
  formatAmount,
  PricePerSqmHistogram,
} from "@/components/PricePerSqmHistogram";
import { PropertyTable, type PropertyTableItem } from "@/components/PropertyTable";

function formatPrice(
  value: number | null | undefined,
  currency: string | null,
): string {
  if (value == null || isNaN(value)) return "-";

  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
  const symbol = currency === "EUR" ? "€" : (currency ?? "");

  return symbol ? `${amount} ${symbol}` : amount;
}

function formatDate(date: string | null): string {
  if (!date) return "-";

  return dayjs(date).format("D MMM YYYY");
}

export default function ContributingListingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const areaId = Array.isArray(params.areaId) ? params.areaId[0] : params.areaId;
  const highlightProviderId = searchParams.get("highlightProviderId") ?? undefined;

  const [properties, setProperties] = React.useState<PropertyTableItem[]>([]);
  const [areas, setAreas] = React.useState<Area[]>([]);
  const [summary, setSummary] = React.useState<ContributingListingsSummary | null>(
    null,
  );
  const [distribution, setDistribution] =
    React.useState<ContributingListingsDistribution | null>(null);
  const [selectedBucketIndex, setSelectedBucketIndex] = React.useState<
    number | null
  >(null);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const histogram = React.useMemo(
    () =>
      distribution && distribution.listings.length > 0
        ? buildPricePerSqmBuckets(
            distribution.listings,
            distribution.avgPriceCurrency,
          )
        : null,
    [distribution],
  );
  const highlightedBucketIndex = histogram
    ? findHighlightedBucketIndex(histogram.buckets, highlightProviderId ?? null)
    : -1;
  const selectedBucket =
    histogram && selectedBucketIndex != null
      ? histogram.buckets[selectedBucketIndex]
      : null;
  const isLastBucketSelected =
    histogram != null &&
    selectedBucketIndex === histogram.buckets.length - 1;

  // Arriving with a highlighted listing opens the table on its price range.
  React.useEffect(() => {
    if (highlightedBucketIndex >= 0) setSelectedBucketIndex(highlightedBucketIndex);
  }, [highlightedBucketIndex]);

  React.useEffect(() => {
    if (!areaId) {
      setError("Area ID is missing.");
      setLoading(false);
      return;
    }

    const fetchContributingListings = async () => {
      try {
        setLoading(true);
        const res = await areasApi.getContributingListings({
          areaId,
          page: page + 1,
          limit: rowsPerPage,
          highlightProviderId,
          minPricePerSqm: selectedBucket?.from,
          // The last bar includes the maximum value, so it has no upper bound.
          maxPricePerSqm:
            selectedBucket && !isLastBucketSelected
              ? selectedBucket.to
              : undefined,
        });

        setProperties(res.data);
        setSummary(res.summary);
        setTotal(res.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchContributingListings();
  }, [
    areaId,
    page,
    rowsPerPage,
    highlightProviderId,
    selectedBucket,
    isLastBucketSelected,
  ]);

  React.useEffect(() => {
    if (!areaId) return;

    areasApi
      .getContributingListingsDistribution(areaId)
      .then(setDistribution)
      .catch(() => setDistribution(null));
  }, [areaId]);

  React.useEffect(() => {
    areasApi.getAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  const handleUpdateProperty = async (
    propertyId: number,
    updates: UpdatePropertyPayload,
  ) => {
    const updatedProperty = await propertiesApi.updateProperty(
      propertyId,
      updates,
    );

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? { ...property, ...updatedProperty }
          : property,
      ),
    );
  };

  const handleBookmark = async (propertyId: number) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, bookmarked: !p.bookmarked } : p,
      ),
    );

    await propertiesApi.bookmarkProperty({
      propertyId,
      bookmarked: !properties.find((p) => p.id === propertyId)?.bookmarked,
    });
  };

  const handleSelectBucket = (index: number | null) => {
    setSelectedBucketIndex(index);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Properties behind {summary?.areaName ?? "this"} average
        </Typography>

        <Box display="flex" gap={1}>
          <Button component={Link} href="/" variant="outlined">
            Dashboard
          </Button>
          <Button component={Link} href="/properties" variant="outlined">
            Properties
          </Button>
          <Button component={Link} href="/areas" variant="outlined">
            Areas
          </Button>
          <LogoutButton />
        </Box>
      </Box>

      {summary && (
        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 2, display: "flex", gap: 4, flexWrap: "wrap" }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Average price/m²
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {summary.avgPricePerSqm != null
                ? `${formatPrice(summary.avgPricePerSqm, summary.avgPriceCurrency)}/m²`
                : "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Listings in this average
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {summary.propertyCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Window used
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatDate(summary.windowStart)} – {formatDate(summary.windowEnd)}
            </Typography>
          </Box>
        </Paper>
      )}

      {distribution && histogram && (
        <PricePerSqmHistogram
          histogram={histogram}
          avgPricePerSqm={distribution.avgPricePerSqm}
          currency={distribution.avgPriceCurrency}
          highlightedBucketIndex={highlightedBucketIndex}
          selectedBucketIndex={selectedBucketIndex}
          onSelectBucket={handleSelectBucket}
        />
      )}

      {summary?.highlightedListingIncluded === false && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This listing isn&apos;t part of the current area average calculation.
        </Alert>
      )}

      {selectedBucket ? (
        <>
          <Box mb={1}>
            <Chip
              label={`${formatAmount(
                selectedBucket.from,
                summary?.avgPriceCurrency ?? null,
              )} – ${formatAmount(
                selectedBucket.to,
                summary?.avgPriceCurrency ?? null,
              )}/m² · ${selectedBucket.listings.length} ${
                selectedBucket.listings.length === 1 ? "listing" : "listings"
              }`}
              onDelete={() => handleSelectBucket(null)}
            />
          </Box>
          <Paper
            elevation={1}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "#fff",
            }}
          >
            {loading ? (
              <Box p={3} textAlign="center">
                <CircularProgress />
                <Typography mt={2}>Loading properties...</Typography>
              </Box>
            ) : (
              <PropertyTable
                properties={properties}
                onBookmark={handleBookmark}
                areas={areas}
                onUpdateProperty={handleUpdateProperty}
                showPricePosition={false}
                showProviderHistory={false}
                highlightProviderId={highlightProviderId ?? null}
              />
            )}

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      ) : (
        histogram && (
          <Typography variant="body2" color="text.secondary">
            Click a bar to see the listings in that price range.
          </Typography>
        )
      )}
    </Box>
  );
}
