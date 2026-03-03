import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  module: string;
  company?: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

interface AuditStats {
  totalEvents: number;
  createEvents: number;
  updateEvents: number;
  deleteEvents: number;
  loginEvents: number;
}

const AuditPage = () => {
  const router = useRouter();
  const authState = useAuth();
  const { user, access_token } = authState;
  const { isSuperAdmin } = useCanAccess();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    createEvents: 0,
    updateEvents: 0,
    deleteEvents: 0,
    loginEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchAuditEvents();
  }, [user, isSuperAdmin, router]);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/audit/events/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const eventList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setEvents(eventList);
        
        // Calcular estadísticas
        const newStats: AuditStats = {
          totalEvents: eventList.length,
          createEvents: eventList.filter((e: AuditEvent) => e.action === 'CREATE').length,
          updateEvents: eventList.filter((e: AuditEvent) => e.action === 'UPDATE').length,
          deleteEvents: eventList.filter((e: AuditEvent) => e.action === 'DELETE').length,
          loginEvents: eventList.filter((e: AuditEvent) => e.action === 'LOGIN').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching audit events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'USERS':
        return 'bg-blue-50';
      case 'COMPANIES':
        return 'bg-green-50';
      case 'TICKETS':
        return 'bg-purple-50';
      case 'DOCUMENTS':
        return 'bg-orange-50';
      case 'PROJECTS':
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filterModule && event.module !== filterModule) return false;
    if (filterAction && event.action !== filterAction) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.actor.toLowerCase().includes(searchLower) ||
        event.details.toLowerCase().includes(searchLower) ||
        (event.company && event.company.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const uniqueModules = [...new Set(events.map((e) => e.module))];
  const uniqueActions = [...new Set(events.map((e) => e.action))];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando auditoría...</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Auditoría de Eventos</h1>
        <p className="text-gray-500 mt-2">Registro completo de acciones críticas en el sistema.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total de Eventos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Creaciones</p>
              <p className="text-3xl font-bold text-green-700">{stats.createEvents}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-2">Actualizaciones</p>
              <p className="text-3xl font-bold text-blue-700">{stats.updateEvents}</p>
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Eliminaciones</p>
              <p className="text-3xl font-bold text-red-700">{stats.deleteEvents}</p>
            </div>
            <div className="text-4xl">🗑️</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-2">Logins</p>
              <p className="text-3xl font-bold text-purple-700">{stats.loginEvents}</p>
            </div>
            <div className="text-4xl">🔐</div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por usuario, empresa o detalles..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="">📂 Todos los módulos</option>
              {uniqueModules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">⚡ Todas las acciones</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterModule('');
                setFilterAction('');
                setSearchTerm('');
              }}
            >
              🔄 Limpiar Filtros
            </Button>
            <Button
              variant="secondary"
              onClick={fetchAuditEvents}
            >
              ↻ Actualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              className={`${getModuleColor(event.module)} border-l-4 border-transparent hover:border-blue-500 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(event.action)}`}>
                      {event.action}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 bg-white px-2 py-1 rounded">{event.module}</span>
                    {event.company && (
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">🏢 {event.company}</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold text-gray-800">👤 {event.actor}</span> • <span className="text-sm">{event.details}</span>
                  </p>
                  <div className="mt-3 flex gap-4 text-xs text-gray-600 flex-wrap">
                    <span>📅 {new Date(event.timestamp).toLocaleString('es-ES')}</span>
                    {event.ip_address && <span>🌐 IP: {event.ip_address}</span>}
                  </div>
                </div>
                <div className="ml-4">
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailsModal(true);
                    }}
                  >
                    👁️ Ver Detalles
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No hay eventos de auditoría con los filtros seleccionados.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">🔍 Detalles del Evento</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">⚡ Acción</h3>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getActionColor(selectedEvent.action)}`}>
                    {selectedEvent.action}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📂 Módulo</h3>
                  <p className="text-gray-600 font-semibold">{selectedEvent.module}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">👤 Usuario</h3>
                  <p className="text-gray-600 font-semibold">{selectedEvent.actor}</p>
                </div>
                {selectedEvent.company && (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🏢 Empresa</h3>
                    <p className="text-gray-600 font-semibold">{selectedEvent.company}</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📅 Fecha y Hora</h3>
                  <p className="text-gray-600 font-semibold">{new Date(selectedEvent.timestamp).toLocaleString('es-ES')}</p>
                </div>
                {selectedEvent.ip_address && (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🌐 IP Address</h3>
                    <p className="text-gray-600 font-semibold">{selectedEvent.ip_address}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 Detalles</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm max-h-64 overflow-auto font-mono whitespace-pre-wrap">
                  {selectedEvent.details}
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default AuditPage;
