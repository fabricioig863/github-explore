# Prompts de Implementação — Octolens

> Cada Step abaixo é um **prompt completo e auto-contido** para executar uma
> entrega. Todas as regras arquiteturais herdadas de `docs/ARQUITETURA.md` e
> `CLAUDE.md` continuam valendo (camadas, lint boundaries, cobertura, alias
> `@/infrastructure → src/infra`, validação só nos use cases, etc.) — antes de
> codar **leia esses dois arquivos**. Em qualquer divergência entre este doc e o
> código, o código vence.
>
> Mockup de referência: `mockups/Octolens App - standalone.html`.
> Telas: SignIn, SignUp, Search (Explorar), RepoDetail, Issues, Profile,
> Settings, DesignSystem — texto sempre em **português pt-BR**.

---

## Step 01 — Autenticação com GitHub OAuth e fluxo inicial

### Objetivo

Implementar autenticação via GitHub OAuth (com token-exchange num Cloudflare
Worker), uma única tela de auth (`AuthScreen`) e o switch de navegação que
separa `AuthStack` (deslogado) de `TabsNavigator` (logado).

### Decisões já tomadas

- **Sem email/senha.** O mockup tem SignIn/SignUp com email + senha + Google;
  isso é descartado. Uma tela só, um botão só: **"Continuar com GitHub"**.
- **Provider:** GitHub OAuth App (não GitHub App).
- **Fluxo:** Authorization Code com `client_secret` trocado por um Cloudflare
  Worker (não embutir secret no bundle).
- **Storage do token:** `expo-secure-store` (nunca AsyncStorage).
- **Escopos pedidos ao usuário:** `read:user user:email public_repo`.

### Pré-requisitos (fora do código)

1. Criar OAuth App em `github.com/settings/developers`. Anotar `Client ID`,
   gerar `Client Secret`. **Authorization callback URL:**
   `https://auth.expo.io/@<expo-user>/github-explorer` (dev) e o deep link da
   build standalone (`octolens://redirect`) — registrar ambos.
2. Cloudflare Worker `oauth-worker/` (ver §"Worker" abaixo) deployado, URL
   anotada.
3. Adicionar deps: `expo-auth-session`, `expo-crypto`, `expo-web-browser`,
   `expo-secure-store`, `expo-linking` (verifique versões compatíveis com
   Expo SDK 54).
4. Novas envs em `.env` (todas `EXPO_PUBLIC_`):
   - `EXPO_PUBLIC_OAUTH_CLIENT_ID` — Client ID da OAuth App.
   - `EXPO_PUBLIC_OAUTH_PROXY_URL` — URL `/exchange` do Worker.
   - `EXPO_PUBLIC_OAUTH_REDIRECT_URI` — deep link/proxy URL conforme o build.

### Arquivos a criar

**Domain (`src/domain/`)**

- `entities/AuthenticatedUser.ts` — `interface AuthenticatedUser { id; login;
  name | null; email | null; avatarUrl; bio | null }`.
- `repositories/IAuthRepository.ts` — interface com:
  - `signIn(code: string): Promise<AuthSession>` (troca code por token via
    proxy, busca user, devolve sessão).
  - `signOut(): Promise<void>` (limpa SecureStore + revoga local).
  - `getCurrentSession(): Promise<AuthSession | null>` (hidrata do storage).
  - tipos co-localizados: `AuthSession { token; user: AuthenticatedUser }`.
- `errors/AuthError.ts` — três `DomainError` novos com `code`:
  - `AuthCanceledError` → `AUTH_CANCELED`
  - `AuthDeniedError` → `AUTH_DENIED`
  - `AuthExpiredError` → `AUTH_EXPIRED`

**Application (`src/application/use-cases/`)**

- `SignInWithGithubUseCase.ts` — recebe `IAuthRepository`; execute(code) →
  `AuthSession`. Valida `assertNonEmpty(code, "Código de autorização ausente.")`.
- `SignOutUseCase.ts` — execute() → void.
- `GetCurrentSessionUseCase.ts` — execute() → `AuthSession | null`.

**Infra (`src/infra/`)**

- `auth/secureTokenStorage.ts` — wrapper assíncrono de `expo-secure-store`
  com keys `octolens:token` e `octolens:user`. Tolera leitura corrompida →
  `null`.
- `http/dtos/AuthDtos.ts` — `TokenExchangeResponseDto` (proxy retorna o
  payload do GitHub) e `GithubUserDto`.
- `http/mappers/authMapper.ts` — `mapAuthenticatedUser(GithubUserDto)` (snake →
  camel, `null` propagado).
- `repositories/GitHubAuthRepository.ts` — implementação real:
  - `signIn(code)`: `POST {OAUTH_PROXY_URL}` com `{ code }` → recebe
    `access_token`; faz `GET /user` autenticado para hidratar
    `AuthenticatedUser`; persiste sessão; devolve.
  - `signOut()`: apaga SecureStore.
  - `getCurrentSession()`: lê SecureStore; se token presente, valida com
    `GET /user`; se 401, limpa e devolve `null`.
  - Tudo dentro de `try/catch → mapHttpError`.
- `repositories/InMemoryAuthRepository.ts` — fake que aceita qualquer code
  e devolve um `AuthSession` fixo (usado quando `EXPO_PUBLIC_USE_MOCK=true`).
- `http/httpClient.ts` — **editar**: substituir o interceptor que injeta
  `EXPO_PUBLIC_GITHUB_TOKEN` por um que lê o token corrente do
  `secureTokenStorage` (com cache em memória pra não dar await por request);
  no 401, dispara um event/emitter de "sessionExpired".
- `di/providers.ts` — adicionar `provideAuthRepository(env)`.
- `di/container.ts` — adicionar `signInWithGithubUseCase`,
  `signOutUseCase`, `getCurrentSessionUseCase`.
- `navigation/AuthStack.tsx` — Native Stack com uma rota só: `Auth` →
  `AuthScreen` (`headerShown: false`).
- `navigation/RootNavigator.tsx` — **editar**: virar condicional. Lê
  `useAuthSession()` (presentation), enquanto `isHydrating` mostra um
  `Spinner` em tela cheia; depois renderiza `AuthStack` ou `TabsNavigator`.
- `navigation/types.ts` — **editar**: adicionar `AuthStackParamList`.

**Presentation (`src/presentation/`)**

- `query/queryKeys.ts` — **editar**: `auth.session()` = `['auth', 'session']`.
- `query/collections/authQueries.ts` — `session()` (`queryOptions`,
  `staleTime: Infinity`, lê `getCurrentSessionUseCase`).
- `hooks/useAuthSession.ts` — `useQuery(authQueries.session())`; retorna
  `{ session, isAuthenticated, isHydrating }`.
- `hooks/useSignInWithGithub.ts` — `useMutation`; encapsula
  `expo-auth-session` (request + prompt) → ao receber `code` chama
  `signInWithGithubUseCase`; `onSuccess` faz `queryClient.setQueryData` de
  `auth.session()` com a nova sessão.
- `hooks/useSignOut.ts` — `useMutation` que chama `signOutUseCase`;
  `onSuccess` invalida `queryKeys.auth.session()` e reseta caches sensíveis
  (`savedRepos`).
- `screens/AuthScreen/AuthScreen.tsx` — tela única (estrutura abaixo).
- `screens/AuthScreen/components/GithubButton.tsx` — botão grande com ícone
  `Github` da `lucide-react-native`, label "Continuar com GitHub", estado
  `loading` quando a mutation está pending.

**Fora de `src/` — Cloudflare Worker (`oauth-worker/`)**

Estrutura paralela ao app, fora do escopo do ESLint do app:

```
oauth-worker/
├── src/index.ts
├── wrangler.toml
├── package.json
└── tsconfig.json
```

Conteúdo do worker (`src/index.ts`):

```ts
interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

    const { code } = (await req.json()) as { code?: string };
    if (!code) return new Response(JSON.stringify({ error: 'missing_code' }), { status: 400, headers: cors });

    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
    });
    const body = await r.text();
    return new Response(body, { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
```

Setup: `wrangler secret put GITHUB_CLIENT_SECRET`; `GITHUB_CLIENT_ID` e
`ALLOWED_ORIGIN` como `[vars]` no `wrangler.toml`. Deploy: `wrangler deploy`.

### Fidelidade ao mockup — `AuthScreen`

Estrutura herda o `auth-body` da `SignInScreen` do mockup, mas **substitui
todo o miolo** (campos + Google) por um único botão. Hierarquia visual:

- `Box flex={1} backgroundColor="bg"` com `paddingHorizontal="xxxl"`
  (24px) e `justifyContent="space-between"`.
- Topo:
  - logo do app (`Box` com gradiente `gradB`, 56×56, `borderRadius="lg"`).
  - `Text variant="display"` — **"Bem-vindo ao Octolens"**.
  - `Text variant="body" color="fgMuted"` — **"Entre com sua conta do
    GitHub para explorar repositórios e issues."**
- Meio: `GithubButton` (Button `variant="primary"` com `leftIcon={<Github/>}`,
  `size="lg"`, label **"Continuar com GitHub"**, `loading={mutation.isPending}`).
- Rodapé: `Text variant="caption" color="fgSubtle" textAlign="center"` —
  **"Ao continuar, você concorda com os Termos de Uso e a Política de
  Privacidade."** (Termos/Política como `Pressable` que abre `Linking`
  para placeholders.)

### Critérios de aceitação

- Boot frio com token válido no SecureStore → entra direto nas tabs sem ver
  `AuthScreen`.
- Boot frio sem token → mostra `AuthScreen`.
- Botão "Continuar com GitHub" abre o browser do GitHub, autoriza, volta pro
  app e troca pra `TabsNavigator` sem botão de continuar.
- 401 em qualquer request da API (rate-limit é diferente) → dispara signOut
  automático e volta pra `AuthScreen`.
- `pnpm lint` passa (boundaries respeitados — nenhum import de
  `expo-auth-session` ou `expo-secure-store` em `domain`/`application`).
- Worker deployado e acessível na URL do `.env`.

### Testes obrigatórios

- **Domain (100%)**: `AuthError` subclasses (code e mensagem).
- **Application (100%)**: cada use case com `InMemoryAuthRepository`;
  cobre caminho feliz + falha (`assertNonEmpty` no `SignInWithGithubUseCase`).
- **Infra unit**: `secureTokenStorage` mocando `expo-secure-store`;
  `GitHubAuthRepository` contra **msw** (troca de code, GET /user, 401).
- **Composition slice**: `__tests__/integration/auth.int.test.tsx` —
  monta `AuthScreen` em `renderWithProviders`, simula sucesso da mutation,
  espera que `useAuthSession` reflita `isAuthenticated=true`.

---

## Step 02 — Componente `Pill` e refatoração da tela Explorar

### Objetivo

Promover o `Pill` a componente do design system de verdade (com variantes),
adicionar uma linha de filtros pills na `SearchScreen` com as opções
**Trending, Mobile, TypeScript, Rust, AI**, e fazer a seleção dirigir a
busca. A definição das pills **não pode ser hardcoded na tela** — vive num
módulo de configuração separado.

### Decisões já tomadas

- **Seleção:** uma pill por vez (radio-like). "Trending" é o estado inicial.
- **Mapeamento pill → query:** cada pill exporta um `searchQuery` (string que
  passa para `repoQueries.search`). Trending usa `stars:>10000 sort:stars` (o
  `buildSearchQuery` já adiciona `in:name,description`; para Trending preferir
  passar uma query crua como `"stars:>10000"`).
- **Não-hardcoded:** as pills vivem em
  `src/presentation/screens/SearchScreen/explorePills.ts` como `export const
  EXPLORE_PILLS: readonly PillDef[]`. A tela apenas itera.

### Arquivos a criar/editar

**Design system**

- `src/presentation/design-system/Pill.tsx` — **mover/renomear** o atual
  `primitives/Pill.tsx` para `design-system/Pill.tsx` e expandir:
  - Props: `label: string`, `selected?: boolean`, `onPress?: () => void`,
    `leftIcon?: ReactNode`, `count?: number`, `variant?: 'filter' | 'static'`
    (default `'static'`).
  - `selected=true` (filter): `backgroundColor="fg"`, texto `bg`.
  - `selected=false` (filter): `backgroundColor="surfaceMuted"`, texto `fg`.
  - `count != null`: renderiza após o label como `· {formatCount(count)}`.
  - `onPress` recebido → vira `Pressable`.
- `src/presentation/design-system/index.ts` (se houver barrel) — exportar.
- `src/presentation/design-system/primitives/Pill.tsx` — **deletar** (ou
  manter como re-export por compat). Atualizar todos os imports.

**Tela Explorar**

- `src/presentation/screens/SearchScreen/explorePills.ts`:

  ```ts
  import type { ReactNode } from 'react';
  import { Flame } from 'lucide-react-native';
  export interface PillDef { id: string; label: string; query: string; icon?: ReactNode }
  export const EXPLORE_PILLS: readonly PillDef[] = [
    { id: 'trending', label: 'Trending', query: 'stars:>10000', icon: <Flame size={14} /> },
    { id: 'mobile',   label: 'Mobile',    query: 'mobile' },
    { id: 'ts',       label: 'TypeScript', query: 'language:typescript' },
    { id: 'rust',     label: 'Rust',       query: 'language:rust' },
    { id: 'ai',       label: 'AI',         query: 'ai' },
  ];
  export const DEFAULT_PILL_ID = 'trending';
  ```

- `src/presentation/screens/SearchScreen/hooks/useExplorePills.ts`:
  retorna `{ pills, selectedId, select, query }`. `query` é o `query` da pill
  selecionada (ou string vazia se nada selecionado).
- `src/presentation/screens/SearchScreen/components/PillRow.tsx`: `ScrollView
  horizontal` com `gap="sm"`, padding lateral, sem indicador; renderiza cada
  `EXPLORE_PILLS` como `<Pill variant="filter" selected={id===selectedId}
  onPress={...} />`.
- `src/presentation/screens/SearchScreen/SearchScreen.tsx` — **editar**:
  - Manter o input de busca livre.
  - Renderizar `<PillRow>` logo abaixo do `SearchHeader`.
  - Lógica de query final: **se** o usuário digitou algo na busca (`query.length >= 2`),
    ignora a pill e usa só o texto. **Senão**, usa o `query` da pill
    selecionada. (Isso evita conflito entre busca livre e filtro rápido.)
  - Atualizar a `sec-title` para mostrar `"Top resultados · {totalCount}"`
    quando houver `totalCount`, exatamente como o mockup.

### Fidelidade ao mockup

- Ordem das pills: **Trending, Mobile, TypeScript, Rust, AI** (exatamente
  essa).
- "Trending" com ícone de chama (`Flame`) à esquerda do label.
- "Trending" pré-selecionada no primeiro render.
- Ao tocar em outra pill, ela vira selecionada (cor `fg` no fundo, texto `bg`),
  a anterior volta a `surfaceMuted`.
- Bottom tab bar visível (já existe).

### Critérios de aceitação

- Trocar de pill dispara nova busca (loading state aparece) e a lista é
  substituída.
- Digitar no input com pelo menos 2 chars **sobrepõe** a pill (resultados da
  busca livre).
- Limpar o input volta para os resultados da pill selecionada.
- `EXPLORE_PILLS` pode ser estendido (adicionar uma 6ª pill) sem editar
  `SearchScreen.tsx`.
- `Pill` não é mais hardcoded em texto/cor — todas as cores via tema.

### Testes obrigatórios

- **Design system** não tem threshold de cobertura, mas adicionar um teste
  de snapshot mínimo do `Pill` em ambos os estados (`selected`/`unselected`,
  com/sem `count`, com/sem `leftIcon`).
- **Presentation**: `useExplorePills` — selecionar troca o id; o `query`
  reflete a pill selecionada.
- **Composition slice**:
  `__tests__/integration/explore-pills.int.test.tsx` — renderiza
  `SearchScreen`, tap em "Rust" → espera que o `InMemoryRepoRepository`
  receba `query: 'language:rust'` (use spy).

---

## Step 03 — Pills na tela de Issues

### Objetivo

Adicionar duas pills (**"Abertas · N"**, **"Fechadas · N"**) no topo da
`IssuesScreen`, com contagem dinâmica, reaproveitando o componente `Pill` do
Step 02. **Apenas essas duas.**

### Decisões já tomadas

- Toggle entre `state: 'open'` e `state: 'closed'` (use case já aceita).
- Contagem das duas vem de **dois `useQuery`** em paralelo (open + closed).
- Para o lado "fechadas" precisamos generalizar a contagem (hoje só existe
  `CountOpenIssuesUseCase`).

### Arquivos a criar/editar

**Domain**

- `repositories/IIssueRepository.ts` — **editar**: substituir `countOpen` por
  `count({ owner; repo; state })`. Co-localizar `CountIssuesParams`.

**Application**

- `application/use-cases/CountIssuesUseCase.ts` — substitui
  `CountOpenIssuesUseCase`. Valida `assertOwnerRepo`; default `state = 'open'`.
- Deletar `CountOpenIssuesUseCase.ts` e tudo que o referencia.

**Infra**

- `repositories/GitHubIssueRepository.ts` — **editar**: refatorar `countOpen`
  → `count(params)`. A query continua via `/search/issues` com `q =
  "repo:{owner}/{repo} type:issue state:{state}"`.
- `repositories/InMemoryIssueRepository.ts` — mesma refatoração.
- `di/container.ts` — substituir o use case registrado.

**Presentation**

- `query/queryKeys.ts` — **editar**: `issues.count(owner, repo, state)` =
  `['issues', 'count', owner, repo, state]`.
- `query/collections/issueQueries.ts` — **editar**: `openCount` → `count(owner,
  repo, state)`; manter `staleTime: 5min`.
- `screens/IssuesScreen.tsx` — **editar**:
  - Estado local `const [state, setState] = useState<'open'|'closed'>('open')`.
  - Dois `useQuery(issueQueries.count(o, r, 'open'))` e `('closed')`.
  - `useInfiniteQuery(issueQueries.list(o, r, state))`.
  - Renderizar `<PillRow>` com duas pills (abaixo de `issue-count` do mockup).
  - Header `issue-count` exibe `<big>{openCountData}</big>` + `<lbl>Abertas ·
    {owner}/{repo}</lbl>` (mantém o mockup; o número grande é sempre o de
    abertas — não troca com a pill).

### Fidelidade ao mockup

- Pills, exatamente nesta ordem e apenas estas duas:
  1. `Abertas · {openCount}` (selecionada por default)
  2. `Fechadas · {closedCount}`
- Contagens formatadas via `formatCount` (ex.: `8900 → "8.9k"`).
- Cor selecionada: `fg`/`bg` (igual Step 02).

### Critérios de aceitação

- Pill "Fechadas" troca o filtro: lista mostra issues fechadas; ícone do item
  pode mudar (mantém `CircleDot` mas a cor pode virar `success`/`fgSubtle` —
  decida pela legibilidade).
- Contagens carregam separadas; enquanto carregando, mostra `…` no badge.
- Switch entre pills não invalida a outra query (caching).
- Boundaries OK; nada de duplicar validação no hook.

### Testes obrigatórios

- **Domain/Application (100%)**: `CountIssuesUseCase` cobre `state` default e
  ambos os valores; cobre `InvalidQueryError` para owner/repo vazios.
- **Infra**: HTTP boundary com msw verifica que a query final tem `state:open`
  e `state:closed`.
- **Presentation**: snapshot/render test confirma que ambas as pills aparecem
  com count formatado.

---

## Step 04 — Tela de Perfil (`ProfileScreen`)

### Objetivo

Implementar a tela de Perfil como **nova tab** (terceira aba, antes de Salvos
ou conforme ordenação do mockup), fiel ao layout do mockup. Itens: hero com
avatar grande, nome, handle, bio, três stats; card de contribuições
(heatmap); seção de "Repositórios fixados".

### Decisões já tomadas

- Dados do usuário autenticado vêm do `useAuthSession()` (Step 01) +
  enriquecimento com `GET /user` (já feito no signIn) — **adicionar campos** a
  `AuthenticatedUser`: `bio`, `publicReposCount`, `followers`, `following`.
- **Pinned repos:** GitHub não expõe pinned via REST. Substituir por **top
  6 repositórios públicos** do usuário ordenados por estrelas (`GET
  /users/{login}/repos?sort=updated`, depois ordenar client-side por
  `stargazers_count` e fatiar). Renomear a seção pra **"Repositórios em
  destaque"** (não "fixados") — única deviação textual permitida pela falta
  de endpoint.
- **Contribuições (heatmap):** GitHub não expõe via REST (só GraphQL com
  scopes). Para MVP, **renderizar o card com placeholder**: dados gerados a
  partir de um stub determinístico (`generatePlaceholderContributions(seed)`),
  com uma `Badge`/`tooltip` "Em breve" no canto. Marcar TODO no código.

### Arquivos a criar/editar

**Domain**

- `entities/AuthenticatedUser.ts` — **editar**: adicionar `bio: string | null`,
  `publicReposCount: number`, `followers: number`, `following: number`.
- `entities/ContributionDay.ts` — `{ date: Date; count: number; level: 0|1|2|3|4 }`.
- `repositories/IUserRepository.ts` — interface com:
  - `listUserRepos(login, { perPage, page }): Promise<PaginatedResult<Repository>>`
  - co-localiza `ListUserReposParams`.

**Application**

- `use-cases/ListUserReposUseCase.ts` — `execute({ login, perPage = 20, page })`;
  `assertNonEmpty(login, ...)`.
- `use-cases/GetTopUserReposUseCase.ts` — execute(login, limit=6); chama
  `ListUserReposUseCase` (`perPage: 30`), ordena por `stars` desc, fatia.
- (Heatmap fica fora da application por enquanto — utilidade pura na
  presentation.)

**Infra**

- `http/dtos/UserReposDto.ts` — DTO da listagem.
- `http/mappers/repositoryMapper.ts` — reaproveitar mapper existente.
- `repositories/GitHubUserRepository.ts` — implementação real:
  `listUserRepos(login, params)` → `GET /users/{login}/repos?sort=updated&per_page&page`.
- `repositories/InMemoryUserRepository.ts` — fixtures (3–6 repos).
- `di/providers.ts` e `di/container.ts` — registrar.
- `http/mappers/authMapper.ts` — **editar**: incluir os 4 novos campos.

**Presentation**

- `query/queryKeys.ts` — **editar**: `users.topRepos(login)`.
- `query/collections/userQueries.ts` — `topRepos(login)` (`queryOptions`,
  staleTime 10min).
- `utils/contributions.ts` — `generatePlaceholderContributions(seed): ContributionDay[]`
  (gera ~140 células determinísticas).
- `screens/ProfileScreen/ProfileScreen.tsx` — tela principal.
- `screens/ProfileScreen/components/ProfileHero.tsx` — avatar XL com gradiente,
  nome (`textVariant: 'h1'`), handle (`bodySmall`, `color: 'fgMuted'`), bio
  (`body`), três stats inline (`<b>{n}</b> repositórios` etc.).
- `screens/ProfileScreen/components/ContributionsCard.tsx` — Card com título
  "Contribuições" + número total + grid de quadradinhos (24×6 ou similar).
  Cor por nível usa o accent do tema (5 níveis).
- `screens/ProfileScreen/components/PinnedRepoCard.tsx` — card individual com
  ícone `Pin`, nome, descrição, footer com `LanguageDot` + stars + forks.

**Navegação**

- `navigation/ProfileStack.tsx` — Native Stack: `Profile` (root) → `Settings`
  → `RepoDetail`. `headerShown: false` no Profile root; `Settings` com header
  e back; `RepoDetail` reusa o existente.
- `navigation/TabsNavigator.tsx` — **editar**: adicionar 3ª tab `ProfileTab`
  com ícone `User` (`lucide-react-native`). Ordem final das tabs:
  **Explorar · Design · Salvos · Perfil** (4 tabs — Design entra no Step 06).
- `navigation/types.ts` — **editar**: `ProfileStackParamList`,
  `ProfileStackScreenProps`, atualizar `TabParamList`.

### Fidelidade ao mockup (copy exato)

- AppBar: título **"Perfil"**, ações à direita: `Share2` + `Settings` (ícones
  `lucide-react-native`). Tap em `Settings` → `navigation.navigate('Settings')`.
- Hero:
  - `displayName` → `Text variant="h1"`.
  - `@login` → `Text variant="body" color="fgMuted"`.
  - bio → `Text variant="body"`.
  - stats (3 itens lado a lado, gap `lg`): cada um com número em negrito
    seguido de label em `fgMuted`:
    - **"{publicReposCount} repositórios"**
    - **"{formatCount(followers)} seguidores"**
    - **"{following} seguindo"**
- Contribuições:
  - Card `surface`, padding `xl`, gap `md`.
  - Cabeçalho: título **"Contribuições"** (`bodySmall` `fgMuted`) +
    contagem **"{total} no último ano"** (`h3`).
  - Grid: ~140 cells, cada cell 12×12 `borderRadius="sm"`, gap 3px. Cores via
    accent do tema (5 níveis derivados).
- Seção fixados:
  - Header: `Box flexDirection="row"` com `Text variant="h3"`
    **"Repositórios em destaque"** + link **"Ver tudo"** (`Pressable` ainda
    sem destino — placeholder, marcar TODO).
  - Lista vertical de `PinnedRepoCard` (2–6 itens).

### Critérios de aceitação

- Tab "Perfil" abre a tela e mostra os dados do usuário autenticado.
- Tap em `Settings` no appbar empilha `SettingsScreen` (Step 05).
- Heatmap renderiza com cores corretas em light e dark.
- Cards "em destaque" são tocáveis → `RepoDetail`.
- Sem hardcoded de cores; tudo via tokens.

### Testes obrigatórios

- **Domain/Application (100%)**: `ListUserReposUseCase`, `GetTopUserReposUseCase`.
- **Infra unit**: mapper estende o user com os 4 campos novos sem regredir os
  existentes.
- **Presentation**: render test do `ProfileHero` com dados; smoke test do
  `ContributionsCard` (não acessa rede, é stub).
- **Composition slice**:
  `__tests__/integration/profile.int.test.tsx` — renderiza
  `ProfileScreen`, espera nome/handle/bio do user em memória, espera lista
  de top repos.

---

## Step 05 — Tela de Configurações (`SettingsScreen`)

### Objetivo

Implementar a tela de Configurações, empilhada a partir do Perfil (não fica na
TabBar), com fidelidade ao mockup. Conecta toggle de tema escuro,
"Alterar foto", logout, e exibe a conexão GitHub.

### Decisões já tomadas

- **NÃO está na TabBar.** Acessada via ícone `Settings` no appbar do
  `ProfileScreen` (Step 04 já roteou).
- A linha "Conexões" do mockup mostra Google. **Como o auth é GitHub** (Step
  01), essa linha vira **"Conta GitHub"** com email/login do usuário e badge
  "Conectada". Essa é a **única alteração permitida em cima do mockup** pra
  Step 05.
- "Alterar foto" usa `expo-image-picker`. Subir avatar pra GitHub via REST
  exige escopo `user` (não temos por default). Caminho pragmático: **salvar
  preferência local** (`localAvatarUri`) que sobrepõe o avatar do GitHub na
  UI; mostrar toast "Alteração salva localmente". TODO: integrar `PATCH /user`
  quando o escopo `user` for adicionado.
- "Remover" reseta `localAvatarUri` (volta a usar o avatar do GitHub).
- Os campos "Nome", "Usuário", "E-mail" são **read-only** (chevron leva a uma
  tela de detalhe não implementada — marcar como TODO/desabilitar tap).

### Arquivos a criar/editar

**Domain**

- `entities/UserPreferences.ts` — `{ localAvatarUri: string | null }`.
- `repositories/IUserPreferencesRepository.ts` — `get(): Promise<UserPreferences>`,
  `update(prefs: Partial<UserPreferences>): Promise<UserPreferences>`.

**Application**

- `use-cases/GetUserPreferencesUseCase.ts`
- `use-cases/UpdateUserPreferencesUseCase.ts` (sem validação além de checagem
  de tipo; mantém o pattern do `assertInput` se houver string trim).

**Infra**

- `repositories/AsyncStorageUserPreferencesRepository.ts` — key
  `@github-explorer:user-prefs:v1`. Tolera corrupção.
- `repositories/InMemoryUserPreferencesRepository.ts`.
- `di/providers.ts`, `di/container.ts` — registrar.

**Presentation**

- `query/queryKeys.ts` — `prefs.user()` = `['prefs', 'user']`.
- `query/collections/preferencesQueries.ts` — `user()` (staleTime 0).
- `hooks/useUpdateAvatar.ts` — `useMutation`: chama `ImagePicker`,
  persiste via `UpdateUserPreferencesUseCase`, invalida `prefs.user()`.
- `hooks/useRemoveAvatar.ts` — set `localAvatarUri: null`.
- `screens/SettingsScreen/SettingsScreen.tsx` — tela principal.
- `screens/SettingsScreen/components/PhotoBlock.tsx`
- `screens/SettingsScreen/components/SettingRow.tsx` — primitivo de linha
  (ícone + label + subtitle? + valor? + chevron?).
- `screens/SettingsScreen/components/SettingGroup.tsx` — wrapper com header.

### Fidelidade ao mockup (copy exato)

- AppBar: back arrow + **"Configurações"** (sem ícones à direita).
- Photo block:
  - Avatar XL centralizado, com `expo-image` ou `Image` mostrando
    `prefs.localAvatarUri ?? user.avatarUrl`.
  - Ícone `Camera` sobreposto no canto inferior direito (`photo-badge`).
  - Abaixo, duas ações lado a lado:
    - **"Alterar foto"** com ícone `ImagePlus` (lucide).
    - **"Remover"** com ícone `Trash` e `color="danger"`.
- Grupo **"Conta"** (header `eyebrow` em uppercase com `fgMuted`):
  - Linha `IdCard` — **"Nome"** — valor `{user.name}` — chevron.
  - Linha `AtSign` — **"Usuário"** — valor `@{user.login}` — chevron.
  - Linha `Mail` — **"E-mail"** — valor `{user.email}` — chevron.
- Grupo **"Aparência"**:
  - Linha `Moon` accent — **"Tema escuro"** — subtitle **"Reduz o brilho à
    noite"** — `Switch` controlado por `useThemeMode()` (toggle entre
    `'dark'` e `'system'` ou `'light'`). Definir: quando ligado → `setMode('dark')`,
    desligado → `setMode('light')`.
- Grupo **"Conexões"**:
  - Linha com ícone GitHub (`Github` lucide) — **"Conta GitHub"** —
    subtitle `{user.email ?? user.login}` — `Badge tone="success"` com texto
    **"Conectada"**, sem chevron.
- Linha solta (card separado, fora de grupo): ícone `LogOut` `color="danger"`
  — **"Sair da conta"** — `onPress` chama `useSignOut()`; sem valor nem chevron.

### Critérios de aceitação

- Toggle de tema reflete instantaneamente (já funciona no app pelo
  `useThemeMode`).
- "Alterar foto" abre o picker, salva URI, e o avatar muda no SettingsScreen e
  no ProfileScreen.
- "Remover" volta para o avatar do GitHub.
- "Sair da conta" desloga e navega pra `AuthScreen` (Step 01 cuida via
  `RootNavigator` switch).
- Linhas "Nome/Usuário/E-mail" são visuais (sem destino) — não dão erro.

### Testes obrigatórios

- **Domain/Application (100%)**: prefs use cases.
- **Infra**: `AsyncStorageUserPreferencesRepository` cobre persist + corrupted.
- **Presentation**: `SettingsScreen` renderiza todas as linhas; tap em "Sair"
  chama `useSignOut`.

---

## Step 06 — Tela de Design System (`DesignSystemScreen`)

### Objetivo

Implementar a tela de Design System como **tab dedicada**, expondo
**Buttons, Inputs, Badges, Card/Avatar, Cores e Tipografia** — fidelidade ao
mockup nos cinco primeiros e **adição obrigatória** de uma seção de
Tipografia (o mockup não traz mas o usuário pediu explicitamente).

### Decisões já tomadas

- Tela é **tab** (4ª aba, ordem do mockup: Explorar · Design · Salvos · Perfil).
- AppBar tem `ThemeToggleButton` à direita (sol/lua) que alterna `useThemeMode`.
- Camada: **só presentation** — nenhuma adição a domain/application/infra.
- "Cores" usa os tokens do tema **diretamente** (`fg`, `fgMuted`, `accent`,
  `success`, `warning`, `danger`), não cores cruas — assim a tela se atualiza
  quando o tema muda.

### Arquivos a criar/editar

**Presentation**

- `screens/DesignSystemScreen/DesignSystemScreen.tsx` — root.
- `screens/DesignSystemScreen/components/ShowBlock.tsx` — wrapper com header
  e padding consistente.
- `screens/DesignSystemScreen/sections/ButtonsSection.tsx`
- `screens/DesignSystemScreen/sections/InputsSection.tsx`
- `screens/DesignSystemScreen/sections/BadgesSection.tsx`
- `screens/DesignSystemScreen/sections/CardAvatarSection.tsx`
- `screens/DesignSystemScreen/sections/ColorsSection.tsx`
- `screens/DesignSystemScreen/sections/TypographySection.tsx`

**Navegação**

- `navigation/TabsNavigator.tsx` — **editar**: adicionar tab `DesignTab` com
  ícone `Component` (lucide) entre `ExploreTab` e `SavedTab`. Ordem final:
  Explorar · Design · Salvos · Perfil.
- `navigation/types.ts` — incluir `DesignTab`.

### Fidelidade ao mockup + seção extra

Cada seção é um `ShowBlock` com `Text variant="h3"` no topo:

**Buttons**

- Linha 1 (variants): `Button variant="primary"` **"Primary"**,
  `variant="accent"` **"Accent"**, `variant="outline"` **"Outline"**,
  `variant="ghost"` **"Ghost"**.
- Linha 2 (tamanhos/estados): `size="sm"` **"sm"**, `size="md"` **"md"**,
  `size="lg"` **"lg"**, `disabled` **"disabled"**, `loading` **"loading"**.

**Input**

- `Input value="dev@octolens.app" helperText="Seu email para login"` (sem
  erro).
- `Input value="invalid-email" error helperText="Email inválido — verifique
  o formato"`.

**Badges**

- Row de 4 `Badge`: `tone="danger"` **"danger"**, `tone="warning"`
  **"warning"**, `tone="info"` **"info"**, `tone="success"` **"success"**.
  (Se o atual `Badge` não suporta esses 4 tones, estender o componente —
  ajustar `Badge.tsx` em `design-system/`.)

**Card · Avatar**

- `Card variant="surface"` contendo:
  - `Avatar size="md"` com gradiente decorativo (ou avatar do octocat de fallback).
  - `Text variant="bodySmall"` **"facebook"** (negrito).
  - `Text variant="caption" color="fgMuted"` **"Organization · 2.1k repos"**.
  - À direita, `Button variant="outline" size="sm"` **"Seguir"**.

**Cores**

- `Box flexDirection="row" flexWrap="wrap" gap="md"` com 6 swatches:
  - `fg`, `fgMuted`, `accent`, `success`, `warning`, `danger`.
- Cada swatch: `Box width={64} height={64} borderRadius="md"
  backgroundColor={token}` + `Text variant="caption"` com o nome do token.

**Tipografia (extra — não está no mockup)**

- Cada variant de texto renderiza uma amostra com seu nome:
  - `display` — "Display"
  - `h1` — "Heading 1"
  - `h2` — "Heading 2"
  - `h3` — "Heading 3"
  - `body` — "Body — texto corrido padrão da interface."
  - `bodySmall` — "Body Small"
  - `caption` — "Caption · auxiliar"
  - `mono` — "console.log('mono')"
  - `eyebrow` — "EYEBROW"

### Critérios de aceitação

- Botão de tema no appbar alterna light/dark e todas as cores/swatches reagem.
- Cada seção tem cabeçalho e padding consistentes; rolagem suave.
- `Badge` aceita 4 tones e renderiza com a paleta semântica.
- Nada na tela é hardcoded em hex — só tokens do tema.
- Bottom tab bar mostra 4 itens, Design ativa.

### Testes obrigatórios

- **Presentation**: smoke test que renderiza `DesignSystemScreen` em ambos os
  temas sem warning (`renderWithProviders` com `themeMode: 'light'` e `'dark'`).
- **Design system**: se `Badge` foi estendido, atualizar os testes existentes
  pra cobrir novos tones.

---

## Resumo das mudanças cross-step

| Onde | O quê | Step |
|------|-------|------|
| `navigation/TabsNavigator.tsx` | 2 → 3 → 4 tabs | 04, 06 |
| `navigation/RootNavigator.tsx` | Switch Auth/Tabs | 01 |
| `entities/AuthenticatedUser.ts` | +4 campos | 04 |
| `IIssueRepository.count` | renomeia/generaliza `countOpen` | 03 |
| `design-system/Pill.tsx` | promove primitivo a componente com variants | 02 |
| `Badge.tsx` | estende tones | 06 (se necessário) |
| `httpClient.ts` interceptor | lê SecureStore | 01 |
| `.env` | +3 vars OAuth | 01 |

## Ordem de execução

Os Steps devem ser feitos **na ordem 01 → 06**. Auth (Step 01) é pré-requisito
de Profile (04), Settings (05) e do interceptor. Pill (02) é pré-requisito de
Issues (03). Design System (06) pode rodar a qualquer momento depois de Pill,
mas Tabs só atinge a configuração final do mockup depois de 04 e 06.

## Cobertura final esperada

- `domain/` e `application/` mantêm 100%/100% (95% branches).
- `infra/auth/`, `infra/repositories/GitHub*Repository.ts` ≥ thresholds globais.
- Verificações de integração: 1 slice por feature (`auth`, `explore-pills`,
  `issues-filter`, `profile`, `settings`).
