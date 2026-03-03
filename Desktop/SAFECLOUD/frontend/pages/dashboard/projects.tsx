import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

const ProjectsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canCreate, canEdit, canDelete } = useCanAccess();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    if (authLoading || !user) return;
    fetchProjects();
  }, [user, authLoading]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { access_token } = useAuth.getState();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.title.trim()) return;

    try {
      const { access_token } = useAuth.getState();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          name: formData.title,
          description: formData.description,
          status: 'ACTIVE',
        }),
      });

      if (response.ok) {
        setFormData({ title: '', description: '' });
        setShowForm(false);
        fetchProjects();
      } else {
        const error = await response.json();
        console.error('Error creating project:', error);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Proyectos</h1>
            <p className="text-gray-500 mt-2">Gestiona tus proyectos y asignaciones.</p>
          </div>
          {canCreate('PROJECTS') && (
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              + Nuevo Proyecto
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Crear Nuevo Proyecto</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del proyecto"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <textarea
              placeholder="Descripción"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreateProject}>
                Crear
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', description: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Projects List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((project: any) => (
            <Card key={project.id} hoverable>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                  <div className="mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 text-sm"
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  Ver
                </Button>
                {canEdit('PROJECTS') && (
                  <Button variant="secondary" className="flex-1 text-sm">
                    Editar
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No hay proyectos disponibles.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;
