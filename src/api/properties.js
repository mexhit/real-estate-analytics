import { apiClient } from "@/api/client";

class PropertiesApi {
  getPaginatedProperties({
    limit,
    page,
    fromDate,
    toDate,
    onlyUnseen,
    onlyBookmarked,
    onlyPriceChanged,
  }) {
    return apiClient
      .get("/properties", {
        params: {
          limit,
          page,
          fromDate,
          toDate,
          onlyUnseen,
          onlyBookmarked,
          onlyPriceChanged,
        },
      })
      .then((data) => data.data);
  }

  getPropertiesByProviderId({ limit, page, providerId }) {
    return apiClient
      .get(`/properties/provider/${providerId}`, {
        params: { providerId, limit, page },
      })
      .then((data) => data.data);
  }

  bookmarkProperty({ propertyId, bookmarked }) {
    return apiClient.put(
      `/properties/${propertyId}/bookmark/${bookmarked}`,
    );
  }
}

export const propertiesApi = new PropertiesApi();
