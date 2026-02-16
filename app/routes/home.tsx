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
  deleteLastAssistantMessage,
  deleteLastNMessages,
  getChat,
  updateChatSettings,
  updateChatTitle,
  type Message,
  type Chat,
} from "~/chat/chat.server";
import { MODELS, DEFAULT_MODEL } from "~/chat/models";
import Sidebar from "~/components/sidebar";
import TwemojiText from "~/components/twemoji-text";
import { RefreshCw, Settings, Pencil } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Chat" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = getUser();
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chat");

  const userChats = await getUserChats(user.id);
  let currentMessages: Message[] = [];
  let assistantName = "claude";
  let userName = "human";
  let model = DEFAULT_MODEL;

  if (chatId) {
    currentMessages = await getChatMessages(chatId);
    const chat = await getChat(chatId);
    if (chat) {
      assistantName = chat.assistantName;
      userName = chat.userName;
      model = chat.model;
    }
  }

  return {
    user,
    chats: userChats,
    currentChatId: chatId,
    initialMessages: currentMessages,
    assistantName,
    userName,
    model,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = getUser();
  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  if (actionType === "newChat") {
    const assistantName = (formData.get("assistantName") as string) || undefined;
    const userName = (formData.get("userName") as string) || undefined;
    const model = (formData.get("model") as string) || undefined;
    const chatId = await createChat(user.id, assistantName, userName, model);
    return redirect(`/?chat=${chatId}`);
  }

  if (actionType === "updateSettings") {
    const chatId = formData.get("chatId") as string;
    const assistantName = formData.get("assistantName") as string;
    const userName = formData.get("userName") as string;
    const model = formData.get("model") as string;
    await updateChatSettings(chatId, assistantName, userName, model);
    return { updated: true };
  }

  if (actionType === "sendMessage") {
    const messagesJson = formData.get("messages") as string;
    const chatId = formData.get("chatId") as string;
    const userMessage = formData.get("userMessage") as string;
    const messages: Message[] = JSON.parse(messagesJson);

    const chat = await getChat(chatId);
    const roleToName = chat
      ? { assistant: chat.assistantName, user: chat.userName }
      : undefined;

    // Set title from first user message if chat has no title yet
    let title: string | undefined;
    if (chat && !chat.title) {
      title = userMessage.length > 40
        ? userMessage.slice(0, 40).trimEnd() + "..."
        : userMessage;
      await updateChatTitle(chatId, title);
    }

    await saveMessage(chatId, "user", userMessage);
    const response = await sendMessage(messages, roleToName, chat?.model);
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

  if (actionType === "regenerate") {
    const messagesJson = formData.get("messages") as string;
    const chatId = formData.get("chatId") as string;
    const messages: Message[] = JSON.parse(messagesJson);

    const chat = await getChat(chatId);
    const roleToName = chat
      ? { assistant: chat.assistantName, user: chat.userName }
      : undefined;

    // Delete the last assistant message from DB
    await deleteLastAssistantMessage(chatId);

    // Re-send with only messages up to (not including) the last assistant message
    const response = await sendMessage(messages, roleToName, chat?.model);
    if (response) {
      await saveMessage(chatId, "assistant", response);
    }

    return { response, chatId, isRegenerate: true };
  }

  if (actionType === "editMessage") {
    const messagesJson = formData.get("messages") as string;
    const chatId = formData.get("chatId") as string;
    const editedMessage = formData.get("editedMessage") as string;
    const deleteCount = parseInt(formData.get("deleteCount") as string, 10);
    const messages: Message[] = JSON.parse(messagesJson);

    const chat = await getChat(chatId);
    const roleToName = chat
      ? { assistant: chat.assistantName, user: chat.userName }
      : undefined;

    // Delete the last N messages (the user msg being edited + its assistant reply if any)
    await deleteLastNMessages(chatId, deleteCount);

    // Save the edited user message and get new response
    await saveMessage(chatId, "user", editedMessage);
    const response = await sendMessage(messages, roleToName, chat?.model);
    if (response) {
      await saveMessage(chatId, "assistant", response);
    }

    return { response, chatId, isEdit: true };
  }

  return null;
}

export default function Home() {
  const {
    chats,
    initialMessages,
    assistantName: loadedAssistantName,
    userName: loadedUserName,
    model: loadedModel,
  } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [assistantName, setAssistantName] = useState(loadedAssistantName);
  const [userName, setUserName] = useState(loadedUserName);
  const [model, setModel] = useState(loadedModel);
  const [showNames, setShowNames] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editWidth, setEditWidth] = useState<number | null>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  const fetcher = useFetcher<typeof action>();
  const namesFetcher = useFetcher<typeof action>();
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
      if (fetcher.data?.isRegenerate) {
        // Replace the last assistant message
        setMessages((prev) => {
          const newMessages = [...prev];
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === "assistant") {
              newMessages[i] = { role: "assistant", content: resp };
              break;
            }
          }
          return newMessages;
        });
      } else if (fetcher.data?.isEdit) {
        // Edit already updated local messages; just append the new response
        setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
      }
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

  useEffect(() => {
    setAssistantName(loadedAssistantName);
    setUserName(loadedUserName);
    setModel(loadedModel);
    setShowNames(false);
  }, [loadedAssistantName, loadedUserName, loadedModel]);

  const submitSettings = (overrides: { assistantName?: string; userName?: string; model?: string } = {}) => {
    if (!activeChatId) return;
    namesFetcher.submit(
      {
        _action: "updateSettings",
        chatId: activeChatId,
        assistantName: overrides.assistantName ?? assistantName,
        userName: overrides.userName ?? userName,
        model: overrides.model ?? model,
      },
      { method: "post" }
    );
  };

  const handleSelectChat = async (chatId: string) => {
    setSearchParams({ chat: chatId });
  };

  const handleNewChat = () => {
    setAssistantName("claude");
    setUserName("human");
    setModel(DEFAULT_MODEL);
    fetcher.submit({ _action: "newChat" }, { method: "post" });
  };

  const handleDeleteChat = (chatId: string) => {
    fetcher.submit({ _action: "deleteChat", chatId }, { method: "post" });
  };

  const handleRegenerate = () => {
    if (!activeChatId || isLoading) return;

    // Get messages up to (but not including) the last assistant message
    const messagesWithoutLastAssistant = [];
    let foundLastAssistant = false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!foundLastAssistant && messages[i].role === "assistant") {
        foundLastAssistant = true;
        continue;
      }
      messagesWithoutLastAssistant.unshift(messages[i]);
    }

    fetcher.submit(
      {
        _action: "regenerate",
        messages: JSON.stringify(messagesWithoutLastAssistant),
        chatId: activeChatId,
      },
      { method: "post" }
    );
    setMessages(messagesWithoutLastAssistant);
  };

  const handleEditStart = (index: number) => {
    if (lastUserMsgRef.current) {
      setEditWidth(lastUserMsgRef.current.offsetWidth);
    }
    setEditingIndex(index);
    setEditText(messages[index].content);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditText("");
  };

  const handleEditSubmit = () => {
    if (!activeChatId || isLoading || editingIndex === null || !editText.trim()) return;

    const editedContent = editText.trim();
    // Check if there's an assistant reply after this message
    const hasReplyAfter =
      editingIndex < messages.length - 1 &&
      messages[editingIndex + 1]?.role === "assistant";
    const deleteCount = hasReplyAfter ? 2 : 1;

    // Build new message list: everything before the edited message + the edited message
    const newMessages = [
      ...messages.slice(0, editingIndex),
      { role: "user" as const, content: editedContent },
    ];

    setMessages(newMessages);
    setEditingIndex(null);
    setEditText("");

    fetcher.submit(
      {
        _action: "editMessage",
        messages: JSON.stringify(newMessages),
        chatId: activeChatId,
        editedMessage: editedContent,
        deleteCount: String(deleteCount),
      },
      { method: "post" }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let chatId = activeChatId;

    if (!chatId) {
      // We need to create a chat first, then send message
      // For simplicity, create chat inline with custom names
      fetcher.submit(
        { _action: "newChat", assistantName, userName, model },
        { method: "post" }
      );
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
        {/* Header bar with role names toggle */}
        {messages.length > 0 && (
          <div className="border-b border-gray-200 bg-gray-100">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {assistantName} / {userName}
              </span>
              <button
                onClick={() => setShowNames(!showNames)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Edit role names"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {showNames && (
              <div className="px-3 pb-3 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Assistant</label>
                  <input
                    type="text"
                    value={assistantName}
                    onChange={(e) => {
                      setAssistantName(e.target.value);
                      submitSettings({ assistantName: e.target.value });
                    }}
                    className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300 w-28"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">User</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      submitSettings({ userName: e.target.value });
                    }}
                    className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300 w-28"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Model</label>
                  <select
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value as typeof DEFAULT_MODEL);
                      submitSettings({ model: e.target.value });
                    }}
                    className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h1 className="font-medium text-gray-700 mb-2">New chat</h1>
                <div className="mt-6 inline-flex flex-col gap-3 text-left bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-500 font-medium">Chat settings</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-16">Assistant</label>
                    <input
                      type="text"
                      value={assistantName}
                      onChange={(e) => {
                        setAssistantName(e.target.value);
                        submitSettings({ assistantName: e.target.value });
                      }}
                      className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300 w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-16">User</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        submitSettings({ userName: e.target.value });
                      }}
                      className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300 w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-16">Model</label>
                    <select
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        submitSettings({ model: e.target.value });
                      }}
                      className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const isLastAssistant =
                message.role === "assistant" &&
                index ===
                  messages.reduce(
                    (lastIdx, m, i) => (m.role === "assistant" ? i : lastIdx),
                    -1
                  );
              const isLastUser =
                message.role === "user" &&
                index ===
                  messages.reduce(
                    (lastIdx, m, i) => (m.role === "user" ? i : lastIdx),
                    -1
                  );

              return (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[80%]">
                    {editingIndex === index ? (
                      <div className="flex flex-col gap-2" style={editWidth ? { width: editWidth } : undefined}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleEditSubmit();
                            }
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          autoFocus
                          rows={3}
                          className="w-full bg-blue-100 text-gray-800 rounded-2xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleEditCancel}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleEditSubmit}
                            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-gray-700 rounded-lg transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group/msg relative">
                        <div
                          ref={isLastUser ? lastUserMsgRef : undefined}
                          className={` rounded-2xl px-4 py-3 ${
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
                        {isLastAssistant && !isLoading && (
                          <button
                            onClick={handleRegenerate}
                            className="mt-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Regenerate response"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {!isLoading && message.role === "user" && (
                          <button
                            onClick={() => handleEditStart(index)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover/msg:opacity-100 transition-opacity"
                            title="Edit message"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

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
