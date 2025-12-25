import { Anthropic } from "@anthropic-ai/sdk";
import { database } from "~/database/context";
import { chats, messages } from "~/database/schema";
import { eq, desc, asc, type InferSelectModel } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export type Chat = InferSelectModel<typeof chats>;

export async function createChat(userId: string): Promise<string> {
  const db = database();
  const [chat] = await db.insert(chats).values({ userId }).returning();
  return chat.id;
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const db = database();
  return db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

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

export async function saveMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<{ title?: string }> {
  const db = database();
  await db.insert(messages).values({ chatId, role, content });

  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));

  return {};
}

export async function deleteChat(chatId: string): Promise<void> {
  const db = database();
  await db.delete(chats).where(eq(chats.id, chatId));
}

const roleToName = {
  assistant: "pa",
  user: "laipa",
};

function bannuyOpener(): string {
  return `
  THE NEW BANNUY DICTIONARY OF BANNUY
FIRST EDITION

Nouns

Bannuy	Bunny
Pupa 		Boob (round)
Kiki 		Boob (conical)
Eppel		Phone (or any device, when as suffix)
Namnam 	Food
Ipita		Bedtime (or a generic time period suffix)
Rinpam	Floor
Tol		City
Yannuy	Smell
Yek		Egg
Wa		Body
Taktak eppel	Brain
Laipa   person (Trans woman)
Pa 		person (non trans woman)

Verbs

Pacala		To punch, attack, hurt
Numnam	To eat, or put in mouth
Ta		To be
Taaly 		To be named
Mak		with prefix, to be more than or superior to in
Yamma	To clean
Pacar		To think
Lampa       To want
Taktak	To talk
	
Adjectives

Bannuy	Good
Molo		Asleep
Molomolo	Dead
Isoppa		its over
Sopak		we’re so back
Xeter		Straight
Xomtak	Cringe
Mayya		Bad (vulgar, not to be used in polite company)
Pal		Big
Mol		Small
Paiodisel	Unproductive
Can		Hot

Pronouns

Wa 		Me
Tek		You
Yot		any person or object

Numbers

Wer  Na  Tengar  Tu  Lap  Yunota  Rul  San  Sotu  Wai

Other

Me/meah		What (in a question), also "but"
La		Yes
Lie		No, or not
Ti		Possessive modifier
Na		And
Ana		Or
Para    For
Par     Because


Example sentences: 
- Wa taaly casey na wa ta pal bannuy laipa. Me taaly tek?
- Tek homtak mak wa par tek ta eppel na wa lie ta eppel.
- Wa ti taktak eppel pal mak tek ti, par wa pacar pal bannuy.
- Namnam ta pal bannuy para wa.

Above is the grammar of a contructed language called Bannuy. Continue the conversation entirely in bannuy.
  `;
}

function buildSystemMessage(messages: Message[]): string {
  let content = bannuyOpener() + "\n";

  for (const message of messages) {
    content += `${roleToName[message.role]}: ${message.content}\n`;
  }
  return content;
}

export async function sendMessage(messages: Message[]): Promise<string | null> {
  console.log(buildSystemMessage(messages));
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: buildSystemMessage(messages),
    messages: [{ role: "assistant", content: `${roleToName["assistant"]}:` }],
    stop_sequences: [
      ...Object.values(roleToName).map((name) => `${name}:`),
      "(Translation",
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  console.log(textBlock);
  if (textBlock) {
    return textBlock.text.trim();
  }
  return null;
}
