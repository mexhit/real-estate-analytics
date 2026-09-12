import { apiClient } from "@/api/client";
import { Property } from "@/api/properties";

export interface Area {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  updatedAt: string;
  avgPricePerSqm: number | null;
  avgPriceCurrency: string | null;
  snapshotPropertyCount: number | null;
  snapshotAt: string | null;
}

export interface ContributingListingsSummary {
  areaId: number;
  areaName: string;
  avgPricePerSqm: number | null;
  avgPriceCurrency: string | null;
  propertyCount: number;
  windowStart: string | null;
  windowEnd: string | null;
  highlightedListingIncluded: boolean | null;
}

export interface ContributingListingsResponse {
  summary: ContributingListingsSummary;
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetContributingListingsParams {
  areaId: number | string;
  page: number;
  limit: number;
  highlightProviderId?: string;
}

class AreasApi {
  getAreas(): Promise<Area[]> {
    return apiClient
      .get("/areas")
      .then((response: { data: Area[] }) => response.data);
  }

  getContributingListings({
    areaId,
    page,
    limit,
    highlightProviderId,
  }: GetContributingListingsParams): Promise<ContributingListingsResponse> {
    return apiClient
      .get(`/areas/${areaId}/contributing-listings`, {
        params: { page, limit, highlightProviderId },
      })
      .then(
        (response: { data: ContributingListingsResponse }) => response.data,
      );
  }

  createArea(name: string): Promise<Area> {
    return apiClient
      .post("/areas", { name })
      .then((response: { data: Area }) => response.data);
  }

  updateArea(id: number, name: string): Promise<Area> {
    return apiClient
      .put(`/areas/${id}`, { name })
      .then((response: { data: Area }) => response.data);
  }

  deleteArea(id: number, reassignToAreaId: number): Promise<void> {
    return apiClient
      .delete(`/areas/${id}`, { data: { reassignToAreaId } })
      .then(() => undefined);
  }
}

export const areasApi = new AreasApi();
