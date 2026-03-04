#!/bin/bash

# SAFE Cloud Deployment Script

set -e

echo "========================================="
echo "SAFE Cloud - Deployment Script"
echo "========================================="

# Check if environment
if [ -z "$ENVIRONMENT" ]; then
    ENVIRONMENT="development"
fi

echo "Environment: $ENVIRONMENT"

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Backend deployment
echo "Deploying Backend..."
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser --noinput --username admin --email admin@safecloud.local || true
cd ..

# Frontend deployment
echo "Deploying Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
