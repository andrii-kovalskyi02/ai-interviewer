import type {
    InterviewDto,
    PersonaDto,
    QuestionDto,
    ReportDto,
    ReportTurnDto,
    TurnDto,
} from '@interviewer/shared';
import type { Persona } from '../domain/interview/Persona.js';
import type { Question } from '../domain/interview/Question.js';
import type { InterviewSession } from '../domain/interview/InterviewSession.js';
import type { InterviewReport } from '../domain/interview/InterviewReport.js';
import { InvalidStateError } from '../domain/errors.js';

export function toPersonaDto(persona: Persona): PersonaDto {
    return {
        id: persona.id,
        name: persona.name,
        emoji: persona.emoji,
        tagline: persona.tagline,
    };
}

export function toQuestionDto(question: Question): QuestionDto {
    return { index: question.index, text: question.text, topic: question.topic };
}

export function toInterviewDto(session: InterviewSession): InterviewDto {
    const turns: TurnDto[] = session.turns.map((turn) => ({
        question: toQuestionDto(turn.question),
        ...(turn.answer === null ? {} : { answerText: turn.answer.text }),
    }));

    const currentTurn = session.currentTurn;

    return {
        id: session.id,
        status: session.status,
        role: session.config.role,
        difficulty: session.config.difficulty,
        persona: toPersonaDto(session.config.persona),
        questionCount: session.config.questionCount,
        turns,
        currentQuestion: currentTurn === null ? null : toQuestionDto(currentTurn.question),
    };
}

export function toReportDto(session: InterviewSession, report: InterviewReport): ReportDto {
    const turns: ReportTurnDto[] = session.turns.map((turn) => {
        if (turn.answer === null || turn.evaluation === null) {
            throw new InvalidStateError(
                `question ${turn.question.index} is missing an answer or evaluation`,
            );
        }

        return {
            question: toQuestionDto(turn.question),
            answerText: turn.answer.text,
            evaluation: {
                score: turn.evaluation.score,
                strengths: turn.evaluation.strengths,
                weaknesses: turn.evaluation.weaknesses,
            },
        };
    });

    return {
        overallScore: report.overallScore,
        verdict: report.verdict,
        summary: report.summary,
        strengths: report.strengths,
        improvements: report.improvements,
        turns,
    };
}
