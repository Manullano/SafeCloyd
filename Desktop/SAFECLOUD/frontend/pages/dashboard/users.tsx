import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const UsersPage = () => {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { canCreate, canEdit, canDelete, isSuperAdmin } = useCanAccess();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'CLIENT_USER' });

  useEffect(() => {
    if (authLoading || !currentUser) return;
    fetchUsers();
  }, [currentUser, authLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.results) ? data.results : data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/users/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
        }),
      });

      if (response.ok) {
        setFormData({ email: '', full_name: '', role: 'CLIENT_USER' });
        setShowForm(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-red-100 text-red-800';
      case 'STAFF_PM':
        return 'bg-purple-100 text-purple-800';
      case 'STAFF_SUPPORT':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT_ADMIN':
        return 'bg-green-100 text-green-800';
      case 'CLIENT_USER':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLIENT_VIEWER':
        return 'bg-gray-100 text-gray-800';
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
            <p className="text-gray-600">Cargando usuarios...</p>
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
            <h1 className="text-3xl font-semibold text-gray-900">Usuarios</h1>
            <p className="text-gray-500 mt-2">Gestiona los usuarios de tu equipo o empresa.</p>
          </div>
          {canCreate('USERS') && (
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              + Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Crear Nuevo Usuario</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="CLIENT_VIEWER">Espectador</option>
              <option value="CLIENT_USER">Usuario</option>
              <option value="CLIENT_ADMIN">Admin del Cliente</option>
              <option value="STAFF_SUPPORT">Soporte Técnico</option>
              <option value="STAFF_PM">Gestor de Proyectos</option>
              {isSuperAdmin && (
                <option value="SUPERADMIN">Super Admin</option>
              )}
            </select>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreateUser}>
                Crear
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ email: '', full_name: '', role: 'CLIENT_USER' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {users.length > 0 ? (
          users.map((u: User) => (
            <Card key={u.id} hoverable>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-primary-500">
                        {u.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{u.full_name}</h3>
                      <p className="text-gray-500 text-sm">{u.email}</p>
                      <div className="mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.id !== currentUser?.id && canEdit('USERS') && (
                    <Button variant="secondary" className="text-sm">
                      Editar
                    </Button>
                  )}
                  {u.id !== currentUser?.id && canDelete('USERS') && (
                    <Button variant="secondary" className="text-sm text-red-600">
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <p className="text-gray-500">No hay usuarios disponibles.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsersPage;
