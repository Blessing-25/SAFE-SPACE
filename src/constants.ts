import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const MOODS = [
    { emoji: '🙂', label: 'Happy', color: 'bg-emerald-100 text-emerald-700' },
    { emoji: '😐', label: 'Neutral', color: 'bg-slate-100 text-slate-700' },
    { emoji: '😞', label: 'Sad', color: 'bg-blue-100 text-blue-700' },
    { emoji: '😡', label: 'Angry', color: 'bg-rose-100 text-rose-700' },
    { emoji: '😰', label: 'Anxious', color: 'bg-amber-100 text-amber-700' },
    { emoji: '😴', label: 'Tired', color: 'bg-indigo-100 text-indigo-700' },
    { emoji: '🤯', label: 'Overwhelmed', color: 'bg-orange-100 text-orange-700' },
    { emoji: '😌', label: 'Calm', color: 'bg-teal-100 text-teal-700' },
    { emoji: '😔', label: 'Lonely', color: 'bg-violet-100 text-violet-700' },
    { emoji: '🥳', label: 'Excited', color: 'bg-pink-100 text-pink-700' },
];

export const ALIAS_ADJECTIVES = ['Quiet', 'Silent', 'Calm', 'Peaceful', 'Gentle', 'Soft', 'Mellow', 'Serene', 'Tranquil', 'Steady'];
export const ALIAS_NOUNS = ['Blueberry', 'River', 'Mountain', 'Forest', 'Cloud', 'Star', 'Moon', 'Breeze', 'Willow', 'Stone'];

export function generateRandomAlias() {
    const adj = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
    const noun = ALIAS_NOUNS[Math.floor(Math.random() * ALIAS_NOUNS.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
}

export const THEMES = [
    { id: 'emerald', label: 'Emerald Sanctuary', primary: 'emerald' },
    { id: 'ocean', label: 'Ocean Serenity', primary: 'sky' },
    { id: 'sunset', label: 'Sunset Warmth', primary: 'amber' },
    { id: 'forest', label: 'Forest Depths', primary: 'green' },
    { id: 'deep-ocean', label: 'Deep Ocean', primary: 'indigo' },
];

export const WELLNESS_GOALS = [
    { id: 'water', label: 'Drink 2L Water', icon: 'Droplets' },
    { id: 'sleep', label: 'Sleep 8 Hours', icon: 'Moon' },
    { id: 'movement', label: '10 Min Movement', icon: 'Activity' },
    { id: 'meditation', label: '5 Min Reflection', icon: 'Brain' },
];
