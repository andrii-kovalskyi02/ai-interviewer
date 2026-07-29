import { z } from 'zod';

const clampToScore = (value: number): number => Math.min(10, Math.max(0, value));
const limitTo = (max: number) => (items: string[]) => items.slice(0, max);

const MIN_QUESTION_WORDS = 4;
const FALLBACK_TOPIC = 'general';

const isTopicLabel = (question: { text: string; topic: string }): boolean =>
    question.text.trim().toLowerCase() === question.topic.trim().toLowerCase();

export const QuestionOutputSchema = z
    .object({
        text: z.string().refine((text) => text.trim().split(/\s+/).length >= MIN_QUESTION_WORDS, {
            message: `question text must be at least ${MIN_QUESTION_WORDS} words`,
        }),
        topic: z.string().min(2).optional().default(FALLBACK_TOPIC),
    })
    .refine((question) => !isTopicLabel(question), {
        message: 'question text must not simply repeat the topic label',
    });

export const EvaluationOutputSchema = z.object({
    score: z.number().transform(clampToScore),
    strengths: z.array(z.string()).transform(limitTo(4)),
    weaknesses: z.array(z.string()).transform(limitTo(4)),
    followUpHint: z.string().nullable().default(null),
});

export const ReportOutputSchema = z.object({
    summary: z.string().min(20),
    strengths: z.array(z.string()).transform(limitTo(5)),
    improvements: z.array(z.string()).transform(limitTo(5)),
});
