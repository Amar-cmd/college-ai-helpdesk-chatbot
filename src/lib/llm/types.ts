export type LLMErrorType =
  | "rate_limit"
  | "timeout"
  | "auth_error"
  | "server_error"
  | "unknown_error"
  | "disabled"
  | "missing_api_key"
  | "missing_model";

export type LLMGenerateInput = {
  prompt: string;
};

export type LLMResult =
  | {
      success: true;
      text: string;
      providerName: string;
      modelName: string;
      latencyMs: number;
    }
  | {
      success: false;
      errorType: LLMErrorType;
      errorMessage: string;
      providerName: string;
      modelName: string;
      latencyMs: number;
    };

export type LLMProvider = {
  name: string;
  modelName: string;
  enabled: boolean;
  generate: (input: LLMGenerateInput) => Promise<LLMResult>;
};

export type LLMRouterResult = {
  success: boolean;
  text: string;
  providerUsed: string;
  modelUsed: string | null;
  latencyMs: number;
  attempts: LLMResult[];
};