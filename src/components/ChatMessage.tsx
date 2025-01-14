import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types/chat';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

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
  
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  };

  const processedContent = message.content
    .split('\n')
    .map(line => line.trim())
    .join('\n');
  const htmlContent = marked(processedContent);
  const sanitizedContent = DOMPurify.sanitize(htmlContent, sanitizeConfig);

  return (
    <div className={`px-4 py-2 transition-colors duration-200 ${
      isDark
        ? 'hover:bg-gray-800/50'
        : 'hover:bg-gray-50'
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
              isDark ? 'text-gray-300' : 'text-gray-500'
            }`}>
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div className={`relative rounded-xl px-4 py-3 shadow-sm
            ${isDark 
              ? isBot 
                ? 'bg-gray-800/90 text-gray-100 border border-gray-700' 
                : 'bg-gray-700/90 text-gray-100 border border-gray-600'
              : isBot
                ? 'bg-blue-50 text-gray-900 border border-blue-100'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}>
            <div 
              className={`prose prose-sm max-w-none break-words
                ${isDark 
                  ? 'prose-invert prose-p:text-gray-100 prose-headings:text-white prose-strong:text-white prose-em:text-gray-100 prose-code:text-pink-300'
                  : 'prose-p:text-gray-800 prose-headings:text-gray-900 prose-code:text-pink-600'
                }
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-code:before:content-none prose-code:after:content-none
                [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>pre]:my-2 [&>blockquote]:my-2
                [&>pre]:p-3 [&>pre]:rounded-lg
                [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md
                ${isDark 
                  ? '[&>code]:bg-gray-800 [&>code]:text-pink-300'
                  : '[&>code]:bg-gray-100 [&>code]:text-pink-600'
                }
                [&>blockquote]:border-l-2 [&>blockquote]:pl-4 [&>blockquote]:italic
                ${isDark 
                  ? '[&>blockquote]:border-gray-600 [&>blockquote]:text-gray-200 [&>blockquote]:bg-gray-800/50'
                  : '[&>blockquote]:border-gray-300 [&>blockquote]:text-gray-600 [&>blockquote]:bg-gray-50'
                }
                [&>a]:underline [&>a]:font-medium
                ${isDark
                  ? '[&>a]:text-blue-400 [&>a]:hover:text-blue-300'
                  : '[&>a]:text-blue-600 [&>a]:hover:text-blue-700'
                }
                [&>ul]:list-disc [&>ol]:list-decimal
                [&>li]:ml-4
                ${isDark
                  ? '[&>ul]:text-gray-100 [&>ol]:text-gray-100'
                  : '[&>ul]:text-gray-800 [&>ol]:text-gray-800'
                }
                [&>h1]:text-xl [&>h2]:text-lg [&>h3]:text-base
                [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-semibold
                [&>h1]:mb-4 [&>h2]:mb-3 [&>h3]:mb-2`}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}