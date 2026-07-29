import type { StartInterviewUseCase } from '../../application/StartInterviewUseCase.js';
import type { SubmitAnswerUseCase } from '../../application/SubmitAnswerUseCase.js';
import type { GetInterviewUseCase } from '../../application/GetInterviewUseCase.js';
import type { GetReportUseCase } from '../../application/GetReportUseCase.js';
import type { FastifyInstance } from 'fastify';
import type { InterviewDto, ReportDto } from '@interviewer/shared';
import { toInterviewDto, toReportDto } from '../dto.js';
import {
    InterviewParamsSchema,
    StartInterviewSchema,
    SubmitAnswerSchema,
} from '../requestSchemas.js';

export interface InterviewUseCases {
    readonly start: StartInterviewUseCase;
    readonly submitAnswer: SubmitAnswerUseCase;
    readonly getInterview: GetInterviewUseCase;
    readonly getReport: GetReportUseCase;
}

export function registerInterviewRoutes(app: FastifyInstance, useCases: InterviewUseCases): void {
    app.post('/api/interviews', async (request, reply): Promise<InterviewDto> => {
        const body = StartInterviewSchema.parse(request.body);
        const session = await useCases.start.execute(body);

        reply.code(201);

        return toInterviewDto(session);
    });

    app.get('/api/interviews/:id', async (request): Promise<InterviewDto> => {
        const { id } = InterviewParamsSchema.parse(request.params);
        const session = await useCases.getInterview.execute(id);

        return toInterviewDto(session);
    });

    app.post('/api/interviews/:id/answers', async (request): Promise<InterviewDto> => {
        const { id } = InterviewParamsSchema.parse(request.params);
        const { text } = SubmitAnswerSchema.parse(request.body);
        const session = await useCases.submitAnswer.execute({ interviewId: id, text });

        return toInterviewDto(session);
    });

    app.get('/api/interviews/:id/report', async (request): Promise<ReportDto> => {
        const { id } = InterviewParamsSchema.parse(request.params);
        const { session, report } = await useCases.getReport.execute(id);

        return toReportDto(session, report);
    });
}
