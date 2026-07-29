import type { ChatMessage, LlmClient } from './LlmClient.js';
import type { GeneratedQuestion, InterviewerGateway } from '../../domain/interview/ports.js';
import type { InterviewSession } from '../../domain/interview/InterviewSession.js';
import { EvaluationOutputSchema, QuestionOutputSchema, ReportOutputSchema } from './schemas.js';
import { evaluationPrompt, nextQuestionPrompt, reportPrompt } from './prompts.js';
import type { InterviewTurn } from '../../domain/interview/InterviewTurn.js';
import type { Evaluation } from '../../domain/interview/Evaluation.js';
import type { InterviewReport } from '../../domain/interview/InterviewReport.js';
import { verdictForScore } from '../../domain/interview/scoring.js';
import { LlmUnavailableError } from './LlmClient.js';
import type { ZodType, z } from 'zod';

interface ParseFailure {
    readonly reason: string;
}

function correctionMessage(failure: ParseFailure): ChatMessage {
    return {
        role: 'user',
        content:
            `Your previous reply was rejected: ${failure.reason}. ` +
            'Fix exactly that and reply with ONLY the JSON object, using the required field ' +
            'names: no prose, no explanation, no markdown fences.',
    };
}

export class LlmInterviewer implements InterviewerGateway {
    constructor(private readonly llm: LlmClient) {}

    async askNextQuestion(session: InterviewSession): Promise<GeneratedQuestion> {
        return this.completeJson(QuestionOutputSchema, nextQuestionPrompt(session));
    }

    async evaluateAnswer(session: InterviewSession, turn: InterviewTurn): Promise<Evaluation> {
        return this.completeJson(EvaluationOutputSchema, evaluationPrompt(session, turn));
    }

    async writeReport(session: InterviewSession): Promise<InterviewReport> {
        const narrative = await this.completeJson(ReportOutputSchema, reportPrompt(session));
        const overallScore = session.averageScore;

        return { ...narrative, overallScore, verdict: verdictForScore(overallScore) };
    }

    private async completeJson<S extends ZodType>(
        schema: S,
        messages: ChatMessage[],
    ): Promise<z.infer<S>> {
        const firstReply = await this.llm.complete(messages, { json: true, temperature: 0.7 });
        const firstAttempt = parseJson(schema, firstReply);

        if (!('reason' in firstAttempt)) {
            return firstAttempt.value;
        }

        const retryReply = await this.llm.complete(
            [
                ...messages,
                { role: 'assistant', content: firstReply },
                correctionMessage(firstAttempt),
            ],
            { json: true, temperature: 0.2 },
        );
        const retryAttempt = parseJson(schema, retryReply);

        if ('reason' in retryAttempt) {
            throw new LlmUnavailableError(
                `The model returned unusable output twice (${retryAttempt.reason}). ` +
                    'Try a stronger model such as qwen2.5:7b, or run with LLM_PROVIDER=mock.',
            );
        }

        return retryAttempt.value;
    }
}

function parseJson<S extends ZodType>(
    schema: S,
    reply: string,
): { value: z.infer<S> } | ParseFailure {
    let candidate: unknown;

    try {
        candidate = JSON.parse(stripCodeFence(reply));
    } catch {
        return { reason: 'it was not parseable JSON' };
    }

    const result = schema.safeParse(candidate);

    if (!result.success) {
        const reason = result.error.issues
            .map((issue) => `${issue.path.join('.') || 'root'} ${issue.message}`)
            .join('; ');

        return { reason };
    }

    return { value: result.data };
}

function stripCodeFence(reply: string): string {
    const trimmed = reply.trim();
    const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);

    return fenced?.[1] ?? trimmed;
}
