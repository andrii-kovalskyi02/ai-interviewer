export interface ChatMessage {
    readonly role: 'system' | 'user' | 'assistant';
    readonly content: string;
}

export interface LlmCompletionOptions {
    readonly json?: boolean;
    readonly temperature?: number;
}

export interface LlmClient {
    complete(messages: ChatMessage[], options?: LlmCompletionOptions): Promise<string>;
}

export class LlmUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
