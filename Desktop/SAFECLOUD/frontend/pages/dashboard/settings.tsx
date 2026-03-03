import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';
import { Icons } from '@/lib/icons';

const SettingsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isSuperAdmin } = useCanAccess();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    system_name: 'SAFE Cloud',
    maintenance_mode: false,
    backup_enabled: true,
  });

  // Proteger acceso solo para SUPERADMIN
  useEffect(() => {
    if (authLoading || !user) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isSuperAdmin, router]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No tienes acceso a esta página.</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/dashboard')}>
            Volver al Panel
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-2">Administración exclusiva para Super Admin. Gestiona la configuración global del sistema.</p>
      </div>

      {/* Admin Dashboard Links */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Panel de Administración</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/dashboard/admin/companies">
            <Card hoverable className="cursor-pointer text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Empresas</h3>
              <p className="text-sm text-gray-600">Gestionar clientes y tenants</p>
            </Card>
          </Link>

          <Link href="/dashboard/admin/users">
            <Card hoverable className="cursor-pointer text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 19H9a6 6 0 016-6v0a6 6 0 016 6v0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Usuarios</h3>
              <p className="text-sm text-gray-600">Crear y administrar usuarios</p>
            </Card>
          </Link>

          <Link href="/dashboard/admin/tickets">
            <Card hoverable className="cursor-pointer text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h6a2 2 0 012 2m0 0a2 2 0 012 2v3a2 2 0 01-2 2h-2.5a2.5 2.5 0 00-5 0H5a2 2 0 01-2-2V7a2 2 0 012-2m0 0a2 2 0 012-2h6a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Tickets</h3>
              <p className="text-sm text-gray-600">Gestión global de soporte</p>
            </Card>
          </Link>

          <Link href="/dashboard/admin/audit">
            <Card hoverable className="cursor-pointer text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Auditoría</h3>
              <p className="text-sm text-gray-600">Historial de eventos</p>
            </Card>
          </Link>

          <Link href="/dashboard/admin/plans">
            <Card hoverable className="cursor-pointer text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Planes</h3>
              <p className="text-sm text-gray-600">Configurar límites y precios</p>
            </Card>
          </Link>

          <Link href="/dashboard/projects">
            <Card hoverable className="cursor-pointer text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4m0 0v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7m18 0H5" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Proyectos</h3>
              <p className="text-sm text-gray-600">Vista global de proyectos</p>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Settings */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Configuración General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Sistema
              </label>
              <input
                type="text"
                value={settings.system_name}
                onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Modo de Mantenimiento</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.backup_enabled}
                  onChange={(e) => setSettings({ ...settings, backup_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Copias de Seguridad Automáticas</span>
              </label>
            </div>
            <Button variant="primary" className="w-full">
              Guardar Cambios
            </Button>
          </div>
        </Card>

        {/* System Stats */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Estadísticas del Sistema</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Proyectos</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Tickets Abiertos</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Documentos</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </Card>

        {/* Roles & Permissions */}
        <Card className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Roles y Permisos</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">Gestionar Roles</h3>
                <Button variant="secondary" size="sm">
                  Ver Roles
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Configura los roles disponibles en el sistema y asigna permisos granulares.
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">Gestionar Permisos</h3>
                <Button variant="secondary" size="sm">
                  Ver Permisos
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Define qué módulos y acciones puede realizar cada rol.
              </p>
            </div>
          </div>
        </Card>

        {/* Maintenance */}
        <Card className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Mantenimiento</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Crear Respaldo</h3>
              <p className="text-sm text-gray-600 mb-3">Realiza una copia de seguridad completa del sistema.</p>
              <Button variant="secondary" className="w-full">
                Crear Respaldo
              </Button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Limpiar Caché</h3>
              <p className="text-sm text-gray-600 mb-3">Borra el caché del sistema para optimizar.</p>
              <Button variant="secondary" className="w-full">
                Limpiar Caché
              </Button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Auditoría</h3>
              <p className="text-sm text-gray-600 mb-3">Revisa el registro de eventos del sistema.</p>
              <Button variant="secondary" className="w-full">
                Ver Auditoría
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
