#!/bin/bash

echo "🚀 Starting Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start dependencies with Docker Compose
echo -e "${BLUE}📦 Starting PostgreSQL and MinIO...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if PostgreSQL is ready
until docker exec pss-postgres-dev pg_isready -U pss_user -d pss_fullstack > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Check if MinIO is ready
until curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo "Waiting for MinIO..."
    sleep 2
done
echo -e "${GREEN}✅ MinIO is ready${NC}"

echo ""
echo -e "${GREEN}🎉 Dependencies are ready!${NC}"
echo ""
echo "Now you can start:"
echo ""
echo -e "${BLUE}Backend (with hot reload):${NC}"
echo "  cd backend"
echo "  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev"
echo ""
echo -e "${BLUE}Frontend (with hot reload):${NC}"
echo "  cd frontend"
echo "  npm start"
echo ""
echo -e "${YELLOW}Services available at:${NC}"
echo "  • Backend API: http://localhost:8080"
echo "  • Frontend: http://localhost:4200"
echo "  • MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo "  • PostgreSQL: localhost:5432 (pss_user/pss_password)"
echo ""
echo -e "${YELLOW}To stop dependencies:${NC}"
echo "  docker-compose -f docker-compose.dev.yml down"