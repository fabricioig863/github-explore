export type AnalyticsEvent =
  | { name: 'repo_searched'; query: string; resultCount: number }
  | { name: 'repo_viewed'; fullName: string }
  | { name: 'repo_saved'; fullName: string; collection: string | null }
  | { name: 'repo_unsaved'; fullName: string }
  | { name: 'issues_viewed'; fullName: string; state: string }
  | { name: 'profile_viewed'; login: string }
  | { name: 'collection_opened'; collection: string };

export type AnalyticsEventName = AnalyticsEvent['name'];

export type ScreenName =
  'explore' | 'design_system' | 'saved' | 'profile' | 'repo_detail' | 'issues' | 'settings';
