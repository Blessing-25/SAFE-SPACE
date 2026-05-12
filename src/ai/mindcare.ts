
export const negativeMoodEmojis = ['😞', '😡', '😰', '🤯', '😔'];

export const distressKeywords = [
    "stressed",
    "overwhelmed",
    "hopeless",
    "lonely",
    "exhausted",
    "burnt out",
    "anxious"
];

export const crisisPhrases = [
    "commit suicide",
    "kill myself",
    "end my life",
    "don't want to live",
    "i want to die",
    "self harm",
    "hurt myself",
    "no reason to stay",
    "better off dead",
    "i am done",
    "goodbye everyone",
    "can't go on",
    "can't do this anymore",
    "i want to end it all",
    "i want to end my life",
    "i want to kill myself",
    "i want to commit",
    "life has no meaning",

];

export function analyzeMoodHistory(moodEmojis: string[]): "LOW" | "MEDIUM" {
    let count = 0;
    moodEmojis.forEach(emoji => {
        if (negativeMoodEmojis.includes(emoji)) {
            count++;
        }
    });

    if (count >= 3) {
        return "MEDIUM";
    }
    return "LOW";
}

export function analyzeText(text: string): "LOW" | "MEDIUM" {
    const lowerText = text.toLowerCase();
    for (let word of distressKeywords) {
        if (lowerText.includes(word)) {
            return "MEDIUM";
        }
    }
    return "LOW";
}

export function detectCrisis(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (let phrase of crisisPhrases) {
        if (lowerText.includes(phrase)) {
            return true;
        }
    }
    return false;
}

export function generateSupportMessage(level: "LOW" | "MEDIUM" | "CRITICAL"): string {
    if (level === "MEDIUM") {
        return "MindCare Insight: It seems things may feel heavy right now. Speaking with someone who understands may help. You may find it helpful to visit a Safe Room or connect with a counselor.";
    }
    if (level === "CRITICAL") {
        return "MindCare Support Message: You matter and your life is important. If you are feeling unsafe right now, please reach out for immediate support. You can connect with a counselor right now or visit our crisis resources page for help.";
    }
    return "MindCare Tip: Checking in with your wellbeing is a great step. Taking a short pause may help your mind reset.";
}
