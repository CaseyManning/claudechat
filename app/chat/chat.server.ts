import { Anthropic } from "@anthropic-ai/sdk";
import { database } from "~/database/context";
import { chats, messages } from "~/database/schema";
import { eq, desc, asc } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Chat {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a new chat for a user
export async function createChat(userId: string): Promise<string> {
  const db = database();
  const [chat] = await db.insert(chats).values({ userId }).returning();
  return chat.id;
}

// Get all chats for a user
export async function getUserChats(userId: string): Promise<Chat[]> {
  const db = database();
  return db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

// Get messages for a chat
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const db = database();
  const dbMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return dbMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

// Save a message to a chat
export async function saveMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const db = database();
  await db.insert(messages).values({ chatId, role, content });
  // Update chat's updatedAt timestamp
  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

// Delete a chat
export async function deleteChat(chatId: string): Promise<void> {
  const db = database();
  await db.delete(chats).where(eq(chats.id, chatId));
}

const roleToName = {
  assistant: "friend 2",
  user: "friend 1",
};

function buildSystemMessage(messages: Message[]): string {
  let content = "";

  for (const message of messages) {
    content += `${roleToName[message.role]}: ${message.content}\n`;
  }
  return content;
}

export async function sendMessage(messages: Message[]): Promise<string> {
  console.log(buildSystemMessage(messages));
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: buildSystemMessage(messages),
    messages: [{ role: "assistant", content: `${roleToName["assistant"]}:` }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text.trim() : "";
}
