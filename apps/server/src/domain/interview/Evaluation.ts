export interface Evaluation {
    readonly score: number;
    readonly strengths: string[];
    readonly weaknesses: string[];
    readonly followUpHint: string | null;
}
