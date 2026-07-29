import type { ChatMessage, LlmClient, LlmCompletionOptions } from './LlmClient.js';
import { LlmUnavailableError } from './LlmClient.js';

const REQUEST_TIMEOUT_MS = 120_000;

export interface OllamaConfig {
    readonly baseUrl: string;
    readonly model: string;
}

interface OllamaChatResponse {
    readonly message?: { readonly content?: string };
}

export class OllamaClient implements LlmClient {
    constructor(private readonly config: OllamaConfig) {}

    async complete(messages: ChatMessage[], options: LlmCompletionOptions = {}): Promise<string> {
        const response = await this.post(messages, options);

        if (!response.ok) {
            throw new LlmUnavailableError(
                `Ollama replied with ${response.status}. ${this.troubleshootingHint()}`,
            );
        }

        const payload = (await response.json()) as OllamaChatResponse;
        const content = payload.message?.content;

        if (content === undefined || content.trim() === '') {
            throw new LlmUnavailableError(
                `Ollama returned an empty reply. ${this.troubleshootingHint()}`,
            );
        }

        return content;
    }

    private async post(messages: ChatMessage[], options: LlmCompletionOptions): Promise<Response> {
        try {
            return await fetch(`${this.config.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                body: JSON.stringify({
                    model: this.config.model,
                    messages,
                    stream: false,
                    ...(options.json === true ? { format: 'json' } : {}),
                    options: { temperature: options.temperature ?? 0.7 },
                }),
            });
        } catch (cause) {
            const reason =
                cause instanceof Error && cause.name === 'TimeoutError'
                    ? 'timed out'
                    : 'is unreachable';

            throw new LlmUnavailableError(`Ollama ${reason}. ${this.troubleshootingHint()}`);
        }
    }

    private troubleshootingHint(): string {
        return `Is Ollama running at ${this.config.baseUrl}? Try \`ollama serve\` and \`ollama pull ${this.config.model}\`, or restart the server with LLM_PROVIDER=mock.`;
    }
}
