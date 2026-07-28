import type { InterviewRepository } from '../domain/interview/ports.js';
import type { InterviewSession } from '../domain/interview/InterviewSession.js';
import { loadSessionOrThrow } from './loadSessionOrThrow.js';

export class GetInterviewUseCase {
    constructor(private readonly repository: InterviewRepository) {}

    async execute(interviewId: string): Promise<InterviewSession> {
        return loadSessionOrThrow(this.repository, interviewId);
    }
}
