# Frontend configuration

module.exports = {
  // API client
  apiClient: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    timeout: 30000,
  },

  // App metadata
  app: {
    name: 'SAFE Cloud',
    version: '1.0.0',
    description: 'Plataforma centralizada para gestión de proyectos y documentación',
  },

  // Features
  features: {
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableErrorReporting: true,
  },

  // Endpoints
  endpoints: {
    auth: {
      login: '/auth/login/',
      register: '/auth/register/',
      token: '/auth/token/',
      refresh: '/auth/token/refresh/',
    },
    companies: {
      list: '/companies/companies/',
      create: '/companies/companies/',
      detail: (id) => `/companies/companies/${id}/`,
    },
    projects: {
      list: '/projects/projects/',
      create: '/projects/projects/',
      detail: (id) => `/projects/projects/${id}/`,
    },
    documents: {
      list: '/documents/documents/',
      create: '/documents/documents/',
      detail: (id) => `/documents/documents/${id}/`,
    },
    tickets: {
      list: '/tickets/tickets/',
      create: '/tickets/tickets/',
      detail: (id) => `/tickets/tickets/${id}/`,
    },
  },
};
