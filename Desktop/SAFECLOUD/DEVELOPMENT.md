# Development Environment Setup

## Prerequisites

- Docker Desktop (https://www.docker.com/products/docker-desktop)
- Git (https://git-scm.com/download)
- VS Code (recommended)
- Postman (for API testing, optional)

## First Time Setup

1. **Clone or extract the project**
```bash
cd SAFECLOUD
```

2. **Create environment files**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Build and start services**
```bash
docker-compose up -d
```

4. **Wait for services to be healthy** (2-3 minutes)
```bash
docker-compose ps
```

5. **Create database tables**
```bash
docker-compose exec backend python manage.py migrate
```

6. **Create superuser account**
```bash
docker-compose exec backend python manage.py createsuperuser
```

7. **Open in browser**
- Frontend: http://localhost:3000
- Backend Admin: http://localhost:8000/admin
- API Docs: http://localhost:8000/api/docs/

## Common Commands

### Start Development
```bash
docker-compose up -d
```

### Stop Development
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access Database
```bash
docker-compose exec db psql -U postgres -d safecloud_db
```

### Create Django Admin User
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Run Django Migrations
```bash
docker-compose exec backend python manage.py migrate
```

### Create Django App
```bash
docker-compose exec backend python manage.py startapp app_name
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

### Access Backend Shell
```bash
docker-compose exec backend python manage.py shell
```

### npm Package Installation (Frontend)
```bash
docker-compose exec frontend npm install package-name
```

## Project Structure Overview

```
backend/
├── safecloud_api/           # Main Django project
│   ├── apps/               # Django apps
│   │   ├── auth/          # Authentication
│   │   ├── companies/     # Company & User management
│   │   ├── projects/      # Projects & Tasks
│   │   ├── tickets/       # Tickets system
│   │   ├── documents/     # Document management
│   │   └── audit/         # Audit logging
│   ├── core/              # Shared utilities
│   ├── settings.py        # Django settings
│   └── urls.py            # URL configuration
├── manage.py              # Django CLI
└── requirements.txt       # Python dependencies

frontend/
├── pages/                 # Next.js pages/routes
├── components/            # React components
├── lib/                   # Utilities & API client
├── stores/                # Zustand state
├── styles/                # CSS & Tailwind
└── package.json          # Node dependencies
```

## Debugging

### Backend Python Debugging
1. Add `import pdb; pdb.set_trace()` in code
2. Access container: `docker-compose exec backend bash`
3. Commands work in the pdb console

### Frontend JavaScript Debugging
1. Open DevTools in browser (F12)
2. Check Network tab for API calls
3. Check Console for errors

### Database Debugging
```bash
docker-compose exec db psql -U postgres -d safecloud_db
\dt                    # List tables
SELECT * FROM users;   # View users
```

## Performance Tips

1. **Backend**
   - Use Django Debug Toolbar (development only)
   - Monitor database queries
   - Use caching for frequently accessed data

2. **Frontend**
   - Use Next.js image optimization
   - Implement lazy loading
   - Monitor bundle size

## Security Notes

⚠️ **Development Only**
- Default credentials used
- CORS allows localhost
- Debug mode enabled
- No HTTPS

**For Production**
- Change all secrets in .env
- Disable DEBUG mode
- Use strong passwords
- Enable HTTPS
- Configure proper CORS origins
- Use environment-specific configs

## Useful Resources

- Django Docs: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Docker Docs: https://docs.docker.com/

## Troubleshooting

### Services won't start
```bash
docker-compose down -v
docker system prune
docker-compose up -d
```

### Port conflicts
```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Database errors
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py flush
```

### Frontend not updating
```bash
docker-compose restart frontend
```

### API timeouts
Check backend logs: `docker-compose logs backend`

## Support

Create an issue or contact the development team.
