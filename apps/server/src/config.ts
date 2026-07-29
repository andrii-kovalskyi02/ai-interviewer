import { z } from 'zod';

export const LlmProvider = {
    Mock: 'mock',
    Ollama: 'ollama',
} as const;

export type LlmProvider = (typeof LlmProvider)[keyof typeof LlmProvider];

const EnvSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3001),
    LLM_PROVIDER: z.enum([LlmProvider.Mock, LlmProvider.Ollama]).default(LlmProvider.Mock),
    OLLAMA_BASE_URL: z.url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().min(1).default('llama3.2:3b'),
});

export type LlmConfig =
    | { readonly provider: typeof LlmProvider.Mock }
    | {
          readonly provider: typeof LlmProvider.Ollama;
          readonly baseUrl: string;
          readonly model: string;
      };

export interface AppConfig {
    readonly port: number;
    readonly llm: LlmConfig;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
    const result = EnvSchema.safeParse(env);

    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
            .join('\n');

        throw new Error(`Invalid environment configuration:\n${details}`);
    }

    const parsed = result.data;

    return {
        port: parsed.PORT,
        llm:
            parsed.LLM_PROVIDER === LlmProvider.Ollama
                ? {
                      provider: LlmProvider.Ollama,
                      baseUrl: parsed.OLLAMA_BASE_URL,
                      model: parsed.OLLAMA_MODEL,
                  }
                : { provider: LlmProvider.Mock },
    };
}
