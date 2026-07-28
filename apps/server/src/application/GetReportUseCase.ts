import type { InterviewSession } from '../domain/interview/InterviewSession.js';
import type { InterviewReport } from '../domain/interview/InterviewReport.js';
import type { InterviewRepository } from '../domain/interview/ports.js';
import { loadSessionOrThrow } from './loadSessionOrThrow.js';
import { InvalidStateError } from '../domain/errors.js';

export interface CompletedInterview {
    readonly session: InterviewSession;
    readonly report: InterviewReport;
}

export class GetReportUseCase {
    constructor(private readonly repository: InterviewRepository) {}

    async execute(interviewId: string): Promise<CompletedInterview> {
        const session = await loadSessionOrThrow(this.repository, interviewId);
        const report = session.report;

        if (report === null) {
            throw new InvalidStateError(
                'invalid_state',
                `interview ${interviewId} has not been completed yet`,
            );
        }

        return { session, report };
    }
}
