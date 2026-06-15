import type { LLMProvider } from "@/lib/llm/types";
import { geminiProvider } from "./gemini";

export const LLM_PROVIDERS: LLMProvider[] = [geminiProvider];