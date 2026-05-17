import { apiClient } from "@/api/client";

export interface Property {
  id: number;
  providerId: string;
  title: string;
  description: string;
  price: number;
  priceAmount?: number | null;
  squareMeters?: number | null;
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

export interface GetPaginatedPropertiesParams {
  limit: number;
  page: number;
  fromDate?: number;
  toDate?: number;
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

class PropertiesApi {
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
}

export const propertiesApi = new PropertiesApi();
