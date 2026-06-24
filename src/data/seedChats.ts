import type { ChatMessage } from '../types';

// No seed chat history. Each chat now opens with the synthetic welcome message
// rendered by ChatRoom; the user starts the real conversation from there.
export const SEED_CHATS: ChatMessage[] = [];
