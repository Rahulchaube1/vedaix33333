import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import OpenAILLM from '../openai/openaiLLM';

interface DeepSeekConfig {
  apiKey: string;
}

const defaultChatModels: Model[] = [
  {
    name: 'DeepSeek V3 (Chat)',
    key: 'deepseek-chat',
  },
  {
    name: 'DeepSeek R1 (Reasoner)',
    key: 'deepseek-reasoner',
  },
];

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your DeepSeek API key',
    required: true,
    placeholder: 'DeepSeek API Key (sk-...)',
    env: 'DEEPSEEK_API_KEY',
    scope: 'server',
  },
];

class DeepSeekProvider extends BaseModelProvider<DeepSeekConfig> {
  constructor(id: string, name: string, config: DeepSeekConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch('https://api.deepseek.com/models', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const fetchedModels: Model[] = data.data.map((m: any) => ({
            name: m.id === 'deepseek-chat' ? 'DeepSeek V3 (Chat)' : m.id === 'deepseek-reasoner' ? 'DeepSeek R1 (Reasoner)' : m.id,
            key: m.id,
          }));
          return {
            embedding: [],
            chat: fetchedModels,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch DeepSeek models, using defaults:', err);
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
      throw new Error('Error Loading DeepSeek Chat Model. Invalid Model Selected');
    }

    return new OpenAILLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.deepseek.com',
      supportsStructuredOutputs: false,
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    throw new Error('DeepSeek Provider does not currently support embedding models.');
  }

  static parseAndValidate(raw: any): DeepSeekConfig {
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
      key: 'deepseek',
      name: 'DeepSeek',
    };
  }
}

export default DeepSeekProvider;
