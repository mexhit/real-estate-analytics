"use client";

import * as React from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Drawer,
  ListItemText,
  MenuItem,
  Popover,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
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

const countActiveFilters = (f: PropertyFilters) =>
  [
    f.fromDate || f.toDate,
    f.propertyTypes.length > 0,
    f.areaIds.length > 0,
    f.sources.length > 0,
    f.furnished !== "any",
    f.onlyUnseen,
    f.onlyBookmarked,
    f.onlyPriceChanged,
    f.onlyUntyped,
    f.onlyUnresolved,
  ].filter(Boolean).length;

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
  fullWidth?: boolean;
  onChange: (selected: string[]) => void;
}

function MultiFilter({
  label,
  options,
  selected,
  disabled,
  fullWidth,
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
      fullWidth={fullWidth}
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
        height: { xs: 44, sm: 40 },
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

const EMPTY_FILTERS: PropertyFilters = {
  fromDate: null,
  toDate: null,
  propertyTypes: [],
  areaIds: [],
  sources: [],
  furnished: "any",
  onlyUnseen: false,
  onlyBookmarked: false,
  onlyPriceChanged: false,
  onlyUntyped: false,
  onlyUnresolved: false,
};

interface PropertiesFilterBarProps {
  filters: PropertyFilters;
  areas: Area[];
  sourceOptions: PropertySourceOption[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  onChange: (patch: Partial<PropertyFilters>) => void;
  onClear: () => void;
}

interface FilterFieldsProps
  extends Pick<
    PropertiesFilterBarProps,
    "filters" | "areas" | "sourceOptions" | "sourcesLoading" | "sourcesError"
  > {
  onChange: (patch: Partial<PropertyFilters>) => void;
  stacked?: boolean;
}

function FilterFields({
  filters,
  areas,
  sourceOptions,
  sourcesLoading,
  sourcesError,
  onChange,
  stacked = false,
}: FilterFieldsProps) {
  const divider = stacked ? null : (
    <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: BORDER }} />
  );

  return (
    <>
      <MultiFilter
        label="Property type"
        options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
        selected={filters.propertyTypes}
        disabled={filters.onlyUntyped}
        fullWidth={stacked}
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
        fullWidth={stacked}
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
        fullWidth={stacked}
        onChange={(selected) => onChange({ sources: selected })}
      />
      <Select
        value={filters.furnished}
        fullWidth={stacked}
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

      {divider}

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

      {divider}

      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.8,
          color: "#9a5b13",
          ...(stacked && { flexBasis: "100%", mt: 1 }),
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
    </>
  );
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
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<PropertyFilters>(filters);
  const now = dayjs();
  const preset = activePreset(filters.fromDate, filters.toDate, now);
  const draftPreset = activePreset(draft.fromDate, draft.toDate, now);
  const activeCount = countActiveFilters(filters);

  const applyPreset = (key: DatePreset) => {
    const { from, to } = presetRange(key, now);

    onChange({ fromDate: from.startOf("day"), toDate: to.endOf("day") });
  };

  const patchDraft = (patch: Partial<PropertyFilters>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const openSheet = () => {
    setDraft(filters);
    setSheetOpen(true);
  };

  const applySheet = () => {
    onChange(draft);
    setSheetOpen(false);
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        gap={2}
        flexWrap="wrap"
        mb={{ xs: 2, sm: 3 }}
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
        <Box
          sx={{ display: { xs: "none", sm: "flex" } }}
          gap={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
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
        display={{ xs: "none", sm: "flex" }}
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
        <FilterFields
          filters={filters}
          areas={areas}
          sourceOptions={sourceOptions}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          onChange={onChange}
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

      <Box
        sx={{
          display: { xs: "flex", sm: "none" },
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={openSheet}
          startIcon={
            <Badge badgeContent={activeCount} color="primary">
              <TuneIcon />
            </Badge>
          }
          sx={{
            flexGrow: 1,
            minHeight: 44,
            bgcolor: "#fff",
            color: "#171717",
            borderColor: BORDER,
            borderRadius: 2.5,
            textTransform: "none",
            fontSize: 15,
            fontWeight: 600,
            "& .MuiButton-startIcon": { mr: 1.5 },
          }}
        >
          Filters
        </Button>
        {hasActiveFilters(filters) && (
          <Button
            onClick={onClear}
            sx={{ minHeight: 44, textTransform: "none", color: ACCENT }}
          >
            Clear
          </Button>
        )}
      </Box>

      <Drawer
        anchor="bottom"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sx={{ display: { sm: "none" } }}
        slotProps={{
          paper: {
            sx: {
              maxHeight: "90dvh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              bgcolor: WARM_BG,
            },
          },
        }}
      >
        <Typography fontWeight={700} fontSize={18} sx={{ px: 2, pt: 2, pb: 1 }}>
          Filters
        </Typography>
        <Box sx={{ overflowY: "auto", px: 2, pb: 2 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            First seen
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
            {PRESETS.map(({ key, label }) => (
              <ToggleChip
                key={key}
                label={label}
                active={draftPreset === key}
                onToggle={() => {
                  if (draftPreset === key) {
                    patchDraft({ fromDate: null, toDate: null });
                    return;
                  }
                  const { from, to } = presetRange(key, now);

                  patchDraft({
                    fromDate: from.startOf("day"),
                    toDate: to.endOf("day"),
                  });
                }}
              />
            ))}
          </Box>
          <Box display="flex" gap={1.5} mb={2.5}>
            <DatePicker
              label="From date"
              value={draft.fromDate}
              onChange={(value) => patchDraft({ fromDate: value })}
              slotProps={{
                textField: { size: "small", fullWidth: true },
                openPickerButton: { sx: { width: 44, height: 44 } },
              }}
            />
            <DatePicker
              label="To date"
              value={draft.toDate}
              onChange={(value) => patchDraft({ toDate: value })}
              slotProps={{
                textField: { size: "small", fullWidth: true },
                openPickerButton: { sx: { width: 44, height: 44 } },
              }}
            />
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1.5}>
            <FilterFields
              stacked
              filters={draft}
              areas={areas}
              sourceOptions={sourceOptions}
              sourcesLoading={sourcesLoading}
              sourcesError={sourcesError}
              onChange={patchDraft}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            px: 2,
            pt: 1.5,
            pb: "max(16px, env(safe-area-inset-bottom))",
            bgcolor: "#fff",
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <Button
            onClick={() => setDraft(EMPTY_FILTERS)}
            sx={{ minHeight: 44, textTransform: "none", color: ACCENT }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={applySheet}
            sx={{
              flexGrow: 1,
              minHeight: 44,
              textTransform: "none",
              bgcolor: ACCENT,
              "&:hover": { bgcolor: ACCENT },
            }}
          >
            Apply
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
