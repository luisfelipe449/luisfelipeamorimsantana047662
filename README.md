# Sistema de Gerenciamento de Artistas e Albums

Projeto Full Stack desenvolvido como parte do **Processo Seletivo Simplificado n 001/2026/SEPLAG** para o cargo de **Analista de Tecnologia da Informacao - Perfil Engenheiro da Computacao (Senior)**.

## Dados do Candidato

- **Nome**: [NOME COMPLETO DO CANDIDATO]
- **Vaga**: Analista de TI - Engenheiro da Computacao (Senior)
- **Projeto**: Full Stack (Java + Angular)
- **Pontuacao Maxima**: 60 pontos

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
git clone [URL_DO_REPOSITORIO]
cd pss-fullstack-mt
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
- [x] Health Checks (liveness e readiness)
- [x] WebSocket para notificacoes de novos albums
- [x] Rate limiting com Bucket4j
- [x] Sincronizacao com endpoint de regionais
- [x] Testes unitarios

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
- [x] Angular Material
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

Projeto desenvolvido para o **Processo Seletivo Simplificado n 001/2026/SEPLAG** - Estado de Mato Grosso.

---

*Este README foi criado seguindo as diretrizes do edital para documentacao tecnica do projeto.*
