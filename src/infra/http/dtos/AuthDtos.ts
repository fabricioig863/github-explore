/** Payload do GitHub repassado pelo proxy (`/login/oauth/access_token`). */
export interface TokenExchangeResponseDto {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

/** Subconjunto de `GET /user` usado para hidratar o usuário autenticado. */
export interface GithubUserDto {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}
