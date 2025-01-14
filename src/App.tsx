import React, { useEffect, useState, useRef } from 'react';
import { Message } from './types/chat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { AuthForm } from './components/AuthForm';
import { APISettings } from './components/APISettings';
import { Bot, LogOut, Moon, Sun } from 'lucide-react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { Toaster, toast } from 'react-hot-toast';
import { getAIResponse } from './lib/l3lueAI';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !currentChatId) {
      initializeChat();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages();
    }
  }, [currentChatId]);

  const initializeChat = async () => {
    try {
      // First ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            email: user.email 
          }]);

        if (createProfileError) {
          throw new Error('Failed to create user profile');
        }
      }

      // Then create a new chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert([{ user_id: user.id }])
        .select()
        .single();

      if (chatError) throw chatError;
      setCurrentChatId(chat.id);

      // Set initial welcome message
      const welcomeMessage: Message = {
        id: '1',
        content: "Hello! I'm l3lueGPT, your AI assistant. How can I help you today?",
        role: 'assistant',
        timestamp: new Date(),
        chatId: chat.id
      };

      setMessages([welcomeMessage]);

      // Save welcome message
      const { error: msgError } = await supabase
        .from('messages')
        .insert([{
          chat_id: chat.id,
          content: welcomeMessage.content,
          role: 'assistant'
        }]);

      if (msgError) throw msgError;
    } catch (error) {
      console.error('Chat initialization error:', error);
      toast.error('Failed to initialize chat');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at),
        chatId: msg.chat_id
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setMessages([]);
      setCurrentChatId(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !currentChatId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      chatId: currentChatId
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save user message
      const { error: saveError } = await supabase
        .from('messages')
        .insert([{
          chat_id: currentChatId,
          content: userMessage.content,
          role: 'user'
        }]);

      if (saveError) throw saveError;

      // Get AI response
      const aiResponse = await getAIResponse(messages.concat(userMessage));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        chatId: currentChatId
      };

      // Save AI message
      const { error: aiSaveError } = await supabase
        .from('messages')
        .insert([{
          chat_id: currentChatId,
          content: aiMessage.content,
          role: 'assistant'
        }]);

      if (aiSaveError) throw aiSaveError;

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast.error(errorMessage);
      console.error('AI response error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col ${
        isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <header className={`border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-[#0D47A1]' : 'bg-[#1E90FF]'
              }`}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">l3lueGPT</h1>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <AuthForm isDark={isDark} />
        </main>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <header className={`border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-[#0D47A1]' : 'bg-[#1E90FF]'
            }`}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">l3lueGPT</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <APISettings />
            <button
              onClick={handleSignOut}
              className={`inline-flex items-center gap-2 ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} isDark={isDark} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} isDark={isDark} />
      <Toaster position="top-right" />
    </div>
  );
}