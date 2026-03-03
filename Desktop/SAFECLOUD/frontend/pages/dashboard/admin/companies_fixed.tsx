import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';
import { Icons } from '@/lib/icons';
import ClientOnboardingWizard from '@/components/admin/ClientOnboardingWizard';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut: string;
  plan: string;
  plan_name?: string;
  status: string;
  created_at: string;
  users_count?: number;
  projects_count?: number;
  documents_count?: number;
  tickets_count?: number;
  storage_used?: number;
}

const CompaniesPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { isSuperAdmin } = useCanAccess();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    plan: 'BASIC',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (authLoading || !user) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchCompanies();
  }, [user, authLoading, isSuperAdmin, router]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.results || (Array.isArray(data) ? data : []));
      } else {
        setError('Error al cargar empresas');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nombre y email son requeridos');
      return;
    }

    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${apiUrl}/companies/${editingId}/`
        : `${apiUrl}/companies/`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editingId ? 'Empresa actualizada' : 'Empresa creada');
        setFormData({
          name: '',
          email: '',
          phone: '',
          rut: '',
          plan: 'BASIC',
          status: 'ACTIVE',
        });
        setShowForm(false);
        setEditingId(null);
        setTimeout(() => {
          setSuccess(null);
          fetchCompanies();
        }, 1500);
      } else {
        const err = await response.json();
        setError(err.detail || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      setError('Error de conexión');
    }
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      email: company.email,
      phone: company.phone || '',
      rut: company.rut || '',
      plan: company.plan || 'BASIC',
      status: company.status || 'ACTIVE',
    });
    setEditingId(company.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Confirmar eliminación?')) return;
    
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (response.ok) {
        setSuccess('Empresa eliminada');
        setTimeout(() => {
          setSuccess(null);
          fetchCompanies();
        }, 1500);
      } else {
        setError('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const newStatus = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await fetch(`${apiUrl}/companies/${company.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess('Estado actualizado');
        setTimeout(() => {
          setSuccess(null);
          fetchCompanies();
        }, 1500);
      } else {
        setError('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error toggling company status:', error);
      setError('Error de conexión');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'BASIC':
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'PRO':
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE':
      case 'enterprise':
        return 'bg-green-100 text-green-800';
      case 'CUSTOM':
      case 'custom':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando empresas...</p>
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
      {showWizard && <ClientOnboardingWizard onClose={() => setShowWizard(false)} />}
      
      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Gestión de Empresas</h1>
            <p className="text-gray-500 mt-2">Administra los clientes (tenants) y su onboarding en SAFE Cloud.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2"
            >
              🚀 Incorporar Cliente
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  rut: '',
                  plan: 'BASIC',
                  status: 'ACTIVE',
                });
                setShowForm(!showForm);
              }}
            >
              + Crear Empresa
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Empresas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{companies.length}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Estado Activo</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {companies.filter(c => c.status === 'ACTIVE').length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Plan PRO</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">
                {companies.filter(c => c.plan.toUpperCase() === 'PRO').length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Suspendidas</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                {companies.filter(c => c.status === 'INACTIVE').length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⛔</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {editingId ? 'Editar Empresa' : 'Crear Nueva Empresa'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre de la empresa"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="RUT"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Teléfono"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={handleSaveCompany}>
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  rut: '',
                  plan: 'BASIC',
                  status: 'ACTIVE',
                });
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Companies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Empresa</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">RUT</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Creada</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.rut || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(company.plan)}`}>
                        {company.plan_name || company.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(company)}
                        className="text-orange-600 hover:text-orange-800 font-medium"
                      >
                        {company.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay empresas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
};

export default CompaniesPage;
