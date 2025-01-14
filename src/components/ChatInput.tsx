import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isDark: boolean;
}

export function ChatInput({ onSendMessage, isLoading, isDark }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus after sending a message
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const message = input.trim();
    if (!message) return;

    onSendMessage(message);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`border-t p-4
      ${isDark ? 'bg-[#121212] border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className={`input-base ${isDark ? 'input-dark' : 'input-light'}`}
              style={{
                minHeight: '44px',
                maxHeight: '200px'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`btn-primary ${isDark ? 'btn-primary-dark' : 'btn-primary-light'}`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}