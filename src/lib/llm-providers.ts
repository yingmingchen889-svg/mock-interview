/**
 * Multi-provider LLM configuration.
 *
 * Each provider has a set of models. A provider is "available" if its API key
 * is configured in the environment. The frontend only shows available models.
 */

export interface LLMModel {
  /** Unique model ID used in DB and API calls, e.g. "deepseek-chat" */
  id: string;
  /** Display name shown in UI */
  label: string;
  /** Short description */
  description: string;
  /** Which subscription tier can use this model */
  tier: "FREE" | "PRO" | "PREMIUM";
  /** Provider this model belongs to */
  provider: string;
}

export interface LLMProvider {
  /** Provider key, e.g. "deepseek", "openai" */
  key: string;
  /** Display name */
  label: string;
  /** Base URL for OpenAI-compatible API */
  baseURL: string;
  /** Environment variable name that holds the API key */
  envKey: string;
  /** Models offered by this provider */
  models: LLMModel[];
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    key: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com",
    envKey: "DEEPSEEK_API_KEY",
    models: [
      {
        id: "deepseek-chat",
        label: "DeepSeek V3",
        description: "高性价比，中文能力强",
        tier: "FREE",
        provider: "deepseek",
      },
      {
        id: "deepseek-reasoner",
        label: "DeepSeek R1",
        description: "深度推理，追问更精准",
        tier: "PRO",
        provider: "deepseek",
      },
    ],
  },
  {
    key: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    models: [
      {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "快速响应，性价比高",
        tier: "FREE",
        provider: "openai",
      },
      {
        id: "gpt-4o",
        label: "GPT-4o",
        description: "深度追问能力",
        tier: "PRO",
        provider: "openai",
      },
    ],
  },
  {
    key: "anthropic",
    label: "Anthropic",
    baseURL: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    models: [
      {
        id: "claude-sonnet",
        label: "Claude Sonnet",
        description: "细致逻辑分析",
        tier: "PRO",
        provider: "anthropic",
      },
    ],
  },
];

/**
 * Get available models based on which API keys are configured.
 * Call this on the server side only (reads process.env).
 */
export function getAvailableModels(): LLMModel[] {
  const available: LLMModel[] = [];
  for (const provider of LLM_PROVIDERS) {
    const apiKey = process.env[provider.envKey];
    if (apiKey && apiKey.trim() !== "") {
      available.push(...provider.models);
    }
  }
  return available;
}

/**
 * Get the provider config for a given model ID.
 */
export function getProviderForModel(modelId: string): { provider: LLMProvider; model: LLMModel } | null {
  for (const provider of LLM_PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      return { provider, model };
    }
  }
  return null;
}

/**
 * Get the API key for a given provider.
 */
export function getProviderApiKey(providerKey: string): string {
  const provider = LLM_PROVIDERS.find((p) => p.key === providerKey);
  if (!provider) return "";
  return process.env[provider.envKey] ?? "";
}
