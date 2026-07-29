import type { InterviewSession } from '../../domain/interview/InterviewSession.js';
import type { ChatMessage } from './LlmClient.js';
import type { InterviewTurn } from '../../domain/interview/InterviewTurn.js';

export function systemPrompt(session: InterviewSession): ChatMessage {
    const { role, difficulty, persona } = session.config;

    return {
        role: 'system',
        content: [
            `You are ${persona.name}, conducting a ${difficulty}-level mock interview for the role of ${role}.`,
            persona.styleInstructions,
            'Ask one question at a time. Keep each question concise (2-4 sentences).',
        ].join(' '),
    };
}

export function nextQuestionPrompt(session: InterviewSession): ChatMessage[] {
    const questionNumber = session.turns.length + 1;

    return [
        systemPrompt(session),
        {
            role: 'user',
            content: [
                'Interview so far:',
                renderTranscript(session),
                '',
                `Generate question ${questionNumber} of ${session.config.questionCount}.`,
                'Vary the topics across the interview so the candidate is assessed broadly.',
                'If a private evaluator note suggests a follow-up, prefer probing that area.',
                'Respond with ONLY a JSON object: {"text": string, "topic": string}.',
                'The topic is a 2-3 word label such as "error handling" or "system design".',
            ].join('\n'),
        },
    ];
}

export function evaluationPrompt(session: InterviewSession, turn: InterviewTurn): ChatMessage[] {
    const { role, difficulty } = session.config;

    return [
        {
            role: 'system',
            content: [
                'You are a neutral, objective technical evaluator.',
                `You are assessing a single answer from a ${difficulty}-level interview for the role of ${role}.`,
                'Judge the answer on correctness, depth, clarity, and relevance.',
                'Be specific and fair. Do not adopt any interviewer persona or voice.',
            ].join(' '),
        },
        {
            role: 'user',
            content: [
                `Question [${turn.question.topic}]: ${turn.question.text}`,
                `Candidate answer: ${turn.answer?.text ?? '(no answer given)'}`,
                '',
                'Respond with ONLY a JSON object:',
                '{"score": number between 0 and 10, "strengths": string[], "weaknesses": string[], "followUpHint": string or null}.',
                'followUpHint is a private note to the interviewer about what to probe next.',
                'It is never shown to the candidate. Use null when nothing needs following up.',
            ].join('\n'),
        },
    ];
}

export function reportPrompt(session: InterviewSession): ChatMessage[] {
    const { persona } = session.config;

    return [
        systemPrompt(session),
        {
            role: 'user',
            content: [
                'The interview is over. Here is the full transcript with private evaluator notes:',
                renderTranscript(session),
                '',
                `Write the final report in the voice of ${persona.name}.`,
                'Base overallScore on the individual answer scores.',
                'Respond with ONLY a JSON object:',
                '{"overallScore": number, "verdict": "strong_hire" | "hire" | "borderline" | "no_hire", "summary": string, "strengths": string[], "improvements": string[]}.',
            ].join('\n'),
        },
    ];
}

function renderTranscript(session: InterviewSession): string {
    if (session.turns.length === 0) {
        return '(no questions asked yet)';
    }

    return session.turns.map(renderTurn).join('\n\n');
}

function renderTurn(turn: InterviewTurn): string {
    const lines = [
        `Q${turn.question.index} [${turn.question.topic}]: ${turn.question.text}`,
        `Candidate: ${turn.answer?.text ?? '(not answered yet)'}`,
    ];

    if (turn.evaluation !== null) {
        const { score, followUpHint } = turn.evaluation;
        const hint = followUpHint === null ? '' : `, ${followUpHint}`;

        lines.push(`(private evaluator note: score ${score}/10${hint})`);
    }

    return lines.join('\n');
}
