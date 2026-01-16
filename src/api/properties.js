import axios from "axios";

class PropertiesApi {
  getPaginatedProperties({ limit, page, fromDate, toDate, onlyUnseen }) {
    return axios
      .get(`http://localhost:3009/properties`, {
        params: { limit, page, fromDate, toDate, onlyUnseen },
      })
      .then((data) => data.data);
  }

  getPropertiesByProviderId({ limit, page, providerId }) {
    return axios
      .get(`http://localhost:3009/properties/provider/${providerId}`, {
        params: { providerId, limit, page },
      })
      .then((data) => data.data);
  }

  bookmarkProperty({ propertyId, bookmarked }) {
    return axios.put(
      `http://localhost:3009/properties/${propertyId}/bookmark/${bookmarked}`,
    );
  }
}

export const propertiesApi = new PropertiesApi();
