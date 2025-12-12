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
      <Typography variant="h5" gutterBottom>
        Products Table
      </Typography>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell> {/* Column for the icon */}
                <TableCell>ID</TableCell>
                <TableCell>Provider ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price (€)</TableCell>
                <TableCell>Repost</TableCell>
                <TableCell>URL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow
                  key={p.id}
                  sx={{
                    backgroundColor: p.seen ? "inherit" : "#f9f9f9", // Subtle highlight
                  }}
                >
                  <TableCell width={40} align="center">
                    {!p.seen && (
                      <NewReleases
                        fontSize="small"
                        sx={{ color: "#00bcd4" }} // bright green, fresh "new" feel
                      />
                    )}
                  </TableCell>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    <Link
                      href={`/providers/${p.providerId}`}
                      style={{
                        color: "#1976d2",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {p.providerId}
                    </Link>
                  </TableCell>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>{p.price}</TableCell>
                  <TableCell>{p.providerPropertyCount}</TableCell>
                  <TableCell>
                    <Button
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
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
