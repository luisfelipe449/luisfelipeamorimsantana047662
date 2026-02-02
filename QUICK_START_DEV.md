# Guia Rápido - Desenvolvimento Local

## 1. Iniciar Dependências (PostgreSQL + MinIO)

```bash
./start-dev.sh
```

## 2. Backend com Hot Reload

```bash
cd backend

# Se Java 17 estiver configurado no PATH:
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Se precisar especificar o JAVA_HOME:
JAVA_HOME=/caminho/para/java17 ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Backend disponível em: http://localhost:8080

## 3. Frontend com Hot Reload

```bash
cd frontend
npm install  # primeira vez
npm start
```

Frontend disponível em: http://localhost:4200

## URLs Úteis

- **Backend API**: http://localhost:8080/api
- **Swagger**: http://localhost:8080/api/swagger-ui.html
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Parar Tudo

- Backend/Frontend: `Ctrl+C` nos terminais
- Dependências: `./stop-dev.sh`