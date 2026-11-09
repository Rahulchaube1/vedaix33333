import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import OpenAILLM from '../openai/openaiLLM';
import OpenAIEmbedding from '../openai/openaiEmbedding';

interface TogetherConfig {
  apiKey: string;
}

const defaultChatModels: Model[] = [
  {
    name: 'Llama 3.3 70B Turbo',
    key: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  {
    name: 'DeepSeek R1 (Together)',
    key: 'deepseek-ai/DeepSeek-R1',
  },
  {
    name: 'DeepSeek V3 (Together)',
    key: 'deepseek-ai/DeepSeek-V3',
  },
  {
    name: 'Qwen 2.5 72B Turbo',
    key: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
  },
];

const defaultEmbeddingModels: Model[] = [
  {
    name: 'BGE Large EN v1.5',
    key: 'BAAI/bge-large-en-v1.5',
  },
  {
    name: 'M2 BERT 80M 8k Retrieval',
    key: 'togethercomputer/m2-bert-80M-8k-retrieval',
  },
];

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Together AI API key',
    required: true,
    placeholder: 'Together API Key',
    env: 'TOGETHER_API_KEY',
    scope: 'server',
  },
];

class TogetherProvider extends BaseModelProvider<TogetherConfig> {
  constructor(id: string, name: string, config: TogetherConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch('https://api.together.xyz/v1/models', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const chatModels: Model[] = [];
          const embeddingModels: Model[] = [];

          data.forEach((m: any) => {
            if (m.type === 'embedding') {
              embeddingModels.push({ name: m.display_name || m.id, key: m.id });
            } else if (m.type === 'chat') {
              chatModels.push({ name: m.display_name || m.id, key: m.id });
            }
          });

          return {
            embedding: embeddingModels.length > 0 ? embeddingModels : defaultEmbeddingModels,
            chat: chatModels.length > 0 ? chatModels.slice(0, 25) : defaultChatModels,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Together models, using defaults:', err);
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
      throw new Error('Error Loading Together AI Chat Model. Invalid Model Selected');
    }

    return new OpenAILLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.together.xyz/v1',
      supportsStructuredOutputs: false,
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    const modelList = await this.getModelList();
    const exists = modelList.embedding.find((m) => m.key === key);

    if (!exists) {
      throw new Error('Error Loading Together AI Embedding Model. Invalid Model Selected.');
    }

    return new OpenAIEmbedding({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.together.xyz/v1',
    });
  }

  static parseAndValidate(raw: any): TogetherConfig {
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
      key: 'together',
      name: 'Together AI',
    };
  }
}

export default TogetherProvider;
