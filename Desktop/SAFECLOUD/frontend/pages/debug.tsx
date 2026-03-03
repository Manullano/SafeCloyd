import React, { useState, useEffect } from 'react';

const DebugPage = () => {
  const [debug, setDebug] = useState({
    apiUrl: '',
    testStatus: 'Probando...',
    testError: '',
    testResponse: '',
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        setDebug(prev => ({ ...prev, apiUrl }));

        console.log(`Intentando conectar a: ${apiUrl}/auth/login/`);

        const response = await fetch(`${apiUrl}/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
          },
          body: JSON.stringify({
            email: 'superadmin@test.com',
            password: 'TestPass123!',
          }),
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, response.headers);

        const data = await response.json();

        setDebug(prev => ({
          ...prev,
          testStatus: `✅ Conectado (Status: ${response.status})`,
          testResponse: JSON.stringify(data, null, 2),
        }));
      } catch (error: any) {
        console.error('Error:', error);
        setDebug(prev => ({
          ...prev,
          testStatus: '❌ Error de conexión',
          testError: error.message || String(error),
        }));
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>Configuración</h2>
        <p><strong>API URL:</strong> {debug.apiUrl || 'Cargando...'}</p>
        <p><strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f5e9' }}>
        <h2>Estado de Conexión</h2>
        <p><strong>{debug.testStatus}</strong></p>
        {debug.testError && (
          <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee' }}>
            <p><strong>Error:</strong> {debug.testError}</p>
          </div>
        )}
      </div>

      {debug.testResponse && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e3f2fd' }}>
          <h2>Respuesta del Backend</h2>
          <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
            {debug.testResponse}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3e0' }}>
        <h2>Pasos para Debug</h2>
        <ol>
          <li>Abre F12 → Console y revisa si hay errores</li>
          <li>Revisa Network tab para ver las requests</li>
          <li>Verifica que ambos servidores estén corriendo:
            <ul>
              <li>Frontend: http://localhost:3001</li>
              <li>Backend: http://localhost:8000/api/auth/login/</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPage;
