import type { InjectionKey, Ref, ComputedRef } from 'vue';
import type { Locale, Translator } from '@pioneer/core';

export interface LocaleInjection {
  locale: Ref<Locale>;
  t: ComputedRef<Translator>;
}

export const LOCALE_KEY: InjectionKey<LocaleInjection> = Symbol('pioneer-locale');
