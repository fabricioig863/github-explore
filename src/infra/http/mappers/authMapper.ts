import type { AuthenticatedUser } from '@/domain/entities/AuthenticatedUser';
import type { GithubUserDto } from 'src/infra/http/dtos/AuthDtos';

export function mapAuthenticatedUser(dto: GithubUserDto): AuthenticatedUser {
  return {
    id: dto.id,
    login: dto.login,
    name: dto.name,
    email: dto.email,
    avatarUrl: dto.avatar_url,
    bio: dto.bio,
    publicReposCount: dto.public_repos,
    followers: dto.followers,
    following: dto.following,
  };
}
