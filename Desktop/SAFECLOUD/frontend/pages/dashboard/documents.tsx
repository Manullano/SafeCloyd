import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

const DocumentsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { canCreate, canEdit, canDelete, canDownload } = useCanAccess();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: '' });

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    fetchDocuments();
  }, [user, authLoading, access_token]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/documents/documents/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data.results) ? data.results : data);
      }
    } catch (err) {
      console.error('Error al obtener documentos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!formData.title.trim()) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/documents/documents/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
        }),
      });

      if (response.ok) {
        setFormData({ title: '', category: '' });
        setShowForm(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando documentos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Documentos</h1>
            <p className="text-gray-500 mt-2">Almacena y gestiona documentos importantes</p>
          </div>
          {canCreate('DOCUMENTS') && (
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              + Subir Documento
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Subir Nuevo Documento</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Título del documento"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Categoría"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreateDocument}>
                Crear
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', category: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Documents List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length > 0 ? (
          documents.map((doc: any) => (
            <Card key={doc.id} hoverable>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{doc.category}</p>
                  <div className="mt-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {canDownload('DOCUMENTS') && (
                  <Button
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    Descargar
                  </Button>
                )}
                {canEdit('DOCUMENTS') && (
                  <Button variant="secondary" className="flex-1 text-sm">
                    Editar
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No hay documentos disponibles.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DocumentsPage;
