import { apiClient } from "@/api/client";

export type RateTrend = "up" | "down" | "unchanged" | "none";

export interface LatestExchangeRate {
  buy: number;
  sell: number;
  buyTrend: RateTrend;
  sellTrend: RateTrend;
  previousBuy: number | null;
  previousSell: number | null;
}

export interface LatestExchangeRates {
  source: string | null;
  fetchedAt: string | null;
  quoteCurrency: string;
  rates: { EUR?: LatestExchangeRate; USD?: LatestExchangeRate };
}

class ExchangeRatesApi {
  getLatest(): Promise<LatestExchangeRates> {
    return apiClient
      .get("/exchange-rates/latest")
      .then((response: { data: LatestExchangeRates }) => response.data);
  }
}

export const exchangeRatesApi = new ExchangeRatesApi();
