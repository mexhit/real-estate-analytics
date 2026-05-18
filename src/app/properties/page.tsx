"use client";

import * as React from "react";
import Link from "next/link";
import {
  Paper,
  TablePagination,
  Typography,
  Box,
  CircularProgress,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
} from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { PROPERTY_TYPES, propertiesApi, type PropertyType } from "@/api/properties";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { LogoutButton } from "@/app/LogoutButton";
import { PropertyTable, type PropertyTableItem } from "@/components/PropertyTable";

const PROPERTY_TYPES_STORAGE_KEY = "propertyTypes";

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
  const [onlyUnseen, setOnlyUnseen] = React.useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = React.useState(false);
  const [onlyPriceChanged, setOnlyPriceChanged] = React.useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = React.useState(false);

  const updateUrl = React.useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(newPage));
      router.replace(`?${params.toString()}`);
    },
    [router],
  );

  const handleBookmark = async (propertyId: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, bookmarked: !p.bookmarked } : p,
      ),
    );

    await propertiesApi.bookmarkProperty({
      propertyId: propertyId,
      bookmarked: !products.find((p) => p.id === propertyId)?.bookmarked,
    });
  };

  React.useEffect(() => {
    const storedFromDate = localStorage.getItem("fromDate");
    const storedToDate = localStorage.getItem("toDate");
    const storedRowsPerPage = localStorage.getItem("rowsPerPage");
    const storedPropertyTypes = localStorage.getItem(PROPERTY_TYPES_STORAGE_KEY);

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
    setPreferencesLoaded(true);
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
          onlyUnseen,
          onlyBookmarked,
          onlyPriceChanged,
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
    onlyUnseen,
    onlyBookmarked,
    onlyPriceChanged,
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
        gap={2}
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Properties
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button component={Link} href="/" variant="outlined">
            Dashboard
          </Button>
          <LogoutButton />
        </Box>
      </Box>
      <Box mb={2} display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <DatePicker
          label="From date"
          value={fromDate}
          onChange={(newValue) => {
            setFromDate(newValue);
            setPage(0);
            updateUrl(0);
          }}
          slotProps={{ textField: { size: "small" } }}
        />

        <DatePicker
          label="To date"
          value={toDate}
          onChange={(newValue) => {
            setToDate(newValue);
            setPage(0);
            updateUrl(0);
          }}
          slotProps={{ textField: { size: "small" } }}
        />

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="property-types-label">Property types</InputLabel>
          <Select
            labelId="property-types-label"
            multiple
            value={propertyTypes}
            onChange={(event) => {
              const value = event.target.value;
              setPropertyTypes(
                typeof value === "string" ? (value.split(",") as PropertyType[]) : value,
              );
              setPage(0);
              updateUrl(0);
            }}
            input={<OutlinedInput label="Property types" />}
            renderValue={(selected) => (
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {PROPERTY_TYPES.map((propertyType) => (
              <MenuItem key={propertyType} value={propertyType}>
                {propertyType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(fromDate || toDate || propertyTypes.length > 0) && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setFromDate(null);
              setToDate(null);
              setPropertyTypes([]);
              setPage(0);
              updateUrl(0);
            }}
          >
            Clear
          </Button>
        )}
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={onlyUnseen}
              onChange={(e) => {
                setOnlyUnseen(e.target.checked);
                setPage(0);
                updateUrl(0);
              }}
            />
          }
          label="Only unseen"
        />
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={onlyBookmarked}
              onChange={(e) => {
                setOnlyBookmarked(e.target.checked);
                setPage(0);
                updateUrl(0);
              }}
            />
          }
          label="Only bookmarked"
        />
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={onlyPriceChanged}
              onChange={(e) => {
                setOnlyPriceChanged(e.target.checked);
                setPage(0);
                updateUrl(0);
              }}
            />
          }
          label="Only price changed"
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
            <Typography mt={2}>Loading products...</Typography>
          </Box>
        ) : (
          <PropertyTable properties={products} onBookmark={handleBookmark} />
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalProducts}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
