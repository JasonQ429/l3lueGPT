import React from 'react';
import { Chat } from '../types/chat';
import { MessageSquare, Trash2 } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatList({ chats, currentChatId, onSelectChat, onDeleteChat, onNewChat }: ChatListProps) {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 ${
              chat.id === currentChatId ? 'bg-gray-800' : ''
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="flex-1 text-sm truncate">{chat.title}</span>
            {chat.id === currentChatId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}