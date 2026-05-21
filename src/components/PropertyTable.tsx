"use client";

import Link from "next/link";
import * as React from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ErrorOutline,
  NewReleases,
  Star,
  StarBorderOutlined,
} from "@mui/icons-material";
import dayjs from "dayjs";

export interface PropertyTableItem {
  id: number;
  providerId: string;
  title: string;
  description: string;
  aiResponseError?: string | null;
  propertyType?: import("@/api/properties").PropertyType | null;
  price: number;
  priceAmount?: number | null;
  squareMeters?: number | null;
  providerPropertyCount: string;
  url: string;
  seen: boolean;
  createdAt: number;
  bookmarked: boolean;
  firstPostedAt: string;
  lastPostedAt: string;
  firstPrice: string;
  lastPrice: string;
}

interface PropertyTableProps {
  properties: PropertyTableItem[];
  onBookmark: (propertyId: number) => void | Promise<void>;
  stickyHeader?: boolean;
}

function formatDate(date: number | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "-";

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

  return `${formatted} €`;
}

function getPricePerSquareMeter(
  priceAmount: number | null | undefined,
  squareMeters: number | null | undefined,
): number | null {
  if (
    priceAmount == null ||
    squareMeters == null ||
    isNaN(priceAmount) ||
    isNaN(squareMeters) ||
    squareMeters <= 0
  ) {
    return null;
  }

  return priceAmount / squareMeters;
}

function parsePriceToNumber(price: string | null | undefined): number | null {
  if (!price) return null;

  const numeric = price.replace(/[^\d]/g, "");

  if (!numeric) return null;

  return Number(numeric);
}

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

function getPriceChangeInfo(firstPrice: string, lastPrice: string) {
  const firstPriceNum = parsePriceToNumber(firstPrice);
  const lastPriceNum = parsePriceToNumber(lastPrice);

  if (firstPriceNum != null && lastPriceNum != null) {
    if (lastPriceNum > firstPriceNum) {
      return {
        type: "increased" as const,
        diffLabel: `↑ +${formatPrice(lastPriceNum - firstPriceNum)}`,
      };
    }

    if (lastPriceNum < firstPriceNum) {
      return {
        type: "decreased" as const,
        diffLabel: `↓ -${formatPrice(firstPriceNum - lastPriceNum)}`,
      };
    }
  }

  return {
    type: "unchanged" as const,
    diffLabel: "—",
  };
}

export function PropertyTable({
  properties,
  onBookmark,
  stickyHeader = true,
}: PropertyTableProps) {
  return (
    <TableContainer>
      <Table stickyHeader={stickyHeader}>
        <TableHead>
          <TableRow>
            <TableCell width={40}></TableCell>
            <TableCell sx={{ fontWeight: 600, width: 50 }} align="center">
              Save
            </TableCell>
            <TableCell sx={{ fontWeight: 600, width: 50 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 140 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 140 }}>Price (€)</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 140 }}>
              Price Changed
            </TableCell>
            <TableCell sx={{ fontWeight: 600, width: 140 }}>Posted</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 140 }}>
              Active For
            </TableCell>
            <TableCell sx={{ fontWeight: 600, width: 50 }}>Repost</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 130 }}>URL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {properties.map((property) => {
            const priceChange = getPriceChangeInfo(
              property.firstPrice,
              property.lastPrice,
            );
            const pricePerSquareMeter = getPricePerSquareMeter(
              property.priceAmount,
              property.squareMeters,
            );

            return (
              <TableRow
                key={property.id}
                hover
                sx={{
                  transition: "0.2s",
                  backgroundColor: !property.seen ? "#f0f9ff" : "inherit",
                }}
              >
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                    }}
                  >
                    {!property.seen && (
                      <Tooltip title="New property" arrow>
                        <NewReleases fontSize="small" sx={{ color: "#0288d1" }} />
                      </Tooltip>
                    )}
                    {property.aiResponseError && (
                      <Tooltip
                        title={`AI extraction error: ${property.aiResponseError}`}
                        arrow
                      >
                        <ErrorOutline fontSize="small" color="error" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onBookmark(property.id)}
                  >
                    {property.bookmarked ? (
                      <Star sx={{ color: "#fbc02d" }} />
                    ) : (
                      <StarBorderOutlined />
                    )}
                  </IconButton>
                </TableCell>

                <TableCell>{property.id}</TableCell>

                <TableCell sx={{ maxWidth: 200 }}>
                  <Tooltip title={property.title} placement="top" arrow>
                    <Typography noWrap sx={{ cursor: "default" }}>
                      {property.title}
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell sx={{ maxWidth: 250 }}>
                  <Tooltip title={property.description} placement="top" arrow>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ cursor: "default" }}
                    >
                      {property.description}
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell sx={{ color: "text.secondary" }}>
                  <Typography variant="body2">
                    {property.propertyType || "-"}
                  </Typography>
                  {property.squareMeters != null && (
                    <Typography variant="caption" color="text.secondary">
                      {property.squareMeters} m²
                    </Typography>
                  )}
                </TableCell>

                <TableCell sx={{ fontWeight: 600 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {property.price}
                  </Typography>
                  {pricePerSquareMeter != null && (
                    <Typography variant="caption" color="text.secondary">
                      {formatPrice(pricePerSquareMeter)}/m2
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  {priceChange.type === "increased" && (
                    <Chip
                      label={priceChange.diffLabel}
                      size="small"
                      color="error"
                      variant="filled"
                    />
                  )}

                  {priceChange.type === "decreased" && (
                    <Chip
                      label={priceChange.diffLabel}
                      size="small"
                      color="success"
                      variant="filled"
                    />
                  )}

                  {priceChange.type === "unchanged" && (
                    <Chip label={priceChange.diffLabel} size="small" variant="outlined" />
                  )}
                </TableCell>

                <TableCell sx={{ width: 140, color: "text.secondary" }}>
                  {formatDate(property.createdAt)}
                </TableCell>

                <TableCell sx={{ color: "text.secondary" }}>
                  <Tooltip
                    title={`From ${formatDate(property.firstPostedAt)} to ${formatDate(
                      property.lastPostedAt,
                    )}`}
                    arrow
                  >
                    <Typography variant="body2" color="text.secondary">
                      {formatPeriod(property.firstPostedAt, property.lastPostedAt)}
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell>
                  <Link
                    href={`/providers/${property.providerId}`}
                    style={{ textDecoration: "none" }}
                    target="_blank"
                  >
                    <Chip
                      label={property.providerPropertyCount}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ cursor: "pointer" }}
                    />
                  </Link>
                </TableCell>

                <TableCell>
                  <Button
                    href={property.url}
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
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
