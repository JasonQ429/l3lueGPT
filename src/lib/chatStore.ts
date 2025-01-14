import { supabase } from './supabase';
import { Chat, Message, ChatWithMessages } from '../types/chat';

export async function createChat(userId: string): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .insert([
      { 
        user_id: userId,
        title: 'New Chat'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    userId: data.user_id
  };
}

export async function loadChats(userId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data.map(chat => ({
    id: chat.id,
    title: chat.title,
    createdAt: new Date(chat.created_at),
    updatedAt: new Date(chat.updated_at),
    userId: chat.user_id
  }));
}

export async function loadChatMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.role,
    timestamp: new Date(msg.created_at),
    chatId: msg.chat_id
  }));
}

export async function saveMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      chat_id: message.chatId,
      content: message.content,
      role: message.role
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    content: data.content,
    role: data.role,
    timestamp: new Date(data.created_at),
    chatId: data.chat_id
  };
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId);

  if (error) throw error;
}

export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) throw error;
}