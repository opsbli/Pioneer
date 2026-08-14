import React from 'react';
import { useTranslator } from '../i18n/LocaleContext';

export const RendererLoading: React.FC = () => {
  const t = useTranslator();
  return (
    <div className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full pio-text-fg-muted">
      <div className="pio-flex pio-flex-col pio-items-center pio-gap-3">
        <div className="pio-w-8 pio-h-8 pio-rounded-full pio-border-2 pio-border-fg-muted pio-border-t-transparent pio-animate-spin" />
        <span className="pio-text-sm">{t('common.loading') ?? 'Loading...'}</span>
      </div>
    </div>
  );
};
