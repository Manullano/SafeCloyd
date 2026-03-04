import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useAuth } from '@/stores/auth';

interface DocumentVersion {
  id: string;
  version_number: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by?: {
    id: string;
    full_name: string;
  };
  created_at: string;
  sha256?: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  current_version: number;
}

const DocumentVersions = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, access_token, isLoading: authLoading } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !access_token || !id) return;

    fetchData();
  }, [id, user, authLoading, access_token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      // Fetch document
      const docRes = await fetch(`${apiUrl}/documents/documents/${id}/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (docRes.ok) {
        const docData = await docRes.json();
        setDocument(docData);
      }

      // Fetch versions
      const versRes = await fetch(`${apiUrl}/documents/documents/${id}/versions/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (versRes.ok) {
        const versData = await versRes.json();
        const versionList = Array.isArray(versData) ? versData : (Array.isArray(versData.results) ? versData.results : []);
        setVersions(versionList);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!id) return;

    try {
      setRestoring(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      const response = await fetch(`${apiUrl}/documents/documents/${id}/restore_version/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version_id: versionId }),
      });

      if (response.ok) {
        setShowRestoreConfirm(null);
        fetchData();
        alert('✅ Versión restaurada exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.error || 'No se pudo restaurar la versión'}`);
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Error al restaurar la versión');
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Documento no encontrado</h1>
          <Button variant="primary" onClick={() => router.push('/dashboard/documents')}>
            Volver a Documentos
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Volver
          </button>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900">📜 Historial de Versiones</h1>
        <p className="text-gray-600 mt-2">{document.title}</p>
      </div>

      {/* Document Info */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Documento</p>
            <p className="text-lg font-semibold text-gray-900">{document.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Versión Actual</p>
            <p className="text-lg font-bold text-blue-600">v{versions.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total de Versiones</p>
            <p className="text-lg font-semibold text-gray-900">{versions.length}</p>
          </div>
        </div>
      </Card>

      {/* Version Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">⏱️ Timeline de Versiones</h2>

        {versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`border-l-4 ${
                  index === 0 ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300 bg-white'
                } p-4 rounded-r-lg hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">v{version.version_number}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{version.file_name}</p>
                      <p className="text-sm text-gray-600">{formatDate(version.created_at)}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      ✅ ACTUAL
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {version.uploaded_by && (
                    <span>👤 {version.uploaded_by.full_name}</span>
                  )}
                  <span>📦 {formatFileSize(version.size_bytes)}</span>
                  {version.mime_type && <span>📄 {version.mime_type}</span>}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs py-2 px-3"
                    onClick={() => window.open(`/api/documents/${id}/versions/${version.id}/download/`, '_blank')}
                  >
                    ⬇️ Descargar
                  </Button>

                  {index > 0 && (
                    <>
                      {showRestoreConfirm === version.id ? (
                        <>
                          <Button
                            variant="primary"
                            className="text-xs py-2 px-3 bg-orange-500 hover:bg-orange-600"
                            onClick={() => handleRestoreVersion(version.id)}
                            disabled={restoring}
                          >
                            {restoring ? '⏳ Restaurando...' : '✅ Confirmar'}
                          </Button>
                          <Button
                            variant="secondary"
                            className="text-xs py-2 px-3"
                            onClick={() => setShowRestoreConfirm(null)}
                          >
                            ❌ Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          className="text-xs py-2 px-3 text-orange-600 border-orange-600"
                          onClick={() => setShowRestoreConfirm(version.id)}
                        >
                          🔄 Restaurar v{version.version_number}
                        </Button>
                      )}
                    </>
                  )}

                  {version.sha256 && (
                    <span
                      className="text-xs text-gray-500 cursor-help hover:bg-gray-100 px-2 py-2 rounded"
                      title={version.sha256}
                    >
                      🔐 SHA256: {version.sha256.substring(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">📭 Sin versiones disponibles</p>
            </div>
          </Card>
        )}
      </div>

      {/* Version Statistics */}
      {versions.length > 0 && (
        <Card className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Estadísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Versiones Totales</p>
              <p className="text-3xl font-bold text-gray-900">{versions.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Versión Más Antigua</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(versions[versions.length - 1].created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tamaño Promedio</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatFileSize(
                  versions.reduce((sum, v) => sum + v.size_bytes, 0) / versions.length
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tamaño Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatFileSize(versions.reduce((sum, v) => sum + v.size_bytes, 0))}
              </p>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
};

export default DocumentVersions;
