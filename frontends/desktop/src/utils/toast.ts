import { Toast, ToastFactory } from '@douyinfe/semi-ui';

const globalToast = ToastFactory.create({ getPopupContainer: () => document.body });

export function showToast(content: string, duration = 3) {
  globalToast.info({ content, duration });
}

export function showError(content: string, duration = 4) {
  globalToast.error({ content, duration });
}

export function showSuccess(content: string, duration = 3) {
  globalToast.success({ content, duration });
}

export function showSystem(content: string) {
  globalToast.info({ content, duration: 2, showClose: false });
}

export { Toast, globalToast };
