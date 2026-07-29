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
                '"text" is the full question you are asking the candidate, phrased as a complete',
                'sentence they can answer. "topic" is only a 2-3 word label used for grouping,',
                'such as "error handling" or "system design". Never put the label in "text".',
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
                'Scoring guide: 0-1 gibberish, empty, or entirely off-topic;',
                '2-3 on-topic but no real substance; 4-5 partially correct but shallow;',
                '6-7 correct and reasonably explained; 8-9 thorough with concrete detail;',
                '10 exceptional.',
                'Credit whatever the candidate genuinely got right, even in a weak answer.',
                'Return an empty strengths list only when the answer is gibberish, empty,',
                'or entirely off-topic. Otherwise always name at least one real strength.',
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
                `Write the final report in the voice of ${persona.name}, including the summary.`,
                'Let the private evaluator scores guide how positive or critical the summary is,',
                'but never state a numeric score or verdict: both are calculated separately.',
                'Draw strengths and improvements only from the evaluator notes above.',
                'Wherever the notes record a strength, carry it into the report: this is coaching,',
                'so the candidate must see what they did well as well as what to fix.',
                'Do not invent praise the notes do not support. Return an empty strengths list',
                'only when the notes record none at all.',
                'Respond with ONLY a JSON object:',
                '{"summary": string, "strengths": string[], "improvements": string[]}.',
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
        const { score, strengths, weaknesses, followUpHint } = turn.evaluation;
        const notes = [`score ${score}/10`];

        if (strengths.length > 0) {
            notes.push(`strengths: ${strengths.join('; ')}`);
        }

        if (weaknesses.length > 0) {
            notes.push(`weaknesses: ${weaknesses.join('; ')}`);
        }

        if (followUpHint !== null) {
            notes.push(followUpHint);
        }

        lines.push(`(private evaluator note: ${notes.join(' | ')})`);
    }

    return lines.join('\n');
}
