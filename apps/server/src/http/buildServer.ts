import { type ApiError, ErrorCode } from '@interviewer/shared';
import type { InterviewUseCases } from './routes/interviews.js';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerPersonaRoutes } from './routes/personas.js';
import { registerInterviewRoutes } from './routes/interviews.js';
import { ZodError } from 'zod';
import { DomainError, InvalidStateError, NotFoundError } from '../domain/errors.js';
import { LlmUnavailableError } from '../infrastructure/llm/LlmClient.js';

interface ErrorResponse {
    readonly status: number;
    readonly body: ApiError;
}

export async function buildServer(useCases: InterviewUseCases): Promise<FastifyInstance> {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: true });

    registerPersonaRoutes(app);
    registerInterviewRoutes(app, useCases);

    app.setErrorHandler((error, request, reply) => {
        const { status, body } = mapError(error);

        if (status >= 500) {
            request.log.error(error);
        } else {
            request.log.info({ err: error }, 'request failed');
        }

        reply.code(status).send(body);
    });

    app.setNotFoundHandler((request, reply) => {
        reply.code(404).send({
            error: {
                code: ErrorCode.NotFound,
                message: `route ${request.method} ${request.url} not found`,
            },
        } satisfies ApiError);
    });

    return app;
}

function mapError(error: unknown): ErrorResponse {
    if (error instanceof ZodError) {
        const details = error.issues
            .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
            .join('; ');

        return { status: 400, body: toBody(ErrorCode.ValidationFailed, details) };
    }

    if (error instanceof NotFoundError) {
        return { status: 404, body: toBody(error.code, error.message) };
    }

    if (error instanceof InvalidStateError) {
        return { status: 409, body: toBody(error.code, error.message) };
    }

    if (error instanceof DomainError) {
        return { status: 422, body: toBody(error.code, error.message) };
    }

    if (error instanceof LlmUnavailableError) {
        return { status: 503, body: toBody(error.code, error.message) };
    }

    return {
        status: 500,
        body: toBody(ErrorCode.InternalError, 'Something went wrong on our side.'),
    };
}

function toBody(code: ErrorCode, message: string): ApiError {
    return { error: { code, message } };
}
