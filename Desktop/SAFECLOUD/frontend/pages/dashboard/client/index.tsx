import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/router';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'CLOSED';
  start_date: string;
  end_date: string;
  owner_user?: {
    id: string;
    full_name: string;
  };
  created_by?: {
    id: string;
    full_name: string;
  };
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  category: string;
  visibility: string;
  created_by?: {
    id: string;
    full_name: string;
  };
  created_at: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to?: string;
  assigned_user?: {
    id: string;
    full_name: string;
  };
  created_at: string;
}

const ClientUserDashboard = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'documents' | 'tickets'>('projects');
  
  // Stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalDocuments: 0,
    openTickets: 0,
    assignedToMe: 0,
  });

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    
    // Only CLIENT users should access this
    if (!user.role || !user.role.startsWith('CLIENT_')) {
      router.push('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, authLoading, access_token, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // Fetch all data in parallel
      const [projectsRes, docsRes, ticketsRes] = await Promise.all([
        fetch(`${apiUrl}/projects/projects/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiUrl}/documents/documents/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiUrl}/tickets/tickets/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        const projectList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setProjects(projectList);
      }

      if (docsRes.ok) {
        const data = await docsRes.json();
        const docList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setDocuments(docList);
      }

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        const ticketList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setTickets(ticketList);
      }

      // Calculate stats
      const activeProj = projects?.filter(p => p.status !== 'CLOSED').length || 0;
      const openTix = tickets?.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length || 0;
      const assignedTix = tickets?.filter(t => t.assigned_to === user?.id).length || 0;

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects: activeProj,
        totalDocuments: documents?.length || 0,
        openTickets: openTix,
        assignedToMe: assignedTix,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: {[key: string]: string} = {
      'PLANNING': '📋 Planeación',
      'IN_PROGRESS': '🟡 En Progreso',
      'BLOCKED': '🔴 Bloqueado',
      'IN_REVIEW': '👀 En Revisión',
      'CLOSED': '✅ Cerrado',
      'OPEN': '🔴 Abierto',
      'WAITING_CUSTOMER': '⏳ Esperando Cliente',
      'RESOLVED': '✅ Resuelto',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
      case 'TODO':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
      case 'DOING':
        return 'bg-yellow-100 text-yellow-800';
      case 'BLOCKED':
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_REVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'CLOSED':
      case 'DONE':
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tu panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">👋 Bienvenido, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-2">Panel de control de proyectos, documentos y tickets.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-2">Mis Proyectos</p>
            <p className="text-3xl font-bold text-blue-700">{stats.totalProjects}</p>
            <p className="text-xs text-blue-500 mt-1">{stats.activeProjects} activos</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div>
            <p className="text-sm font-medium text-green-600 mb-2">Documentos</p>
            <p className="text-3xl font-bold text-green-700">{stats.totalDocuments}</p>
            <p className="text-xs text-green-500 mt-1">en empresa</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <div>
            <p className="text-sm font-medium text-orange-600 mb-2">Tickets Abiertos</p>
            <p className="text-3xl font-bold text-orange-700">{stats.openTickets}</p>
            <p className="text-xs text-orange-500 mt-1">por resolver</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <div>
            <p className="text-sm font-medium text-purple-600 mb-2">Asignados a Mí</p>
            <p className="text-3xl font-bold text-purple-700">{stats.assignedToMe}</p>
            <p className="text-xs text-purple-500 mt-1">requieren mi atención</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-white">
          <div>
            <p className="text-sm font-medium text-pink-600 mb-2">Tu Perfil</p>
            <p className="text-lg font-bold text-pink-700 truncate">{user?.full_name || 'Usuario'}</p>
            <p className="text-xs text-pink-500 mt-1">{user?.role || 'Sin rol'}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'projects'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📁 Mis Proyectos ({stats.totalProjects})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'documents'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📄 Documentos ({stats.totalDocuments})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎫 Mis Tickets ({stats.openTickets})
        </button>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <Card>
          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-4 ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div className="flex gap-4">
                      {project.start_date && (
                        <span>📅 Inicio: {new Date(project.start_date).toLocaleDateString()}</span>
                      )}
                      {project.end_date && (
                        <span>⏰ Fin: {new Date(project.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {project.owner_user && (
                      <span>👤 {project.owner_user.full_name}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">📭 No tienes proyectos asignados aún</p>
                <p className="text-gray-400 text-sm mt-2">Contacta a tu administrador para que te agregue a un proyecto.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <div className="space-y-3">
            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Documento</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Categoría</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Creador</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.title}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {doc.created_by?.full_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="primary"
                            className="text-xs py-1 px-2"
                            onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                          >
                            📥 Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">📭 No hay documentos disponibles</p>
                <p className="text-gray-400 text-sm mt-2">Los documentos de tu empresa aparecerán aquí.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <Card>
          <div className="space-y-3">
            {tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Ticket</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Prioridad</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Asignado a</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Creado</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{ticket.title}</span>
                            <span className="text-xs text-gray-500">ID: {ticket.id.substring(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {ticket.assigned_user?.full_name || 'Sin asignar'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="primary"
                            className="text-xs py-1 px-2"
                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                          >
                            📋 Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">📭 No tienes tickets</p>
                <p className="text-gray-400 text-sm mt-2">Tus tickets de soporte aparecerán aquí.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Footer Help */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 ¿Necesitas ayuda?</h3>
        <p className="text-sm text-blue-800">
          Si tienes dudas sobre tus proyectos, documentos o tickets, contacta a tu equipo de soporte.
        </p>
        <Button variant="primary" className="mt-4">
          📧 Crear Ticket de Soporte
        </Button>
      </div>
    </Layout>
  );
};

export default ClientUserDashboard;
