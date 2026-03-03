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
  industry?: string;
  status: string;
  created_at: string;
  users_count?: number;
  projects_count?: number;
  documents_count?: number;
  tickets_count?: number;
  storage_used?: number;
}

interface Plan {
  id: string;
  name: string;
  code: string;
}

const CompaniesPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { isSuperAdmin } = useCanAccess();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    industry: '',
    plan: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (authLoading || !user) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchPlans();
    fetchCompanies();
  }, [user, authLoading, isSuperAdmin, router]);

  const fetchPlans = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/plans/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const plansData = data.results || (Array.isArray(data) ? data : []);
        setPlans(plansData);
        
        // Set default plan
        if (plansData.length > 0) {
          setFormData(prev => ({
            ...prev,
            plan: plansData[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

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
    if (!formData.name.trim() || !formData.email.trim() || !formData.plan) {
      setError('Nombre, email y plan son requeridos');
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
          industry: '',
          plan: plans.length > 0 ? plans[0].id : '',
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
        setError(err.detail || err.error || 'Error al guardar');
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
      industry: company.industry || '',
      plan: company.plan || 'BASIC',
      status: company.status || 'ACTIVE',
    });
    setEditingId(company.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/${deleteConfirm}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (response.ok) {
        setSuccess('Empresa eliminada correctamente');
        setDeleteConfirm(null);
        setTimeout(() => {
          setSuccess(null);
          fetchCompanies();
        }, 1500);
      } else {
        setError('Error al eliminar la empresa');
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      setError('Error de conexión');
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
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
                  industry: '',
                  plan: plans.length > 0 ? plans[0].id : '',
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
            <input
              type="text"
              placeholder="Industria (ej: Tecnología, Minería, etc)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="">Seleccionar Plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.code})
                </option>
              ))}
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
                  industry: '',
                  plan: plans.length > 0 ? plans[0].id : '',
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
                    <td className="px-6 py-4 text-sm space-x-1">
                      <button
                        onClick={() => handleEdit(company)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg 
                          bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 
                          transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        title="Editar empresa"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(company)}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg 
                          transition-all duration-200 ${
                            company.status === 'ACTIVE'
                              ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-800 border border-orange-200 hover:border-orange-300'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-800 border border-green-200 hover:border-green-300'
                          }`}
                        title={company.status === 'ACTIVE' ? 'Desactivar empresa' : 'Activar empresa'}
                      >
                        {company.status === 'ACTIVE' ? (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Desactivar
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg 
                          bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 
                          transition-all duration-200 border border-red-200 hover:border-red-300"
                        title="Eliminar empresa"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0a9 9 0 11-6.364-6.364" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              ¿Confirmar eliminación?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Esta acción no puede deshacerse. La empresa será eliminada permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg 
                  hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg 
                  hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CompaniesPage;
