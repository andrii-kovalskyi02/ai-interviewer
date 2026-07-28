import type { Verdict } from '@interviewer/shared';

export interface InterviewReport {
    readonly overallScore: number;
    readonly verdict: Verdict;
    readonly summary: string;
    readonly strengths: string[];
    readonly improvements: string[];
}
