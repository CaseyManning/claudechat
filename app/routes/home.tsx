import { useState, useRef, useEffect } from "react";
import {
  href,
  redirect,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "react-router";
import type { Route } from "./+types/home";
import { getUser } from "~/utils/global-context";
import {
  sendMessage,
  createChat,
  getUserChats,
  getChatMessages,
  saveMessage,
  deleteChat,
  type Message,
  type Chat,
} from "~/chat/chat.server";
import Sidebar from "~/components/sidebar";
import TwemojiText from "~/components/twemoji-text";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Chat" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = getUser();
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chat");

  const userChats = await getUserChats(user.id);
  let currentMessages: Message[] = [];

  if (chatId) {
    currentMessages = await getChatMessages(chatId);
  }

  return {
    user,
    chats: userChats,
    currentChatId: chatId,
    initialMessages: currentMessages,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = getUser();
  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  if (actionType === "newChat") {
    const chatId = await createChat(user.id);
    return redirect(`/?chat=${chatId}`);
  }

  if (actionType === "sendMessage") {
    const messagesJson = formData.get("messages") as string;
    const chatId = formData.get("chatId") as string;
    const userMessage = formData.get("userMessage") as string;
    const messages: Message[] = JSON.parse(messagesJson);

    const { title } = await saveMessage(chatId, "user", userMessage);
    const response = await sendMessage(messages);
    if (response) {
      await saveMessage(chatId, "assistant", response);
    }

    return { response, chatId, title };
  }

  if (actionType === "deleteChat") {
    const chatId = formData.get("chatId") as string;
    await deleteChat(chatId);
    return { deletedChatId: chatId };
  }

  return null;
}

export default function Home() {
  const { chats, initialMessages } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const fetcher = useFetcher<typeof action>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get("chat");

  const isLoading =
    fetcher.state === "submitting" || fetcher.state === "loading";

  // Handle response from server
  useEffect(() => {
    const resp = fetcher.data?.response;
    if (resp && fetcher.state === "idle") {
      setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
    }
    if (fetcher.data?.deletedChatId && fetcher.state === "idle") {
      const deletedId = fetcher.data.deletedChatId;
      if (activeChatId === deletedId) {
        setMessages([]);
        setSearchParams({});
      }
    }
  }, [fetcher.data, fetcher.state, setSearchParams, activeChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSelectChat = async (chatId: string) => {
    setSearchParams({ chat: chatId });
  };

  const handleNewChat = () => {
    fetcher.submit({ _action: "newChat" }, { method: "post" });
  };

  const handleDeleteChat = (chatId: string) => {
    fetcher.submit({ _action: "deleteChat", chatId }, { method: "post" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let chatId = activeChatId;

    if (!chatId) {
      // We need to create a chat first, then send message
      // For simplicity, create chat inline
      fetcher.submit({ _action: "newChat" }, { method: "post" });
      return;
    }

    const userMessage = input.trim();
    const newMessage: Message = { role: "user", content: userMessage };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    fetcher.submit(
      {
        _action: "sendMessage",
        messages: JSON.stringify(newMessages),
        chatId: chatId,
        userMessage: userMessage,
      },
      { method: "post" }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#f9f9f9] font-mono">
      <Sidebar
        chats={chats}
        currentChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="flex-1 flex flex-col">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h1 className="font-medium text-gray-700 mb-2">New chat</h1>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-100 text-gray-800"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <TwemojiText
                    text={message.content}
                    className="whitespace-pre-wrap"
                  />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 pt-4">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 py-4 pb-6">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-200 rounded-2xl px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                key={"input-" + messages.length}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                onKeyDown={handleKeyDown}
                placeholder="send a message"
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-500 max-h-[200px]"
                disabled={isLoading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
