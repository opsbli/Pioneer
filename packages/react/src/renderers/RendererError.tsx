import { AlertCircle } from 'lucide-react';

interface RendererErrorProps {
  message: string;
  detail?: string;
  showIcon?: boolean;
}

export const RendererError: React.FC<RendererErrorProps> = ({
  message,
  detail,
  showIcon = true,
}) => {
  return (
    <div className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
      <div className="pio-text-center">
        {showIcon && (
          <div className="pio-w-12 pio-h-12 pio-mx-auto pio-mb-3 pio-rounded-full pio-bg-red-500/10 pio-flex pio-items-center pio-justify-center">
            <AlertCircle className="pio-w-6 pio-h-6 pio-text-red-400" />
          </div>
        )}
        <p className="pio-text-base pio-font-medium pio-text-fg-primary pio-mb-1">
          {message}
        </p>
        {detail && (
          <p className="pio-text-xs pio-text-fg-tertiary">{detail}</p>
        )}
      </div>
    </div>
  );
};
