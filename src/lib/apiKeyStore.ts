import { toast } from 'react-hot-toast';

interface APIKeys {
  mistral: string;
  openAssistant: string;
}

export async function validateMistralKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function validateOpenAssistantKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Test',
        parameters: { max_new_tokens: 1, return_full_text: false }
      })
    });
    
    // For OpenAssistant, a 503 response with a loading message is actually valid
    // as it means the model is loading but the API key is correct
    if (response.status === 503) {
      const data = await response.json();
      return data.error?.includes('Model is currently loading');
    }
    
    return response.ok;
  } catch {
    return false;
  }
}

class APIKeyStore {
  private static instance: APIKeyStore;
  private settingsOpen = false;
  private validationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): APIKeyStore {
    if (!APIKeyStore.instance) {
      APIKeyStore.instance = new APIKeyStore();
    }
    return APIKeyStore.instance;
  }

  getKeys(): APIKeys {
    return {
      mistral: localStorage.getItem('VITE_MISTRAL_API_KEY') || '',
      openAssistant: localStorage.getItem('VITE_OPENASSISTANT_API_KEY') || ''
    };
  }

  async validateKeys(): Promise<boolean> {
    const keys = this.getKeys();
    if (!keys.mistral || !keys.openAssistant) return false;

    const [isMistralValid, isOpenAssistantValid] = await Promise.all([
      validateMistralKey(keys.mistral),
      validateOpenAssistantKey(keys.openAssistant)
    ]);

    return isMistralValid && isOpenAssistantValid;
  }

  async ensureValidKeys(): Promise<boolean> {
    if (this.settingsOpen) return false;
    
    if (!this.validationPromise) {
      this.validationPromise = new Promise(async (resolve) => {
        const isValid = await this.validateKeys();
        if (!isValid) {
          this.settingsOpen = true;
          const event = new CustomEvent('openAPISettings', { detail: { reason: 'invalid_keys' } });
          window.dispatchEvent(event);
          resolve();
        } else {
          resolve();
        }
        this.validationPromise = null;
      });
    }

    await this.validationPromise;
    return !this.settingsOpen;
  }

  setSettingsOpen(open: boolean) {
    this.settingsOpen = open;
  }
}

export const apiKeyStore = APIKeyStore.getInstance();