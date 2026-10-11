"use client";

import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  ListItemText,
  MenuItem,
  Popover,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  PROPERTY_TYPES,
  type PropertySourceOption,
  type PropertyType,
} from "@/api/properties";
import type { Area } from "@/api/areas";
import { ACCENT, BORDER, WARM_BG } from "@/components/AppHeader";

export type FurnishedFilter = "any" | "yes" | "no";

export interface PropertyFilters {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  propertyTypes: PropertyType[];
  areaIds: number[];
  sources: string[];
  furnished: FurnishedFilter;
  onlyUnseen: boolean;
  onlyBookmarked: boolean;
  onlyPriceChanged: boolean;
  onlyUntyped: boolean;
  onlyUnresolved: boolean;
}

export const hasActiveFilters = (f: PropertyFilters) =>
  Boolean(
    f.fromDate ||
      f.toDate ||
      f.propertyTypes.length > 0 ||
      f.areaIds.length > 0 ||
      f.sources.length > 0 ||
      f.furnished !== "any" ||
      f.onlyUnseen ||
      f.onlyBookmarked ||
      f.onlyPriceChanged ||
      f.onlyUntyped ||
      f.onlyUnresolved,
  );

type DatePreset = "today" | "yesterday" | "7days" | "30days";

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7days", label: "7 days" },
  { key: "30days", label: "30 days" },
];

const presetRange = (preset: DatePreset, now: Dayjs) => {
  switch (preset) {
    case "today":
      return { from: now, to: now };
    case "yesterday":
      return { from: now.subtract(1, "day"), to: now.subtract(1, "day") };
    case "7days":
      return { from: now.subtract(6, "day"), to: now };
    case "30days":
      return { from: now.subtract(29, "day"), to: now };
  }
};

const activePreset = (
  fromDate: Dayjs | null,
  toDate: Dayjs | null,
  now: Dayjs,
): DatePreset | "custom" | null => {
  if (!fromDate && !toDate) {
    return null;
  }

  const match = PRESETS.find(({ key }) => {
    const { from, to } = presetRange(key, now);

    return Boolean(fromDate?.isSame(from, "day") && toDate?.isSame(to, "day"));
  });

  return match?.key ?? "custom";
};

const formatDate = (date: Dayjs | null) =>
  date ? date.format("DD MMM YYYY") : "Any";

const monoFont = "var(--font-geist-mono), ui-monospace, monospace";

const controlSx = {
  height: 44,
  bgcolor: "#fff",
  borderRadius: 2.5,
  fontSize: 15,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: BORDER },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c9c4b8" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT },
};

interface MultiFilterProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  disabled?: boolean;
  onChange: (selected: string[]) => void;
}

function MultiFilter({
  label,
  options,
  selected,
  disabled,
  onChange,
}: MultiFilterProps) {
  const renderValue = (values: string[]) => {
    if (values.length === 0) {
      return label;
    }
    if (values.length === 1) {
      return options.find((o) => o.value === values[0])?.label ?? values[0];
    }

    return `${label} · ${values.length}`;
  };

  return (
    <Select
      multiple
      displayEmpty
      value={selected}
      disabled={disabled}
      onChange={(event) => {
        const value = event.target.value;

        onChange(typeof value === "string" ? value.split(",") : value);
      }}
      renderValue={renderValue}
      sx={{ ...controlSx, fontWeight: selected.length > 0 ? 600 : 500 }}
      inputProps={{ "aria-label": label }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} dense>
          <Checkbox checked={selected.includes(option.value)} size="small" />
          <ListItemText primary={option.label} />
        </MenuItem>
      ))}
    </Select>
  );
}

interface ToggleChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleChip({ label, active, onToggle }: ToggleChipProps) {
  return (
    <Chip
      label={label}
      clickable
      onClick={onToggle}
      aria-pressed={active}
      sx={{
        height: 40,
        px: 0.75,
        fontSize: 15,
        fontWeight: 500,
        bgcolor: active ? ACCENT : "transparent",
        color: active ? "#fff" : "inherit",
        border: `1px ${active ? "solid" : "dashed"} ${active ? ACCENT : "#bdb8ac"}`,
        "&:hover": { bgcolor: active ? ACCENT : WARM_BG },
      }}
    />
  );
}

interface PropertiesFilterBarProps {
  filters: PropertyFilters;
  areas: Area[];
  sourceOptions: PropertySourceOption[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  onChange: (patch: Partial<PropertyFilters>) => void;
  onClear: () => void;
}

export function PropertiesFilterBar({
  filters,
  areas,
  sourceOptions,
  sourcesLoading,
  sourcesError,
  onChange,
  onClear,
}: PropertiesFilterBarProps) {
  const [rangeAnchor, setRangeAnchor] = React.useState<HTMLElement | null>(
    null,
  );
  const now = dayjs();
  const preset = activePreset(filters.fromDate, filters.toDate, now);

  const applyPreset = (key: DatePreset) => {
    const { from, to } = presetRange(key, now);

    onChange({ fromDate: from.startOf("day"), toDate: to.endOf("day") });
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        gap={2}
        flexWrap="wrap"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Properties
          </Typography>
          <Typography color="text.secondary">
            {filters.fromDate || filters.toDate
              ? `Listings first seen between ${formatDate(filters.fromDate)} and ${formatDate(filters.toDate)}`
              : "All listings"}
          </Typography>
        </Box>
        <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={preset}
            onChange={(_, value: DatePreset | "custom" | null) => {
              if (value === "custom") {
                return;
              }
              if (value) {
                applyPreset(value);
              }
            }}
            sx={{
              bgcolor: "#ebe8e1",
              p: 0.5,
              borderRadius: 2.5,
              "& .MuiToggleButton-root": {
                border: 0,
                borderRadius: "10px !important",
                px: 2,
                textTransform: "none",
                fontSize: 15,
                color: "#55524c",
                "&.Mui-selected": {
                  bgcolor: "#fff",
                  color: "#171717",
                  fontWeight: 600,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                },
              },
            }}
          >
            {PRESETS.map(({ key, label }) => (
              <ToggleButton key={key} value={key}>
                {label}
              </ToggleButton>
            ))}
            <ToggleButton
              value="custom"
              selected={preset === "custom"}
              onClick={(event) => setRangeAnchor(event.currentTarget)}
            >
              Custom
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            onClick={(event) => setRangeAnchor(event.currentTarget)}
            startIcon={<CalendarMonthOutlinedIcon />}
            sx={{
              height: 48,
              px: 2,
              bgcolor: "#fff",
              color: "#171717",
              border: `1px solid ${BORDER}`,
              borderRadius: 2.5,
              fontFamily: monoFont,
              fontSize: 14,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            {formatDate(filters.fromDate)}
            <ArrowForwardIcon sx={{ fontSize: 16, mx: 1 }} />
            {formatDate(filters.toDate)}
          </Button>
        </Box>
      </Box>

      <Popover
        open={Boolean(rangeAnchor)}
        anchorEl={rangeAnchor}
        onClose={() => setRangeAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box p={2} display="flex" flexDirection="column" gap={2}>
          <DatePicker
            label="From date"
            value={filters.fromDate}
            onChange={(value) => onChange({ fromDate: value })}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="To date"
            value={filters.toDate}
            onChange={(value) => onChange({ toDate: value })}
            slotProps={{ textField: { size: "small" } }}
          />
        </Box>
      </Popover>

      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
        p={2}
        mb={2}
        sx={{
          bgcolor: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: 3,
        }}
      >
        <MultiFilter
          label="Property type"
          options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
          selected={filters.propertyTypes}
          disabled={filters.onlyUntyped}
          onChange={(selected) =>
            onChange({ propertyTypes: selected as PropertyType[] })
          }
        />
        <MultiFilter
          label="Area"
          options={areas.map((area) => ({
            value: String(area.id),
            label: area.name,
          }))}
          selected={filters.areaIds.map(String)}
          disabled={filters.onlyUnresolved}
          onChange={(selected) => onChange({ areaIds: selected.map(Number) })}
        />
        <MultiFilter
          label={
            sourcesLoading
              ? "Loading sources…"
              : sourcesError
                ? sourcesError
                : "Source"
          }
          options={sourceOptions}
          selected={filters.sources}
          disabled={sourcesLoading || Boolean(sourcesError)}
          onChange={(selected) => onChange({ sources: selected })}
        />
        <Select
          value={filters.furnished}
          onChange={(event) =>
            onChange({ furnished: event.target.value as FurnishedFilter })
          }
          renderValue={(value) => (
            <>
              <Box component="span" color="text.secondary">
                Furnished:{" "}
              </Box>
              {value === "any" ? "Any" : value === "yes" ? "Yes" : "No"}
            </>
          )}
          sx={controlSx}
          inputProps={{ "aria-label": "Furnished" }}
        >
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </Select>

        <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: BORDER }} />

        <ToggleChip
          label="Unseen"
          active={filters.onlyUnseen}
          onToggle={() => onChange({ onlyUnseen: !filters.onlyUnseen })}
        />
        <ToggleChip
          label="Bookmarked"
          active={filters.onlyBookmarked}
          onToggle={() => onChange({ onlyBookmarked: !filters.onlyBookmarked })}
        />
        <ToggleChip
          label="Price changed"
          active={filters.onlyPriceChanged}
          onToggle={() =>
            onChange({ onlyPriceChanged: !filters.onlyPriceChanged })
          }
        />

        <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: BORDER }} />

        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.8,
            color: "#9a5b13",
          }}
        >
          NEEDS REVIEW
        </Typography>
        <ToggleChip
          label="Missing area"
          active={filters.onlyUnresolved}
          onToggle={() =>
            onChange({
              onlyUnresolved: !filters.onlyUnresolved,
              ...(!filters.onlyUnresolved && { areaIds: [] }),
            })
          }
        />
        <ToggleChip
          label="Untyped"
          active={filters.onlyUntyped}
          onToggle={() =>
            onChange({
              onlyUntyped: !filters.onlyUntyped,
              ...(!filters.onlyUntyped && { propertyTypes: [] }),
            })
          }
        />

        {hasActiveFilters(filters) && (
          <Button
            size="small"
            onClick={onClear}
            sx={{ ml: "auto", textTransform: "none", color: ACCENT }}
          >
            Clear filters
          </Button>
        )}
      </Box>
    </>
  );
}
