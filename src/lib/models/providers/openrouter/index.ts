import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import OpenAILLM from '../openai/openaiLLM';

interface OpenRouterConfig {
  apiKey: string;
}

const defaultChatModels: Model[] = [
  {
    name: 'DeepSeek R1 (OpenRouter)',
    key: 'deepseek/deepseek-r1',
  },
  {
    name: 'DeepSeek V3 (OpenRouter)',
    key: 'deepseek/deepseek-chat',
  },
  {
    name: 'Llama 3.3 70B Instruct',
    key: 'meta-llama/llama-3.3-70b-instruct',
  },
  {
    name: 'Qwen 2.5 72B Instruct',
    key: 'qwen/qwen-2.5-72b-instruct',
  },
  {
    name: 'Claude 3.5 Sonnet',
    key: 'anthropic/claude-3.5-sonnet',
  },
  {
    name: 'GPT-4o',
    key: 'openai/gpt-4o',
  },
  {
    name: 'Mistral Large 2411',
    key: 'mistralai/mistral-large-2411',
  },
  {
    name: 'Gemini 2.0 Flash (Free)',
    key: 'google/gemini-2.0-flash-exp:free',
  },
];

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your OpenRouter API key',
    required: true,
    placeholder: 'OpenRouter API Key (sk-or-...)',
    env: 'OPENROUTER_API_KEY',
    scope: 'server',
  },
];

class OpenRouterProvider extends BaseModelProvider<OpenRouterConfig> {
  constructor(id: string, name: string, config: OpenRouterConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const popularIds = new Set(defaultChatModels.map((m) => m.key));
          const fetchedModels: Model[] = data.data
            .filter((m: any) => popularIds.has(m.id) || !m.id.includes(':'))
            .slice(0, 30)
            .map((m: any) => ({
              name: m.name || m.id,
              key: m.id,
            }));

          if (fetchedModels.length > 0) {
            return {
              embedding: [],
              chat: fetchedModels,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch OpenRouter models, using defaults:', err);
    }

    return {
      embedding: [],
      chat: defaultChatModels,
    };
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id);

    return {
      embedding: [],
      chat: [
        ...defaultModels.chat,
        ...(configProvider?.chatModels || []),
      ],
    };
  }

  async loadChatModel(key: string): Promise<BaseLLM<any>> {
    const modelList = await this.getModelList();
    const exists = modelList.chat.find((m) => m.key === key);

    if (!exists) {
      throw new Error('Error Loading OpenRouter Chat Model. Invalid Model Selected');
    }

    return new OpenAILLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://openrouter.ai/api/v1',
      supportsStructuredOutputs: false,
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    throw new Error('OpenRouter Provider does not support embedding models.');
  }

  static parseAndValidate(raw: any): OpenRouterConfig {
    if (!raw || typeof raw !== 'object')
      throw new Error('Invalid config provided. Expected object');
    if (!raw.apiKey)
      throw new Error('Invalid config provided. API key must be provided');

    return {
      apiKey: String(raw.apiKey),
    };
  }

  static getProviderConfigFields(): UIConfigField[] {
    return providerConfigFields;
  }

  static getProviderMetadata(): ProviderMetadata {
    return {
      key: 'openrouter',
      name: 'OpenRouter',
    };
  }
}

export default OpenRouterProvider;
