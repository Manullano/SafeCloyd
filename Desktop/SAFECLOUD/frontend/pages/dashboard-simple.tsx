import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/stores/auth';
import { usePermission } from '@/context/PermissionContext';

const SimpleDashboard = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const permContext = usePermission();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toLocaleTimeString(),
      authLoading,
      hasUser: !!user,
      userEmail: user?.email || 'N/A',
      userRole: user?.role || 'N/A',
      hasAccessToken: !!access_token,
      permContextLoading: permContext?.isLoading,
      permContextRole: permContext?.role || 'N/A',
      permContextPerms: (permContext?.permissions?.length || 0) + ' permisos',
    });
  }, [user, authLoading, access_token, permContext]);

  // Si está cargando auth, mostrar loading
  if (authLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Cargando Autenticación...</h1>
        <p>Por favor espera...</p>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>No Autenticado</h1>
        <p>Redirigiendo a login...</p>
        <button onClick={() => router.push('/login')}>
          Ir a Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard - Usuario: {user?.email}</h1>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Información de Debug</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Object.entries(debugInfo).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{key}:</td>
                <td style={{ padding: '8px' }}>
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #0f0', backgroundColor: '#f0fff0' }}>
        <h2>✅ Si ves esto, el Dashboard está funcionando!</h2>
        <p>Usuario autenticado: <strong>{user?.email}</strong></p>
        <p>Rol: <strong>{user?.role}</strong></p>
        <p>Permisos cargados: <strong>{permContext?.permissions?.length || 0}</strong></p>
      </div>

      <button
        onClick={() => {
          localStorage.clear();
          router.push('/login');
        }}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#ff0000',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default SimpleDashboard;
