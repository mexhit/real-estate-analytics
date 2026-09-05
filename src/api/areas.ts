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
