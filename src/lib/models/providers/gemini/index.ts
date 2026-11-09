import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import GeminiEmbedding from './geminiEmbedding';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import GeminiLLM from './geminiLLM';

interface GeminiConfig {
  apiKey: string;
}

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Gemini API key',
    required: true,
    placeholder: 'Gemini API Key',
    env: 'GEMINI_API_KEY',
    scope: 'server',
  },
];

const fallbackGeminiChatModels: Model[] = [
  { key: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { key: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { key: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

const fallbackGeminiEmbeddingModels: Model[] = [
  { key: 'text-embedding-004', name: 'Text Embedding 004' },
];

class GeminiProvider extends BaseModelProvider<GeminiConfig> {
  constructor(id: string, name: string, config: GeminiConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        },
      );

      if (res.ok) {
        const data = await res.json();
        let defaultEmbeddingModels: Model[] = [];
        let defaultChatModels: Model[] = [];

        if (Array.isArray(data.models)) {
          data.models.forEach((m: any) => {
            if (
              m.supportedGenerationMethods?.some(
                (genMethod: string) =>
                  genMethod === 'embedText' || genMethod === 'embedContent',
              )
            ) {
              defaultEmbeddingModels.push({
                key: m.name,
                name: m.displayName || m.name,
              });
            } else if (m.supportedGenerationMethods?.includes('generateContent')) {
              defaultChatModels.push({
                key: m.name,
                name: m.displayName || m.name,
              });
            }
          });

          return {
            embedding: defaultEmbeddingModels.length > 0 ? defaultEmbeddingModels : fallbackGeminiEmbeddingModels,
            chat: defaultChatModels.length > 0 ? defaultChatModels : fallbackGeminiChatModels,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Gemini models, using defaults:', err);
    }

    return {
      embedding: fallbackGeminiEmbeddingModels,
      chat: fallbackGeminiChatModels,
    };
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id)!;

    return {
      embedding: [
        ...defaultModels.embedding,
        ...configProvider.embeddingModels,
      ],
      chat: [...defaultModels.chat, ...configProvider.chatModels],
    };
  }

  async loadChatModel(key: string): Promise<BaseLLM<any>> {
    const modelList = await this.getModelList();

    const exists = modelList.chat.find((m) => m.key === key);

    if (!exists) {
      throw new Error(
        'Error Loading Gemini Chat Model. Invalid Model Selected',
      );
    }

    return new GeminiLLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    const modelList = await this.getModelList();
    const exists = modelList.embedding.find((m) => m.key === key);

    if (!exists) {
      throw new Error(
        'Error Loading Gemini Embedding Model. Invalid Model Selected.',
      );
    }

    return new GeminiEmbedding({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    });
  }

  static parseAndValidate(raw: any): GeminiConfig {
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
      key: 'gemini',
      name: 'Gemini',
    };
  }
}

export default GeminiProvider;
