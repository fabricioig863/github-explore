# GitHub Explorer

App mobile em Expo / React Native para explorar repositórios e issues do GitHub, com uma
lista de repositórios salvos localmente e organizados em coleções automáticas.

**Não precisa de login nem de configuração.** Toda a API consumida é pública: clone,
instale e rode.

---

## Índice

- [Rodando o projeto](#rodando-o-projeto)
- [Rate limit da API](#rate-limit-da-api)
- [O que o app faz](#o-que-o-app-faz)
- [Arquitetura](#arquitetura)
  - [As quatro camadas](#as-quatro-camadas)
  - [A regra de dependência](#a-regra-de-dependência)
  - [Fluxo de uma tela](#fluxo-de-uma-tela)
  - [Injeção de dependências](#injeção-de-dependências)
  - [Tratamento de erros](#tratamento-de-erros)
  - [Categorização em coleções](#categorização-em-coleções)
- [Testes](#testes)
- [Scripts](#scripts)

---

## Rodando o projeto

### Requisitos

| Item           | Versão / observação                                      |
| -------------- | -------------------------------------------------------- |
| Node           | 22 ou superior                                           |
| pnpm           | 10.32.1 (fixado no `packageManager` do `package.json`)   |
| Android Studio | SDK + um emulador, ou um device físico com depuração USB |
| Xcode          | apenas para iOS. Deployment target mínimo 15.1           |

**Não use o Expo Go.** O app depende de `expo-secure-store` e de config plugins nativos,
que o sandbox do Expo Go não suporta. É preciso um development build.

### Passos

```bash
pnpm install
npx expo prebuild     # gera android/ e ios/, que não são versionados
pnpm android          # ou: pnpm ios (apenas macOS)
```

A primeira build demora alguns minutos; as seguintes reaproveitam o cache.

### Configuração opcional

Não existe `.env` obrigatório. Para ajustar o padrão:

```bash
cp .env.example .env
```

| Variável                       | Para quê                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| `EXPO_PUBLIC_PROFILE_USERNAME` | login que abre por padrão na aba Perfil (padrão: `octocat`) |
| `EXPO_PUBLIC_USE_MOCK`         | `true` roda sobre dados em memória, sem tocar na rede       |

O Metro lê o `.env` só na inicialização. Depois de editar, reinicie com `pnpm start -c`.

---

## Rate limit da API

Sem autenticação, o GitHub permite **60 requisições por hora, por IP**. Dá para navegar
bastante, mas em uso intenso você pode esbarrar no limite — o app exibe um erro de limite
excedido quando isso acontece.

Para elevar para **5.000 por hora**, informe um Personal Access Token em
**Perfil → Configurações → Token de acesso**:

1. Gere um token em <https://github.com/settings/tokens>.
2. **Não marque escopo nenhum.** O app só lê dados públicos; um token sem escopos já
   resolve o rate limit e não dá acesso a nada da sua conta.
3. Cole no campo e salve.

O token fica no armazenamento seguro do aparelho — Keychain no iOS,
EncryptedSharedPreferences no Android — e só é enviado para a própria API do GitHub. Pode
ser removido na mesma tela a qualquer momento.

---

## O que o app faz

| Aba          | Conteúdo                                                         |
| ------------ | ---------------------------------------------------------------- |
| **Explorar** | busca de repositórios, com paginação e filtros rápidos           |
| **Design**   | catálogo vivo do design system (tipografia, cores, componentes)  |
| **Salvos**   | repositórios salvos, agrupados em coleções automáticas           |
| **Perfil**   | perfil público de qualquer usuário, com repositórios em destaque |

A partir de um repositório dá para abrir os detalhes e a lista de issues, com filtro por
estado.

Dois pontos que valem ser explícitos:

- **O gráfico de contribuições é gerado localmente.** A REST API pública do GitHub não
  expõe esses dados; o gráfico é determinístico a partir do login, só para ilustrar a UI.
- **A aba Perfil mostra qualquer pessoa.** O campo de busca no topo troca o usuário
  exibido; o login inicial vem de `EXPO_PUBLIC_PROFILE_USERNAME`.

---

## Arquitetura

Clean Architecture em quatro camadas, com a regra de dependência apontando para dentro e
**imposta por lint** — violar a fronteira quebra o `pnpm lint`, não é convenção informal.

```
src/
├── domain/          entidades, contratos de repositório, erros, regras puras
├── application/     use cases — orquestram domínio, sem conhecer framework
├── infra/           implementações concretas: HTTP, storage, DI, tema
├── presentation/    componentes, telas, hooks e camada de query
└── app/             rotas do expo-router (file-based routing)
```

### As quatro camadas

**`domain/`** — o núcleo. Não importa nada de fora, nem bibliotecas externas.

- `entities/` — `Repository`, `Issue`, `GitHubUser`, `SavedRepo`, `Owner`, `Label`…
- `repositories/` — as _interfaces_ (`IRepoRepository`, `IUserRepository`, …). São
  contratos; quem os cumpre vive em `infra/`.
- `errors/` — hierarquia própria (`NotFoundError`, `RateLimitError`, `NetworkError`,
  `InvalidQueryError`, `UnexpectedError`), todos sob `DomainError`.
- `services/` — regras de negócio puras que não pertencem a uma entidade só. Hoje:
  `repoCategorization`.

**`application/`** — um use case por operação, cada um recebendo suas dependências pelo
construtor como _interface_ do domínio. É aqui que mora validação de entrada
(`validation/assertInput`) e composição entre use cases — `GetTopUserReposUseCase`, por
exemplo, é construído sobre `ListUserReposUseCase`.

**`infra/`** — tudo que é detalhe técnico substituível:

- `http/` — cliente axios, DTOs da API e mappers DTO → entidade. A fronteira onde o
  formato do GitHub para de existir.
- `repositories/` — duas implementações de cada contrato: a real (`GitHubRepoRepository`)
  e uma em memória (`InMemoryRepoRepository`) usada pelo modo mock e pelos testes.
- `di/` — a composição (detalhada abaixo).
- `auth/`, `theme/`, `query/`, `reactotron/` — armazenamento do token, tema, client do
  React Query e debug.

**`presentation/`** — React, e nada além de React:

- `design-system/` — primitivas (`Box`, `Text`) sobre Restyle, e componentes de base.
- `query/collections/` — as `queryOptions` do React Query, um arquivo por domínio. É a
  ponte entre as telas e os use cases.
- `hooks/`, `screens/`, `components/`, `utils/`.

**`app/`** — só roteamento. Cada arquivo é uma rota do expo-router e normalmente apenas
reexporta uma tela de `presentation/screens`.

### A regra de dependência

Configurada em [`eslint.config.js`](eslint.config.js) via `eslint-plugin-boundaries`:

| Camada         | Pode importar de        | Mensagem do lint ao violar                                      |
| -------------- | ----------------------- | --------------------------------------------------------------- |
| `domain`       | nada                    | _domain é puro: não pode importar de nenhuma outra camada_      |
| `application`  | `domain`                | _application só pode importar de domain_                        |
| `infra`        | `domain`, `application` | _infrastructure não pode importar de presentation nem de rotas_ |
| `presentation` | todas menos `app`       | não pode importar rotas                                         |
| `app`          | todas                   | —                                                               |

`domain` e `application` também estão proibidos de importar **qualquer pacote externo**.
Na prática isso significa que o núcleo do app não sabe que existe axios, React ou Expo — e
é por isso que ele roda em teste sem mock nenhum.

### Fluxo de uma tela

Buscando o perfil de um usuário:

```
ProfileScreen
  └─ useQuery(userQueries.profile(login))        presentation/query
       └─ container.getUserProfileUseCase        infra/di
            └─ IUserRepository.getUser(login)    domain (contrato)
                 └─ GitHubUserRepository         infra (implementação)
                      └─ GET /users/{login}
                           └─ mapGitHubUser      DTO → entidade GitHubUser
```

A tela nunca conhece axios nem o formato do GitHub. Troque `GitHubUserRepository` por
outra implementação e nada acima muda.

### Injeção de dependências

Três arquivos, sem biblioteca de DI:

- **`providers.ts`** — escolhe a implementação de cada contrato conforme
  `EXPO_PUBLIC_USE_MOCK`. É o único lugar que lê essa variável.
- **`container.ts`** — recebe os repositórios e devolve todos os use cases já
  construídos. Função pura: dá para instanciar com fakes em teste.
- **`bootstrap.ts`** — a única instância viva, montada na inicialização do app.

A presentation importa `container` de `bootstrap` e nunca instancia um use case por conta
própria.

### Tratamento de erros

`infra/http/errorMapper.ts` é o funil: toda resposta da API que falha passa por ele e sai
como um `DomainError`. Um 403 com `x-ratelimit-remaining: 0` vira `RateLimitError` (e não
um "acesso negado" genérico); ausência de resposta vira `NetworkError`; o resto,
`UnexpectedError`.

Daí para cima ninguém inspeciona status HTTP — a presentation traduz o tipo do erro em
texto por `presentation/utils/getErrorMessage`.

### Categorização em coleções

Ao salvar um repositório, ele é classificado automaticamente em uma das cinco coleções:
**Mobile**, **Backend**, **Web**, **Ferramentas** e **AI & ML**.

A regra vive em [`src/domain/services/repoCategorization.ts`](src/domain/services/repoCategorization.ts),
numa única estrutura editável — `COLLECTION_RULES`.

A decisão percorre três níveis de prioridade:

1. **topics do repositório** — o sinal mais confiável, é a taxonomia do próprio GitHub;
2. **palavras em nome, owner e descrição**;
3. **linguagem**, apenas como último recurso.

Linguagem sozinha erra: `openai/codex` é escrito em Rust, mas pertence a AI & ML pelo
owner, não a Backend. Por isso ela vem por último.

Detalhes do comportamento:

- **Um repositório pertence a no máximo uma coleção** — a de maior prioridade. A ordem do
  array `COLLECTION_RULES` _é_ a ordem de prioridade.
- **Os termos casam por palavra inteira, não por substring.** Sem isso, `ai` casaria
  dentro de "cont**ai**ner".
- **Termos são normalizados**: `machine-learning`, `machine_learning` e `Machine Learning`
  são o mesmo termo. Escreva-os juntos na regra (`machinelearning`).
- **Sem match, o repositório fica sem coleção** — e continua visível em "Todos" e em
  "Salvos recentemente". Nunca some da lista.

Para ajustar o mapeamento, edite `match` (o que se procura) ou `languages` (o fallback).
Para mudar a precedência, mova o bloco de posição. Para criar uma coleção, adicione o
bloco, inclua o id em `CollectionId` e preencha a aparência em
`presentation/utils/savedCollections.ts` — o TypeScript aponta se faltar.

---

## Testes

```bash
pnpm test              # suíte completa
pnpm test:unit         # só unitários (ignora *.int.test.*)
pnpm test:int          # só integração
pnpm test:coverage     # com relatório de cobertura
```

São **401 testes em 68 suites**, organizados espelhando as camadas:

| Diretório                   | O que cobre                                            |
| --------------------------- | ------------------------------------------------------ |
| `__tests__/domain/`         | regras puras (categorização, erros)                    |
| `__tests__/application/`    | use cases, com repositórios fake                       |
| `__tests__/infrastructure/` | mappers, DI, e repositórios reais contra HTTP simulado |
| `__tests__/presentation/`   | componentes e telas com Testing Library                |
| `__tests__/integration/`    | fatias verticais: tela → use case → repositório        |

Os testes de infraestrutura usam **msw** para simular a API do GitHub no nível do HTTP, em
vez de mockar axios. Isso exercita o cliente, os interceptors e o mapeamento de erros de
verdade.

Cobertura mínima exigida (`jest.config.js`): **100% em `domain/`** e **100% em
`application/`** (95% em branches), contra 80% global. O núcleo é o que precisa de
garantia — a UI é verificada por comportamento.

---

## Scripts

| Comando                     | O que faz                                      |
| --------------------------- | ---------------------------------------------- |
| `pnpm start`                | sobe o Metro (`-c` limpa o cache)              |
| `pnpm android` / `pnpm ios` | compila e instala o development build          |
| `pnpm test`                 | suíte completa                                 |
| `pnpm test:coverage`        | cobertura, com os thresholds acima             |
| `pnpm typecheck`            | `tsc --noEmit`                                 |
| `pnpm lint`                 | ESLint, incluindo as fronteiras da arquitetura |
| `pnpm format`               | Prettier                                       |

---

## Stack

| Tecnologia                                 | Papel                             |
| ------------------------------------------ | --------------------------------- |
| Expo SDK 57 / React Native 0.86 / React 19 | plataforma e runtime              |
| expo-router                                | roteamento por arquivos           |
| TypeScript (strict)                        | tipagem, sem `any`                |
| TanStack Query                             | cache e estado de servidor        |
| Restyle                                    | design system tipado sobre o tema |
| axios                                      | cliente HTTP                      |
| Jest + Testing Library + msw               | testes                            |
| eslint-plugin-boundaries                   | fronteiras da arquitetura         |
