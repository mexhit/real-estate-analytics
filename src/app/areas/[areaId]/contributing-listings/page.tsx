"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TablePagination,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  areasApi,
  type Area,
  type ContributingListingsSummary,
} from "@/api/areas";
import { propertiesApi, type UpdatePropertyPayload } from "@/api/properties";
import { LogoutButton } from "@/app/LogoutButton";
import { PropertyTable, type PropertyTableItem } from "@/components/PropertyTable";

function formatPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "-";

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)} €`;
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
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
  }, [areaId, page, rowsPerPage, highlightProviderId]);

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
                ? `${formatPrice(summary.avgPricePerSqm)}/m²`
                : "-"}
              {summary.avgPriceCurrency ? ` (${summary.avgPriceCurrency})` : ""}
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

      {summary?.highlightedListingIncluded === false && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This listing isn&apos;t part of the current area average calculation.
        </Alert>
      )}

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
    </Box>
  );
}
