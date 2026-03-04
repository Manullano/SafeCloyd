import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/router';

interface Analytics {
  total_users: number;
  active_users_today: number;
  total_projects: number;
  active_projects: number;
  total_documents: number;
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  cpu_usage: number;
  memory_usage: number;
}

interface DailyStats {
  date: string;
  logins: number;
  documents_created: number;
  tickets_created: number;
  api_calls: number;
}

const Analytics = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    
    // Only SUPERADMIN can view analytics
    if (user.role !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    
    fetchAnalytics();
  }, [user, authLoading, access_token, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const [analyticsRes, dailyRes] = await Promise.all([
        fetch(`${apiUrl}/analytics/overview/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiUrl}/analytics/daily/?period=${timeRange}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => null),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (dailyRes?.ok) {
        const data = await dailyRes.json();
        const statsList = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
        setDailyStats(statsList);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStoragePercent = () => {
    if (!analytics) return 0;
    return Math.round((analytics.storage_used_mb / analytics.storage_limit_mb) * 100);
  };

  const getStorageColor = () => {
    const percent = getStoragePercent();
    if (percent < 50) return '#10b981'; // green
    if (percent < 80) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análiticas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">📊 Análiticas del Sistema</h1>
        <p className="text-gray-500 mt-2">Resumen de actividad y rendimiento de SAFE Cloud</p>
      </div>

      {/* Time Range Selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Período:</label>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      {analytics && (
        <>
          {/* Users Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Usuarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Usuarios Totales</p>
                    <p className="text-4xl font-bold text-blue-600">{analytics.total_users}</p>
                  </div>
                  <span className="text-5xl">👥</span>
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Activos Hoy</p>
                    <p className="text-4xl font-bold text-green-600">{analytics.active_users_today}</p>
                  </div>
                  <span className="text-5xl">✨</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Projects Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📁 Proyectos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-4xl font-bold text-purple-600">{analytics.total_projects}</p>
                  </div>
                  <span className="text-5xl">📁</span>
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Activos</p>
                    <p className="text-4xl font-bold text-purple-600">{analytics.active_projects}</p>
                  </div>
                  <span className="text-5xl">⚡</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Documents & Tickets Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📄 Contenido</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Documentos</p>
                    <p className="text-4xl font-bold text-yellow-600">{analytics.total_documents}</p>
                  </div>
                  <span className="text-5xl">📄</span>
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tickets Abiertos</p>
                    <p className="text-4xl font-bold text-red-600">{analytics.open_tickets}</p>
                  </div>
                  <span className="text-5xl">🔴</span>
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tickets Cerrados</p>
                    <p className="text-4xl font-bold text-green-600">{analytics.closed_tickets}</p>
                  </div>
                  <span className="text-5xl">✅</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Storage Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💾 Almacenamiento</h2>
            <Card>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Usado: <span className="font-bold text-gray-900">{analytics.storage_used_mb} MB</span> / {analytics.storage_limit_mb} MB
                </p>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(getStoragePercent(), 100)}%`,
                      backgroundColor: getStorageColor(),
                    }}
                  />
                </div>
                <p className="text-sm font-bold text-gray-900">{getStoragePercent()}% utilizado</p>
              </div>
            </Card>
          </div>

          {/* System Resources Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Recursos del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div>
                  <p className="text-sm text-gray-600 mb-2">CPU Utilizado</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(analytics.cpu_usage, 100)}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{analytics.cpu_usage}%</p>
                </div>
              </Card>
              <Card>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Memoria Utilizada</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all"
                      style={{ width: `${Math.min(analytics.memory_usage, 100)}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{analytics.memory_usage}%</p>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Daily Stats Chart */}
      {dailyStats.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Actividad Diaria</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Logins</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Documentos</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Tickets</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">API Calls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyStats.map((stat) => (
                  <tr key={stat.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(stat.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{stat.logins}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{stat.documents_created}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{stat.tickets_created}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{stat.api_calls}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  );
};

export default Analytics;
