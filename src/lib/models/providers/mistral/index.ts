import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import OpenAILLM from '../openai/openaiLLM';
import OpenAIEmbedding from '../openai/openaiEmbedding';

interface MistralConfig {
  apiKey: string;
}

const defaultChatModels: Model[] = [
  {
    name: 'Mistral Large',
    key: 'mistral-large-latest',
  },
  {
    name: 'Mistral Small',
    key: 'mistral-small-latest',
  },
  {
    name: 'Codestral',
    key: 'codestral-latest',
  },
  {
    name: 'Ministral 8B',
    key: 'ministral-8b-latest',
  },
  {
    name: 'Mistral NeMo (Open)',
    key: 'open-mistral-nemo',
  },
];

const defaultEmbeddingModels: Model[] = [
  {
    name: 'Mistral Embed',
    key: 'mistral-embed',
  },
];

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Mistral AI API key',
    required: true,
    placeholder: 'Mistral API Key',
    env: 'MISTRAL_API_KEY',
    scope: 'server',
  },
];

class MistralProvider extends BaseModelProvider<MistralConfig> {
  constructor(id: string, name: string, config: MistralConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const chatModels: Model[] = [];
          const embeddingModels: Model[] = [];

          data.data.forEach((m: any) => {
            if (m.id.includes('embed')) {
              embeddingModels.push({ name: m.id, key: m.id });
            } else {
              chatModels.push({ name: m.id, key: m.id });
            }
          });

          return {
            embedding: embeddingModels.length > 0 ? embeddingModels : defaultEmbeddingModels,
            chat: chatModels.length > 0 ? chatModels : defaultChatModels,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Mistral models, using defaults:', err);
    }

    return {
      embedding: defaultEmbeddingModels,
      chat: defaultChatModels,
    };
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id);

    return {
      embedding: [
        ...defaultModels.embedding,
        ...(configProvider?.embeddingModels || []),
      ],
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
      throw new Error('Error Loading Mistral Chat Model. Invalid Model Selected');
    }

    return new OpenAILLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.mistral.ai/v1',
      supportsStructuredOutputs: false,
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    const modelList = await this.getModelList();
    const exists = modelList.embedding.find((m) => m.key === key);

    if (!exists) {
      throw new Error('Error Loading Mistral Embedding Model. Invalid Model Selected.');
    }

    return new OpenAIEmbedding({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.mistral.ai/v1',
    });
  }

  static parseAndValidate(raw: any): MistralConfig {
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
      key: 'mistral',
      name: 'Mistral AI',
    };
  }
}

export default MistralProvider;
