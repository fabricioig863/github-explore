export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
  bio: string | null;
  publicReposCount: number;
  followers: number;
  following: number;
}
