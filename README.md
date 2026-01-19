# Sistema de Gerenciamento de Artistas e Álbuns

Projeto Full Stack desenvolvido como parte do Processo Seletivo Simplificado nº 001/2026/SEPLAG para o cargo de **Analista de Tecnologia da Informação - Perfil Engenheiro da Computação (Sênior)**.

## Dados do Candidato

- **Nome**: [NOME COMPLETO DO CANDIDATO]
- **Vaga**: Analista de TI - Engenheiro da Computação (Sênior)
- **Projeto**: Full Stack (Java + Angular)

## Tecnologias Utilizadas

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL 15
- Flyway (migrations)
- MinIO (armazenamento S3)
- WebSocket (STOMP)
- SpringDoc OpenAPI (Swagger)

### Frontend
- Angular 17+
- Angular Material
- TypeScript
- RxJS (BehaviorSubject)

### Infraestrutura
- Docker & Docker Compose
- Nginx (servidor web frontend)

## Estrutura do Projeto

```
.
├── docker-compose.yml    # Orquestração dos containers
├── backend/              # API REST (Spring Boot)
└── frontend/             # SPA (Angular)
```

## Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Git

### Passo a Passo

1. Clone o repositório:
```bash
git clone https://github.com/[seu-usuario]/[nome-do-repositorio].git
cd [nome-do-repositorio]
```

2. Suba os containers:
```bash
docker-compose up -d
```

3. Aguarde todos os serviços iniciarem e acesse:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **MinIO Console**: http://localhost:9001 (usuário: minioadmin, senha: minioadmin)

### Credenciais de Acesso

**Banco de Dados (PostgreSQL)**:
- Host: localhost:5432
- Database: pss_fullstack
- Usuário: pss_user
- Senha: pss_password

**MinIO**:
- Endpoint: localhost:9000
- Console: localhost:9001
- Access Key: minioadmin
- Secret Key: minioadmin

## Funcionalidades Implementadas

### Backend (API REST)
- [ ] CRUD de Artistas (POST, PUT, GET)
- [ ] CRUD de Álbuns com paginação
- [ ] Autenticação JWT (expiração 5 min + refresh)
- [ ] Upload de capas de álbuns (MinIO)
- [ ] Presigned URLs (expiração 30 min)
- [ ] Filtros e ordenação por nome
- [ ] Consultas parametrizadas (banda/cantor)
- [ ] WebSocket para notificações
- [ ] Rate Limiting (10 req/min por usuário)
- [ ] Health Checks (liveness/readiness)
- [ ] Sincronização de regionais
- [ ] Documentação Swagger/OpenAPI

### Frontend (SPA Angular)
- [ ] Listagem de artistas (cards/tabela)
- [ ] Busca e ordenação
- [ ] Detalhamento de artista com álbuns
- [ ] Cadastro/edição de artistas
- [ ] Cadastro/edição de álbuns com upload
- [ ] Autenticação (login/refresh)
- [ ] Notificações em tempo real
- [ ] Layout responsivo

## Testes

### Backend
```bash
cd backend
./mvnw test
```

### Frontend
```bash
cd frontend
npm test
```

## Decisões de Arquitetura

[Seção a ser preenchida com as decisões técnicas e trade-offs]

## Autor

Desenvolvido para o Processo Seletivo Simplificado nº 001/2026/SEPLAG - Estado de Mato Grosso.
