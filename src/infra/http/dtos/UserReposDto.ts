import type { RepositoryDto } from 'src/infra/http/dtos/RepositoryDto';

// GET /users/{login}/repos devolve um array cru de repositórios (sem envelope).
export type UserReposResponseDto = RepositoryDto[];
