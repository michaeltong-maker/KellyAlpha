// Central localization for seed/demo content. Base fields on Agent/Result are
// English; an optional `i18n.zh` override supplies the Traditional-Chinese
// version of any displayed field. These helpers apply the override for the
// active language so a screen never mixes English and Chinese.
//
// User-created agents/results carry no `i18n`, so they pass through unchanged.

import type { Agent, Result } from '../types';

type Lang = 'en' | 'zh' | 'zh-Hans';

// Seed content ships an `i18n.zh` (Traditional) override. Both Chinese locales
// use it for now; the Simplified UI chrome comes from the dictionary, while
// these longer report/agent bodies remain Traditional until SC bodies are
// authored. (A future `i18n['zh-Hans']` slot could override per-locale.)
const isZh = (lang: Lang) => lang === 'zh' || lang === 'zh-Hans';

export function localizeAgent(a: Agent, lang: Lang): Agent {
  if (isZh(lang) && a.i18n?.zh) return { ...a, ...a.i18n.zh };
  return a;
}

export function localizeResult(r: Result, lang: Lang): Result {
  if (isZh(lang) && r.i18n?.zh) return { ...r, ...r.i18n.zh };
  return r;
}
