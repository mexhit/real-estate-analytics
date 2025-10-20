import axios from "axios";

class PropertiesApi {
  getPaginatedProperties({ limit, page }) {
    return axios
      .get(`http://localhost:3009/properties?page=${page}&limit=${limit}`)
      .then((data) => data.data);
  }
}

export const propertiesApi = new PropertiesApi();
