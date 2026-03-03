import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  max_companies: number;
  max_projects: number;
  max_documents: number;
  max_users: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PlansStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalCompaniesOnPlans: number;
}

const PlansPage = () => {
  const router = useRouter();
  const authState = useAuth();
  const { user, access_token } = authState;
  const { isSuperAdmin } = useCanAccess();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlansStats>({
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    totalCompaniesOnPlans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Plan>>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing_period: 'monthly',
    max_companies: 1,
    max_projects: 10,
    max_documents: 100,
    max_users: 5,
    features: [],
    is_active: true,
  });

  useEffect(() => {
    if (!user) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchPlans();
  }, [user, isSuperAdmin, router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/plans/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const planList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setPlans(planList);
        
        // Calcular estadísticas
        const newStats: PlansStats = {
          totalPlans: planList.length,
          activePlans: planList.filter((p: Plan) => p.is_active).length,
          inactivePlans: planList.filter((p: Plan) => !p.is_active).length,
          totalCompaniesOnPlans: planList.reduce((sum: number, p: Plan) => sum + 1, 0),
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    try {
      setIsCreating(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/plans/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPlans();
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          price: 0,
          currency: 'USD',
          billing_period: 'monthly',
          max_companies: 1,
          max_projects: 10,
          max_documents: 100,
          max_users: 5,
          features: [],
          is_active: true,
        });
        alert('✅ Plan creado exitosamente');
      } else {
        alert('❌ Error al crear el plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('❌ Error al crear el plan');
    } finally {
      setIsCreating(false);
    }
  };

  const updatePlan = async (planId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/plans/${planId}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedPlan),
      });

      if (response.ok) {
        await fetchPlans();
        setShowDetailsModal(false);
        alert('✅ Plan actualizado exitosamente');
      } else {
        alert('❌ Error al actualizar el plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('❌ Error al actualizar el plan');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este plan?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/plans/${planId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchPlans();
        alert('✅ Plan eliminado exitosamente');
      } else {
        alert('❌ Error al eliminar el plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('❌ Error al eliminar el plan');
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/plans/${planId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        await fetchPlans();
        alert(`✅ Plan ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      } else {
        alert('❌ Error al cambiar el estado del plan');
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('❌ Error al cambiar el estado del plan');
    }
  };

  const filteredPlans = plans.filter((plan) => {
    if (filterActive !== '' && plan.is_active.toString() !== filterActive) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        plan.name.toLowerCase().includes(searchLower) ||
        plan.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando planes...</p>
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
          <h1 className="text-3xl font-semibold text-gray-900">💎 Planes de Suscripción</h1>
          <p className="text-gray-500 mt-2">Gestiona todos los planes disponibles del sistema.</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          ➕ Crear Nuevo Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-2">Total de Planes</p>
              <p className="text-3xl font-bold text-blue-700">{stats.totalPlans}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Planes Activos</p>
              <p className="text-3xl font-bold text-green-700">{stats.activePlans}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Planes Inactivos</p>
              <p className="text-3xl font-bold text-red-700">{stats.inactivePlans}</p>
            </div>
            <div className="text-4xl">⛔</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-2">Empresas</p>
              <p className="text-3xl font-bold text-purple-700">{stats.totalCompaniesOnPlans}</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="">✅ Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterActive('');
                setSearchTerm('');
              }}
            >
              🔄 Limpiar Filtros
            </Button>
            <Button
              variant="secondary"
              onClick={fetchPlans}
            >
              ↻ Actualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`flex flex-col h-full border-2 ${plan.is_active ? 'border-green-500' : 'border-red-500'}`}
            >
              <div className="mb-4 pb-4 border-b">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {plan.is_active ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.billing_period}</span>
                </div>
              </div>

              <div className="flex-1 mb-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🏢</span> <span>Hasta {plan.max_companies} empresa(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📁</span> <span>Hasta {plan.max_projects} proyecto(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📄</span> <span>Hasta {plan.max_documents} documento(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span> <span>Hasta {plan.max_users} usuario(s)</span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Características:</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                          <span>✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="secondary"
                  className="text-xs flex-1"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowDetailsModal(true);
                  }}
                >
                  👁️ Ver
                </Button>
                <Button
                  variant={plan.is_active ? 'danger' : 'primary'}
                  className="text-xs flex-1"
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                >
                  {plan.is_active ? '⛔ Desactivar' : '✅ Activar'}
                </Button>
                <Button
                  variant="danger"
                  className="text-xs flex-1"
                  onClick={() => deletePlan(plan.id)}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No hay planes con los filtros seleccionados.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">➕ Crear Nuevo Plan</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Plan</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Pro Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Descripción del plan..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Período de Facturación</label>
                  <select
                    value={formData.billing_period || 'monthly'}
                    onChange={(e) => setFormData({...formData, billing_period: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Máx. Empresas</label>
                  <input
                    type="number"
                    value={formData.max_companies || ''}
                    onChange={(e) => setFormData({...formData, max_companies: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Máx. Proyectos</label>
                  <input
                    type="number"
                    value={formData.max_projects || ''}
                    onChange={(e) => setFormData({...formData, max_projects: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Máx. Documentos</label>
                  <input
                    type="number"
                    value={formData.max_documents || ''}
                    onChange={(e) => setFormData({...formData, max_documents: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Máx. Usuarios</label>
                  <input
                    type="number"
                    value={formData.max_users || ''}
                    onChange={(e) => setFormData({...formData, max_users: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-gray-700">Plan Activo</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createPlan}
                  disabled={isCreating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? '⏳ Creando...' : '✅ Crear Plan'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">📝 Detalles del Plan</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={selectedPlan.name || ''}
                  onChange={(e) => setSelectedPlan({...selectedPlan, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={selectedPlan.description || ''}
                  onChange={(e) => setSelectedPlan({...selectedPlan, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
                  <input
                    type="number"
                    value={selectedPlan.price || ''}
                    onChange={(e) => setSelectedPlan({...selectedPlan, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
                  <input
                    type="text"
                    value={selectedPlan.billing_period || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Límites</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Máx. Empresas</p>
                    <p className="text-lg font-bold">{selectedPlan.max_companies}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Máx. Proyectos</p>
                    <p className="text-lg font-bold">{selectedPlan.max_projects}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Máx. Documentos</p>
                    <p className="text-lg font-bold">{selectedPlan.max_documents}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Máx. Usuarios</p>
                    <p className="text-lg font-bold">{selectedPlan.max_users}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => updatePlan(selectedPlan.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  💾 Guardar Cambios
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default PlansPage;
