import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import GroqLLM from './groqLLM';

interface GroqConfig {
  apiKey: string;
}

const supportsChatCompletions = (modelKey: string) =>
  !/(whisper|orpheus|prompt-guard|safeguard|guard)/i.test(modelKey);

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Groq API key',
    required: true,
    placeholder: 'Groq API Key',
    env: 'GROQ_API_KEY',
    scope: 'server',
  },
];

const fallbackGroqChatModels: Model[] = [
  { key: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
  { key: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
  { key: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { key: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  { key: 'gemma2-9b-it', name: 'Gemma 2 9B' },
];

class GroqProvider extends BaseModelProvider<GroqConfig> {
  constructor(id: string, name: string, config: GroqConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const res = await fetch(`https://api.groq.com/openai/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const defaultChatModels: Model[] = [];

        data.data
          .filter((m: any) => supportsChatCompletions(m.id))
          .sort((a: any, b: any) => {
            const preferred = [
              'llama-3.3-70b-versatile',
              'deepseek-r1-distill-llama-70b',
              'llama-3.1-8b-instant',
            ];
            const aIndex = preferred.indexOf(a.id);
            const bIndex = preferred.indexOf(b.id);
            return (aIndex === -1 ? preferred.length : aIndex) -
              (bIndex === -1 ? preferred.length : bIndex);
          })
          .forEach((m: any) => {
            defaultChatModels.push({
              key: m.id,
              name: m.id,
            });
          });

        if (defaultChatModels.length > 0) {
          return {
            embedding: [],
            chat: defaultChatModels,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Groq models, using fallback list:', err);
    }

    return {
      embedding: [],
      chat: fallbackGroqChatModels,
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
      chat: [
        ...defaultModels.chat,
        ...configProvider.chatModels.filter((model) =>
          supportsChatCompletions(model.key),
        ),
      ],
    };
  }

  async loadChatModel(key: string): Promise<BaseLLM<any>> {
    const modelList = await this.getModelList();

    const exists = modelList.chat.find((m) => m.key === key);

    if (!exists) {
      throw new Error('Error Loading Groq Chat Model. Invalid Model Selected');
    }

    return new GroqLLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://api.groq.com/openai/v1',
      supportsStructuredOutputs: false,
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    throw new Error('Groq Provider does not support embedding models.');
  }

  static parseAndValidate(raw: any): GroqConfig {
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
      key: 'groq',
      name: 'Groq',
    };
  }
}

export default GroqProvider;
