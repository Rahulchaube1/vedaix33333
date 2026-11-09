import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import AnthropicLLM from './anthropicLLM';

interface AnthropicConfig {
  apiKey: string;
}

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Anthropic API key',
    required: true,
    placeholder: 'Anthropic API Key',
    env: 'ANTHROPIC_API_KEY',
    scope: 'server',
  },
];

const fallbackAnthropicChatModels: Model[] = [
  { key: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { key: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
  { key: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
];

class AnthropicProvider extends BaseModelProvider<AnthropicConfig> {
  constructor(id: string, name: string, config: AnthropicConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch('https://api.anthropic.com/v1/models?limit=999', {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-type': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = (await res.json()).data;
        if (Array.isArray(data) && data.length > 0) {
          const models: Model[] = data.map((m: any) => {
            return {
              key: m.id,
              name: m.display_name || m.id,
            };
          });

          return {
            embedding: [],
            chat: models,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Anthropic models, using defaults:', err);
    }

    return {
      embedding: [],
      chat: fallbackAnthropicChatModels,
    };
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id)!;

    return {
      embedding: [],
      chat: [...defaultModels.chat, ...configProvider.chatModels],
    };
  }

  async loadChatModel(key: string): Promise<BaseLLM<any>> {
    const modelList = await this.getModelList();

    const exists = modelList.chat.find((m) => m.key === key);

    if (!exists) {
      throw new Error(
        'Error Loading Anthropic Chat Model. Invalid Model Selected',
      );
    }

    return new AnthropicLLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.anthropic.com/v1',
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    throw new Error('Anthropic provider does not support embedding models.');
  }

  static parseAndValidate(raw: any): AnthropicConfig {
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
      key: 'anthropic',
      name: 'Anthropic',
    };
  }
}

export default AnthropicProvider;
