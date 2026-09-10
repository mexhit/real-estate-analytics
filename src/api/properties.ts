import { apiClient } from "@/api/client";

export const PROPERTY_TYPES = [
  "APARTMENT_1_1",
  "APARTMENT_2_1",
  "APARTMENT_3_1",
  "STUDIO",
  "PRIVATE_HOUSE",
  "VILLA",
  "OFFICE",
  "LAND",
  "PARKING",
  "SHOP",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type PricePosition = "above" | "below" | "in_line";

export interface Property {
  id: number;
  providerId: string;
  title: string;
  description: string;
  aiResponseError?: string | null;
  propertyType?: PropertyType | null;
  areaName?: string | null;
  price: number;
  priceAmount?: number | null;
  squareMeters?: number | null;
  areaAvgPricePerSqm?: number | null;
  areaAvgPriceCurrency?: string | null;
  areaSnapshotPropertyCount?: number | null;
  pricePosition?: PricePosition | null;
  pricePositionPercentage?: number | null;
  url: string;
  createdAt: number;
  seen: boolean;
  bookmarked: boolean;
  providerPropertyCount: string;
  firstPostedAt: string;
  lastPostedAt: string;
  firstPrice: string;
  lastPrice: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface NewPropertySeriesPoint {
  date: string;
  count: number;
}

export interface GetPaginatedPropertiesParams {
  limit: number;
  page: number;
  fromDate?: number;
  toDate?: number;
  propertyTypes?: PropertyType[];
  areaIds?: number[];
  onlyUnseen?: boolean;
  onlyBookmarked?: boolean;
  onlyPriceChanged?: boolean;
}

export interface GetPropertiesByProviderIdParams {
  limit: number;
  page: number;
  providerId: number | string;
}

export interface BookmarkPropertyParams {
  propertyId: number;
  bookmarked?: boolean;
}

export interface ExtractAiMetadataParams {
  propertyId: number;
}

class PropertiesApi {
  getNewPropertiesSeries(): Promise<NewPropertySeriesPoint[]> {
    return apiClient
      .get("/properties/analytics/new-properties")
      .then((response: { data: NewPropertySeriesPoint[] }) => response.data);
  }

  getPaginatedProperties(
    params: GetPaginatedPropertiesParams,
  ): Promise<PaginatedResponse<Property>> {
    return apiClient
      .get("/properties", { params })
      .then((response: { data: PaginatedResponse<Property> }) => response.data);
  }

  getPropertiesByProviderId(
    params: GetPropertiesByProviderIdParams,
  ): Promise<PaginatedResponse<Property>> {
    const { providerId } = params;

    return apiClient
      .get(`/properties/provider/${providerId}`, { params })
      .then((response: { data: PaginatedResponse<Property> }) => response.data);
  }

  bookmarkProperty({ propertyId, bookmarked }: BookmarkPropertyParams) {
    return apiClient.put(`/properties/${propertyId}/bookmark/${bookmarked}`);
  }

  extractAiMetadata({
    propertyId,
  }: ExtractAiMetadataParams): Promise<Property> {
    return apiClient
      .post("/properties/ai-metadata", { propertyId })
      .then((response: { data: Property }) => response.data);
  }
}

export const propertiesApi = new PropertiesApi();
