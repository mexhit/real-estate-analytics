import { apiClient } from "@/api/client";

export interface Area {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

class AreasApi {
  getAreas(): Promise<Area[]> {
    return apiClient
      .get("/areas")
      .then((response: { data: Area[] }) => response.data);
  }
}

export const areasApi = new AreasApi();
