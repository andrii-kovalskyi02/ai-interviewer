// The single source of truth for the HTTP contract between web and server.

export const Difficulty = {
    Junior: 'junior',
    Mid: 'mid',
    Senior: 'senior',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const InterviewStatus = {
    InProgress: 'in_progress',
    Completed: 'completed',
} as const;

export type InterviewStatus = (typeof InterviewStatus)[keyof typeof InterviewStatus];

export const Verdict = {
    StrongHire: 'strong_hire',
    Hire: 'hire',
    Borderline: 'borderline',
    NoHire: 'no_hire',
} as const;

export type Verdict = (typeof Verdict)[keyof typeof Verdict];

export interface PersonaDto {
    id: string;
    name: string;
    emoji: string;
    tagline: string;
}

export interface StartInterviewRequest {
    role: string; // free text, 3..80 chars
    difficulty: Difficulty;
    personaId: string;
    questionCount: number; // 3..8
}

export interface QuestionDto {
    index: number;
    text: string;
    topic: string;
}

export interface TurnDto {
    question: QuestionDto;
    answerText?: string;
    // evaluation is INTENTIONALLY not exposed per-turn during the interview,
    // scores are revealed only in the final report (see ReportDto).
}

export interface InterviewDto {
    id: string;
    status: InterviewStatus;
    role: string;
    difficulty: Difficulty;
    persona: PersonaDto;
    questionCount: number;
    turns: TurnDto[];
    currentQuestion: QuestionDto | null; // null when completed
}

export interface SubmitAnswerRequest {
    text: string; // 1..4000 chars
}

export interface EvaluationDto {
    score: number; // 0..10
    strengths: string[];
    weaknesses: string[];
}

export interface ReportTurnDto {
    question: QuestionDto;
    answerText: string;
    evaluation: EvaluationDto;
}

export interface ReportDto {
    overallScore: number; // 0..10, one decimal
    verdict: Verdict;
    summary: string; // persona-voiced paragraph
    strengths: string[];
    improvements: string[];
    turns: ReportTurnDto[];
}

export interface ApiError {
    error: { code: string; message: string };
}
