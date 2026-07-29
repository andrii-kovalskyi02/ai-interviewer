import { z } from 'zod';
import { Difficulty } from '@interviewer/shared';

export const StartInterviewSchema = z.object({
    role: z.string().trim().min(3).max(80),
    difficulty: z.enum([Difficulty.Junior, Difficulty.Mid, Difficulty.Senior]),
    personaId: z.string().min(1),
    questionCount: z.number().int().min(3).max(8),
});

export const SubmitAnswerSchema = z.object({
    text: z.string().trim().min(1).max(4000),
});

export const InterviewParamsSchema = z.object({
    id: z.string().min(1),
});
