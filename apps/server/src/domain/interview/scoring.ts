import { Verdict } from '@interviewer/shared';

const STRONG_HIRE_FROM = 8.5;
const HIRE_FROM = 6.5;
const BORDERLINE_FROM = 4.5;

export function verdictForScore(overallScore: number): Verdict {
    if (overallScore >= STRONG_HIRE_FROM) {
        return Verdict.StrongHire;
    }

    if (overallScore >= HIRE_FROM) {
        return Verdict.Hire;
    }

    if (overallScore >= BORDERLINE_FROM) {
        return Verdict.Borderline;
    }

    return Verdict.NoHire;
}
