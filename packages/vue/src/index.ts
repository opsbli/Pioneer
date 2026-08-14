// 导入样式
import './index.css';

// 导入版本号
import packageJson from '../package.json';

// 导出版本号
export const VERSION = packageJson.version;

// 导出主组件
export { default as PioneerModal } from './PioneerModal.vue';
export { default as PioneerEmbed } from './PioneerEmbed.vue';
export { default as PioneerContent } from './PioneerContent.vue';

// 导出类型定义
export type {
  PreviewFile,
  PreviewFileLink,
  PreviewFileInput,
  FileType,
  PreviewState,
  ToolbarAction,
  CustomRenderer,
  CustomRendererContext,
  CustomRendererEventPayload,
  RequestHandler,
  RequestInitFactory,
  RequestOptions,
  Fetcher,
  ShouldFetchAsBlob,
} from './types';

// 导出工具函数和常量
export {
  normalizeFile,
  normalizeFiles,
  getFileType,
  configurePdfWorker,
  SUPPORTED_FILE_TYPES,
} from '@pioneer/core';

export type { PdfWorkerOptions } from '@pioneer/core';

// 导出 i18n 相关
export { useTranslator, provideLocale } from './composables/useTranslator';
export { LOCALE_KEY } from './i18n/localeKey';
export type { Locale, Messages, Translator, Theme } from '@pioneer/core';
