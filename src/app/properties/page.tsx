"use client";

import * as React from "react";
import {
  Paper,
  TablePagination,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PROPERTY_TYPES,
  propertiesApi,
  type PropertySourceOption,
  type PropertyType,
  type UpdatePropertyPayload,
} from "@/api/properties";
import { applyListingMark } from "@/lib/listing-marks";
import { areasApi, type Area } from "@/api/areas";
import dayjs, { Dayjs } from "dayjs";
import { AppHeader, WARM_BG, BORDER } from "@/components/AppHeader";
import {
  PropertiesFilterBar,
  type FurnishedFilter,
  type PropertyFilters,
} from "@/components/PropertiesFilterBar";
import {
  PropertyTable,
  type PropertyTableItem,
} from "@/components/PropertyTable";

const PROPERTY_TYPES_STORAGE_KEY = "propertyTypes";
const AREA_IDS_STORAGE_KEY = "areaIds";
const SOURCES_STORAGE_KEY = "sources";
const FURNISHED_STORAGE_KEY = "furnished";
const SEARCH_DEBOUNCE_MS = 400;

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = parseInt(searchParams.get("page") || "0", 10);

  const [products, setProducts] = React.useState<PropertyTableItem[]>([]);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fromDate, setFromDate] = React.useState<Dayjs | null>(null);
  const [toDate, setToDate] = React.useState<Dayjs | null>(null);

  const [page, setPage] = React.useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [propertyTypes, setPropertyTypes] = React.useState<PropertyType[]>([]);
  const [areas, setAreas] = React.useState<Area[]>([]);
  const [areaIds, setAreaIds] = React.useState<number[]>([]);
  const [sourceOptions, setSourceOptions] = React.useState<
    PropertySourceOption[]
  >([]);
  const [sourcesLoading, setSourcesLoading] = React.useState(true);
  const [sourcesError, setSourcesError] = React.useState<string | null>(null);
  const [sources, setSources] = React.useState<string[]>([]);
  const [furnished, setFurnished] = React.useState<FurnishedFilter>("any");
  const [onlyUnseen, setOnlyUnseen] = React.useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = React.useState(false);
  const [hideDismissed, setHideDismissed] = React.useState(false);
  const [onlyPriceChanged, setOnlyPriceChanged] = React.useState(false);
  const [onlyUntyped, setOnlyUntyped] = React.useState(false);
  const [onlyUnresolved, setOnlyUnresolved] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [preferencesLoaded, setPreferencesLoaded] = React.useState(false);

  const updateUrl = React.useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(newPage));
      router.replace(`?${params.toString()}`);
    },
    [router],
  );

  React.useEffect(() => {
    const trimmed = searchText.trim();

    if (trimmed === search) {
      return;
    }

    const timer = setTimeout(() => {
      setSearch(trimmed);
      setPage(0);
      updateUrl(0);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchText, search, updateUrl]);

  const handleBookmark = async (propertyId: number) => {
    const current = products.find((p) => p.id === propertyId);

    if (!current) return;

    setProducts((prev) =>
      applyListingMark(
        prev,
        current.providerId,
        "bookmarked",
        !current.bookmarked,
      ),
    );

    await propertiesApi.bookmarkProperty({
      propertyId,
      bookmarked: !current.bookmarked,
    });
  };

  const handleDismiss = async (propertyId: number) => {
    const current = products.find((p) => p.id === propertyId);

    if (!current) return;

    setProducts((prev) =>
      applyListingMark(
        prev,
        current.providerId,
        "dismissed",
        !current.dismissed,
      ),
    );

    await propertiesApi.dismissProperty({
      propertyId,
      dismissed: !current.dismissed,
    });
  };

  const handleUpdateProperty = async (
    propertyId: number,
    updates: UpdatePropertyPayload,
  ) => {
    const updatedProperty = await propertiesApi.updateProperty(
      propertyId,
      updates,
    );

    setProducts((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? { ...property, ...updatedProperty }
          : property,
      ),
    );
  };

  const handleRetryAiMetadata = async (propertyId: number) => {
    try {
      const updatedProperty = await propertiesApi.extractAiMetadata({
        propertyId,
      });

      setProducts((prev) =>
        prev.map((property) =>
          property.id === propertyId
            ? { ...property, ...updatedProperty }
            : property,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  React.useEffect(() => {
    areasApi
      .getAreas()
      .then(setAreas)
      .catch(() => setAreas([]));
  }, []);

  React.useEffect(() => {
    propertiesApi
      .getPropertySources()
      .then((options) => {
        setSourceOptions(options);
        setSourcesLoading(false);
      })
      .catch(() => {
        setSourcesError("Couldn't load sources");
        setSourcesLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const storedFromDate = localStorage.getItem("fromDate");
    const storedToDate = localStorage.getItem("toDate");
    const storedRowsPerPage = localStorage.getItem("rowsPerPage");
    const storedPropertyTypes = localStorage.getItem(
      PROPERTY_TYPES_STORAGE_KEY,
    );
    const storedAreaIds = localStorage.getItem(AREA_IDS_STORAGE_KEY);
    const storedSources = localStorage.getItem(SOURCES_STORAGE_KEY);
    const storedFurnished = localStorage.getItem(FURNISHED_STORAGE_KEY);

    setFromDate(storedFromDate ? dayjs(storedFromDate) : null);
    setToDate(storedToDate ? dayjs(storedToDate) : null);
    setRowsPerPage(storedRowsPerPage ? parseInt(storedRowsPerPage, 10) : 10);
    if (storedPropertyTypes) {
      try {
        const parsed = JSON.parse(storedPropertyTypes);

        if (Array.isArray(parsed)) {
          setPropertyTypes(
            parsed.filter((value): value is PropertyType =>
              PROPERTY_TYPES.includes(value as PropertyType),
            ),
          );
        }
      } catch {
        localStorage.removeItem(PROPERTY_TYPES_STORAGE_KEY);
      }
    }
    if (storedAreaIds) {
      try {
        const parsed = JSON.parse(storedAreaIds);

        if (Array.isArray(parsed)) {
          setAreaIds(
            parsed.filter(
              (value): value is number => typeof value === "number",
            ),
          );
        }
      } catch {
        localStorage.removeItem(AREA_IDS_STORAGE_KEY);
      }
    }
    if (storedSources) {
      try {
        const parsed = JSON.parse(storedSources);

        if (Array.isArray(parsed)) {
          setSources(
            parsed.filter(
              (value): value is string => typeof value === "string",
            ),
          );
        }
      } catch {
        localStorage.removeItem(SOURCES_STORAGE_KEY);
      }
    }
    if (storedFurnished === "yes" || storedFurnished === "no") {
      setFurnished(storedFurnished);
    }
    const linkedAreaId = searchParams.get("areaId");
    const linkedUnresolved = searchParams.get("unresolved") === "true";
    if (linkedAreaId || linkedUnresolved) {
      // Arriving from a Dashboard chart click: show exactly that slice, so
      // drop every stored filter except the chart's date range.
      const linkedFrom = searchParams.get("fromDate");
      const linkedTo = searchParams.get("toDate");
      setFromDate(linkedFrom ? dayjs(Number(linkedFrom)) : null);
      setToDate(linkedTo ? dayjs(Number(linkedTo)) : null);
      setPropertyTypes([]);
      setAreaIds(linkedAreaId ? [Number(linkedAreaId)] : []);
      setSources([]);
      setFurnished("any");
      setOnlyUnseen(false);
      setOnlyBookmarked(false);
      setHideDismissed(false);
      setOnlyPriceChanged(false);
      setOnlyUntyped(false);
      setOnlyUnresolved(linkedUnresolved);
      router.replace("/properties");
    }
    setPreferencesLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await propertiesApi.getPaginatedProperties({
          limit: rowsPerPage,
          page: page + 1,
          fromDate: fromDate ? fromDate.startOf("day").valueOf() : undefined,
          toDate: toDate ? toDate.endOf("day").valueOf() : undefined,
          propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
          areaIds: areaIds.length > 0 ? areaIds : undefined,
          sources: sources.length > 0 ? sources : undefined,
          isFurnished: furnished === "any" ? undefined : furnished === "yes",
          onlyUnseen,
          onlyBookmarked,
          hideDismissed,
          onlyPriceChanged,
          onlyUntyped,
          onlyUnresolved,
          search: search || undefined,
        });

        setProducts(res.data);
        setTotalProducts(res.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    preferencesLoaded,
    page,
    rowsPerPage,
    fromDate,
    toDate,
    propertyTypes,
    areaIds,
    sources,
    furnished,
    onlyUnseen,
    onlyBookmarked,
    hideDismissed,
    onlyPriceChanged,
    onlyUntyped,
    onlyUnresolved,
    search,
  ]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    localStorage.setItem("rowsPerPage", String(rowsPerPage));
  }, [preferencesLoaded, rowsPerPage]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const fromDateStr = fromDate ? fromDate.toISOString() : "";

    localStorage.setItem("fromDate", fromDateStr);
  }, [preferencesLoaded, fromDate]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const toDateStr = toDate ? toDate.toISOString() : "";

    localStorage.setItem("toDate", String(toDateStr));
  }, [preferencesLoaded, toDate]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    localStorage.setItem(
      PROPERTY_TYPES_STORAGE_KEY,
      JSON.stringify(propertyTypes),
    );
  }, [preferencesLoaded, propertyTypes]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    localStorage.setItem(AREA_IDS_STORAGE_KEY, JSON.stringify(areaIds));
  }, [preferencesLoaded, areaIds]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
  }, [preferencesLoaded, sources]);

  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    localStorage.setItem(FURNISHED_STORAGE_KEY, furnished);
  }, [preferencesLoaded, furnished]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    updateUrl(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    updateUrl(0);
  };

  const filters: PropertyFilters = {
    fromDate,
    toDate,
    propertyTypes,
    areaIds,
    sources,
    furnished,
    onlyUnseen,
    onlyBookmarked,
    hideDismissed,
    onlyPriceChanged,
    onlyUntyped,
    onlyUnresolved,
  };

  const handleFiltersChange = (patch: Partial<PropertyFilters>) => {
    if ("fromDate" in patch) setFromDate(patch.fromDate ?? null);
    if ("toDate" in patch) setToDate(patch.toDate ?? null);
    if (patch.propertyTypes) setPropertyTypes(patch.propertyTypes);
    if (patch.areaIds) setAreaIds(patch.areaIds);
    if (patch.sources) setSources(patch.sources);
    if (patch.furnished) setFurnished(patch.furnished);
    if (patch.onlyUnseen !== undefined) setOnlyUnseen(patch.onlyUnseen);
    if (patch.onlyBookmarked !== undefined)
      setOnlyBookmarked(patch.onlyBookmarked);
    if (patch.hideDismissed !== undefined)
      setHideDismissed(patch.hideDismissed);
    if (patch.onlyPriceChanged !== undefined)
      setOnlyPriceChanged(patch.onlyPriceChanged);
    if (patch.onlyUntyped !== undefined) setOnlyUntyped(patch.onlyUntyped);
    if (patch.onlyUnresolved !== undefined)
      setOnlyUnresolved(patch.onlyUnresolved);
    setPage(0);
    updateUrl(0);
  };

  const handleSearchClear = () => {
    setSearchText("");
    setSearch("");
    setPage(0);
    updateUrl(0);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSearch("");
    setFromDate(null);
    setToDate(null);
    setPropertyTypes([]);
    setAreaIds([]);
    setSources([]);
    setFurnished("any");
    setOnlyUnseen(false);
    setOnlyBookmarked(false);
    setHideDismissed(false);
    setOnlyPriceChanged(false);
    setOnlyUntyped(false);
    setOnlyUnresolved(false);
    setPage(0);
    updateUrl(0);
  };

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: WARM_BG }}>
      <AppHeader />
      <Box p={{ xs: 2, sm: 3 }}>
        <PropertiesFilterBar
          filters={filters}
          search={searchText}
          onSearchChange={setSearchText}
          onSearchClear={handleSearchClear}
          areas={areas}
          sourceOptions={sourceOptions}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          onChange={handleFiltersChange}
          onClear={handleClearFilters}
        />
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: BORDER,
            backgroundColor: "#fff",
          }}
        >
          {loading ? (
            <Box p={3} textAlign="center">
              <CircularProgress />
              <Typography mt={2}>Loading products...</Typography>
            </Box>
          ) : (
            <PropertyTable
              properties={products}
              onBookmark={handleBookmark}
              onDismiss={handleDismiss}
              onRetryAiMetadata={handleRetryAiMetadata}
              areas={areas}
              onUpdateProperty={handleUpdateProperty}
            />
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalProducts}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-input":
                { display: { xs: "none", sm: "block" } },
              "& .MuiTablePagination-toolbar": {
                px: { xs: 1, sm: 2 },
              },
              "& .MuiTablePagination-actions button": {
                width: { xs: 44, sm: "auto" },
                height: { xs: 44, sm: "auto" },
              },
              "& .MuiTablePagination-spacer": {
                display: { xs: "none", sm: "block" },
              },
              "& .MuiTablePagination-displayedRows": {
                flexGrow: { xs: 1, sm: 0 },
                textAlign: { xs: "center", sm: "left" },
              },
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
