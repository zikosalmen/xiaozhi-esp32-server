import Vue from 'vue';
import VueI18n from 'vue-i18n';
import en from './en';
import fr from './fr';
import ar from './ar';

import enLocale from 'element-ui/lib/locale/lang/en';
import frLocale from 'element-ui/lib/locale/lang/fr';
import arLocale from 'element-ui/lib/locale/lang/ar';

Vue.use(VueI18n);

// Support strictly only English, French, and Arabic
const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];

const getDefaultLanguage = () => {
  const savedLang = localStorage.getItem('userLanguage');
  if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
    return savedLang;
  }
  const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (browserLang.indexOf('fr') === 0) {
    return 'fr';
  }
  if (browserLang.indexOf('ar') === 0) {
    return 'ar';
  }
  return 'en';
};

const initialLang = getDefaultLanguage();
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', initialLang === 'ar' ? 'rtl' : 'ltr');
}

const i18n = new VueI18n({
  locale: initialLang,
  fallbackLocale: 'en',
  messages: {
    'en': { ...en, ...enLocale },
    'fr': { ...frLocale, ...fr },
    'ar': { ...arLocale, ...ar },
  }
});

export default i18n;

// Switch language strictly between en, fr, and ar
export const changeLanguage = (lang) => {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    lang = 'en';
  }
  i18n.locale = lang;
  localStorage.setItem('userLanguage', lang);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
  Vue.prototype.$eventBus.$emit('languageChanged', lang);
};