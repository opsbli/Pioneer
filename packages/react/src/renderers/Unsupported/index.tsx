import { FileQuestion, Download } from 'lucide-react';
import { useTranslator } from '../../i18n/LocaleContext';

interface UnsupportedRendererProps {
  fileName: string;
  fileType: string;
  onDownload: () => void;
}

export const UnsupportedRenderer: React.FC<UnsupportedRendererProps> = ({
  fileName,
  fileType,
  onDownload,
}) => {
  const t = useTranslator();
  return (
    <div className="pio-flex pio-flex-col pio-items-center pio-justify-center pio-w-full pio-h-full pio-p-6 pio-gap-4">
      <div className="pio-w-20 pio-h-20 pio-rounded-full pio-bg-surface-2 pio-flex pio-items-center pio-justify-center">
        <FileQuestion className="pio-w-10 pio-h-10 pio-text-fg-secondary" />
      </div>

      <div className="pio-text-fg-primary pio-text-center">
        <p className="pio-text-lg pio-font-medium pio-mb-2">{fileName}</p>
        <p className="pio-text-fg-secondary">{t('common.unsupported_preview', { type: fileType })}</p>
      </div>

      <button
        onClick={onDownload}
        className="pio-flex pio-items-center pio-gap-2 pio-px-4 pio-py-2 pio-bg-surface-2 hover:pio-bg-surface-3 pio-backdrop-blur-sm pio-rounded-lg pio-text-fg-primary pio-font-medium pio-transition-all"
      >
        <Download className="pio-w-5 pio-h-5" />
        {t('common.download')}
      </button>
    </div>
  );
};
