"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Box,
  CircularProgress,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { NewReleases, StarBorderOutlined, Star } from "@mui/icons-material";
import { useSearchParams, useRouter } from "next/navigation";
import { propertiesApi } from "@/api/properties";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { LogoutButton } from "@/app/LogoutButton";

interface Product {
  id: number;
  providerId: string;
  title: string;
  description: string;
  price: number;
  providerPropertyCount: string;
  url: string;
  seen: boolean;
  hasPriceChanged: boolean;
  createdAt: number;
  bookmarked: boolean;
  firstPostedAt: string;
  lastPostedAt: string;
  firstPrice: string;
  lastPrice: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial page from URL (default 0)
  const initialPage = parseInt(searchParams.get("page") || "0", 10);

  const [products, setProducts] = React.useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fromDate, setFromDate] = React.useState<Dayjs | null>(() => {
    if (typeof window !== "undefined") {
      const storeFromDate = localStorage.getItem("fromDate");

      return storeFromDate ? dayjs(storeFromDate) : null;
    }

    return null;
  });
  const [toDate, setToDate] = React.useState<Dayjs | null>(() => {
    if (typeof window !== "undefined") {
      const storeToDate = localStorage.getItem("toDate");

      return storeToDate ? dayjs(storeToDate) : null;
    }

    return null;
  });

  const [page, setPage] = React.useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = React.useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("rowsPerPage") || "10", 10);
    }

    return 10;
  });
  const [onlyUnseen, setOnlyUnseen] = React.useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = React.useState(false);
  const [onlyPriceChanged, setOnlyPriceChanged] = React.useState(false);

  // Update URL when page changes
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

  function formatPeriod(from: string | Date, to: string | Date) {
    const start = dayjs(from);
    const end = dayjs(to);

    const days = end.diff(start, "day");

    if (days < 7) {
      return `${days} day${days !== 1 ? "s" : ""}`;
    }

    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks !== 1 ? "s" : ""}`;
    }

    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await propertiesApi.getPaginatedProperties({
          limit: rowsPerPage,
          page: page + 1,
          fromDate: fromDate ? fromDate.startOf("day").valueOf() : undefined,
          toDate: toDate ? toDate.endOf("day").valueOf() : undefined,
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
    page,
    rowsPerPage,
    fromDate,
    toDate,
    onlyUnseen,
    onlyBookmarked,
    onlyPriceChanged,
  ]);

  React.useEffect(() => {
    localStorage.setItem("rowsPerPage", String(rowsPerPage));
  }, [rowsPerPage]);

  React.useEffect(() => {
    const fromDateStr = fromDate ? fromDate.toISOString() : "";

    localStorage.setItem("fromDate", fromDateStr);
  }, [fromDate]);

  React.useEffect(() => {
    const toDateStr = toDate ? toDate.toISOString() : "";

    localStorage.setItem("toDate", String(toDateStr));
  }, [toDate]);

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

  const formatDate = (date: number | string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  function formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "-";

    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);

    return `${formatted} €`;
  }

  function parsePriceToNumber(price: string | null | undefined): number | null {
    if (!price) return null;

    // Keep digits only
    const numeric = price.replace(/[^\d]/g, "");

    if (!numeric) return null;

    return Number(numeric);
  }

  const getPriceChangeInfo = (firstPrice: string, lastPrice: string) => {
    const firstPriceNum = parsePriceToNumber(firstPrice);
    const lastPriceNum = parsePriceToNumber(lastPrice);

    if (firstPriceNum != null && lastPriceNum != null) {
      if (lastPriceNum > firstPriceNum) {
        return {
          type: "increased",
          diff: lastPriceNum - firstPriceNum,
        };
      }

      if (lastPriceNum < firstPriceNum) {
        return {
          type: "decreased",
          diff: firstPriceNum - lastPriceNum,
        };
      }
    }

    return {
      type: "unchanged",
      diff: 0,
    };
  };

  const productsWithPriceChange = products.map((p) => {
    const change = getPriceChangeInfo(p.firstPrice, p.lastPrice);

    return {
      ...p,
      priceChangeType: change.type,
      priceDiff: formatPrice(change.diff),
    };
  });

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
        <LogoutButton />
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

        {(fromDate || toDate) && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setFromDate(null);
              setToDate(null);
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
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={40}></TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 50 }} align="center">
                    Save
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 50 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    Price (€)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    Price Changed
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    Posted
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>
                    Active For
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 50 }}>
                    Repost
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 130 }}>
                    URL
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {productsWithPriceChange.map((p) => (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{
                      transition: "0.2s",
                      backgroundColor: !p.seen ? "#f0f9ff" : "inherit",
                    }}
                  >
                    {/* New icon */}
                    <TableCell align="center">
                      {!p.seen && (
                        <NewReleases
                          fontSize="small"
                          sx={{ color: "#0288d1" }}
                        />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleBookmark(p.id)}
                      >
                        {p.bookmarked ? (
                          <Star sx={{ color: "#fbc02d" }} />
                        ) : (
                          <StarBorderOutlined />
                        )}
                      </IconButton>
                    </TableCell>

                    {/* ID normal text */}
                    <TableCell>{p.id}</TableCell>

                    {/* Title */}
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Tooltip title={p.title} placement="top" arrow>
                        <Typography noWrap sx={{ cursor: "default" }}>
                          {p.title}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Description */}
                    <TableCell sx={{ maxWidth: 250 }}>
                      <Tooltip title={p.description} placement="top" arrow>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ cursor: "default" }}
                        >
                          {p.description}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Price */}
                    <TableCell sx={{ fontWeight: 600 }}>{p.price}</TableCell>

                    <TableCell>
                      {p.priceChangeType === "increased" && (
                        <Chip
                          label={`↑ +${p.priceDiff}`}
                          size="small"
                          color="error"
                          variant="filled"
                        />
                      )}

                      {p.priceChangeType === "decreased" && (
                        <Chip
                          label={`↓ -${p.priceDiff}`}
                          size="small"
                          color="success"
                          variant="filled"
                        />
                      )}

                      {p.priceChangeType === "unchanged" && (
                        <Chip label="—" size="small" variant="outlined" />
                      )}
                    </TableCell>

                    {/* Posted date */}
                    <TableCell sx={{ width: 140, color: "text.secondary" }}>
                      {formatDate(p.createdAt)}
                    </TableCell>
                    {/* Active for */}
                    <TableCell sx={{ color: "text.secondary" }}>
                      <Tooltip
                        title={`From ${formatDate(p.firstPostedAt)} to ${formatDate(
                          p.lastPostedAt,
                        )}`}
                        arrow
                      >
                        <Typography variant="body2" color="text.secondary">
                          {formatPeriod(p.firstPostedAt, p.lastPostedAt)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    {/* Repost → clickable (provider page) */}
                    <TableCell>
                      <Link
                        href={`/providers/${p.providerId}`}
                        style={{
                          textDecoration: "none",
                        }}
                        target="_blank"
                      >
                        <Chip
                          label={p.providerPropertyCount}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ cursor: "pointer" }}
                        />
                      </Link>
                    </TableCell>

                    {/* URL */}
                    <TableCell>
                      <Button
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        size="small"
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
