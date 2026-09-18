export interface GithubUserDto {
  id: number;
  login: string;
  name: string | null;

  email?: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}
