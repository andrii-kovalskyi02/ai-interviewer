import type { InterviewSession } from './InterviewSession.js';
import type { InterviewTurn } from './InterviewTurn.js';
import type { Evaluation } from './Evaluation.js';
import type { InterviewReport } from './InterviewReport.js';

export interface GeneratedQuestion {
    readonly text: string;
    readonly topic: string;
}

export interface InterviewRepository {
    save(session: InterviewSession): Promise<void>;
    findById(id: string): Promise<InterviewSession | null>;
}

export interface InterviewerGateway {
    askNextQuestion(session: InterviewSession): Promise<GeneratedQuestion>;
    evaluateAnswer(session: InterviewSession, turn: InterviewTurn): Promise<Evaluation>;
    writeReport(session: InterviewSession): Promise<InterviewReport>;
}
