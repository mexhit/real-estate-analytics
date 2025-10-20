import axios from 'axios';

class PropertiesApi {
    getPaginatedProperties() {
        return axios.get('http://localhost:3009/properties?page=1&limit=10')
            .then(data => data.data);
    }
}

export const propertiesApi = new PropertiesApi();
