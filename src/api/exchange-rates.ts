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

export type RateCurrency = "EUR" | "USD";
export type RateHistoryRange = "today" | "yesterday" | "week";

export interface RateHistoryPoint {
  at: string;
  buy: number;
  sell: number;
}

export interface RateHistory {
  currency: RateCurrency;
  range: RateHistoryRange;
  source: string | null;
  points: RateHistoryPoint[];
}

class ExchangeRatesApi {
  getHistory(
    currency: RateCurrency,
    range: RateHistoryRange,
  ): Promise<RateHistory> {
    return apiClient
      .get("/exchange-rates/history", { params: { currency, range } })
      .then((response: { data: RateHistory }) => response.data);
  }

  getLatest(): Promise<LatestExchangeRates> {
    return apiClient
      .get("/exchange-rates/latest")
      .then((response: { data: LatestExchangeRates }) => response.data);
  }
}

export const exchangeRatesApi = new ExchangeRatesApi();
