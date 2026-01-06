'use client';

import { tBilingual, POSLanguage } from '@/lib/pos-translations';
import type { posTranslations } from '@/lib/pos-translations';

interface BilingualTextProps {
  category: keyof typeof posTranslations;
  textKey: string;
  lang: POSLanguage;
  className?: string;
  primaryClassName?: string;
  englishClassName?: string;
  showEnglish?: boolean; // Default true, set false if primary is English
}

export default function BilingualText({
  category,
  textKey,
  lang,
  className = '',
  primaryClassName = '',
  englishClassName = 'text-xs opacity-60',
  showEnglish = true,
}: BilingualTextProps) {
  const { primary, english } = tBilingual(category, textKey, lang);

  // Don't show English subtitle if primary language is English
  const shouldShowEnglish = showEnglish && lang !== 'en' && primary !== english;

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={primaryClassName}>{primary}</span>
      {shouldShowEnglish && (
        <span className={englishClassName}>{english}</span>
      )}
    </span>
  );
}

// Inline version for buttons and tabs
export function BilingualTextInline({
  category,
  textKey,
  lang,
  className = '',
  primaryClassName = '',
  englishClassName = 'text-[10px] opacity-70 ml-1',
  showEnglish = true,
}: BilingualTextProps) {
  const { primary, english } = tBilingual(category, textKey, lang);

  // Don't show English subtitle if primary language is English
  const shouldShowEnglish = showEnglish && lang !== 'en' && primary !== english;

  return (
    <span className={className}>
      <span className={primaryClassName}>{primary}</span>
      {shouldShowEnglish && (
        <span className={englishClassName}>({english})</span>
      )}
    </span>
  );
}
