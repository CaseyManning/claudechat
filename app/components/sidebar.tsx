import { useState } from "react";
import type { Chat } from "~/chat/chat.server";

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      className={`h-screen bg-gray-100 border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-12" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <button
            onClick={onNewChat}
            className="flex-1 mr-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            + New chat
          </button>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Chat list */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          {chats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentChatId === chat.id
                      ? "bg-gray-300 text-gray-900"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <div className="truncate">Chat</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(chat.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed new chat button */}
      {isCollapsed && (
        <div className="p-2">
          <button
            onClick={onNewChat}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors w-full"
            title="New chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-gray-600 mx-auto"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
