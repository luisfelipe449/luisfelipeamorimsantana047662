#!/bin/bash

echo "🛑 Stopping Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Stop Docker Compose services
echo -e "${RED}📦 Stopping PostgreSQL and MinIO...${NC}"
docker-compose -f docker-compose.dev.yml down

echo ""
echo -e "${GREEN}✅ Development environment stopped${NC}"
echo ""
echo "Note: Backend and Frontend processes should be stopped manually (Ctrl+C)"