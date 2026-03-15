const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE === 'production';

export const logger = {
  debug: (...args: any[]) => {
    if (!isProd) console.debug(...args);
  },
  info: (...args: any[]) => {
    if (!isProd) console.info(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  }
};

export default logger;
