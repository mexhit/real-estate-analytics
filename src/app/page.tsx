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
  Typography,
} from "@mui/material";
import { ArrowDownward, ArrowUpward, Today } from "@mui/icons-material";
import dayjs from "dayjs";
import {
  propertiesApi,
  PROPERTY_TYPES,
  type NewPropertySeriesPoint,
} from "@/api/properties";
import {
  exchangeRatesApi,
  type LatestExchangeRate,
  type LatestExchangeRates,
  type RateTrend,
} from "@/api/exchange-rates";
import { AppHeader, WARM_BG } from "@/components/AppHeader";
import {
  PropertyTable,
  type PropertyTableItem,
} from "@/components/PropertyTable";
import { AreaDistributionChart } from "@/components/AreaDistributionChart";
import { NewPropertiesChart } from "@/components/NewPropertiesChart";

interface DashboardMetric {
  kind: "new-properties" | "exchange-rate";
  label: string;
  value: string;
  accent: string;
  rate?: LatestExchangeRate;
}

// Lek getting weaker (rate up) is shown red, stronger (rate down) green.
const TREND_COLORS: Record<RateTrend, string> = {
  up: "#b91c1c",
  down: "#15803d",
  unchanged: "#64748b",
  none: "#64748b",
};

function TrendArrow({ trend }: { trend: RateTrend }) {
  if (trend === "up") {
    return <ArrowUpward sx={{ fontSize: 22, color: TREND_COLORS.up }} />;
  }
  if (trend === "down") {
    return <ArrowDownward sx={{ fontSize: 22, color: TREND_COLORS.down }} />;
  }
  return null;
}

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newPropertySeries, setNewPropertySeries] = React.useState<
    NewPropertySeriesPoint[]
  >([]);
  const [chartLoading, setChartLoading] = React.useState(true);
  const [chartError, setChartError] = React.useState<string | null>(null);
  const [exchangeRates, setExchangeRates] =
    React.useState<LatestExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = React.useState(true);
  const [ratesError, setRatesError] = React.useState<string | null>(null);
  const [todayPriceChangedTotal, setTodayPriceChangedTotal] = React.useState(0);
  const [todayPriceChangedProperties, setTodayPriceChangedProperties] =
    React.useState<PropertyTableItem[]>([]);
  const [todayApartment31Total, setTodayApartment31Total] = React.useState(0);
  const [todayApartment31Properties, setTodayApartment31Properties] =
    React.useState<PropertyTableItem[]>([]);

  const handleBookmark = async (propertyId: number) => {
    const updateCollection = (items: PropertyTableItem[]) =>
      items.map((item) =>
        item.id === propertyId
          ? { ...item, bookmarked: !item.bookmarked }
          : item,
      );

    const currentProperty =
      todayPriceChangedProperties.find((item) => item.id === propertyId) ||
      todayApartment31Properties.find((item) => item.id === propertyId);

    setTodayPriceChangedProperties((prev) => updateCollection(prev));
    setTodayApartment31Properties((prev) => updateCollection(prev));

    await propertiesApi.bookmarkProperty({
      propertyId,
      bookmarked: !currentProperty?.bookmarked,
    });
  };

  const handleRetryAiMetadata = async (propertyId: number) => {
    try {
      const updatedProperty = await propertiesApi.extractAiMetadata({
        propertyId,
      });
      const updateCollection = (items: PropertyTableItem[]) =>
        items.map((item) =>
          item.id === propertyId ? { ...item, ...updatedProperty } : item,
        );

      setTodayPriceChangedProperties((prev) => updateCollection(prev));
      setTodayApartment31Properties((prev) => updateCollection(prev));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  React.useEffect(() => {
    const fetchNewPropertySeries = async () => {
      try {
        setChartLoading(true);
        setChartError(null);
        setNewPropertySeries(await propertiesApi.getNewPropertiesSeries());
      } catch (err) {
        setChartError((err as Error).message);
      } finally {
        setChartLoading(false);
      }
    };

    const fetchExchangeRates = async () => {
      try {
        setRatesLoading(true);
        setRatesError(null);
        setExchangeRates(await exchangeRatesApi.getLatest());
      } catch (err) {
        setRatesError((err as Error).message);
      } finally {
        setRatesLoading(false);
      }
    };

    const fetchDashboard = async () => {
      const todayStart = dayjs().startOf("day").valueOf();
      const todayEnd = dayjs().endOf("day").valueOf();

      try {
        setLoading(true);
        const [
          todayPriceChangedRes,
          todayApartment31Res,
        ] = await Promise.all([
          propertiesApi.getPaginatedProperties({
            limit: 8,
            page: 1,
            fromDate: todayStart,
            toDate: todayEnd,
            onlyPriceChanged: true,
          }),
          propertiesApi.getPaginatedProperties({
            limit: 8,
            page: 1,
            fromDate: todayStart,
            toDate: todayEnd,
            propertyTypes: [PROPERTY_TYPES[2]],
          }),
        ]);

        setTodayPriceChangedTotal(todayPriceChangedRes.total);
        setTodayPriceChangedProperties(todayPriceChangedRes.data);
        setTodayApartment31Total(todayApartment31Res.total);
        setTodayApartment31Properties(todayApartment31Res.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void fetchNewPropertySeries();
    void fetchExchangeRates();
    void fetchDashboard();
  }, []);

  const todayNewPropertyTotal = newPropertySeries.at(-1)?.count ?? 0;

  const dashboardMetrics: DashboardMetric[] = [
    {
      kind: "new-properties",
      label: "New properties today",
      value: String(todayNewPropertyTotal),
      accent: "#0f766e",
    },
    ...(["EUR", "USD"] as const).map(
      (currency): DashboardMetric => ({
        kind: "exchange-rate",
        label: `${currency} / ALL`,
        value: exchangeRates?.rates[currency]?.sell.toFixed(2) ?? "—",
        accent: currency === "EUR" ? "#b45309" : "#2563eb",
        rate: exchangeRates?.rates[currency],
      }),
    ),
  ];

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <>
    <AppHeader />
    <Box
      p={{ xs: 2, md: 3 }}
      sx={{
        minHeight: "100vh",
        bgcolor: WARM_BG,
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
                {metric.kind === "new-properties" ? (
                  chartLoading ? (
                    <CircularProgress size={22} />
                  ) : (
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      sx={{ color: metric.accent, lineHeight: 1.1 }}
                    >
                      {chartError ? "—" : metric.value}
                    </Typography>
                  )
                ) : ratesLoading ? (
                  <CircularProgress size={22} />
                ) : (
                  <>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        sx={{ color: metric.accent, lineHeight: 1.1 }}
                      >
                        {ratesError ? "—" : metric.value}
                      </Typography>
                      {metric.rate && <TrendArrow trend={metric.rate.sellTrend} />}
                    </Box>
                    {metric.rate && (
                      <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          Buy {metric.rate.buy.toFixed(2)}
                        </Typography>
                        <TrendArrow trend={metric.rate.buyTrend} />
                      </Box>
                    )}
                    {!metric.rate && !ratesError && (
                      <Typography variant="body2" color="text.secondary">
                        No rate yet
                      </Typography>
                    )}
                    {exchangeRates?.fetchedAt && metric.rate && (
                      <Typography variant="caption" color="text.secondary">
                        Updated{" "}
                        {dayjs(exchangeRates.fetchedAt).format("MMM D, HH:mm")}
                      </Typography>
                    )}
                  </>
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
              3_1 apartments posted today
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Today&apos;s new listings filtered to `APARTMENT_3_1`.
            </Typography>
          </Box>
          <Chip
            label={
              loading ? "Loading..." : `${todayApartment31Total} posted today`
            }
            sx={{ borderRadius: 2 }}
          />
        </Box>

        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        ) : todayApartment31Properties.length === 0 ? (
          <Box px={2.5} py={3}>
            <Typography color="text.secondary">
              No `APARTMENT_3_1` listings were posted today.
            </Typography>
          </Box>
        ) : (
          <PropertyTable
            properties={todayApartment31Properties}
            onBookmark={handleBookmark}
            onRetryAiMetadata={handleRetryAiMetadata}
          />
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
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
              Listings first posted today where the latest price differs from
              the first captured price.
            </Typography>
          </Box>
          <Chip
            label={
              loading ? "Loading..." : `${todayPriceChangedTotal} tracked today`
            }
            sx={{ borderRadius: 2 }}
          />
        </Box>

        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        ) : todayPriceChangedProperties.length === 0 ? (
          <Box px={2.5} py={3}>
            <Typography color="text.secondary">
              No price changes detected on properties posted today.
            </Typography>
          </Box>
        ) : (
          <PropertyTable
            properties={todayPriceChangedProperties}
            onBookmark={handleBookmark}
            onRetryAiMetadata={handleRetryAiMetadata}
          />
        )}
      </Paper>

      <Box mt={3}>
        <AreaDistributionChart />
      </Box>

      <Box mt={3}>
        <NewPropertiesChart
          data={newPropertySeries}
          loading={chartLoading}
          error={chartError}
        />
      </Box>
    </Box>
    </>
  );
}
