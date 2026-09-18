import type { GitHubUser } from '@/domain/entities/GitHubUser';
import type { GithubUserDto } from 'src/infra/http/dtos/UserDtos';

export function mapGitHubUser(dto: GithubUserDto): GitHubUser {
  return {
    id: dto.id,
    login: dto.login,
    name: dto.name,
    email: dto.email ?? null,
    avatarUrl: dto.avatar_url,
    bio: dto.bio,
    publicReposCount: dto.public_repos,
    followers: dto.followers,
    following: dto.following,
  };
}
