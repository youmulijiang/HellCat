import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { enUSResources } from './resources/enUS';
import { zhCNResources } from './resources/zhCN';

export const I18N_STORAGE_KEY = 'hellcat_locale';
export const DEFAULT_LANGUAGE = 'zh-CN';
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  'zh-CN': { translation: zhCNResources },
  'en-US': { translation: enUSResources },
} as const;

const normalizeLanguage = (language?: string | null): AppLanguage => {
  if (!language) return DEFAULT_LANGUAGE;

  const normalized = language.toLowerCase();
  if (normalized.startsWith('en')) return 'en-US';
  if (normalized.startsWith('zh')) return 'zh-CN';
  return DEFAULT_LANGUAGE;
};

const getStoredLanguage = (): AppLanguage | null => {
  if (typeof window === 'undefined') return null;

  const storedLanguage = window.localStorage.getItem(I18N_STORAGE_KEY);
  return storedLanguage ? normalizeLanguage(storedLanguage) : null;
};

const getNavigatorLanguage = (): AppLanguage => {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  return normalizeLanguage(navigator.language);
};

const syncHtmlLanguage = (language: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalizeLanguage(language);
  }
};

export const getInitialLanguage = (): AppLanguage => {
  return getStoredLanguage() ?? getNavigatorLanguage();
};

export const getAntdLocale = (language?: string) => {
  return normalizeLanguage(language) === 'en-US' ? enUS : zhCN;
};

export const setAppLanguage = async (language: AppLanguage) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(I18N_STORAGE_KEY, language);
  }

  await i18n.changeLanguage(language);
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

syncHtmlLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on('languageChanged', syncHtmlLanguage);

export default i18n;