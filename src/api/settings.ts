import { apiClient } from "@/api/client";

export const AI_PROVIDERS = ["GEMINI", "GROQ"] as const;

export type AiProviderType = (typeof AI_PROVIDERS)[number];

export interface AiProviderSetting {
  aiProvider: AiProviderType;
}

class SettingsApi {
  getAiProvider(): Promise<AiProviderSetting> {
    return apiClient
      .get("/settings/ai-provider")
      .then((response: { data: AiProviderSetting }) => response.data);
  }

  updateAiProvider(aiProvider: AiProviderType): Promise<AiProviderSetting> {
    return apiClient
      .patch("/settings/ai-provider", { aiProvider })
      .then((response: { data: AiProviderSetting }) => response.data);
  }
}

export const settingsApi = new SettingsApi();
