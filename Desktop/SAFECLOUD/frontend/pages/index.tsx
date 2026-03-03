import React from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import { Lock, Zap, Shield } from 'lucide-react';

const IndexPage = () => {
  const BriefcaseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>;
  const FileTextIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"></path></svg>;
  const TicketIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2h2V5a4 4 0 00-4-4H4a4 4 0 00-4 4v8a4 4 0 004 4h12a4 4 0 004-4v-2h-2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"></path></svg>;

  return (
    <Layout>
      {/* Hero Section */}
      <div className="text-center py-16">
        <img src="/logos/safecloud_logo.png" alt="SAFE Cloud" className="h-40 w-auto mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
          Bienvenido a SAFE Cloud
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Centraliza proyectos, documentación y soporte en un entorno seguro. Gestiona tus
          operaciones con confianza.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Acceder a la plataforma
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Crear cuenta
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 my-16">
        <Card title="Proyectos" hoverable>
          <p className="text-gray-600 mb-4">
            Planifica, asigna tareas y controla avances en tiempo real.
          </p>
          <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
            Explorar →
          </Link>
        </Card>

        <Card title="Documentos" hoverable>
          <p className="text-gray-600 mb-4">
            Versiona, organiza y comparte documentación con permisos granulares.
          </p>
          <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
            Explorar →
          </Link>
        </Card>

        <Card title="Tickets" hoverable>
          <p className="text-gray-600 mb-4">
            Gestiona solicitudes de soporte con estados y trazabilidad completa.
          </p>
          <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
            Explorar →
          </Link>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="bg-primary-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 my-16 rounded-lg">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            ¿Por qué elegir SAFE Cloud?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-500 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Seguridad Avanzada</h3>
                <p className="text-gray-600 text-sm">
                  Encriptación de datos, auditoría completa y cumplimiento normativo.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-500 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Rendimiento</h3>
                <p className="text-gray-600 text-sm">
                  Infraestructura escalable y respuesta en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-500 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"></path></svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Confiable</h3>
                <p className="text-gray-600 text-sm">
                  SLA de 99.9% y soporte técnico 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-12">
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          Listo para comenzar?
        </h2>
        <p className="text-gray-600 mb-8">
          Accede a tu cuenta o crea una nueva en segundos.
        </p>
        <Link href="/register">
          <Button variant="primary" size="lg">
            Comenzar Ahora
          </Button>
        </Link>
      </div>
    </Layout>
  );
};

export default IndexPage;
