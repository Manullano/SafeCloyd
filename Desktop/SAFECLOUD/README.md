# SAFE Cloud - Full Stack Application

A comprehensive SaaS platform for project management, documentation, and security.

## Project Structure

```
SAFECLOUD/
├── backend/              # Django REST API
├── frontend/            # Next.js SPA
├── database/            # PostgreSQL scripts
├── docker-compose.yml   # Docker orchestration
└── README.md           # This file
```

## Tech Stack

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL 15
- **Authentication**: JWT (Simple JWT)
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14
- **UI**: React 18 + TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Quick Start with Docker

1. Clone the repository
```bash
cd SAFECLOUD
```

2. Create environment files
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start the application
```bash
docker-compose up -d
```

4. Create superuser (in backend container)
```bash
docker-compose exec backend python manage.py createsuperuser
```

5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/api/docs/

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Register

### Companies
- `GET /api/companies/companies/` - List companies
- `POST /api/companies/companies/` - Create company
- `GET /api/companies/companies/{id}/` - Get company details
- `PUT /api/companies/companies/{id}/` - Update company
- `POST /api/companies/companies/{id}/activate/` - Activate company
- `POST /api/companies/companies/{id}/deactivate/` - Deactivate company

### Projects
- `GET /api/projects/projects/` - List projects
- `POST /api/projects/projects/` - Create project
- `GET /api/projects/projects/{id}/` - Get project details
- `PUT /api/projects/projects/{id}/` - Update project
- `POST /api/projects/projects/{id}/change_status/` - Change project status

### Tickets
- `GET /api/tickets/tickets/` - List tickets
- `POST /api/tickets/tickets/` - Create ticket
- `GET /api/tickets/tickets/{id}/` - Get ticket details
- `PUT /api/tickets/tickets/{id}/` - Update ticket
- `POST /api/tickets/tickets/{id}/change_status/` - Change ticket status
- `POST /api/tickets/tickets/{id}/assign/` - Assign ticket
- `POST /api/tickets/tickets/{id}/add_comment/` - Add comment

### Documents
- `GET /api/documents/documents/` - List documents
- `POST /api/documents/documents/` - Upload document
- `GET /api/documents/documents/{id}/` - Get document details
- `POST /api/documents/documents/{id}/upload_version/` - Upload new version
- `DELETE /api/documents/documents/{id}/soft_delete/` - Delete document

### Audit
- `GET /api/audit/events/` - List audit events

## User Roles

1. **SUPERADMIN** - Platform administrator
   - Manage all companies and users
   - System configuration

2. **STAFF_PM** - Project Manager
   - Manage assigned company projects
   - Create and assign tasks

3. **STAFF_SUPPORT** - Support Staff
   - Handle customer support tickets
   - Limited company access

4. **CLIENT_ADMIN** - Company Administrator
   - Manage company users and projects
   - Access company resources

5. **CLIENT_USER** - Regular User
   - Access assigned projects
   - Create tickets
   - Upload documents

## Database Schema

See [database/init.sql](database/init.sql) for the complete schema.

### Main Tables
- `plans` - Service plans (Basic, Pro, Corporate, Enterprise)
- `companies` - Customer organizations
- `users` - System users
- `projects` - Projects created by companies
- `tasks` - Tasks within projects (Kanban board)
- `tickets` - Support tickets
- `documents` - File storage and versioning
- `audit_events` - System audit log

## Configuration

### Environment Variables

#### Backend (.env)
- `DEBUG` - Django debug mode
- `DJANGO_SECRET_KEY` - Django secret key
- `DB_*` - Database credentials
- `CORS_ALLOWED_ORIGINS` - CORS allowed origins
- `AWS_*` - AWS S3 configuration

#### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Development

### Running Tests
```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run test
```

### Code Quality
```bash
# Backend
cd backend
python -m flake8
python -m black .

# Frontend
cd frontend
npm run lint
```

## Deployment

### Docker Production Build
```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml push
```

### Environment Setup
Update `.env` files with production values:
- Secure `DJANGO_SECRET_KEY`
- Update `ALLOWED_HOSTS`
- Configure database credentials
- Set `DEBUG=False`
- Configure email backend
- Configure AWS S3 bucket

## Monitoring & Logs

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access database
docker-compose exec db psql -U postgres -d safecloud_db
```

## Troubleshooting

### Database Connection Issues
```bash
docker-compose down -v
docker-compose up db
```

### Port Already in Use
```bash
lsof -i :8000  # Check port 8000
lsof -i :3000  # Check port 3000
```

### Clear Cache
```bash
docker-compose down
docker system prune -a
docker-compose up -d
```

## Security Considerations

1. Change all default secrets and keys
2. Use HTTPS in production
3. Implement rate limiting
4. Regular security audits
5. Keep dependencies updated
6. Use strong database passwords
7. Enable 2FA for admin users
8. Regular backups

## Support

For issues and questions, please create a GitHub issue or contact support@safecloud.local

## License

Proprietary - SAFE Technologies

## Changelog

### Version 1.0.0
- Initial release
- Core features: Companies, Users, Projects, Documents, Tickets
- JWT authentication
- Role-based access control
- Audit logging
