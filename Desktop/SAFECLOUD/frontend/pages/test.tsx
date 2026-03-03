import React from 'react';

export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test de Página - Frontend Funcionando</h1>
      <p>Si ves esto, Next.js está compilando correctamente.</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>Debug Info:</h2>
        <p>LocalStorage Items:</p>
        <pre style={{ backgroundColor: '#fff', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(
            {
              hasAccessToken: !!localStorage.getItem('accessToken'),
              hasRefreshToken: !!localStorage.getItem('refreshToken'),
              authStoreKeys: Object.keys(JSON.parse(localStorage.getItem('auth-store') || '{}'))
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
