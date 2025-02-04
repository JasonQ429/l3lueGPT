import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types/chat';
import DOMPurify from 'dompurify';

interface ChatMessageProps {
  message: Message;
  isDark: boolean;
}

function formatTimestamp(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok'
  };
  
  const now = new Date();
  const messageDate = new Date(date);
  
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString('en-US', options);
  }
  
  options.month = 'short';
  options.day = 'numeric';
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleString('en-US', options);
  }
  
  options.year = 'numeric';
  return messageDate.toLocaleString('en-US', options);
}

export function ChatMessage({ message, isDark }: ChatMessageProps) {
  const isBot = message.role === 'assistant';
  
  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: {
      'a': 'rel="noopener noreferrer" target="_blank"'
    }
  };

  const sanitizedContent = DOMPurify.sanitize(message.content, sanitizeConfig);

  return (
    <div className={`px-4 py-2 transition-colors duration-200 ${
      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
    }`}>
      <div className="max-w-3xl mx-auto flex gap-3">
        <div className="flex-shrink-0 pt-1">
          {isBot ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {isBot ? 'l3lueGPT' : 'You'}
            </p>
            <span className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div className={`relative rounded-xl px-4 py-3 shadow-sm ${
            isDark 
              ? isBot 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-gray-700 border border-gray-600'
              : isBot
                ? 'bg-blue-50 border border-blue-100'
                : 'bg-white border border-gray-200'
          }`}>
            <div className={`prose prose-sm max-w-none ${
              isDark
                ? 'text-gray-100 prose-headings:text-gray-100 prose-strong:text-gray-100 prose-em:text-gray-200'
                : 'text-gray-900 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-em:text-gray-700'
            }
              prose-p:my-2 prose-headings:my-4
              prose-ul:my-2 prose-ol:my-2
              prose-li:my-0 prose-li:text-inherit
              prose-a:text-blue-500 hover:prose-a:text-blue-400
              prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md
              ${isDark
                ? 'prose-code:bg-gray-700 prose-code:text-pink-300'
                : 'prose-code:bg-gray-100 prose-code:text-pink-600'
              }
              prose-pre:p-3 prose-pre:my-2 prose-pre:rounded-lg
              ${isDark
                ? 'prose-pre:bg-gray-900 prose-pre:text-gray-100'
                : 'prose-pre:bg-gray-50 prose-pre:text-gray-900'
              }
              prose-blockquote:border-l-2 prose-blockquote:pl-4
              ${isDark
                ? 'prose-blockquote:border-gray-600 prose-blockquote:text-gray-300'
                : 'prose-blockquote:border-gray-300 prose-blockquote:text-gray-700'
              }`}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}