import { toast, ExternalToast } from 'sonner';

/**
 * Gets the current active language from the `googtrans` cookie.
 * Fallbacks to 'es' if not found.
 */
const getCurrentLang = (): 'es' | 'en' => {
  if (typeof document === 'undefined') return 'es';
  const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  if (match) {
    return match[1] === 'en' ? 'en' : 'es';
  }
  return 'es';
};

/**
 * A wrapper around sonner toast to support i18n
 */
export const i18nToast = {
  success: (msgEs: string, msgEn?: string, options?: ExternalToast) => {
    const lang = getCurrentLang();
    const message = lang === 'en' && msgEn ? msgEn : msgEs;
    toast.success(message, options);
  },
  error: (msgEs: string, msgEn?: string, options?: ExternalToast) => {
    const lang = getCurrentLang();
    const message = lang === 'en' && msgEn ? msgEn : msgEs;
    toast.error(message, options);
  },
  info: (msgEs: string, msgEn?: string, options?: ExternalToast) => {
    const lang = getCurrentLang();
    const message = lang === 'en' && msgEn ? msgEn : msgEs;
    toast.info(message, options);
  },
  warning: (msgEs: string, msgEn?: string, options?: ExternalToast) => {
    const lang = getCurrentLang();
    const message = lang === 'en' && msgEn ? msgEn : msgEs;
    toast.warning(message, options);
  },
  loading: (msgEs: string, msgEn?: string, options?: ExternalToast) => {
    const lang = getCurrentLang();
    const message = lang === 'en' && msgEn ? msgEn : msgEs;
    return toast.loading(message, options);
  },
  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  }
};
