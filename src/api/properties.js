import axios from "axios";

class PropertiesApi {
  getPaginatedProperties({ limit, page, providerId }) {
    return axios
      .get(`http://localhost:3009/properties`, {
        params: { providerId, limit, page },
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
}

export const propertiesApi = new PropertiesApi();
