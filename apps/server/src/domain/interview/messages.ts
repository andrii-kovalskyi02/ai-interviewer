export const InterviewMessages = {
    alreadyCompleted: 'the interview is already completed',
    questionStillPending: 'the current question must be answered before asking the next one',
    allQuestionsAsked: (questionCount: number) =>
        `interview already has all ${questionCount} questions`,
    noPendingQuestion: 'there is no pending question to answer',
    foreignTurn: 'turn does not belong to this interview',
    notEnoughQuestions: (questionCount: number) =>
        `interview needs ${questionCount} questions before it can be completed`,
    unevaluatedAnswers: 'every question must be answered and evaluated before completing',
    alreadyAnswered: (index: number) => `question ${index} has already been answered`,
    notAnsweredYet: (index: number) =>
        `question ${index} cannot be evaluated before it is answered`,
    alreadyEvaluated: (index: number) => `question ${index} has already been evaluated`,
} as const;
