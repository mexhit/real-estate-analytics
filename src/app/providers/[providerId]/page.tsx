"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Button,
} from "@mui/material";
import Link from "next/link";
import { propertiesApi } from "@/api/properties";
import { LogoutButton } from "@/app/LogoutButton";

interface Property {
  id: number;
  providerId: string;
  title: string;
  description: string;
  price: number;
  url: string;
  createdAt: number;
}

export default function ProviderPropertiesPage() {
  const { providerId } = useParams();
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await propertiesApi.getPropertiesByProviderId({
          limit: rowsPerPage,
          page: page + 1,
          providerId: providerId,
        });
        const data = res.data;
        setProperties(data);
        setTotalProperties(res.total);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, providerId, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (date: number) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  if (loading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading properties...</Typography>
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">
          Properties by Provider: <strong>{providerId}</strong>
        </Typography>

        <Box display="flex" gap={1}>
          <Button component={Link} href="/" variant="outlined">
            Back to Products
          </Button>
          <LogoutButton />
        </Box>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Provider ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price (€)</TableCell>
                <TableCell>Posted</TableCell>
                <TableCell>URL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
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
                  {/* Posted date */}
                  <TableCell sx={{ width: 140, color: "text.secondary" }}>
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1976d2",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Open
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalProperties}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
