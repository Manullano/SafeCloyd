import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  company?: string;
  created_at?: string;
}

interface UsersStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

const AdminUsersPage = () => {
  const router = useRouter();
  const authState = useAuth();
  const { user: currentUser, access_token } = authState;
  const { isSuperAdmin } = useCanAccess();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UsersStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'CLIENT_USER',
    company_id: '',
    password: '',
  });
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
    fetchCompanies();
  }, [currentUser, isSuperAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/users/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setUsers(userList);
        
        // Calcular estadísticas
        const newStats: UsersStats = {
          totalUsers: userList.length,
          activeUsers: userList.filter((u: UserItem) => u.is_active).length,
          inactiveUsers: userList.filter((u: UserItem) => !u.is_active).length,
          adminUsers: userList.filter((u: UserItem) => u.role.includes('ADMIN')).length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/companies/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data.results) ? data.results : data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim()) {
      alert('❌ Por favor completa el email y nombre');
      return;
    }

    try {
      setIsCreating(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const payload: any = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
      };

      if (formData.role.startsWith('CLIENT_') && formData.company_id) {
        payload.company_id = formData.company_id;
      }

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`${apiUrl}/companies/users/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFormData({
          email: '',
          full_name: '',
          role: 'CLIENT_USER',
          company_id: '',
          password: '',
        });
        setShowForm(false);
        await fetchUsers();
        alert('✅ Usuario creado exitosamente');
      } else {
        alert('❌ Error al crear el usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('❌ Error al crear el usuario');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        await fetchUsers();
        alert(`✅ Usuario ${!isActive ? 'activado' : 'desactivado'} exitosamente`);
      } else {
        alert('❌ Error al cambiar el estado');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('❌ Error al cambiar el estado');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchUsers();
        alert('✅ Usuario eliminado exitosamente');
      } else {
        alert('❌ Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Error al eliminar el usuario');
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

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return '👑';
      case 'STAFF_PM':
        return '📊';
      case 'STAFF_SUPPORT':
        return '🎧';
      case 'CLIENT_ADMIN':
        return '🔐';
      case 'CLIENT_USER':
        return '👤';
      case 'CLIENT_VIEWER':
        return '👁️';
      default:
        return '👤';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatus !== '' && u.is_active.toString() !== filterStatus) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        u.email.toLowerCase().includes(searchLower) ||
        u.full_name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const uniqueRoles = [...new Set(users.map((u) => u.role))];

  if (loading) {
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

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tienes acceso a esta página.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">👥 Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-2">Administra usuarios de todas las empresas y roles.</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          ➕ Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-2">Total de Usuarios</p>
              <p className="text-3xl font-bold text-blue-700">{stats.totalUsers}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Usuarios Activos</p>
              <p className="text-3xl font-bold text-green-700">{stats.activeUsers}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Usuarios Inactivos</p>
              <p className="text-3xl font-bold text-red-700">{stats.inactiveUsers}</p>
            </div>
            <div className="text-4xl">⛔</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-2">Administradores</p>
              <p className="text-3xl font-bold text-purple-700">{stats.adminUsers}</p>
            </div>
            <div className="text-4xl">👑</div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por email o nombre..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">🔑 Todos los roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleEmoji(role)} {role}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">⭐ Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterRole('');
                setFilterStatus('');
                setSearchTerm('');
              }}
            >
              🔄 Limpiar Filtros
            </Button>
            <Button
              variant="secondary"
              onClick={fetchUsers}
            >
              ↻ Actualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8 border-2 border-green-500">
          <h2 className="text-2xl font-semibold mb-6">➕ Crear Nuevo Usuario</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nombre completo"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="SUPERADMIN">👑 Super Admin</option>
              <option value="STAFF_PM">📊 Staff - Project Manager</option>
              <option value="STAFF_SUPPORT">🎧 Staff - Support</option>
              <option value="CLIENT_ADMIN">🔐 Cliente - Admin</option>
              <option value="CLIENT_USER">👤 Cliente - User</option>
              <option value="CLIENT_VIEWER">👁️ Cliente - Viewer</option>
            </select>
            {formData.role.startsWith('CLIENT_') && (
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              >
                <option value="">Seleccionar empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    🏢 {company.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="password"
              placeholder="Contraseña (opcional)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateUser}
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? '⏳ Creando...' : '✅ Crear Usuario'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setFormData({
                  email: '',
                  full_name: '',
                  role: 'CLIENT_USER',
                  company_id: '',
                  password: '',
                });
              }}
            >
              ❌ Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <Card key={u.id} className="border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-blue-700">
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{u.full_name}</h3>
                    <p className="text-gray-600 text-sm">📧 {u.email}</p>
                    {u.company && (
                      <p className="text-gray-600 text-xs">🏢 {u.company}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(u.role)}`}>
                        {getRoleEmoji(u.role)} {u.role}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? '🟢 Activo' : '🔴 Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={u.is_active ? 'secondary' : 'primary'}
                    className="text-sm"
                    onClick={() => handleToggleStatus(u.id, u.is_active)}
                  >
                    {u.is_active ? '⛔ Desactivar' : '✅ Activar'}
                  </Button>
                  <Button
                    variant="danger"
                    className="text-sm"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No hay usuarios con los filtros seleccionados.</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminUsersPage;
