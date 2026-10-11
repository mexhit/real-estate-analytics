"use client";

import Link from "next/link";
import * as React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
  AutoFixHigh,
  CalendarTodayOutlined,
  Check,
  Edit,
  ErrorOutline,
  LocationOnOutlined,
  OpenInNew,
  Repeat,
  Star,
  StarBorderOutlined,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { type Area } from "@/api/areas";
import { type UpdatePropertyPayload } from "@/api/properties";
import { EditPropertyDialog } from "@/components/EditPropertyDialog";

export interface PropertyTableItem {
  id: number;
  providerId: string;
  source: string;
  title: string;
  description: string;
  aiResponseError?: string | null;
  propertyType?: import("@/api/properties").PropertyType | null;
  areaId?: number | null;
  areaName?: string | null;
  isFurnished?: boolean | null;
  price: string;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  squareMeters?: number | null;
  areaAvgPricePerSqm?: number | null;
  areaAvgPriceCurrency?: string | null;
  areaSnapshotPropertyCount?: number | null;
  pricePosition?: import("@/api/properties").PricePosition | null;
  pricePositionPercentage?: number | null;
  providerPropertyCount?: string;
  url: string;
  seen: boolean;
  createdAt: number | string;
  bookmarked: boolean;
  firstPostedAt?: string;
  lastPostedAt?: string;
  firstPrice?: string;
  lastPrice?: string;
}

interface PropertyTableProps {
  properties: PropertyTableItem[];
  onBookmark: (propertyId: number) => void | Promise<void>;
  onRetryAiMetadata?: (propertyId: number) => void | Promise<void>;
  areas?: Area[];
  onUpdateProperty?: (
    propertyId: number,
    updates: UpdatePropertyPayload,
  ) => Promise<void>;
  stickyHeader?: boolean;
  showPricePosition?: boolean;
  showProviderHistory?: boolean;
  highlightProviderId?: string | null;
}

function formatDate(date: number | string | null | undefined): string {
  if (date == null) return "-";

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(parsed);
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

function formatListedAge(date: number | string | null | undefined): string {
  if (date == null) return "";

  const start = dayjs(date);

  if (!start.isValid()) return "";

  const days = dayjs().startOf("day").diff(start.startOf("day"), "day");

  if (days <= 0) return "Today";

  return `${days} day${days !== 1 ? "s" : ""}`;
}

function getPricePositionInfo(
  pricePosition: import("@/api/properties").PricePosition | null | undefined,
  pricePositionPercentage: number | null | undefined,
): { label: string; color: "error" | "success" | "default"; variant: "filled" | "outlined" } | null {
  if (!pricePosition) return null;

  if (pricePosition === "above") {
    return {
      label: `↑ ${pricePositionPercentage}% vs area`,
      color: "error",
      variant: "filled",
    };
  }

  if (pricePosition === "below") {
    return {
      label: `↓ ${pricePositionPercentage}% vs area`,
      color: "success",
      variant: "filled",
    };
  }

  return {
    label: "In line with area",
    color: "default",
    variant: "outlined",
  };
}

function getPriceChangeInfo(
  firstPrice: string | null | undefined,
  lastPrice: string | null | undefined,
) {
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
  onRetryAiMetadata,
  areas = [],
  onUpdateProperty,
  stickyHeader = true,
  showPricePosition = true,
  showProviderHistory = true,
  highlightProviderId = null,
}: PropertyTableProps) {
  const [retryingAiMetadataIds, setRetryingAiMetadataIds] = React.useState<
    Set<number>
  >(new Set());
  const [editingProperty, setEditingProperty] =
    React.useState<PropertyTableItem | null>(null);

  const handleRetryAiMetadata = async (propertyId: number) => {
    if (!onRetryAiMetadata || retryingAiMetadataIds.has(propertyId)) {
      return;
    }

    setRetryingAiMetadataIds((prev) => new Set(prev).add(propertyId));

    try {
      await onRetryAiMetadata(propertyId);
    } finally {
      setRetryingAiMetadataIds((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  };

  const headerCellSx = {
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "text.secondary",
  } as const;

  return (
    <>
      <TableContainer>
        <Table stickyHeader={stickyHeader} sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, width: 56 }} />
              <TableCell sx={headerCellSx}>Listing</TableCell>
              <TableCell sx={{ ...headerCellSx, width: 220 }} align="right">
                Price
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: 240 }}>Area</TableCell>
              <TableCell sx={{ ...headerCellSx, width: 260 }} align="right">
                Source
              </TableCell>
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
              const pricePositionInfo = getPricePositionInfo(
                property.pricePosition,
                property.pricePositionPercentage,
              );
              const repostCount = Number(property.providerPropertyCount);
              const isRetrying = retryingAiMetadataIds.has(property.id);

              return (
                <TableRow
                  key={property.id}
                  hover
                  sx={{
                    transition: "0.2s",
                    "& > td": { verticalAlign: "top" },
                    backgroundColor:
                      highlightProviderId != null &&
                      property.providerId === highlightProviderId
                        ? "#fff3cd"
                        : !property.seen
                          ? "#f0f9ff"
                          : "background.paper",
                  }}
                >
                  <TableCell align="center" sx={{ px: 1 }}>
                    <IconButton
                      aria-label={`Bookmark property ${property.id}`}
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

                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      {!property.seen && (
                        <Chip
                          label="NEW"
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 700, height: 22 }}
                        />
                      )}
                      <Tooltip title={property.title} placement="top" arrow>
                        <Typography
                          noWrap
                          fontWeight={600}
                          sx={{ cursor: "default" }}
                        >
                          {property.title}
                        </Typography>
                      </Tooltip>
                    </Box>
                    {property.description && (
                      <Tooltip
                        title={property.description}
                        placement="top"
                        arrow
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            cursor: "default",
                            mt: 0.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {property.description}
                        </Typography>
                      </Tooltip>
                    )}
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1.5,
                      }}
                    >
                      {property.propertyType && (
                        <Chip
                          label={property.propertyType}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1 }}
                        />
                      )}
                      {property.squareMeters != null && (
                        <Typography variant="body2" color="text.secondary">
                          {property.squareMeters} m²
                        </Typography>
                      )}
                      {property.isFurnished === true && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Check fontSize="small" />
                          <Typography variant="body2">Furnished</Typography>
                        </Box>
                      )}
                      {property.isFurnished === false && (
                        <Typography variant="body2" color="text.secondary">
                          Unfurnished
                        </Typography>
                      )}
                      <Tooltip
                        title={`Active from ${formatDate(
                          property.firstPostedAt,
                        )} to ${formatDate(property.lastPostedAt)}`}
                        arrow
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          <CalendarTodayOutlined sx={{ fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            Listed {formatDate(property.createdAt)} ·{" "}
                            {formatListedAge(property.createdAt)}
                          </Typography>
                        </Box>
                      </Tooltip>
                      {showProviderHistory && repostCount > 1 && (
                        <Link
                          href={`/providers/${property.providerId}`}
                          style={{ textDecoration: "none" }}
                          target="_blank"
                        >
                          <Chip
                            icon={<Repeat />}
                            label={`× ${repostCount}`}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ cursor: "pointer" }}
                          />
                        </Link>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        #{property.id}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    {priceChange.type !== "unchanged" && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textDecoration: "line-through" }}
                        >
                          {property.firstPrice}
                        </Typography>
                        <Chip
                          label={priceChange.diffLabel}
                          size="small"
                          color={
                            priceChange.type === "increased"
                              ? "error"
                              : "success"
                          }
                          variant="filled"
                        />
                      </Box>
                    )}
                    <Typography fontWeight={700} fontSize={18}>
                      {property.price}
                    </Typography>
                    {(pricePerSquareMeter != null ||
                      (showPricePosition && pricePositionInfo)) && (
                      <Box
                        sx={{
                          mt: 0.5,
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {pricePerSquareMeter != null && (
                          <Typography variant="body2" color="text.secondary">
                            {formatPrice(pricePerSquareMeter)}/m²
                          </Typography>
                        )}
                        {showPricePosition && pricePositionInfo && (
                          <Tooltip
                            title={
                              pricePerSquareMeter != null &&
                              property.areaAvgPricePerSqm != null
                                ? `${formatPrice(pricePerSquareMeter)}/m² vs ${
                                    property.areaName || "area"
                                  } average ${formatPrice(
                                    property.areaAvgPricePerSqm,
                                  )}/m² · based on ${
                                    property.areaSnapshotPropertyCount
                                  } listings · click to see them`
                                : ""
                            }
                            arrow
                          >
                            <Link
                              href={`/areas/${property.areaId}/contributing-listings?highlightProviderId=${encodeURIComponent(
                                property.providerId,
                              )}`}
                              style={{ textDecoration: "none" }}
                              target="_blank"
                            >
                              <Chip
                                label={pricePositionInfo.label}
                                size="small"
                                color={pricePositionInfo.color}
                                variant={pricePositionInfo.variant}
                                sx={{ cursor: "pointer" }}
                              />
                            </Link>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        minWidth: 0,
                      }}
                    >
                      <LocationOnOutlined fontSize="small" color="primary" />
                      {property.areaName ? (
                        <Typography fontWeight={600} noWrap>
                          {property.areaName}
                        </Typography>
                      ) : (
                        <Typography
                          color="text.secondary"
                          fontStyle="italic"
                          noWrap
                        >
                          Area not set
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Tooltip
                        title={
                          property.aiResponseError
                            ? `AI extraction error: ${property.aiResponseError}. Click to retry.`
                            : "Extract AI metadata"
                        }
                        arrow
                      >
                        <span>
                          <IconButton
                            aria-label={`Extract AI metadata for property ${property.id}`}
                            color={property.aiResponseError ? "error" : "default"}
                            disabled={!onRetryAiMetadata || isRetrying}
                            onClick={() => handleRetryAiMetadata(property.id)}
                            size="small"
                          >
                            {isRetrying ? (
                              <CircularProgress
                                color={
                                  property.aiResponseError ? "error" : "inherit"
                                }
                                size={18}
                              />
                            ) : property.aiResponseError ? (
                              <ErrorOutline fontSize="small" />
                            ) : (
                              <AutoFixHigh fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Box sx={{ width: 34, mr: 0.5 }}>
                        {onUpdateProperty && (
                          <IconButton
                            aria-label={`Edit property ${property.id}`}
                            size="small"
                            onClick={() => setEditingProperty(property)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Button
                        href={property.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNew fontSize="small" />}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          width: 150,
                          justifyContent: "space-between",
                        }}
                      >
                        {property.source}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {onUpdateProperty && (
        <EditPropertyDialog
          open={editingProperty !== null}
          property={editingProperty}
          areas={areas}
          onClose={() => setEditingProperty(null)}
          onSave={onUpdateProperty}
        />
      )}
    </>
  );
}
