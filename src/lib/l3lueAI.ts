import { Message } from '../types/chat';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: true
});

function detectLanguage(text: string): 'en' | 'zh' {
  const englishRequest = /(?:reply|respond|answer|speak).*(?:in|using) (?:english|英文)/i;
  const chineseRequest = /(?:reply|respond|answer|speak).*(?:in|using) (?:chinese|中文)|(?:用|说|回复).*(?:中文|汉语)/i;
  
  if (englishRequest.test(text)) return 'en';
  if (chineseRequest.test(text)) return 'zh';

  const chineseRegex = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u20000-\u2a6df]|[\u2a700-\u2b73f]|[\u2b740-\u2b81f]|[\u2b820-\u2ceaf]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u2f800-\u2fa1f]/;
  const chineseCharCount = (text.match(chineseRegex) || []).length;
  const totalLength = text.replace(/[\s\p{P}]/gu, '').length;
  
  return chineseCharCount / totalLength > 0.3 ? 'zh' : 'en';
}

function formatSystemPrompt(language: 'en' | 'zh'): string {
  const currentTime = new Date().toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return language === 'zh'
    ? `你是一个先进的 AI 助手，使用最新的 Mistral 和 Yi-6B 模型。当前时间：${currentTime}。请用中文回复。`
    : `You are an advanced AI assistant using the latest Mistral and Yi-6B models. Current time: ${currentTime}. Please respond in English.`;
}

async function validateAPIKeys(): Promise<void> {
  const mistralKey = localStorage.getItem('VITE_MISTRAL_API_KEY');
  const openAssistantKey = localStorage.getItem('VITE_OPENASSISTANT_API_KEY');

  if (!mistralKey || !openAssistantKey) {
    const event = new CustomEvent('openAPISettings', { 
      detail: { reason: 'invalid_keys' } 
    });
    window.dispatchEvent(event);
    throw new Error('API keys not found');
  }
}

async function callMistralAPI(messages: Message[], language: 'en' | 'zh'): Promise<string> {
  await validateAPIKeys();
  const mistralKey = localStorage.getItem('VITE_MISTRAL_API_KEY');

  const formattedMessages = [
    { role: 'system', content: formatSystemPrompt(language) },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
        presence_penalty: 0.5,
        frequency_penalty: 0.5
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Mistral API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Mistral API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Mistral API error:', error);
    throw error;
  }
}

async function callOpenAssistantAPI(messages: Message[], language: 'en' | 'zh'): Promise<string> {
  await validateAPIKeys();
  const openAssistantKey = localStorage.getItem('VITE_OPENASSISTANT_API_KEY');

  const formattedMessages = [
    { role: 'system', content: formatSystemPrompt(language) },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/01-ai/Yi-6B-200K', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAssistantKey}`,
      },
      body: JSON.stringify({
        inputs: formattedMessages[formattedMessages.length - 1].content,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.2,
          do_sample: true
        }
      }),
    });

    if (response.status === 503) {
      const data = await response.json();
      if (data.error?.includes('Model is currently loading')) {
        throw new Error('Model is loading, please try again in a moment');
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `OpenAssistant API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data[0]?.generated_text) {
      throw new Error('Invalid response from Yi-6B API');
    }

    return data[0].generated_text;
  } catch (error) {
    console.error('Yi-6B API error:', error);
    throw error;
  }
}

export async function getAIResponse(messages: Message[]): Promise<string> {
  if (!messages.length) {
    throw new Error('No messages provided');
  }

  const lastMessage = messages[messages.length - 1];
  const language = detectLanguage(lastMessage.content);

  try {
    let text: string;
    try {
      text = await callMistralAPI(messages, language);
    } catch (mistralError) {
      console.warn('Mistral API error, falling back to Yi-6B:', mistralError);
      text = await callOpenAssistantAPI(messages, language);
    }

    return marked(text);
  } catch (error) {
    if (error.message.includes('API keys not found')) {
      throw new Error(language === 'zh'
        ? '请先设置 API 密钥'
        : 'Please set up your API keys first'
      );
    }

    console.error('AI response error:', error);
    throw new Error(language === 'zh'
      ? '获取AI响应时出错：' + error.message
      : 'Error getting AI response: ' + error.message
    );
  }
}