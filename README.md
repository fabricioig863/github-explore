# GitHub Explorer

[![CI](https://github.com/fabricioig863/github-explore/actions/workflows/ci.yml/badge.svg)](https://github.com/fabricioig863/github-explore/actions/workflows/ci.yml)

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
- [Observabilidade (Firebase)](#observabilidade-firebase)
- [CI](#ci)
- [Bibliotecas e por que cada uma](#bibliotecas-e-por-que-cada-uma)
- [Possíveis melhorias futuras](#possíveis-melhorias-futuras)

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

## Observabilidade (Firebase)

O app usa **Firebase Analytics** e **Crashlytics**, e a integração foi feita como porta e
adaptador — o SDK não aparece em nenhuma tela nem use case.

```
domain/observability/     IAnalytics · ICrashReporter · AnalyticsEvent
infra/observability/      FirebaseAnalytics · ConsoleAnalytics · NoopAnalytics
infra/di/providers.ts     escolhe qual usar
```

Trocar o Firebase por outro provedor mexe em um arquivo.

### O que é coletado

Os eventos são um union discriminado em
[`AnalyticsEvent.ts`](src/domain/observability/AnalyticsEvent.ts), e não strings soltas:
errar o nome de um evento vira erro de compilação, não um dado que some do painel.

| Evento              | Quando                                     | Onde é emitido       |
| ------------------- | ------------------------------------------ | -------------------- |
| `repo_searched`     | busca concluída (só página 1)              | `SearchReposUseCase` |
| `repo_saved`        | repositório salvo, com a coleção resolvida | `SaveRepoUseCase`    |
| `repo_unsaved`      | repositório removido                       | `UnsaveRepoUseCase`  |
| `repo_viewed`       | tela de detalhes aberta                    | `RepoDetailScreen`   |
| `issues_viewed`     | lista de issues aberta, com o filtro       | `IssuesScreen`       |
| `profile_viewed`    | perfil consultado                          | `ProfileScreen`      |
| `collection_opened` | coleção selecionada                        | `SavedScreen`        |

Mais `screen_view` em cada uma das sete telas.

Nada identifica pessoas: não há login no app, nenhum identificador de usuário é enviado, e
o token opcional nunca sai do aparelho.

Os eventos de domínio saem dos use cases; os de visualização, das telas. Abrir uma tela não
é uma operação de domínio.

### Erros

O `Crashlytics` recebe as falhas pelo `QueryCache` e pelo `MutationCache` do React Query, em
[`queryClient.ts`](src/infra/query/queryClient.ts). Rate limit, not found e query inválida
são **ignorados de propósito**: são respostas esperadas da API, já tratadas na UI.
Reportá-las afogaria o painel no que não é defeito.

### Rodando sem Firebase

Três adaptadores, escolhidos em `providers.ts`:

| Situação                           | Adaptador                                  |
| ---------------------------------- | ------------------------------------------ |
| `EXPO_PUBLIC_DEBUG_ANALYTICS=true` | `Console` — imprime os eventos no terminal |
| `EXPO_PUBLIC_USE_MOCK=true`        | `Noop` — não faz nada                      |
| padrão                             | `Firebase`                                 |

O adaptador de console é o caminho mais rápido para ver os eventos durante o
desenvolvimento, sem abrir o painel.

### Configuração

`google-services.json` (Android) e `GoogleService-Info.plist` (iOS) **são versionados**. Sem
eles o `expo prebuild` falha e o projeto não compila. Não são segredo: vão embutidos em
qualquer binário distribuído, e a API key do Firebase é restringível pelo console, não por
sigilo.

Duas decisões de build ficam registradas no `app.json`:

- **`ios.disableSPM: true`** — o react-native-firebase resolve o SDK por Swift Package
  Manager por padrão, e nesse modo o script de upload de símbolos do Crashlytics procura o
  plist em `ios/`, enquanto o plugin o instala em `ios/<target>/`. Com o SPM desligado, o
  build usa o script do CocoaPods, que localiza o arquivo sozinho.
- **`ios.useFrameworks: "static"`** — exigido pelos pods em Swift do Firebase.

---

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada push na `Master` e a
cada pull request que a tenha como alvo. São três verificações, em ordem crescente de
custo: `typecheck`, `lint` e `test:coverage`.

Duas decisões que valem o registro:

**Um job só, com passos sequenciais**, em vez de três jobs paralelos. Paralelizar
significaria três `pnpm install` — e como o repositório é privado, cada minuto sai da cota
de 2.000/mês do plano free. Sequencial roda em ~3 minutos contra ~9.

**`test:coverage` em vez de `test`.** Executa os mesmos testes, mas também aplica os
thresholds. Se a cobertura do domínio cair de 100%, o CI falha — o número no README para de
ser uma promessa e passa a ser uma trava.

O install usa `--frozen-lockfile`: se o `pnpm-lock.yaml` divergir do `package.json`, a
build quebra em vez de resolver silenciosamente uma árvore diferente da local.

---

## Bibliotecas e por que cada uma

### Plataforma

**Expo SDK 57 / React Native 0.86 / React 19** — o Expo entrega o ciclo de build nativo
(prebuild, EAS) e o acesso a APIs de aparelho sem gerenciar Xcode e Gradle à mão. O projeto
não usa Expo Go: `android/` e `ios/` são gerados por Continuous Native Generation a partir
do `app.json`, então nada nativo é versionado e a configuração vive num arquivo só.

**expo-router** — roteamento por arquivos. Escolhido sobre o React Navigation puro por
dois motivos práticos: deep linking sai de graça (cada arquivo é uma URL) e o
`typedRoutes` gera tipos das rotas, então um `router.push` para uma rota inexistente
quebra no `tsc`, não em runtime.

**TypeScript em modo strict**, com `noUncheckedIndexedAccess` e `noImplicitOverride`
ligados. Sem `any` em nenhum ponto do código. O `noUncheckedIndexedAccess` é o que força
tratar `array[0]` como possivelmente indefinido — chato de início, mas elimina uma classe
inteira de crash em lista vazia.

### Dados e estado

**@tanstack/react-query** — todo o estado de servidor. Traz de fábrica o que seria
reescrito à mão: cache por chave, deduplicação de requests simultâneas, revalidação,
estados de `loading`/`error` e **paginação infinita** (`useInfiniteQuery`, usado na busca).
Não há Redux nem Context global para dados: estado de servidor não é estado de aplicação, e
tratá-los como a mesma coisa é o que costuma inflar esse tipo de projeto.

**axios** — cliente HTTP. Preferido ao `fetch` pelos **interceptors**, que são o ponto onde
o token opcional é injetado e onde o timeout é aplicado de forma centralizada. Com `fetch`
puro isso viraria um wrapper manual em todo request.

**@react-native-async-storage/async-storage** — persistência dos repositórios salvos e das
preferências. É chave-valor simples, que é exatamente a forma do dado; um SQLite aqui seria
peso sem retorno.

**expo-secure-store** — guarda o Personal Access Token opcional. Usa Keychain no iOS e
EncryptedSharedPreferences no Android. Token nunca entra no AsyncStorage, que é texto puro.

### Interface

**@shopify/restyle** — design system tipado. Os componentes recebem `backgroundColor="bg"`
e `padding="huge"` em vez de valores soltos, e o TypeScript recusa um token que não exista
no tema. É o que sustenta o tema claro/escuro sem `if (isDark)` espalhado pelas telas.

**lucide-react-native** — ícones em SVG, com peso por ícone e a mesma API no conjunto todo.

**react-native-svg** + **react-native-svg-transformer** — permite `import Ilustracao from
'./x.svg'` como componente React, mantendo a ilustração vetorial em vez de PNG em três
densidades.

**@expo-google-fonts/geist** e **geist-mono** — tipografia. A monoespaçada é usada nos
metadados (datas, contadores) para alinhar em coluna.

**date-fns** — datas relativas ("salvo há 2 dias") com locale pt-BR. Escolhida sobre o
Moment por ser modular: entra no bundle só a função importada.

**react-native-safe-area-context**, **react-native-screens**,
**react-native-gesture-handler**, **react-native-reanimated** — peers do expo-router e do
React Navigation. Não são importados diretamente pelo código da aplicação.

### Qualidade

**Jest + jest-expo** — runner configurado para o ambiente React Native.

**@testing-library/react-native** — testes de componente por comportamento e
acessibilidade (`getByText`, `getByLabelText`), não por estrutura interna. Um teste assim
sobrevive a refatoração de layout.

**msw** — simula a API do GitHub **no nível do HTTP**, e não mockando o axios. A diferença
importa: os testes de repositório exercitam o cliente real, os interceptors e o mapeamento
de erros. Mockar o axios testaria só o mock.

**eslint-plugin-boundaries** — transforma a regra de dependência da arquitetura em erro de
lint. Sem isso, "domain não importa de infra" é um acordo verbal que a primeira pressa
quebra.

**@typescript-eslint**, **eslint-plugin-import**, **eslint-config-expo**, **prettier** —
lint e formatação.

**reactotron-react-native** — inspeção de requests e estado durante o desenvolvimento.
Neutralizado no bundle web por um stub `.web.ts`, porque a biblioteca toca em módulos
nativos que não existem fora do aparelho.

### Módulos do Expo

**expo-image-picker** abre a galeria para trocar o avatar local. **expo-splash-screen**
segura a splash até as fontes carregarem, evitando o flash de texto sem fonte.
**expo-build-properties** é config plugin, usado para adotar o ciclo de vida de cena
exigido pelo SDK do iOS 27. **expo-constants**, **expo-font**, **expo-linking**,
**expo-status-bar** e **expo-system-ui** entram como dependências do expo-router e do
próprio runtime.

**react-dom** e **react-native-web** existem porque o Expo compila o projeto para web
também. A web não é alvo do app, mas o bundle precisa montar — há um teste implícito de
sanidade nisso: código que quebra no web costuma ser código que toca em nativo sem
proteção.

---

## Possíveis melhorias futuras

Em ordem aproximada de retorno sobre esforço.

**Observabilidade.** Não há hoje nenhuma visibilidade do que acontece em produção.
Crashlytics para relatórios de crash e eventos de analytics nas ações principais (busca,
salvar, abrir detalhe) entrariam como porta no domínio e adaptador na infraestrutura,
mantendo a regra de dependência.

**Atualizações OTA.** Sem `expo-updates`, qualquer correção exige build nova. Para um app
cuja lógica é quase toda JavaScript, é o ganho isolado mais óbvio.

**Contribuições reais no perfil.** O gráfico é gerado localmente porque a REST API pública
não expõe esses dados. A GraphQL API do GitHub expõe, via `contributionsCollection`, mas
exige autenticação — daria para habilitar apenas quando houver token configurado.

**Cache offline.** O React Query mantém cache em memória, que morre ao fechar o app.
Persistir com `@tanstack/query-persist-client` faria a lista abrir instantaneamente e
funcionar sem rede.

**Coleções editáveis pelo usuário.** Hoje as regras de categorização são fixas no código.
Deixar criar coleções e arrastar repositórios entre elas transformaria uma heurística numa
funcionalidade — com o detalhe de que a regra automática viraria só a sugestão inicial.

**Testes end-to-end.** A suíte cobre unidade e integração, mas ninguém verifica o app
rodando de verdade. Maestro ou Detox cobririam os fluxos principais em aparelho.

**Acessibilidade.** Os elementos interativos têm `accessibilityLabel` e `accessibilityRole`,
mas falta auditoria com leitor de tela e verificação de contraste nos dois temas.

**Virtualização de listas.** As listas usam `FlatList`. Com centenas de itens salvos,
`FlashList` reduziria o custo de renderização — ainda não é um problema no volume atual.

**Internacionalização.** A interface está fixa em pt-BR. Extrair as strings para um
dicionário é pré-requisito para qualquer idioma adicional.
