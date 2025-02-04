import { Message } from '../types/chat';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe and clean output
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: true, // Enable built-in sanitizer
  smartLists: true,
  smartypants: true,
  mangle: false,
  headerIds: false,
  silent: true
});

// Clean and format the text content
function sanitizeContent(content: string): string {
  // Remove excessive newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Remove special characters that might cause display issues
  content = content.replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, '');
  
  // Remove excessive punctuation
  content = content.replace(/([!?.]){4,}/g, '$1$1$1');
  
  // Remove markdown-breaking characters
  content = content.replace(/([`~])\1{2,}/g, '$1$1$1');
  
  // Clean up code blocks
  content = content.replace(/```{3,}/g, '```');
  
  return content.trim();
}

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
    ? `你是一个专业的AI助手。请用简洁、准确的中文回复。当前时间：${currentTime}。
    
    请注意：
    1. 回答要清晰、有条理
    2. 避免过长的回复
    3. 使用适当的标点符号
    4. 保持专业的语气`
    : `You are a professional AI assistant. Please respond in clear, concise English. Current time: ${currentTime}.
    
    Guidelines:
    1. Keep responses clear and well-structured
    2. Avoid overly long responses
    3. Use appropriate punctuation
    4. Maintain a professional tone`;
}

class AIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AIError';
  }
}

function getEnglishErrorMessage(error: AIError): string {
  switch (error.code) {
    case 'NO_MESSAGES':
      return 'No messages provided';
    case 'INVALID_API_KEY':
      return 'Invalid API key. Please check your settings.';
    default:
      return error.message;
  }
}

function getChineseErrorMessage(error: AIError): string {
  switch (error.code) {
    case 'NO_MESSAGES':
      return '未提供消息';
    case 'INVALID_API_KEY':
      return 'API密钥无效，请检查设置。';
    default:
      return error.message;
  }
}

async function validateAPIKeys(): Promise<void> {
  const mistralKey = localStorage.getItem('VITE_MISTRAL_API_KEY');
  const openAssistantKey = localStorage.getItem('VITE_OPENASSISTANT_API_KEY');

  if (!mistralKey || !openAssistantKey) {
    const event = new CustomEvent('openAPISettings', { 
      detail: { reason: 'invalid_keys' } 
    });
    window.dispatchEvent(event);
    throw new AIError('API keys not found', 'INVALID_API_KEY');
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
        max_tokens: 1000,
        top_p: 0.95,
        presence_penalty: 0.5,
        frequency_penalty: 0.5
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIError(error.error?.message || `Mistral API error: ${response.statusText}`, 'API_ERROR');
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new AIError('Invalid response from Mistral API', 'INVALID_RESPONSE');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Mistral API error:', error);
    throw error;
  }
}

export async function getAIResponse(messages: Message[]): Promise<string> {
  if (!messages.length) {
    throw new AIError('No messages provided', 'NO_MESSAGES');
  }

  const lastMessage = messages[messages.length - 1];
  const language = detectLanguage(lastMessage.content);

  try {
    const response = await callMistralAPI(messages, language);
    
    // Clean and format the response
    const sanitizedResponse = sanitizeContent(response);
    
    // Convert to markdown and sanitize HTML
    const htmlContent = marked(sanitizedResponse);
    const cleanHtml = DOMPurify.sanitize(htmlContent, {
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
    });

    return cleanHtml;
  } catch (error) {
    if (error instanceof AIError) {
      const errorMessage = language === 'zh'
        ? getChineseErrorMessage(error)
        : getEnglishErrorMessage(error);
      throw new Error(errorMessage);
    }
    
    throw new Error(language === 'zh'
      ? '发生未知错误'
      : 'An unknown error occurred'
    );
  }
}