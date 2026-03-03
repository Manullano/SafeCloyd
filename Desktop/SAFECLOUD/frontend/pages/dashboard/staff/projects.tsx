import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';
import { Icons } from '@/lib/icons';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  company_id: string;
  company_name?: string;
  start_date: string;
  end_date?: string;
  progress: number;
  tasks_count: number;
  team_members: number;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  project_id: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string;
  assigned_to?: string;
}

interface Ticket {
  id: string;
  title: string;
  project_id: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  project_id: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

const StaffProjectsDashboard = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { canCreate, canEdit, canDelete } = useCanAccess();

  // State Management
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'tickets' | 'documents'>('projects');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [taskFilter, setTaskFilter] = useState<string>('ALL');
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');

  // Form Data
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    company_id: '',
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    project_id: '',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: '',
  });

  // Auth Check
  useEffect(() => {
    if (authLoading || !user) return;
    
    // Check if user is STAFF_PM
    if (user.role !== 'STAFF_PM') {
      router.push('/dashboard');
      return;
    }
    
    fetchAllData();
  }, [user, authLoading, router]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // Fetch projects
      const projectsRes = await fetch(`${apiUrl}/projects/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch tasks
      const tasksRes = await fetch(`${apiUrl}/tasks/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch tickets
      const ticketsRes = await fetch(`${apiUrl}/tickets/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch documents
      const docsRes = await fetch(`${apiUrl}/documents/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.results || (Array.isArray(data) ? data : []));
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.results || (Array.isArray(data) ? data : []));
      }

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.results || (Array.isArray(data) ? data : []));
      }

      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.results || (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Project Management
  const handleSaveProject = async () => {
    if (!projectFormData.name.trim()) {
      setError('El nombre del proyecto es requerido');
      return;
    }

    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${apiUrl}/projects/${editingId}/`
        : `${apiUrl}/projects/`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectFormData),
      });

      if (response.ok) {
        setSuccess(editingId ? 'Proyecto actualizado' : 'Proyecto creado');
        setProjectFormData({
          name: '',
          description: '',
          company_id: '',
          start_date: '',
          end_date: '',
          status: 'ACTIVE',
        });
        setShowProjectForm(false);
        setEditingId(null);
        setTimeout(() => {
          setSuccess(null);
          fetchAllData();
        }, 1500);
      } else {
        const err = await response.json();
        setError(err.detail || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Error de conexión');
    }
  };

  const handleEditProject = (project: Project) => {
    setProjectFormData({
      name: project.name,
      description: project.description,
      company_id: project.company_id,
      start_date: project.start_date,
      end_date: project.end_date || '',
      status: project.status,
    });
    setEditingId(project.id);
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('¿Confirmar eliminación del proyecto?')) return;
    
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (response.ok) {
        setSuccess('Proyecto eliminado');
        setTimeout(() => {
          setSuccess(null);
          fetchAllData();
        }, 1500);
      } else {
        setError('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Error de conexión');
    }
  };

  // Task Management
  const handleSaveTask = async () => {
    if (!taskFormData.title.trim() || !taskFormData.project_id) {
      setError('Título del proyecto son requeridos');
      return;
    }

    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tasks/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskFormData),
      });

      if (response.ok) {
        setSuccess('Tarea creada');
        setTaskFormData({
          title: '',
          project_id: '',
          status: 'TODO',
          priority: 'MEDIUM',
          due_date: '',
        });
        setShowTaskForm(false);
        setTimeout(() => {
          setSuccess(null);
          fetchAllData();
        }, 1500);
      } else {
        const err = await response.json();
        setError(err.detail || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Error de conexión');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess('Tarea actualizada');
        setTimeout(() => {
          setSuccess(null);
          fetchAllData();
        }, 1500);
      } else {
        setError('Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Error de conexión');
    }
  };

  // KPI Calculations
  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'DONE').length;
  const openTicketsCount = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
  const avgProjectProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) 
    : 0;

  // Filter data
  const filteredProjects = projectFilter === 'ALL' 
    ? projects 
    : projects.filter(p => p.status === projectFilter);

  const filteredTasks = taskFilter === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === taskFilter);

  const filteredTickets = ticketFilter === 'ALL'
    ? tickets
    : tickets.filter(t => t.status === ticketFilter);

  const recentDocuments = documents.sort((a, b) => 
    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  ).slice(0, 5);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Proyectos</h1>
            <p className="text-gray-600 mt-1">Gestiona todos tus proyectos, tareas y recursos</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Proyectos Activos</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{activeProjectsCount}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tareas Pendientes</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{pendingTasksCount}</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tickets Abiertos</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{openTicketsCount}</p>
              </div>
              <div className="text-4xl">🎫</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Progreso Promedio</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{avgProjectProgress}%</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Proyectos
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ✓ Tareas
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🎫 Tickets
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 Documentos
            </button>
          </div>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="COMPLETED">Completados</option>
                  <option value="ON_HOLD">Pausados</option>
                </select>
              </div>
              {canCreate('PROJECTS') && (
                <Button onClick={() => setShowProjectForm(true)} variant="primary">
                  + Nuevo Proyecto
                </Button>
              )}
            </div>

            {/* Project Form Modal */}
            {showProjectForm && (
              <Card className="p-6 bg-blue-50 border-2 border-blue-200">
                <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar' : 'Crear'} Proyecto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del proyecto"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="date"
                    value={projectFormData.start_date}
                    onChange={(e) => setProjectFormData({...projectFormData, start_date: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    placeholder="Descripción"
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({...projectFormData, status: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="ON_HOLD">Pausado</option>
                    <option value="COMPLETED">Completado</option>
                  </select>
                  <input
                    type="date"
                    value={projectFormData.end_date}
                    onChange={(e) => setProjectFormData({...projectFormData, end_date: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveProject} variant="primary">Guardar</Button>
                  <Button onClick={() => {
                    setShowProjectForm(false);
                    setEditingId(null);
                    setProjectFormData({
                      name: '',
                      description: '',
                      company_id: '',
                      start_date: '',
                      end_date: '',
                      status: 'ACTIVE',
                    });
                  }} variant="secondary">Cancelar</Button>
                </div>
              </Card>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg">{project.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{project.company_name}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-semibold">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{width: `${project.progress}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">Tareas</p>
                        <p className="text-lg font-bold">{project.tasks_count}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">Equipo</p>
                        <p className="text-lg font-bold">{project.team_members}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canEdit('PROJECTS') && (
                        <Button 
                          onClick={() => handleEditProject(project)} 
                          variant="secondary"
                          className="flex-1"
                        >
                          ✏️ Editar
                        </Button>
                      )}
                      {canDelete('PROJECTS') && (
                        <Button 
                          onClick={() => handleDeleteProject(project.id)} 
                          variant="secondary"
                          className="flex-1"
                        >
                          🗑️ Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <Card className="text-center py-8 text-gray-500">
                No hay proyectos disponibles
              </Card>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos</option>
                  <option value="TODO">Por hacer</option>
                  <option value="IN_PROGRESS">En progreso</option>
                  <option value="REVIEW">Revisión</option>
                  <option value="DONE">Completado</option>
                </select>
              </div>
              {canCreate('TASKS') && (
                <Button onClick={() => setShowTaskForm(true)} variant="primary">
                  + Nueva Tarea
                </Button>
              )}
            </div>

            {/* Task Form Modal */}
            {showTaskForm && (
              <Card className="p-6 bg-purple-50 border-2 border-purple-200">
                <h3 className="text-lg font-bold mb-4">Crear Tarea</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Título de la tarea"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={taskFormData.project_id}
                    onChange={(e) => setTaskFormData({...taskFormData, project_id: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecciona proyecto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                  <input
                    type="date"
                    value={taskFormData.due_date}
                    onChange={(e) => setTaskFormData({...taskFormData, due_date: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveTask} variant="primary">Guardar</Button>
                  <Button onClick={() => {
                    setShowTaskForm(false);
                    setTaskFormData({
                      title: '',
                      project_id: '',
                      status: 'TODO',
                      priority: 'MEDIUM',
                      due_date: '',
                    });
                  }} variant="secondary">Cancelar</Button>
                </div>
              </Card>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      <p className="text-sm text-gray-600">Proyecto: {projects.find(p => p.id === task.project_id)?.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        className={`px-3 py-1 rounded text-xs font-semibold border-0 ${
                          task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'REVIEW' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="TODO">Por hacer</option>
                        <option value="IN_PROGRESS">En progreso</option>
                        <option value="REVIEW">Revisión</option>
                        <option value="DONE">Completado</option>
                      </select>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <Card className="text-center py-8 text-gray-500">
                No hay tareas disponibles
              </Card>
            )}
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={ticketFilter}
                onChange={(e) => setTicketFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos</option>
                <option value="OPEN">Abiertos</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="RESOLVED">Resueltos</option>
                <option value="CLOSED">Cerrados</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{ticket.title}</h4>
                      <p className="text-sm text-gray-600">Creado: {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                        ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        ticket.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTickets.length === 0 && (
              <Card className="text-center py-8 text-gray-500">
                No hay tickets disponibles
              </Card>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Últimos documentos del proyecto
            </div>

            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">📄</span>
                      <div>
                        <h4 className="font-semibold">{doc.name}</h4>
                        <p className="text-sm text-gray-600">
                          {doc.uploaded_by} • {(doc.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {recentDocuments.length === 0 && (
              <Card className="text-center py-8 text-gray-500">
                No hay documentos disponibles
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffProjectsDashboard;
