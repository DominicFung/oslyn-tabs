// Centralized logging utility to reduce debug noise in production
const isDebugMode = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';

export class Logger {
  static debug(message: string, ...args: any[]): void {
    if (isDebugMode) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    console.log(`ℹ️ [INFO] ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`❌ [ERROR] ${message}`, ...args);
  }

  static success(message: string, ...args: any[]): void {
    console.log(`✅ [SUCCESS] ${message}`, ...args);
  }

  // Performance logging
  static time(label: string): void {
    if (isDebugMode) {
      console.time(`⏱️ [TIMER] ${label}`);
    }
  }

  static timeEnd(label: string): void {
    if (isDebugMode) {
      console.timeEnd(`⏱️ [TIMER] ${label}`);
    }
  }

  // Conditional logging based on environment
  static conditional(condition: boolean, message: string, ...args: any[]): void {
    if (condition && isDebugMode) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }
}
