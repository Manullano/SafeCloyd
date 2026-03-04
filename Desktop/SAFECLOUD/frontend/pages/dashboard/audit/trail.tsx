import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/router';

interface AuditEvent {
  id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

const AuditTrail = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_id: '',
    status: '',
  });
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    
    // Only SUPERADMIN and STAFF can view audit logs
    if (!['SUPERADMIN', 'STAFF_PM'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    
    fetchAuditEvents();
  }, [user, authLoading, access_token, router, filters]);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${apiUrl}/audit-events/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const eventList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setEvents(eventList);
      }
    } catch (error) {
      console.error('Error fetching audit events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Status', 'IP Address'],
      ...events.map(e => [
        new Date(e.timestamp).toLocaleString('es-ES'),
        e.user.full_name,
        e.action,
        e.entity_type,
        e.entity_id,
        e.status,
        e.ip_address,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('RESTORE')) return '♻️';
    if (action.includes('LOGIN')) return '🔓';
    if (action.includes('LOGOUT')) return '🔐';
    return '📝';
  };

  const getStatusColor = (status: string) => {
    return status === 'SUCCESS' 
      ? 'text-green-700 bg-green-100'
      : 'text-red-700 bg-red-100';
  };

  const filteredEvents = events;

  if (authLoading || loading) {
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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">🔎 Registro de Auditoría</h1>
        <p className="text-gray-500 mt-2">Historial completo de acciones y cambios en el sistema.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
            <input
              type="text"
              placeholder="Ej: CREATE_USER"
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entidad</label>
            <select
              value={filters.entity_type}
              onChange={(e) => setFilters({...filters, entity_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="User">Usuario</option>
              <option value="Project">Proyecto</option>
              <option value="Document">Documento</option>
              <option value="Ticket">Ticket</option>
              <option value="Company">Empresa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="SUCCESS">✅ Exitoso</option>
              <option value="FAILED">❌ Fallido</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setFilters({ action: '', entity_type: '', user_id: '', status: '' })}
            >
              🔄 Limpiar
            </Button>
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleExportCSV}
            >
              📥 Exportar CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600 mb-1">Total de Eventos</p>
          <p className="text-3xl font-bold text-gray-900">{events.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Exitosos</p>
          <p className="text-3xl font-bold text-green-600">
            {events.filter(e => e.status === 'SUCCESS').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Fallidos</p>
          <p className="text-3xl font-bold text-red-600">
            {events.filter(e => e.status === 'FAILED').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Últimas 24h</p>
          <p className="text-3xl font-bold text-blue-600">
            {events.filter(e => {
              const eventDate = new Date(e.timestamp).getTime();
              const oneDayAgo = new Date().getTime() - 86400000;
              return eventDate > oneDayAgo;
            }).length}
          </p>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Acción</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">IP</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 50).map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleString('es-ES')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                          {event.user.full_name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{event.user.full_name}</p>
                          <p className="text-xs text-gray-600">{event.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionIcon(event.action)}</span>
                        <span className="font-medium text-gray-900">{event.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                        {event.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(event.status)}`}>
                        {event.status === 'SUCCESS' ? '✅ OK' : '❌ Error'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 monospace">{event.ip_address}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    📭 Sin eventos encontrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {events.length > 50 && (
          <p className="text-xs text-gray-600 mt-4 text-center">
            Mostrando 50 de {events.length} eventos
          </p>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  📋 Detalles del Evento
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Acción</p>
                  <p className="font-semibold text-gray-900">{selectedEvent.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <span className={`px-3 py-1 rounded text-sm font-bold inline-block ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Usuario</p>
                <p className="font-semibold text-gray-900">{selectedEvent.user.full_name} ({selectedEvent.user.email})</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo de Entidad</p>
                  <p className="font-semibold text-gray-900">{selectedEvent.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">ID de Entidad</p>
                  <p className="font-semibold text-gray-900">{selectedEvent.entity_id}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Dirección IP</p>
                <p className="font-semibold text-gray-900">{selectedEvent.ip_address}</p>
              </div>

              {Object.keys(selectedEvent.old_values).length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Valores Anteriores</p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEvent.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {Object.keys(selectedEvent.new_values).length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Nuevos Valores</p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEvent.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setSelectedEvent(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AuditTrail;
