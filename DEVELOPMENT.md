# Guia de Desenvolvimento Local

Este guia explica como rodar o projeto em modo de desenvolvimento local com hot reload.

## Pré-requisitos

- Java 17+
- Node.js 18+
- Docker e Docker Compose
- Maven (ou use o wrapper `./mvnw`)

## Início Rápido

### 1. Iniciar as dependências (PostgreSQL e MinIO)

```bash
./start-dev.sh
```

Este comando irá:
- Iniciar PostgreSQL na porta 5432
- Iniciar MinIO nas portas 9000 (API) e 9001 (Console)
- Criar os buckets necessários
- Aguardar até que todos os serviços estejam prontos

### 2. Iniciar o Backend (Spring Boot)

Em um novo terminal:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

O backend estará disponível em: http://localhost:8080

**Features do modo desenvolvimento:**
- Hot reload automático com Spring DevTools
- SQL logging habilitado
- Debug logging mais verboso
- Swagger UI em: http://localhost:8080/api/swagger-ui.html

### 3. Iniciar o Frontend (Angular)

Em outro terminal:

```bash
cd frontend
npm install  # primeira vez apenas
npm start
```

O frontend estará disponível em: http://localhost:4200

**Features do modo desenvolvimento:**
- Hot reload automático
- Source maps para debug
- Proxy configurado para o backend local
- Auto-refresh no browser

## URLs e Credenciais

### Serviços
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **MinIO Console**: http://localhost:9001

### Credenciais
- **PostgreSQL**:
  - Host: localhost:5432
  - Database: pss_fullstack
  - User: pss_user
  - Password: pss_password

- **MinIO**:
  - User: minioadmin
  - Password: minioadmin

- **Aplicação (login padrão)**:
  - Email: admin@pss.mt.gov.br
  - Senha: Admin123!

## Comandos Úteis

### Backend

```bash
# Rodar testes
cd backend
./mvnw test

# Rodar apenas um teste específico
./mvnw test -Dtest=NomeDoTeste

# Build sem testes
./mvnw clean package -DskipTests

# Limpar e compilar
./mvnw clean compile
```

### Frontend

```bash
# Rodar testes
cd frontend
npm test

# Rodar testes com coverage
npm run test:coverage

# Build de produção
npm run build:prod

# Lint
ng lint
```

### Docker

```bash
# Ver logs das dependências
docker-compose -f docker-compose.dev.yml logs -f

# Reiniciar apenas uma dependência
docker-compose -f docker-compose.dev.yml restart postgres
docker-compose -f docker-compose.dev.yml restart minio

# Limpar volumes (CUIDADO: apaga todos os dados)
docker-compose -f docker-compose.dev.yml down -v
```

## Parar o Ambiente

Para parar as dependências:

```bash
./stop-dev.sh
```

Para parar backend e frontend: Use `Ctrl+C` nos terminais respectivos.

## Troubleshooting

### Backend não conecta no PostgreSQL

Verifique se o PostgreSQL está rodando:
```bash
docker ps | grep postgres
```

### Frontend não conecta no backend

Verifique se o proxy está configurado corretamente em `frontend/proxy.conf.json`.

### MinIO não está acessível

Verifique se as portas 9000 e 9001 estão livres:
```bash
lsof -i :9000
lsof -i :9001
```

### Hot reload não funciona

**Backend**: Certifique-se de estar usando o profile `dev`:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**Frontend**: Certifique-se de estar usando `npm start` e não `ng serve` diretamente.

## Desenvolvimento com IDEs

### IntelliJ IDEA / Eclipse

1. Importe o projeto backend como Maven project
2. Configure o profile de execução como `dev`
3. Enable automatic build/hot swap

### VS Code

1. Instale as extensões:
   - Spring Boot Extension Pack
   - Angular Language Service
2. Use os comandos de terminal descritos acima

## Notas Importantes

- O modo de desenvolvimento usa volumes Docker separados (`*_dev`) para não conflitar com o ambiente de produção
- Os logs são mais verbosos em desenvolvimento
- O hot reload funciona tanto para código Java quanto TypeScript/Angular
- Alterações em arquivos estáticos (HTML, CSS) são refletidas imediatamente
- Alterações em classes Java podem requerer restart automático (Spring DevTools)