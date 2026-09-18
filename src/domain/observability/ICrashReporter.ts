export interface CrashContext {
  [key: string]: string | number | boolean;
}

export interface ICrashReporter {
  recordError(error: Error, context?: CrashContext): void;
  log(message: string): void;
}
