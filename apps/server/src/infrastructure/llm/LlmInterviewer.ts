import type { ChatMessage, LlmClient } from './LlmClient.js';
import type { GeneratedQuestion, InterviewerGateway } from '../../domain/interview/ports.js';
import type { InterviewSession } from '../../domain/interview/InterviewSession.js';
import { EvaluationOutputSchema, QuestionOutputSchema, ReportOutputSchema } from './schemas.js';
import { evaluationPrompt, nextQuestionPrompt, reportPrompt } from './prompts.js';
import type { InterviewTurn } from '../../domain/interview/InterviewTurn.js';
import type { Evaluation } from '../../domain/interview/Evaluation.js';
import type { InterviewReport } from '../../domain/interview/InterviewReport.js';
import { LlmUnavailableError } from './LlmClient.js';
import type { ZodType, z } from 'zod';

const CORRECTION_MESSAGE: ChatMessage = {
    role: 'user',
    content:
        'Your previous reply was not valid JSON matching the required schema. ' +
        'Reply with ONLY the JSON object: no prose, no explanation, no markdown fences.',
};

export class LlmInterviewer implements InterviewerGateway {
    constructor(private readonly llm: LlmClient) {}

    async askNextQuestion(session: InterviewSession): Promise<GeneratedQuestion> {
        return this.completeJson(QuestionOutputSchema, nextQuestionPrompt(session));
    }

    async evaluateAnswer(session: InterviewSession, turn: InterviewTurn): Promise<Evaluation> {
        return this.completeJson(EvaluationOutputSchema, evaluationPrompt(session, turn));
    }

    async writeReport(session: InterviewSession): Promise<InterviewReport> {
        return this.completeJson(ReportOutputSchema, reportPrompt(session));
    }

    private async completeJson<S extends ZodType>(
        schema: S,
        messages: ChatMessage[],
    ): Promise<z.infer<S>> {
        const firstReply = await this.llm.complete(messages, { json: true, temperature: 0.7 });
        const firstAttempt = parseJson(schema, firstReply);

        if (firstAttempt !== null) {
            return firstAttempt;
        }

        const retryReply = await this.llm.complete(
            [...messages, { role: 'assistant', content: firstReply }, CORRECTION_MESSAGE],
            { json: true, temperature: 0.2 },
        );
        const retryAttempt = parseJson(schema, retryReply);

        if (retryAttempt === null) {
            throw new LlmUnavailableError(
                'The model returned malformed output twice. Try a stronger model such as qwen2.5:7b, or run with LLM_PROVIDER=mock.',
            );
        }

        return retryAttempt;
    }
}

function parseJson<S extends ZodType>(schema: S, reply: string): z.infer<S> | null {
    let candidate: unknown;

    try {
        candidate = JSON.parse(stripCodeFence(reply));
    } catch {
        return null;
    }

    const result = schema.safeParse(candidate);

    return result.success ? result.data : null;
}

function stripCodeFence(reply: string): string {
    const trimmed = reply.trim();
    const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);

    return fenced?.[1] ?? trimmed;
}
