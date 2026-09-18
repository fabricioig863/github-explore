const FALLBACK_LOGIN = 'octocat';

export const DEFAULT_PROFILE_LOGIN =
  process.env.EXPO_PUBLIC_PROFILE_USERNAME?.trim() !== undefined &&
  process.env.EXPO_PUBLIC_PROFILE_USERNAME.trim().length > 0
    ? process.env.EXPO_PUBLIC_PROFILE_USERNAME.trim()
    : FALLBACK_LOGIN;
