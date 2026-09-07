import { apiClient } from "@/api/client";

export interface AreaSnapshotRunResult {
  areaId: number;
  areaName: string;
  propertyCount?: number;
  excludedCount?: number;
  error?: string;
}

export type AreaPriceSnapshotJobResult =
  | { status: "skipped"; reason: string }
  | { status: "completed"; areas: AreaSnapshotRunResult[] };

class JobsApi {
  runAreaPriceSnapshot(): Promise<AreaPriceSnapshotJobResult> {
    return apiClient
      .post("/jobs/area-price-snapshot/run")
      .then(
        (response: { data: AreaPriceSnapshotJobResult }) => response.data,
      );
  }
}

export const jobsApi = new JobsApi();
