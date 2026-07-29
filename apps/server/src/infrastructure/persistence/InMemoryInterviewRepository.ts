import type { InterviewRepository } from '../../domain/interview/ports.js';
import type { InterviewSession } from '../../domain/interview/InterviewSession.js';

export class InMemoryInterviewRepository implements InterviewRepository {
    private readonly sessions = new Map<string, InterviewSession>();

    async save(session: InterviewSession): Promise<void> {
        this.sessions.set(session.id, session);
    }

    async findById(id: string): Promise<InterviewSession | null> {
        return this.sessions.get(id) ?? null;
    }
}
