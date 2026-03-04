import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/router';

interface AuditLog {
  id: string;
  actor_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  action: string;
  company?: {
    id: string;
    name: string;
  };
  entity: string;
  entity_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  data: Record<string, any>;
}

const AuditTrail = () => {
  const router = useRouter();
  const { user, access_token, isLoading: authLoading } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchUser, setSearchUser] = useState<string>('');

  useEffect(() => {
    if (authLoading || !user || !access_token) return;

    // Only SUPERADMIN and STAFF_PM can see audit logs
    if (!['SUPERADMIN', 'STAFF_PM'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchLogs();
  }, [user, authLoading, access_token, router]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      let url = `${apiUrl}/audit/logs/?limit=200`;
      if (filterAction !== 'ALL') url += `&action=${filterAction}`;
      if (filterEntity !== 'ALL') url += `&entity=${filterEntity}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      if (searchUser) url += `&user_name=${searchUser}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const logList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setLogs(logList);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-600';
    if (action.includes('CREATE')) return 'text-green-600';
    if (action.includes('UPDATE')) return 'text-blue-600';
    if (action.includes('RESTORE')) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getEntityIcon = (entity: string) => {
    const icons: { [key: string]: string } = {
      USER: '👤',
      PROJECT: '📁',
      DOCUMENT: '📄',
      TICKET: '🎫',
      COMMENT: '💬',
      COMPANY: '🏢',
      PLAN: '📊',
    };
    return icons[entity] || '📝';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const stats = {
    total: logs.length,
    creates: logs.filter(l => l.action.includes('CREATE')).length,
    updates: logs.filter(l => l.action.includes('UPDATE')).length,
    deletes: logs.filter(l => l.action.includes('DELETE')).length,
  };

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
        <h1 className="text-3xl font-semibold text-gray-900">🔐 Historial de Auditoría</h1>
        <p className="text-gray-600 mt-2">Registro completo de todas las actividades del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Eventos</p>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Creaciones</p>
            <p className="text-4xl font-bold text-green-600">+{stats.creates}</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Modificaciones</p>
            <p className="text-4xl font-bold text-blue-600">{stats.updates}</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Eliminaciones</p>
            <p className="text-4xl font-bold text-red-600">🗑️ {stats.deletes}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setLoading(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">✓ Todas las acciones</option>
              <option value="CREATE">create_ (Crear)</option>
              <option value="UPDATE">_UPDATE (Cambios)</option>
              <option value="DELETE">_DELETE (Eliminar)</option>
              <option value="RESTORE">_RESTORE (Restaurar)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entidad</label>
            <select
              value={filterEntity}
              onChange={(e) => {
                setFilterEntity(e.target.value);
                setLoading(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">✓ Todas las entidades</option>
              <option value="USER">👤 Usuario</option>
              <option value="PROJECT">📁 Proyecto</option>
              <option value="DOCUMENT">📄 Documento</option>
              <option value="TICKET">🎫 Ticket</option>
              <option value="COMMENT">💬 Comentario</option>
              <option value="COMPANY">🏢 Empresa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setLoading(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setLoading(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                setLoading(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={fetchLogs}
            className="text-sm"
          >
            🔄 Actualizar resultados
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <div className="space-y-3">
        {logs.length > 0 ? (
          logs.map(log => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Entity & Action */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getEntityIcon(log.entity)}</span>
                    <div>
                      <p className={`font-bold ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {log.entity} {log.entity_id && `(ID: ${log.entity_id})`}
                      </p>
                    </div>
                  </div>

                  {/* User Info */}
                  {log.actor_user && (
                    <p className="text-sm text-gray-600 mb-2">
                      👤 {log.actor_user.full_name} ({log.actor_user.email})
                    </p>
                  )}

                  {/* Company Info */}
                  {log.company && (
                    <p className="text-sm text-gray-600 mb-2">
                      🏢 {log.company.name}
                    </p>
                  )}

                  {/* Timestamp & IP */}
                  <p className="text-xs text-gray-500 space-x-2">
                    <span>⏰ {formatDate(log.timestamp)}</span>
                    <span>🌐 {log.ip_address}</span>
                  </p>
                </div>

                {/* Right: Details */}
                <div className="text-right text-sm">
                  {Object.keys(log.data).length > 0 && (
                    <details className="text-gray-600">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                        📋 Detalles
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-left">
                        <pre className="text-gray-700 overflow-auto max-h-32">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">📭 Sin eventos de auditoría</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AuditTrail;
