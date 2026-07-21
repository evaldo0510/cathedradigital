/**
 * ai-gateway.ts — provider helper compartilhado (Lovable AI Gateway).
 *
 * Uso padrão nas edge functions Deno:
 *
 *   import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
 *   import { generateText, Output } from "npm:ai";
 *
 *   const gateway = createLovableAiGatewayProvider(Deno.env.get("LOVABLE_API_KEY")!);
 *   const { output } = await generateText({ model: gateway("google/gemini-2.5-flash"), ... });
 */
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  options?: { structuredOutputs?: boolean },
) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export { LOVABLE_AIG_RUN_ID_HEADER };
