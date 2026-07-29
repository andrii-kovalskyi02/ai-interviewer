import { z } from 'zod';
import { Verdict } from '@interviewer/shared';

export const QuestionOutputSchema = z.object({
    text: z.string().min(5),
    topic: z.string().min(2),
});

export const EvaluationOutputSchema = z.object({
    score: z.number().min(0).max(10),
    strengths: z.array(z.string()).max(4),
    weaknesses: z.array(z.string()).max(4),
    followUpHint: z.string().nullable().default(null),
});

export const ReportOutputSchema = z.object({
    overallScore: z.number().min(0).max(10),
    verdict: z.enum([Verdict.StrongHire, Verdict.Hire, Verdict.Borderline, Verdict.NoHire]),
    summary: z.string().min(20),
    strengths: z.array(z.string()).min(1).max(5),
    improvements: z.array(z.string()).min(1).max(5),
});
