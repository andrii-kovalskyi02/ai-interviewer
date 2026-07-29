import type { GeneratedQuestion, InterviewerGateway } from '../../domain/interview/ports.js';
import { verdictForScore } from '../../domain/interview/scoring.js';
import type { InterviewSession } from '../../domain/interview/InterviewSession.js';
import type { InterviewTurn } from '../../domain/interview/InterviewTurn.js';
import type { Evaluation } from '../../domain/interview/Evaluation.js';
import type { InterviewReport } from '../../domain/interview/InterviewReport.js';

const PIRATE_PERSONA_ID = 'pirate';
const THINKING_DELAY_MS = 400;

const MAX_MOCK_SCORE = 9;

interface QuestionTemplate {
    readonly topic: string;
    readonly text: (role: string) => string;
}

const QUESTION_POOL: readonly QuestionTemplate[] = [
    {
        topic: 'experience',
        text: (role) =>
            `Walk me through a project where you worked as a ${role}. What was your role?`,
    },
    {
        topic: 'trade-offs',
        text: () =>
            'Describe a technical trade-off you made recently. What did you give up, and why?',
    },
    {
        topic: 'debugging',
        text: () =>
            'Tell me about the hardest bug you have tracked down. How did you isolate the cause?',
    },
    {
        topic: 'system design',
        text: (role) =>
            `As a ${role}, how would you structure a codebase so it stays maintainable as the team grows?`,
    },
    {
        topic: 'testing',
        text: () =>
            'What is your approach to testing, and how do you decide what is worth testing?',
    },
    {
        topic: 'collaboration',
        text: () =>
            'Describe a time you disagreed with a teammate about a technical decision. How did it end?',
    },
];

export class MockInterviewer implements InterviewerGateway {
    constructor(private readonly delayMs: number = THINKING_DELAY_MS) {}

    async askNextQuestion(session: InterviewSession): Promise<GeneratedQuestion> {
        await this.pause();

        const template = QUESTION_POOL[session.turns.length % QUESTION_POOL.length];

        if (template === undefined) {
            throw new Error('question pool is empty');
        }

        const text = template.text(session.config.role);
        const isPirate = session.config.persona.id === PIRATE_PERSONA_ID;

        return { text: isPirate ? `Arr! ${text}` : text, topic: template.topic };
    }

    async evaluateAnswer(_session: InterviewSession, turn: InterviewTurn): Promise<Evaluation> {
        await this.pause();

        const wordCount = countWords(turn.answer?.text ?? '');
        const score = Math.min(MAX_MOCK_SCORE, 4 + Math.floor(wordCount / 14));

        return {
            score,
            strengths:
                wordCount > 40 ? ['Gave a detailed, concrete answer'] : ['Answered directly'],
            weaknesses:
                wordCount > 40 ? ['Could tighten the structure'] : ['Could use a concrete example'],
            followUpHint: wordCount < 20 ? 'probe for a specific example' : null,
        };
    }

    async writeReport(session: InterviewSession): Promise<InterviewReport> {
        await this.pause();

        const overallScore = session.averageScore;

        return {
            overallScore,
            verdict: verdictForScore(overallScore),
            summary:
                `Across ${session.turns.length} questions for the ${session.config.role} role, ` +
                `the candidate averaged ${overallScore.toFixed(1)}/10. ` +
                'Answers were clearest when backed by concrete examples from real work.',
            strengths: ['Communicates clearly', 'Engages with the question asked'],
            improvements: ['Add more concrete examples', 'Go deeper on trade-offs'],
        };
    }

    private pause(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
}

function countWords(text: string): number {
    const trimmed = text.trim();

    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}
