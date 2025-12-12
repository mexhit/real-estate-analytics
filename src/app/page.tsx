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
} from "@mui/material";
import { NewReleases } from "@mui/icons-material";
import { useSearchParams, useRouter } from "next/navigation";
import { propertiesApi } from "@/api/properties";

interface Product {
  id: number;
  providerId: string;
  title: string;
  description: string;
  price: number;
  providerPropertyCount: string;
  url: string;
  seen: boolean;
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

  const [page, setPage] = React.useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = React.useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("rowsPerPage") || "10", 10);
    }

    return 10;
  });

  // Update URL when page changes
  const updateUrl = React.useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(newPage));
      router.replace(`?${params.toString()}`);
    },
    [router],
  );

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await propertiesApi.getPaginatedProperties({
          limit: rowsPerPage,
          page: page + 1, // API is 1-based
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
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    localStorage.setItem("rowsPerPage", String(rowsPerPage));
  }, [rowsPerPage]);

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

  if (loading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading products...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Properties
      </Typography>

      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Price (€)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Repost</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {products.map((p) => (
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
                      <NewReleases fontSize="small" sx={{ color: "#0288d1" }} />
                    )}
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

                  {/* Repost → clickable (provider page) */}
                  <TableCell>
                    <Link
                      href={`/providers/${p.providerId}`}
                      style={{
                        textDecoration: "none",
                      }}
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
