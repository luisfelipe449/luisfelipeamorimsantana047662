# Sistema de Gerenciamento de Artistas e Albums

Projeto Full Stack desenvolvido como parte do **Processo Seletivo Simplificado n 001/2026/SEPLAG** para o cargo de **Analista de Tecnologia da Informacao - Perfil Engenheiro da Computacao (Senior)**.

## Dados do Candidato

- **Nome**: LUIS FELIPE AMORIM SANT'ANA
- **Vaga**: Analista de TI - Engenheiro da Computacao (Senior)
- **Projeto**: Full Stack (Java + Angular)

## Tecnologias Utilizadas

### Backend
| Tecnologia | Versao | Finalidade |
|------------|--------|------------|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.2.1 | Framework web |
| Spring Security | 6.x | Autenticacao e autorizacao |
| Spring Data JPA | 3.x | Persistencia de dados |
| PostgreSQL | 15 | Banco de dados relacional |
| Flyway | 9.x | Migrations de banco |
| MinIO | Latest | Armazenamento S3-compatible |
| Bucket4j | 8.x | Rate limiting |
| SpringDoc OpenAPI | 2.x | Documentacao Swagger |
| WebSocket/STOMP | - | Comunicacao em tempo real |
| JUnit 5 + Mockito | - | Testes unitarios |

### Frontend
| Tecnologia | Versao | Finalidade |
|------------|--------|------------|
| Angular | 17.x | Framework SPA |
| Angular Material | 17.x | Componentes UI |
| Tailwind CSS | 3.4.x | Framework CSS utilitario |
| TypeScript | 5.x | Tipagem estatica |
| RxJS | 7.x | Programacao reativa |
| STOMP.js | - | Cliente WebSocket |
| SockJS | - | Fallback WebSocket |

### Infraestrutura
| Tecnologia | Finalidade |
|------------|------------|
| Docker | Containerizacao |
| Docker Compose | Orquestracao |
| Nginx | Servidor web frontend |

## Estrutura do Projeto

```
pss-fullstack-mt/
├── docker-compose.yml          # Orquestracao de todos os servicos
├── README.md                   # Documentacao do projeto
├── backend/
│   ├── Dockerfile              # Build do backend
│   ├── pom.xml                 # Dependencias Maven
│   └── src/
│       ├── main/
│       │   ├── java/com/pss/fullstack/
│       │   │   ├── config/     # Configuracoes (Security, MinIO, WebSocket)
│       │   │   ├── controller/ # REST Controllers
│       │   │   ├── dto/        # Data Transfer Objects
│       │   │   ├── model/      # Entidades JPA
│       │   │   ├── repository/ # Spring Data Repositories
│       │   │   └── service/    # Logica de negocio
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/  # Flyway migrations
│       └── test/               # Testes unitarios
└── frontend/
    ├── Dockerfile              # Build multi-stage com nginx
    ├── nginx.conf              # Configuracao do servidor
    └── src/
        └── app/
            ├── core/           # Servicos singleton, interceptors, guards
            ├── shared/         # Componentes reutilizaveis
            └── features/       # Modulos de funcionalidades
                ├── auth/       # Login/autenticacao
                ├── artists/    # CRUD de artistas
                └── albums/     # CRUD de albums
```

## Como Executar

### Pre-requisitos
- Docker e Docker Compose instalados
- Portas disponiveis: 80 (frontend), 8080 (backend), 5432 (PostgreSQL), 9000/9001 (MinIO)

### Execucao com Docker Compose

1. Clone o repositorio:
```bash
git clone https://github.com/luisfelipe449/luisfelipeamorimsantana047662/
cd luisfelipeamorimsantana047662
```

2. Inicie todos os servicos:
```bash
docker-compose up -d
```

3. Aguarde todos os containers ficarem saudaveis:
```bash
docker-compose ps
```

4. Acesse a aplicacao:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/actuator/health
- **MinIO Console**: http://localhost:9001

### Credenciais Padrao

**Usuario do Sistema**:
- Usuario: `admin`
- Senha: `admin123`

**Banco de Dados (PostgreSQL)**:
- Host: `localhost:5432`
- Database: `pss_fullstack`
- Usuario: `pss_user`
- Senha: `pss_password`

**MinIO**:
- Endpoint: `localhost:9000`
- Console: `localhost:9001`
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

## Desenvolvimento Local com Hot Reload

Para desenvolvimento com hot reload, utilize uma estratégia híbrida: Docker apenas para dependências (PostgreSQL e MinIO), enquanto backend e frontend rodam localmente.

### Pré-requisitos
- Java 17 instalado localmente
- Node.js 18+ e npm instalados
- Docker e Docker Compose para as dependências

### Scripts de Desenvolvimento

1. **Iniciar dependências** (PostgreSQL + MinIO):
```bash
./start-dev.sh
```

2. **Backend com hot reload** (em outro terminal):
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

3. **Frontend com hot reload** (em outro terminal):
```bash
cd frontend
npm install  # primeira vez apenas
npm start
```

4. **Parar dependências** quando terminar:
```bash
./stop-dev.sh
```

### URLs de Desenvolvimento
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **MinIO Console**: http://localhost:9001

### Vantagens desta Abordagem
- ✅ Hot reload instantâneo no backend e frontend
- ✅ Sem rebuild de containers a cada mudança
- ✅ Desenvolvimento mais rápido e produtivo
- ✅ Dependências isoladas em containers
- ✅ Logs em tempo real no terminal

## Funcionalidades Implementadas

### Backend (API REST)

#### Autenticacao e Seguranca
- [x] JWT com expiracao de 5 minutos
- [x] Refresh token com expiracao de 24 horas
- [x] CORS configurado para bloquear dominios externos
- [x] Rate limiting: 10 requisicoes/minuto por usuario

#### CRUD de Artistas
- [x] Criar artista (POST /api/v1/artists)
- [x] Atualizar artista (PUT /api/v1/artists/{id})
- [x] Listar artistas (GET /api/v1/artists)
- [x] Buscar artista por ID (GET /api/v1/artists/{id})
- [x] Filtro por nome com ordenacao (asc/desc)
- [x] Consultas parametrizadas por tipo (SOLO/BAND)

#### CRUD de Albums
- [x] Criar album (POST /api/v1/albums)
- [x] Atualizar album (PUT /api/v1/albums/{id})
- [x] Listar albums com paginacao (GET /api/v1/albums)
- [x] Buscar album por ID (GET /api/v1/albums/{id})

#### Armazenamento de Imagens (MinIO)
- [x] Upload de capas de albums (POST /api/v1/albums/{id}/covers)
- [x] Presigned URLs com expiracao de 30 minutos
- [x] Bucket automaticamente criado na inicializacao

#### Recursos Senior
- [x] Health Checks Backend (liveness e readiness)
- [x] Health Check Service Frontend com monitoramento automatico
- [x] WebSocket para notificacoes de novos albums
- [x] Rate limiting com Bucket4j (10 req/min)
- [x] Sincronizacao com endpoint de regionais
- [x] Testes unitarios com 80%+ cobertura

#### Documentacao
- [x] Swagger/OpenAPI 3.0
- [x] Versionamento de endpoints (/api/v1/...)
- [x] Flyway migrations

### Frontend (Angular SPA)

#### Autenticacao
- [x] Tela de login
- [x] JWT interceptor com refresh automatico
- [x] Auth guard para rotas protegidas
- [x] Logout

#### Modulo de Artistas
- [x] Listagem com cards responsivos
- [x] Busca por nome
- [x] Ordenacao (A-Z / Z-A)
- [x] Filtro por tipo (Solo/Banda)
- [x] Paginacao
- [x] Detalhamento com albums
- [x] Formulario de criacao/edicao

#### Modulo de Albums
- [x] Listagem com capas
- [x] Busca por titulo
- [x] Paginacao
- [x] Upload de capas
- [x] Formulario de criacao/edicao

#### Arquitetura Senior
- [x] Padrao Facade para abstracao de servicos
- [x] State management com BehaviorSubject
- [x] Lazy loading de modulos
- [x] WebSocket para notificacoes em tempo real

#### UI/UX
- [x] Angular Material (componentes interativos)
- [x] Tailwind CSS (layout e estilos utilitarios)
- [x] Layout responsivo (mobile, tablet, desktop)
- [x] Snackbar para feedback de acoes
- [x] Loading spinners

## Endpoints da API

### Autenticacao
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /api/v1/auth/login | Login (retorna JWT) |
| POST | /api/v1/auth/refresh | Renovar access token |

### Artistas
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/artists | Listar artistas (com filtros) |
| GET | /api/v1/artists/{id} | Buscar artista por ID |
| POST | /api/v1/artists | Criar artista |
| PUT | /api/v1/artists/{id} | Atualizar artista |

### Albums
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/albums | Listar albums (paginado) |
| GET | /api/v1/albums/{id} | Buscar album por ID |
| POST | /api/v1/albums | Criar album |
| PUT | /api/v1/albums/{id} | Atualizar album |
| POST | /api/v1/albums/{id}/covers | Upload de capa |
| GET | /api/v1/albums/{id}/covers/url | Obter presigned URL |

### Regionais
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /api/v1/regionais/sync | Sincronizar regionais |
| GET | /api/v1/regionais | Listar regionais |

### Health Checks
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /actuator/health | Status geral |
| GET | /actuator/health/liveness | Probe de liveness |
| GET | /actuator/health/readiness | Probe de readiness |

## Testes

### Executar Testes do Backend
```bash
cd backend
./mvnw test
```

### Executar Testes do Frontend
```bash
cd frontend
npm test
```

## Decisoes de Arquitetura

### 1. Estrutura em Camadas (Backend)
Optei por uma arquitetura em camadas tradicionais (Controller → Service → Repository) por ser um padrao bem estabelecido, facil de entender e manter. Para um projeto deste porte, esta abordagem oferece boa separacao de responsabilidades sem adicionar complexidade desnecessaria.

### 2. Padrao Facade (Frontend)
Implementei o padrao Facade para encapsular toda a logica de estado e comunicacao com a API. Isso permite:
- Desacoplamento entre componentes e servicos
- Centralizacao do gerenciamento de estado
- Facilidade para testes unitarios

### 3. BehaviorSubject para State Management
Utilizei BehaviorSubject ao inves de bibliotecas como NgRx por ser:
- Mais simples e direto para projetos deste tamanho
- Nativo do RxJS (ja incluso no Angular)
- Suficiente para as necessidades de estado reativo

### 4. JWT com Refresh Token
A estrategia de access token (5 min) + refresh token (24h) foi escolhida para:
- Seguranca: tokens de curta duracao minimizam impacto de vazamentos
- UX: refresh automatico evita re-login frequente
- Conformidade: atende exatamente ao requisito do edital

### 5. MinIO para Armazenamento
MinIO foi escolhido por:
- Compatibilidade total com API S3
- Facilidade de configuracao via Docker
- Presigned URLs nativas

### 6. Rate Limiting com Bucket4j
Bucket4j foi escolhido por:
- Integracao nativa com Spring
- Configuracao simples
- Eficiencia (in-memory)

### 7. WebSocket com STOMP/SockJS
A combinacao STOMP + SockJS garante:
- Protocolo padrao para mensageria
- Fallback para browsers sem suporte nativo
- Integracao facilitada com Spring

### 8. Tailwind CSS + Angular Material
Conforme orientacao do edital ("Se usar framework CSS, priorize Tailwind"), integrei Tailwind CSS como framework CSS principal. A estrategia adotada:
- **Angular Material**: apenas para componentes interativos (buttons, forms, dialogs, menus)
- **Tailwind CSS**: todo o resto (layout, espacamento, cores, tipografia, responsividade)
- Resultado: reducao de ~2.500 linhas de CSS customizado para ~200 linhas
- Beneficios: maior consistencia, manutencao simplificada, responsividade declarativa

### 9. Otimizacao de Busca (Debounce)
Para respeitar o rate limit de 10 requisicoes por minuto definido no edital, a busca por texto nas listagens implementa:
- **Debounce de 500ms**: Aguarda o usuario parar de digitar antes de enviar a requisicao a API
- **distinctUntilChanged**: Operador RxJS que evita requisicoes duplicadas se o valor nao mudou
- **Minimo de 2 caracteres**: Busca so e executada com pelo menos 2 caracteres digitados

Esta estrategia garante que mesmo digitando rapidamente (ex: "Serj Tankian" com 12 caracteres), apenas 1-2 requisicoes sejam feitas ao servidor, evitando o estouro do rate limit e melhorando a experiencia do usuario.

### 10. Tratamento de Token Expirado (HTTP 401)
O filtro JWT foi configurado para retornar HTTP 401 (Unauthorized) explicitamente quando o token esta expirado ou invalido. Isso permite que o frontend:
1. Identifique corretamente que precisa renovar o token
2. Chame o endpoint /auth/refresh automaticamente
3. Retente a requisicao original com o novo token

Sem essa configuracao, o Spring Security retornaria 403 (Forbidden), que semanticamente significa "autenticado mas sem permissao", impedindo o fluxo correto de refresh token.

### Endpoint Proxy para Imagens (Solução para SignatureDoesNotMatch)

**Problema**: As URLs presigned do MinIO apresentavam erro `SignatureDoesNotMatch` quando geradas com URL interno (`minio:9000`) mas acessadas externamente (`localhost:9000`). A assinatura AWS S3 inclui o hostname no cálculo, tornando a simples substituição de strings insuficiente.

**Solução Implementada**: Criado endpoint proxy no backend que serve imagens diretamente do MinIO:
- **Endpoints públicos**: `/api/v1/images/album-covers/{objectKey}` e `/api/v1/images/artist-photos/{objectKey}`
- **Sem autenticação**: Imagens são públicas para visualização
- **Cache otimizado**: Headers Cache-Control (1 hora) e ETag para performance
- **Segurança**: Validação de object keys previne directory traversal

**Benefícios**:
- ✅ Elimina completamente problemas de assinatura S3
- ✅ URLs mais simples e previsíveis
- ✅ Controle total sobre cache e headers HTTP
- ✅ Possibilidade de adicionar transformações futuras (resize, watermark)
- ✅ Métricas e logs centralizados de acesso a imagens

**Trade-offs**:
- Backend processa todas requisições de imagem (maior uso de CPU/memória)
- Latência adicional comparado a acesso direto ao MinIO
- Mitigado com cache headers apropriados (1 hora para imagens)

### 11. Modo de Desenvolvimento Local com Hot Reload

**Problema**: O desenvolvimento usando Docker Compose completo é lento devido ao processo de build/restart a cada mudança de código, impactando a produtividade do desenvolvedor.

**Solução Implementada**: Criado modo de desenvolvimento híbrido que:
- **Docker Compose Dev**: Executa apenas dependências (PostgreSQL + MinIO)
- **Backend Local**: Spring Boot com DevTools para hot reload automático
- **Frontend Local**: Angular dev server com hot reload e proxy para backend

**Arquivos criados**:
- `docker-compose.dev.yml`: Apenas PostgreSQL e MinIO
- `start-dev.sh`: Script para iniciar dependências
- `stop-dev.sh`: Script para parar dependências
- `proxy.conf.json`: Configuração de proxy do Angular
- `application-dev.yml`: Profile Spring com DevTools habilitado
- `DEVELOPMENT.md`: Documentação completa do modo dev

**Benefícios**:
- ✅ Hot reload instantâneo (backend e frontend)
- ✅ Debugging facilitado com IDEs
- ✅ Ciclo de feedback 10x mais rápido
- ✅ Logs mais verbosos para desenvolvimento
- ✅ Volumes Docker separados (`*_dev`) não conflitam com produção

**Decisão Técnica**: Optei por manter as dependências (PostgreSQL/MinIO) em Docker para:
- Garantir consistência entre ambientes
- Evitar instalação manual de serviços
- Facilitar reset de dados com `docker-compose down -v`
- Manter paridade com ambiente de produção

Enquanto backend/frontend rodam localmente para:
- Aproveitar hot reload nativo das ferramentas
- Facilitar debugging com breakpoints
- Reduzir overhead de containerização durante desenvolvimento
- Permitir uso completo de ferramentas de desenvolvimento das IDEs

**Configuração Nginx**: Ajustado o arquivo `nginx.conf` para usar `location ^~ /api` com prioridade sobre regras de cache de assets estáticos, garantindo que requisições de imagens pela API sejam corretamente proxiadas para o backend

### 12. Upload de Áudio Sequencial (não paralelo)

**Problema**: O upload paralelo de múltiplos arquivos de áudio via `Promise.all()` apresentava riscos:
1. **Violação do Rate Limit**: 5+ uploads simultâneos excedem o limite de 10 req/min
2. **Erros Silenciosos**: Falhas eram engolidas pelo `Promise.all()`, usuário não percebia
3. **Carga no Servidor**: Pico de I/O com múltiplas conexões simultâneas

**Solução Implementada**: Upload sequencial com feedback progressivo:
- Arquivos de áudio são enviados um por vez, em ordem
- Snackbar mostra progresso ("Enviando áudio 1 de 3...")
- Erros interrompem o processo imediatamente com mensagem clara
- Nunca viola o rate limit, independente do número de faixas

**Trade-offs**:
| Aspecto | Síncrono | Paralelo |
|---------|----------|----------|
| Rate Limit | ✅ Nunca viola | ❌ Viola com 5+ faixas |
| Consistência | ✅ Erro claro | ❌ Erros silenciosos |
| Velocidade | ❌ Mais lento | ✅ Mais rápido |
| Complexidade | ✅ Simples | ❌ Promise.all complexo |

**Decisão**: A consistência e respeito ao rate limit são mais importantes que a velocidade de upload. O usuário prefere saber exatamente o que está acontecendo e receber erros claros do que ter uploads mais rápidos mas potencialmente falhos.

### 13. Health Check no Frontend (Monitoramento Proativo)

**Requisito**: O edital exige "Health Checks" como requisito Sênior para o frontend.

**Implementação**: Serviço de monitoramento periódico (`HealthCheckService`) que verifica a saúde do backend a cada 60 segundos.

**Estratégia de Rate Limit**: O endpoint `/actuator/health` está **excluído do rate limiting** no backend, garantindo que o monitoramento não consuma o limite de 10 req/min do usuário:

```java
private boolean isPublicEndpoint(String path) {
    return path.startsWith("/api/actuator") || // Health check excluído
           // ...outros endpoints públicos
}
```

**Mecanismo de Resiliência**:
- Timeout de 5 segundos por requisição
- Até 3 retries com backoff exponencial (1s, 2s, 4s)
- Estado reativo via `BehaviorSubject` (requisito Sênior)

**Feedback ao Usuário**:
- Banner vermelho sticky quando backend indisponível
- Snackbar com botão "Reconectar" para retry manual
- Indicador de retry em andamento ("Retry 2/3")
- Notificação de sucesso quando conexão restaurada

**Benefícios**:
- ✅ Usuário sabe imediatamente quando há problemas de conexão
- ✅ Não afeta o rate limit (endpoint excluído)
- ✅ Demonstra uso de BehaviorSubject para estado reativo
- ✅ Retry automático com feedback visual

**Alternativas Consideradas**:
| Abordagem | Prós | Contras |
|-----------|------|---------|
| Polling periódico (escolhida) | Detecção proativa, UX clara | Overhead constante |
| Health check passivo (interceptor) | Zero overhead | Só detecta após falha real |
| Sem health check | Simplicidade | Não atende requisito Sênior |

## Trade-offs e Priorizacoes

1. **Simplicidade vs Features**: Priorizei uma implementacao limpa e funcional das features obrigatorias sobre adicionar funcionalidades extras.

2. **Testes**: Foquei em testes unitarios para os servicos mais criticos (JWT, CRUD). Em um cenario real, adicionaria testes de integracao e E2E.

3. **Seguranca**: CORS foi configurado de forma restritiva. Em producao, seria necessario ajustar para dominios especificos.

4. **Performance**: Nao implementei cache (Redis) por nao ser requisito. Para escala, seria uma adicao importante.

## Dados de Exemplo

O sistema ja vem com dados iniciais (via Flyway migration):

**Artistas**:
- Serj Tankian (Solo) - Armenia
- Mike Shinoda (Solo) - EUA
- Michel Telo (Solo) - Brasil
- Guns N' Roses (Banda) - EUA

**Albums**:
- Harakiri, Black Blooms, The Rough Dog (Serj Tankian)
- The Rising Tied, Post Traumatic (Mike Shinoda)
- Bem Sertanejo (Michel Telo)
- Use Your Illusion I/II, Greatest Hits (Guns N' Roses)

## Comandos Uteis

```bash
# Iniciar todos os servicos
docker-compose up -d

# Verificar status dos containers
docker-compose ps

# Ver logs de um servico especifico
docker-compose logs -f backend

# Parar todos os servicos
docker-compose down

# Reconstruir e iniciar
docker-compose up -d --build

# Limpar volumes (cuidado: apaga dados)
docker-compose down -v
```

## Autor

Luis Felipe Amorim Sant'Ana

Projeto desenvolvido para o **Processo Seletivo Simplificado n 001/2026/SEPLAG** - Estado de Mato Grosso.
