"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { isAxiosError } from "axios";
import { PROPERTY_TYPES, type UpdatePropertyPayload } from "@/api/properties";
import { type Area } from "@/api/areas";
import { type PropertyTableItem } from "@/components/PropertyTable";

const NO_AREA_VALUE = "__none__";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
}

interface EditableFields {
  title: string;
  description: string;
  priceAmount: string;
  priceCurrency: string;
  squareMeters: string;
  propertyType: string;
  areaId: string;
}

interface EditPropertyDialogProps {
  open: boolean;
  property: PropertyTableItem | null;
  areas: Area[];
  onClose: () => void;
  onSave: (
    propertyId: number,
    updates: UpdatePropertyPayload,
  ) => Promise<void>;
}

export function EditPropertyDialog({
  open,
  property,
  areas,
  onClose,
  onSave,
}: EditPropertyDialogProps) {
  const [initialFields, setInitialFields] =
    React.useState<EditableFields | null>(null);
  const [fields, setFields] = React.useState<EditableFields | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (property) {
      const initial: EditableFields = {
        title: property.title ?? "",
        description: property.description ?? "",
        priceAmount:
          property.priceAmount != null ? String(property.priceAmount) : "",
        priceCurrency: property.priceCurrency ?? "",
        squareMeters:
          property.squareMeters != null ? String(property.squareMeters) : "",
        propertyType: property.propertyType ?? "",
        areaId:
          property.areaId != null ? String(property.areaId) : NO_AREA_VALUE,
      };

      setInitialFields(initial);
      setFields(initial);
      setError(null);
    } else {
      setInitialFields(null);
      setFields(null);
    }
  }, [property]);

  const handleClose = () => {
    if (saving) {
      return;
    }
    onClose();
  };

  const setField = <K extends keyof EditableFields>(
    key: K,
    value: EditableFields[K],
  ) => {
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!property || !fields || !initialFields) {
      return;
    }

    const updates: UpdatePropertyPayload = {};

    if (fields.title !== initialFields.title) {
      updates.title = fields.title;
    }
    if (fields.description !== initialFields.description) {
      updates.description = fields.description;
    }
    if (fields.priceAmount !== initialFields.priceAmount) {
      updates.priceAmount =
        fields.priceAmount === "" ? null : Number(fields.priceAmount);
    }
    if (fields.priceCurrency !== initialFields.priceCurrency) {
      updates.priceCurrency =
        fields.priceCurrency === "" ? null : fields.priceCurrency;
    }
    if (fields.squareMeters !== initialFields.squareMeters) {
      updates.squareMeters =
        fields.squareMeters === "" ? null : Number(fields.squareMeters);
    }
    if (fields.propertyType !== initialFields.propertyType) {
      updates.propertyType =
        fields.propertyType === ""
          ? null
          : (fields.propertyType as UpdatePropertyPayload["propertyType"]);
    }
    if (fields.areaId !== initialFields.areaId) {
      updates.areaId =
        fields.areaId === NO_AREA_VALUE ? null : Number(fields.areaId);
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSave(property.id, updates);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update property"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Edit Property</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {error && <Alert severity="error">{error}</Alert>}

            {fields && (
              <>
                <TextField
                  label="Title"
                  value={fields.title}
                  onChange={(e) => setField("title", e.target.value)}
                  required
                  fullWidth
                  autoFocus
                />

                <TextField
                  label="Description"
                  value={fields.description}
                  onChange={(e) => setField("description", e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />

                <Box display="flex" gap={2}>
                  <TextField
                    label="Price amount"
                    type="number"
                    value={fields.priceAmount}
                    onChange={(e) => setField("priceAmount", e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Currency"
                    value={fields.priceCurrency}
                    onChange={(e) =>
                      setField("priceCurrency", e.target.value.toUpperCase())
                    }
                    fullWidth
                  />
                </Box>

                <TextField
                  label="Square meters"
                  type="number"
                  value={fields.squareMeters}
                  onChange={(e) => setField("squareMeters", e.target.value)}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="edit-property-type-label">
                    Property type
                  </InputLabel>
                  <Select
                    labelId="edit-property-type-label"
                    label="Property type"
                    value={fields.propertyType}
                    onChange={(e) =>
                      setField("propertyType", e.target.value as string)
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {PROPERTY_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="edit-property-area-label">Area</InputLabel>
                  <Select
                    labelId="edit-property-area-label"
                    label="Area"
                    value={fields.areaId}
                    onChange={(e) =>
                      setField("areaId", e.target.value as string)
                    }
                  >
                    <MenuItem value={NO_AREA_VALUE}>
                      <em>None</em>
                    </MenuItem>
                    {areas.map((area) => (
                      <MenuItem key={area.id} value={String(area.id)}>
                        {area.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !fields?.title.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
