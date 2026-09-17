# Documentação Técnica — GitHub Explorer

> Fonte oficial de contexto arquitetural para implementações futuras.
> Foco em **explicação e convenções**, não em código-fonte. Em caso de divergência
> entre este documento e o código, **o código é a fonte da verdade** — atualize esta doc.

---

## 1. Visão geral

Aplicativo mobile (Expo / React Native) que explora repositórios e issues do GitHub,
com lista de repositórios salvos localmente. Construído sobre **Clean Architecture**
de quatro camadas, com a **regra de dependência apontando para dentro** e **imposta por
lint** (`eslint-plugin-boundaries`) — violar a fronteira **quebra o build**, não é só convenção.

### Stack principal

| Tecnologia | Papel |
|------------|-------|
| Expo SDK 54 / React Native 0.81 / React 19 | Plataforma e runtime |
| TypeScript strict | `noUncheckedIndexedAccess`, `noImplicitOverride`, `strict` |
| `@shopify/restyle` | Design system tipado contra o tema |
| `@tanstack/react-query` v5 | Cache de servidor, paginação infinita, mutações |
| `axios` | Cliente HTTP (adapter) |
| `@react-navigation` (native-stack + bottom-tabs) | Navegação (tratada como framework externo) |
| `@react-native-async-storage/async-storage` | Persistência local de repos salvos e tema |
| `date-fns` (locale ptBR) | Datas relativas |
| `lucide-react-native` | Ícones |
| `@expo-google-fonts/geist` + `geist-mono` | Tipografia |
| **pnpm 10** | Gerenciador de pacotes (autoritativo, pinado em `package.json#packageManager`) |

> **Não usar npm/yarn.** O `pnpm-lock.yaml` é autoritativo.

---

## 2. As quatro camadas

```
src/domain/        → puro. Zero imports externos. Entidades, interfaces de repositório, hierarquia de erros.
src/application/   → use cases. Importa SÓ @/domain. Sem HTTP, sem React.
src/infra/         → adapters. axios, AsyncStorage, React Navigation, Restyle, setup do React Query.
src/presentation/  → screens, components, hooks, design-system, utils.
```

### Regra de dependência (imposta pelo ESLint)

`eslint.config.js` declara os elementos de fronteira e proíbe:

- **domain** → não pode importar application, infrastructure, presentation **nem nenhum pacote externo** (`boundaries/external: disallow ['*']`).
- **application** → não pode importar infrastructure, presentation **nem nenhum pacote externo**.
- **infrastructure** → não pode importar presentation.
- **presentation** → pode importar das camadas internas (consome tipos de navegação, container via factories etc.).

Regras adicionais ativas: `@typescript-eslint/no-explicit-any: error`, `no-unused-vars: error`,
`consistent-type-imports: error`, `import/no-cycle: error`.

> **Ordem importa:** `src/infra/navigation/**` é declarado como elemento **antes** de
> `src/infra/**`, porque o plugin casa pelo **primeiro match**. Navegação é fronteira própria.

### Aliases de path

`tsconfig.json` + `babel.config.js` (+ `moduleNameMapper` no Jest) definem:

| Alias | Aponta para |
|-------|-------------|
| `@/domain/*` | `src/domain/*` |
| `@/application/*` | `src/application/*` |
| `@/infrastructure/*` | **`src/infra/*`** (pasta é `infra`, alias é `infrastructure`) |
| `@/presentation/*` | `src/presentation/*` |

O código mistura alias (`@/domain`) e caminho absoluto (`src/...`) — **ambos funcionam**.

---

## 3. Camada Domain (`src/domain/`)

**Pura, sem comportamento.** Entidades são `interface` (sem classes), com nomes em
**camelCase já normalizado** (conversão de snake_case acontece nos mappers da infra).
Datas são `Date` (nunca string). `null` é **propagado explicitamente** — nunca coagido
para string vazia.

### Entidades (`entities/`)

- **Owner** — `id`, `login`, `avatarUrl`, `type: 'User' | 'Organization'`.
- **Label** — `id`, `name`, `color`.
- **Repository** — `id`, `name`, `fullName` (`owner/name`), `owner: Owner`,
  `description | null`, `language | null`, `license | null` (três nullables),
  métricas (`stars`, `forks`, `watchers`, `openIssuesCount`), `htmlUrl`, `pushedAt: Date`, `topics: string[]`.
- **Issue** — `id`, `number` (número visível, distinto de `id`), `title`,
  `state: 'open' | 'closed'`, `author: Pick<Owner, 'login' | 'avatarUrl'>` (subconjunto),
  `labels: Label[]`, `commentsCount`, `createdAt: Date`, `htmlUrl`.
- **SavedRepo** — entidade de persistência local com owner **achatado**
  (`ownerLogin`, `ownerAvatarUrl` em vez de objeto `Owner`), `language | null`, `htmlUrl`,
  `savedAt: Date`. Chave de negócio: **`fullName`**, não o `id` numérico.

### Hierarquia de erros (`errors/`)

`DomainError` (abstract) estende `Error`, declara `abstract readonly code`, ajusta
`this.name` para o nome da subclasse e usa `Error.captureStackTrace` de forma defensiva
(funciona em Hermes/JSC). Cada subclasse fixa um `code` discriminado:

| Classe | `code` | Quando |
|--------|--------|--------|
| `InvalidQueryError` | `INVALID_QUERY` | **Única lançada dentro de domain/application** (validação de entrada). |
| `NetworkError` | `NETWORK_ERROR` | Falha de conexão (lançada na infra). |
| `NotFoundError` | `NOT_FOUND` | 404; construtor recebe `resource` → `"{resource} não foi encontrado."`. |
| `RateLimitError` | `RATE_LIMIT_EXCEEDED` | Rate limit GitHub; campo opcional `resetAt?: Date`. |
| `UnexpectedError` | `UNEXPECTED` | Fallback genérico. |

> Mensagens default são **em português** (voltadas à UI). Erros de rede/404/rate-limit/unexpected
> pertencem ao domínio mas são **instanciados pela infra** (`errorMapper`) — use cases só lançam `InvalidQueryError`.
>
> ⚠️ O CLAUDE.md cita `RATE_LIMIT`; o código real usa **`RATE_LIMIT_EXCEEDED`**.

### Interfaces de repositório (`repositories/`)

- **`PaginatedResult<T>`** (`Pagination.ts`) — `items: T[]`, `totalCount?`, `hasNextPage: boolean`.
  O `hasNextPage` já vem **pré-computado**; a derivação matemática `page * perPage < totalCount`
  acontece na infra.
- **`IRepoRepository`** — `search(params)`, `getDetails(owner, repo)` (args posicionais).
- **`IIssueRepository`** — `list(params)`, `countOpen({owner, repo})`.
- **`ISavedReposRepository`** — `list()`, `save(repo: Repository)` (retorna `SavedRepo`),
  `unsave(fullName)`, `isSaved(fullName)`.

Tipos de params (`SearchReposParams`, `ListIssuesParams` etc.) ficam **co-localizados** no
arquivo da interface.

---

## 4. Camada Application (`src/application/`)

### Padrão de Use Case

Padrão **uniforme e obrigatório**:

- Classe com `constructor(private readonly xRepository: IInterface)` — recebe a **interface**
  (DIP), nunca a implementação. Injetada pelo container.
- Um único método público `async execute(...)`.
- Importa apenas `@/domain` e o helper de validação. **Zero acoplamento a HTTP/React.**

| Use case | Dep | Validação / defaults |
|----------|-----|----------------------|
| `SearchReposUseCase` | `IRepoRepository` | `query.trim()`; `< 2 chars` → `InvalidQueryError`; **`perPage = 20`** default. |
| `GetRepoDetailsUseCase` | `IRepoRepository` | `assertOwnerRepo` (trim + não-vazio). |
| `ListIssuesUseCase` | `IIssueRepository` | `assertOwnerRepo`; defaults `state = 'open'`, `perPage = 20`; `page` obrigatório. |
| `CountOpenIssuesUseCase` | `IIssueRepository` | `assertOwnerRepo`; sem paginação. |
| `ListSavedReposUseCase` | `ISavedReposRepository` | sem input/validação. |
| `SaveRepoUseCase` | `ISavedReposRepository` | `assertNonEmpty(repo.fullName, ...)`. |
| `IsRepoSavedUseCase` | `ISavedReposRepository` | `assertNonEmpty(fullName, ...)`; usa valor trimado. |
| `UnsaveRepoUseCase` | `ISavedReposRepository` | `assertNonEmpty(fullName, ...)`; usa valor trimado. |

### Validação (`validation/assertInput.ts`)

Funções puras que sempre lançam `InvalidQueryError` em falha:

- `assertOwnerRepo(owner, repo)` → trim em ambos; vazio → erro com mensagem fixa; retorna o par trimado.
- `assertNonEmpty(value, message)` → trim; vazio → erro com **mensagem parametrizada**; retorna a string trimada.

> **Regra de ouro:** sanitização (trim) e defaults (`perPage = 20`, `state = 'open'`) vivem
> **só nos use cases**. **Nunca duplicar nos hooks/factories.** `page` nunca tem default.

---

## 5. Camada Infrastructure (`src/infra/`)

### 5.1 Composição de dependências (DI) — `di/`

Três arquivos com responsabilidades separadas:

- **`container.ts`** — fábrica **pura** `createContainer(deps)`. Recebe as três interfaces de
  repositório e instancia os 8 use cases. Não conhece env nem implementações concretas.
- **`providers.ts`** — escolhe a implementação por flag. `readDiEnv()` lê
  `EXPO_PUBLIC_USE_MOCK` (default = mock, só desliga com `'false'`).
  `provide*Repository(env)` retorna `InMemory*` / `GitHub*` / `AsyncStorage*`.
- **`bootstrap.ts`** — **composition root** singleton: lê env, chama os providers, monta o `container`.

> Use cases **nunca** instanciam repositórios — recebem interfaces via construtor.
> A presentation só toca o `container` através das **query factories** (ver §6.3).

### 5.2 HTTP (`http/`)

- **`httpClient.ts`** — `createHttpClient(options)` + singleton `httpClient`.
  Base URL `https://api.github.com`, timeout **15000ms**, headers
  `Accept: application/vnd.github+json` e `X-GitHub-Api-Version: 2022-11-28`.
  Se `EXPO_PUBLIC_GITHUB_TOKEN` existir, um **request interceptor** injeta
  `Authorization: Bearer <token>` (eleva rate limit a 5000 req/h). Sem token, funciona anônimo
  (60 req/h). **Nenhum response interceptor** — erro é tratado pelos repositórios.
- **`errorMapper.ts`** — `mapHttpError(err, resourceContext?): never` (**sempre lança**, garante
  que `AxiosError` jamais vaze). Ordem: não-Axios → `UnexpectedError`; sem `response` → `NetworkError`;
  rate limit → `RateLimitError(undefined, resetAt)`; 404 → `NotFoundError(ctx)`; fallback → `UnexpectedError`.
  - **Rate limit:** `status === 429`, **ou** `status === 403` **e** header `x-ratelimit-remaining === '0'`.
  - `resetAt` derivado de `x-ratelimit-reset` (epoch em segundos × 1000).
  - A assinatura `: never` é o que permite os métodos de repositório não terem `return` no `catch`.

### 5.3 DTOs e Mappers

- **DTOs** (`http/dtos/`) — formas cruas **snake_case** espelhando a API
  (`RepositoryDto`, `OwnerDto`, `LicenseDto`, `IssueDto`, `LabelDto`, envelope `Search*ResponseDto`
  com `total_count`).
- **Mappers** (`http/mappers/`) — traduzem DTO → entidade de domínio:
  - snake_case → camelCase (`stargazers_count` → `stars` etc.).
  - **Date parsing** (`pushed_at`/`created_at` → `new Date(...)`).
  - **Null propagation** (`description` mantém `null`; `license` → `dto.license?.name ?? null`;
    `topics ?? []`). Nunca coage `null` para vazio.

### 5.4 Repositórios (`repositories/`)

- **`GitHubRepoRepository`** — `search` + `getDetails`. Endpoints:
  - `GET /search/repositories` (`q` via `buildSearchQuery`, `sort: stars`, `order: desc`, `page`, `per_page`).
  - `GET /repos/{owner}/{repo}` (sem envelope).
  - Todo `catch` chama `mapHttpError(err, ctx)`.
  - **`buildSearchQuery(raw)`**: `trim`; se for padrão `owner/repo` (exatamente dois segmentos) →
    `repo:owner/repo` (busca exata); senão → texto livre + `in:name,description`.
  - **`hasNextPage`** calculado: `page * perPage < totalCount`.
- **`GitHubIssueRepository`** — `list` + `countOpen`. Usa **`GET /search/issues`** com
  `q = "repo:{owner}/{repo} type:issue state:{state}"` (`sort: created`). O `type:issue`
  **exclui pull requests** (a API mistura PRs em `/repos/.../issues`), garantindo lista limpa.
  Contagem lê só `total_count` com `per_page: 1`.
- **`InMemory*Repository`** — leem fixtures, simulam latência (300–500ms), filtram e paginam.
  Selecionados quando `EXPO_PUBLIC_USE_MOCK=true`. **Excluídos da cobertura.**
- **`InMemorySavedReposRepository`** — estado em memória, idempotente por `fullName`, ordena por `savedAt` desc.
- **`AsyncStorageSavedReposRepository`** — persistente. Storage key **`@github-explorer:saved-repos:v1`**
  (versionada). Serializa `savedAt` como ISO; re-hidrata para `Date`. `list` tolera corrupção
  (parse em try/catch → `[]`). `save` deriva `SavedRepo` de `Repository` (`savedAt = new Date()`),
  idempotente, prepend.

### 5.5 Navegação (`navigation/`)

> **Por que fica em `infra`:** React Navigation é tratado como **adapter de framework externo**
> (como axios/AsyncStorage). As telas (presentation) **consomem** tipos de props de rota
> (`ExploreStackScreenProps`) mas **nunca montam a árvore de rotas**. Isso mantém a presentation
> agnóstica ao mecanismo de navegação.

Árvore de rotas:

```
NavigationContainer (RootNavigator)
└─ TabsNavigator (Bottom Tabs, headerShown: false)
   ├─ ExploreTab → ExploreStack (Native Stack)
   │    ├─ Search      (SearchScreen)       "Explorar"
   │    ├─ RepoDetail  (RepoDetailScreen)   "Detalhes"
   │    └─ Issues      (IssuesScreen)       "Issues"
   └─ SavedTab → SavedStack (Native Stack)
        ├─ Saved       (SavedScreen)        headerShown: false
        ├─ RepoDetail  (RepoDetailScreen)   "Detalhes"
        └─ Issues      (IssuesScreen)       "Issues"
```

- **`RootNavigator`** converte o tema Restyle em `NavTheme` do React Navigation (`buildNavTheme`)
  e sincroniza dark/light com o app.
- **`TabsNavigator`** — ícones `Compass` (Explorar) / `Bookmark` (Salvos, preenchido quando ativo).
- **Tipagem (`types.ts`)** — `RepoStackParamList` compartilhada (`RepoDetail` e `Issues` com
  `{owner, repo}`). `ExploreStackParamList`/`SavedStackParamList` estendem com `Search`/`Saved`.
  Props compostos via `CompositeScreenProps` (`ExploreStackScreenProps<T>` etc.).
  `declare global { namespace ReactNavigation { interface RootParamList … } }` dá tipagem global ao `useNavigation`.

### 5.6 React Query setup (`query/`)

`QueryClient` singleton com defaults:

- **`staleTime: 5 min`** — evita refetch agressivo.
- **`gcTime: 30 s`** — cache descartado rápido quando inativo (memória baixa em mobile).
- **`retry: shouldRetry`** — **não** retenta `RateLimitError`, `InvalidQueryError`, `NotFoundError`
  (erros determinísticos); demais: 1 retry (2 tentativas).
- **`refetchOnWindowFocus: false`**.

`QueryProvider` injeta o singleton via `QueryClientProvider`.

### 5.7 Tema (`theme/`)

Tema **Restyle** (`createTheme`). `type Theme = typeof lightTheme` é a forma canônica.

- **`lightTheme`** define a estrutura completa: `colors` (tokens semânticos —
  `bg`, `surface`, `surfaceMuted`, `border`, `fg`/`fgMuted`/`fgSubtle`, `accent`, `success`,
  `warning`, `danger`, `dangerBg`…), `spacing` (`none`→`giga`), `borderRadii` (`sm`→`pill`=999),
  `textVariants` (`display`, `h1`-`h3`, `body`, `bodySmall`, `caption`, `mono`, `eyebrow`…),
  `buttonVariants`, `cardVariants`.
- **`darkTheme`** = `...lightTheme` sobrescrevendo **apenas `colors`** (mesma forma garantida pelo tipo).
- **`tokens/palette.ts`** — única fonte de hex cru; os temas só referenciam `palette.*`.
- **`fonts.ts`** — `useAppFonts()` carrega Geist (400/500/600/700) e GeistMono (400/500/600).
- **`languageColors.ts`** — cores GitHub Linguist + `languageColorOrFallback` (fallback `#8a877f`).
- **`themeStorage.ts`** — `ThemeMode = 'light' | 'dark' | 'system'`; key `@github-explorer:theme-mode`;
  default e fallback `'system'`; grava silenciosamente.
- **`AppThemeProvider`** — combina `useColorScheme()` + estado `mode` (hidratado de storage),
  expõe `{ mode, resolvedScheme, setMode, isHydrated }` via `useThemeMode()`.

### 5.8 Reactotron

`reactotron/ReactotronConfig.ts` guardado por `if (__DEV__)` — só conecta em dev. Excluído da cobertura.

---

## 6. Camada Presentation (`src/presentation/`)

### 6.1 Design System (`design-system/`)

- **Primitivos** `Box` (`createBox<Theme>()`) e `Text` (`createText<Theme>()`) são a **única
  fonte de estilização**. Props tipadas contra o tema (`backgroundColor="surface"`,
  `padding="huge"`, `borderRadius="pill"`, `gap`, `variant`).
- **Componentes**: `Card` (variants `surface`/`flat`, vira `Pressable` se receber `onPress`),
  `Button` (variants `primary`/`accent`/`outline`/`ghost`; `size` sm/md/lg; `loading`, `disabled`,
  `leftIcon`), `Input` (borda/fundo `danger` quando `error`; `label`/`helperText`/`leftIcon`),
  `Avatar` (circular com fallback de iniciais via `onError`), `Badge` (pill com `tone` ou `dotColor`
  cru para labels), `Skeleton` (animação de opacidade), `Pill`/`LanguageDot`/`Spinner` (primitivos).
- **`design-system/` é excluído da cobertura** (ver `jest.config.js`).

### 6.2 Componentes reutilizáveis (`components/`)

- **`RepoListItem`** — Card clicável; consome `Repository`; avatar + stats (estrelas/`LanguageDot`/forks).
- **`IssueListItem`** — consome `Issue`; `CircleDot`, título, `Badge`s de labels, meta `#n · data · @autor`.
- **`SavedRepoRow`** — consome `SavedRepo`; "salvo {data relativa}".
- **`CollectionCard`** — card de coleção (glyph + cor + contagem).
- **`SegmentedTabs<T>`** — abas genéricas (`{id,label}`, `selected`, `onChange`).
- **`BookmarkButton`** / **`ThemeToggleButton`** — controlados (sem estado próprio).
- **`RateLimitBanner`** — renderiza `null` se o erro não for `RateLimitError`; usa `resetAt`.
- **`EmptyState`** — vazio/erro genérico com `onRetry` opcional e `action`.

### 6.3 Camada React Query (`query/`) — o ponto de contato com o container

> **Regra central:** telas e componentes **nunca** acessam o `container` diretamente.
> O container só aparece dentro das **query option factories** em `query/collections/`.

- **`queryKeys.ts`** — fábricas de `QueryKey` tipadas. **Hierarquia proposital:**
  `isRepoSaved(fullName)` = `['savedRepos', 'isSaved', fullName]` é **prefixada** por
  `savedRepos()` = `['savedRepos']` → invalidar o prefixo invalida `isSaved` em cascata.
- **`factories.ts`** — `paginatedQueryOptions<T>({ queryKey, fetchPage, enabled?, staleTime? })`
  envolve `infiniteQueryOptions`: `initialPageParam: 1`, `getNextPageParam =
  lastPage.hasNextPage ? allPages.length + 1 : undefined`. O `hasNextPage` vem do domínio.
- **`collections/`** — ligam `queryKeys` ↔ container:
  - **`repoQueries`** — `details(owner, repo)` (`queryOptions`, `enabled` se não-vazios),
    `search(rawQuery)` (`paginatedQueryOptions`, `enabled` se `>= 2`, `perPage: 20`).
  - **`issueQueries`** — `list(owner, repo, state='open')` (`perPage: 20`),
    `openCount(owner, repo)` (`staleTime: 5min`).
  - **`savedQueries`** — `list()` e `isSaved(fullName)` com **`staleTime: 0`** (dados locais voláteis).

### 6.4 Telas (`screens/`)

**Padrão de estado obrigatório em toda tela:**
`isLoading → Skeleton`; `error → RateLimitBanner + EmptyState (com retry)`;
`lista vazia → EmptyState`; sucesso → conteúdo.

**Padrão de lista infinita:** `FlatList` com `keyExtractor` por `id`,
`RefreshControl` (`refreshing = isFetching && !isFetchingNextPage`),
`onEndReached` (guard `hasNextPage && !isFetchingNextPage`, threshold 0.1),
`ListFooterComponent` = Spinner durante `isFetchingNextPage`.

- **`SearchScreen`** — `query` local → `useDebounce(query, 300)` → `useInfiniteQuery(repoQueries.search)`.
  Achata `pages.flatMap(p => p.items)`. Guard de UI `MIN_QUERY_LENGTH = 2`. Navega `RepoDetail`.
- **`RepoDetailScreen`** — combina **três queries** (`repoQueries.details`, `issueQueries.openCount`,
  `savedQueries.isSaved`) + mutação `useToggleSaveRepo`. `useLayoutEffect` injeta `BookmarkButton`
  no `headerRight`. Layout: `RepoHero` / `StatsGrid` / `RepoMeta` + botão "Ver N issues abertas".
  Sub-componentes próprios em `RepoDetailScreen/components/`.
- **`IssuesScreen`** — `useInfiniteQuery(issueQueries.list)` + `useQuery(issueQueries.openCount)`;
  lista de `IssueListItem`.
- **`SavedScreen`** — `useQuery(savedQueries.list())` + `useThemeMode()`. Abas
  `collections`/`all`/`recent` via `SegmentedTabs`. Agrupamento client-side via `utils/savedCollections`.

### 6.5 Hooks (`hooks/`)

- **`useToggleSaveRepo`** — `useMutation` que chama `unsaveRepoUseCase`/`saveRepoUseCase` conforme
  `isCurrentlySaved`. **`onSuccess` invalida `queryKeys.savedRepos()`** (prefixo cobre `isSaved`).
  **Sem optimistic update** — invalidação simples pós-sucesso.
- **`useDebounce<T>(value, delay)`** — genérico, `setTimeout` + cleanup.

### 6.6 Utils (`utils/`)

- **`formatCount`** — `1.2k`, `15k`, `1.3M`.
- **`formatRelativeDate`** — `date-fns formatDistanceToNow` com locale ptBR ("há 3 dias").
- **`getErrorMessage`** — mapeia subclasses de `DomainError` → mensagens PT amigáveis.
- **`getEmptySearchCopy`** — copy do estado vazio de busca (detecta padrão `owner/repo`).
- **`savedCollections`** — `CollectionId`, metadados `COLLECTIONS`, `LANG_TO_COLLECTION`,
  e `categorize`/`countByCollection`/`reposInCollection` (agrupamento client-side).

---

## 7. Bootstrap da aplicação (`App.tsx`)

Ordem de providers (de fora para dentro):
`QueryProvider` → `AppThemeProvider` → `RootNavigator` + `StatusBar`.
Importa `ReactotronConfig` no topo. Segura a splash screen até as fontes carregarem
(`useAppFonts`); retorna `null` enquanto carregam sem erro.

---

## 8. Fluxo de dados (request típico)

```
Tela (useInfiniteQuery / useQuery)
  → query factory (query/collections/*) ── único ponto que toca o container
    → container.<useCase>.execute(input)        [application: valida, aplica defaults]
      → IRepository (interface)                  [domain]
        → GitHub*Repository (impl real)          [infra]
          → httpClient (axios)                   → GitHub API
          ← DTO snake_case
          → mapper → entidade de domínio (camelCase, Date, null)
          → PaginatedResult (hasNextPage calculado)
        ← (erro) mapHttpError → DomainError       [nunca AxiosError]
  ← React Query cache → UI (estados loading/error/empty/success)
  ← getErrorMessage converte DomainError → texto PT
```

---

## 9. Estratégia de testes

Testes em `__tests__/` espelhando `src/`, + `__tests__/integration/` e `__tests__/test-utils/`
(fakes, fixtures, `jest.setup.ts`, `renderWithProviders`).

| Categoria | Local | Propósito |
|-----------|-------|-----------|
| Unit | `__tests__/{domain,application,infrastructure,presentation}/**/*.test.*` | Isolado com fakes/mocks |
| Composition slice | `__tests__/integration/*.int.test.tsx` | hook real → use case real → `InMemory*Repository`. **Sem** `jest.mock` no container |
| HTTP boundary | `__tests__/infrastructure/**/*.int.test.ts` | `GitHub*Repository` + `httpClient` reais contra **msw** (`onUnhandledRequest: 'error'`) |

**Thresholds de cobertura** (`jest.config.js`): global 80/75/80/80; `domain/` **100%** em todos os
eixos; `application/` 100% (95% branches). `collectCoverageFrom` **exclui** `InMemory*`, fixtures,
arquivos de tema, navegação, design-system e reactotron — **mantenha essa lista honesta** ao adicionar
infra nova que mereça cobertura.

**msw@2** precisa de wiring especial (`moduleNameMapper` para `msw/node`/`msw`, whitelist em
`transformIgnorePatterns` para deps ESM transitivas). Ao adicionar pacotes que dependem de msw,
estenda a whitelist.

Comandos: `pnpm test` (tudo), `pnpm test:unit` (exclui `*.int.test.*`), `pnpm test:int`,
`pnpm test:coverage`. Arquivo único: `pnpm test caminho`. Nome: `pnpm test -t "padrão"`.

---

## 10. Ambiente

`.env` (gitignored) — vars precisam do prefixo `EXPO_PUBLIC_` para chegar ao bundle:

- **`EXPO_PUBLIC_USE_MOCK`** (`true`/`false`) — alterna o container entre `InMemory*` e `GitHub*`.
- **`EXPO_PUBLIC_GITHUB_TOKEN`** — PAT opcional, eleva rate limit a 5000 req/h.
  **Embarcado no JS — use só escopo read-only `public_repo`.**
- **`EXPO_PUBLIC_PROFILE_USERNAME`** — default `octocat`.

---

## 11. Convenções de nomenclatura

- **Entidades**: substantivos singulares; campos camelCase; nullables explícitos `T | null`; datas `Date`.
- **Interfaces de repositório**: prefixo `I` (`IRepoRepository`); params co-localizados com sufixo `Params`.
- **Use cases**: sufixo `UseCase`, verbo inicial (`Search`, `Get`, `List`, `Count`, `Save`, `Unsave`);
  método único `execute`; input co-localizado com sufixo `Input`.
- **Erros**: sufixo `Error`; `code` em SCREAMING_SNAKE_CASE (discriminated union por `code`).
- **DTOs**: sufixo `Dto`, campos snake_case (espelham a API).
- **Mappers**: `map<Entidade>` (`mapRepository`, `mapIssue`).
- **Query factories**: agrupadas por entidade (`repoQueries`, `issueQueries`, `savedQueries`).
- **Textos de UI**: sempre em **português**.

---

## 12. Decisões arquiteturais relevantes

1. **Navegação em `infra`, não `presentation`** — React Navigation é framework externo (adapter).
2. **React Query setup em `infra/query/`** — hooks da presentation só **envolvem** `useQuery`/`useInfiniteQuery`.
3. **Composition root separado em 3 arquivos** (`container` puro / `providers` por env / `bootstrap` singleton)
   — facilita testar `createContainer` isoladamente.
4. **DTOs/Mappers na fronteira HTTP** — domínio nunca vê snake_case; conversão centralizada.
5. **`AxiosError` nunca vaza** — `mapHttpError(...): never` traduz tudo para `DomainError`.
6. **`/search/issues` + `type:issue`** em vez de `/repos/.../issues` — evita PRs misturados; `hasNextPage` derivado matematicamente.
7. **`buildSearchQuery`** reescreve `owner/repo` para `repo:` e adiciona `in:name,description`.
8. **`gcTime` (30s) < `staleTime` (5min)** — escolha deliberada: dados frescos mas removidos rápido
   quando inativos, otimizando memória mobile.
9. **Sem optimistic update em saves** — invalidação por prefixo de query key é suficiente e mais simples.
10. **Boundaries impostos por lint** — a arquitetura é verificada no CI, não só documentada.

---

## 13. Boas práticas obrigatórias para novas implementações

### Ao adicionar uma nova feature/vertical (entidade → tela)

> Adicionar uma vertical (entidade + interface + impl + use cases + hooks + tela) deve exigir
> **zero edições nas verticais existentes**. Se uma mudança toca arquivos de múltiplas verticais,
> **reconsidere o escopo.**

Sequência recomendada:

1. **Domain** — criar a entidade (`interface`, camelCase, `Date`, `null` explícito) e a interface
   de repositório (`I*Repository` + tipos `*Params` co-localizados). Zero imports externos.
2. **Application** — criar use case(s) `*UseCase` com `execute`, recebendo a interface no construtor;
   colocar validação/defaults aqui (usar `assertInput`).
3. **Infra** — DTO (snake_case) + mapper; `GitHub*Repository` (impl real, `catch → mapHttpError`) e
   `InMemory*Repository` (fixture); registrar nos `providers.ts` e no `createContainer`.
4. **Presentation** — adicionar query keys (`queryKeys.ts`), factory em `query/collections/`,
   e só então consumir nas telas/hooks via `useQuery`/`useInfiniteQuery`.

### Regras invioláveis

- ❌ **Nunca** importar pacote externo em `domain`/`application` (lint quebra o build).
- ❌ **Nunca** acessar `container` direto em tela/componente — só via factory em `query/collections/`.
- ❌ **Nunca** duplicar trim/validação/defaults nos hooks — isso vive nos use cases.
- ❌ **Nunca** deixar `AxiosError` ou snake_case vazar do `infra/http`.
- ❌ **Nunca** estilizar com valores brutos — usar `Box`/`Text` + tokens do tema
  (exceção: cores dinâmicas de linguagem/label).
- ✅ Toda tela trata explicitamente **loading / error / empty / success**.
- ✅ Listas usam `paginatedQueryOptions` + o padrão de `FlatList` (refresh + footer Spinner + `onEndReached`).
- ✅ Erros na UI via `getErrorMessage`; datas via `formatRelativeDate`; contagens via `formatCount`.
- ✅ Mutações que mudam dados salvos invalidam `queryKeys.savedRepos()`.
- ✅ Manter `collectCoverageFrom` honesto; rodar `pnpm typecheck` + `pnpm lint` + `pnpm test` antes de concluir.
- ✅ Usar **pnpm** (nunca npm/yarn).

---

## 14. Dependências importantes e seus propósitos

| Dependência | Propósito |
|-------------|-----------|
| `@shopify/restyle` | Design system tipado — `Box`/`Text`, variants, tokens semânticos do tema. |
| `@tanstack/react-query` | Cache de servidor, paginação infinita (`infiniteQueryOptions`), mutações + invalidação. |
| `axios` | Cliente HTTP isolado em `infra/http` (interceptor de auth). |
| `@react-navigation/*` | Navegação (bottom-tabs + native-stack), tratada como adapter em `infra/navigation`. |
| `@react-native-async-storage/async-storage` | Persistência de repos salvos e modo de tema. |
| `date-fns` (+ ptBR) | Datas relativas amigáveis. |
| `lucide-react-native` | Ícones vetoriais. |
| `@expo-google-fonts/geist` / `geist-mono` | Tipografia (Geist / GeistMono). |
| `react-native-svg` | Suporte a SVG (base de ícones). |
| `msw` (dev) | Mock de rede a nível XHR para testes de boundary HTTP. |
| `eslint-plugin-boundaries` (dev) | Impõe a regra de dependência da Clean Architecture no build. |
| `reactotron-react-native` (dev) | Debug de rede/estado só em `__DEV__`. |
| `jest-expo` + `@testing-library/react-native` (dev) | Runner e render de testes. |
```
