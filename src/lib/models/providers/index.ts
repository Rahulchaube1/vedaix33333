import { ModelProviderUISection } from '@/lib/config/types';
import { ProviderConstructor } from '../base/provider';
import OpenAIProvider from './openai';
import OllamaProvider from './ollama';
import GeminiProvider from './gemini';
import TransformersProvider from './transformers';
import GroqProvider from './groq';
import LemonadeProvider from './lemonade';
import AnthropicProvider from './anthropic';
import LMStudioProvider from './lmstudio';
import DeepSeekProvider from './deepseek';
import OpenRouterProvider from './openrouter';
import MistralProvider from './mistral';
import TogetherProvider from './together';

export const providers: Record<string, ProviderConstructor<any>> = {
  openai: OpenAIProvider,
  deepseek: DeepSeekProvider,
  openrouter: OpenRouterProvider,
  groq: GroqProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  mistral: MistralProvider,
  together: TogetherProvider,
  ollama: OllamaProvider,
  lmstudio: LMStudioProvider,
  transformers: TransformersProvider,
  lemonade: LemonadeProvider,
};

export const getModelProvidersUIConfigSection =
  (): ModelProviderUISection[] => {
    return Object.entries(providers).map(([k, p]) => {
      const configFields = p.getProviderConfigFields();
      const metadata = p.getProviderMetadata();

      return {
        fields: configFields,
        key: k,
        name: metadata.name,
      };
    });
  };
