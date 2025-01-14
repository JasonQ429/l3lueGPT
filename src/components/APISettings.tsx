import React, { useState, useEffect } from 'react';
import { Settings, Key, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface APIKeys {
  mistral: string;
  openAssistant: string;
}

export function APISettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [keys, setKeys] = useState<APIKeys>({
    mistral: localStorage.getItem('VITE_MISTRAL_API_KEY') || '',
    openAssistant: localStorage.getItem('VITE_OPENASSISTANT_API_KEY') || ''
  });
  const [errors, setErrors] = useState<Partial<APIKeys>>({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const handleOpenSettings = (e: CustomEvent) => {
      setIsOpen(true);
      if (e.detail?.reason === 'invalid_keys') {
        toast.error('API keys are missing or invalid. Please update them.');
      }
    };

    window.addEventListener('openAPISettings', handleOpenSettings as EventListener);
    return () => {
      window.removeEventListener('openAPISettings', handleOpenSettings as EventListener);
    };
  }, []);

  const validateKeys = async () => {
    setIsValidating(true);
    setErrors({});

    try {
      // Validate Mistral key
      if (keys.mistral) {
        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keys.mistral}`
          },
          body: JSON.stringify({
            model: 'mistral-tiny',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 1
          })
        });
        if (!mistralResponse.ok) {
          setErrors(prev => ({ ...prev, mistral: 'Invalid Mistral API key' }));
        }
      } else {
        setErrors(prev => ({ ...prev, mistral: 'Mistral API key is required' }));
      }

      // Validate OpenAssistant key
      if (keys.openAssistant) {
        const openAssistantResponse = await fetch('https://api-inference.huggingface.co/models/OpenAssistant/oasst-sft-7-llama-2-70b-hf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keys.openAssistant}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: 'Test',
            parameters: { max_new_tokens: 1 }
          })
        });
        
        // For OpenAssistant, a 503 is valid (model loading)
        if (!openAssistantResponse.ok && openAssistantResponse.status !== 503) {
          setErrors(prev => ({ ...prev, openAssistant: 'Invalid OpenAssistant API key' }));
        }
      } else {
        setErrors(prev => ({ ...prev, openAssistant: 'OpenAssistant API key is required' }));
      }

      if (Object.keys(errors).length === 0) {
        localStorage.setItem('VITE_MISTRAL_API_KEY', keys.mistral);
        localStorage.setItem('VITE_OPENASSISTANT_API_KEY', keys.openAssistant);
        toast.success('API keys saved successfully');
        setIsOpen(false);
      }
    } catch (error) {
      toast.error('Error validating API keys');
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        aria-label="API Settings"
      >
        <Settings className="w-5 h-5" />
        <span className="hidden sm:inline">API Settings</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">API Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mistral API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={keys.mistral}
                onChange={(e) => setKeys(prev => ({ ...prev, mistral: e.target.value }))}
                className={`pl-10 w-full rounded-lg border ${
                  errors.mistral ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="Enter Mistral API key"
              />
            </div>
            {errors.mistral && (
              <p className="mt-1 text-sm text-red-600">{errors.mistral}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAssistant API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={keys.openAssistant}
                onChange={(e) => setKeys(prev => ({ ...prev, openAssistant: e.target.value }))}
                className={`pl-10 w-full rounded-lg border ${
                  errors.openAssistant ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="Enter OpenAssistant API key"
              />
            </div>
            {errors.openAssistant && (
              <p className="mt-1 text-sm text-red-600">{errors.openAssistant}</p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              How to get API keys
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>
                <strong>Mistral API key:</strong>{' '}
                <a
                  href="https://console.mistral.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  console.mistral.ai
                </a>
              </li>
              <li>
                <strong>OpenAssistant:</strong>{' '}
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  huggingface.co/settings/tokens
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-4">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={validateKeys}
            disabled={isValidating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <span className="animate-spin">⌛</span>
                Validating...
              </>
            ) : (
              'Save & Validate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}