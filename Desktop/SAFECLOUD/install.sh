#!/bin/bash

# SAFE Cloud Installation Script

echo "========================================="
echo "SAFE Cloud - Installation Script"
echo "========================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Docker Compose found: $(docker-compose --version)"

# Create environment files
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    echo "✅ backend/.env created"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend/.env.local..."
    cp frontend/.env.example frontend/.env.local
    echo "✅ frontend/.env.local created"
fi

# Start services
echo ""
echo "Starting services..."
docker-compose up -d

# Wait for services
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Run migrations
echo ""
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Create superuser
echo ""
echo "Creating superuser..."
docker-compose exec -T backend python manage.py createsuperuser --noinput \
    --username admin \
    --email admin@safecloud.local || true

echo ""
echo "========================================="
echo "✅ Installation completed!"
echo "========================================="
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000/api"
echo "  Admin:    http://localhost:8000/admin"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Email:    admin@safecloud.local"
echo ""
