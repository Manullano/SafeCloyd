import React, { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { Icons } from '@/lib/icons';

type Step = 'welcome' | 'company' | 'admin' | 'review' | 'success';

interface Plan {
  id: string;
  name: string;
  name_display: string;
  max_users: number;
  max_projects: number;
  price: number;
  is_active: boolean;
}

interface CompanyData {
  name: string;
  slug: string;
  email: string;
  plan: string | null;
  rut?: string;
  industry?: string;
}

interface AdminData {
  name: string;
  email: string;
  phone?: string;
}

interface ClientOnboardingWizardProps {
  onClose?: () => void;
}

export default function ClientOnboardingWizard({ onClose }: ClientOnboardingWizardProps) {
  const { access_token } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    slug: '',
    email: '',
    plan: null,
  });

  const [adminData, setAdminData] = useState<AdminData>({
    name: '',
    email: '',
  });

  // Cargar planes cuando el componente monta
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/companies/plans/', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });
        if (res.ok) {
          let data = await res.json();
          
          // Manejar diferentes estructuras de respuesta del backend
          let plansArray: Plan[] = [];
          if (Array.isArray(data)) {
            plansArray = data;
          } else if (data.results && Array.isArray(data.results)) {
            plansArray = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            plansArray = data.data;
          }
          
          setPlans(plansArray);
          
          // Seleccionar el primer plan por defecto (PRO)
          if (plansArray.length > 0) {
            const proOrDefault = plansArray.find((p: Plan) => p.name === 'PRO') || plansArray[0];
            setCompanyData((prev) => ({ ...prev, plan: proOrDefault.id.toString() }));
          }
        }
      } catch (err) {
        console.error('Error cargando planes:', err);
        setPlans([]);
      }
    };

    if (access_token) {
      fetchPlans();
    }
  }, [access_token]);

  // Generar slug automáticamente desde nombre
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCompanyData({
      ...companyData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleNextCompany = () => {
    if (!companyData.name || !companyData.email || !companyData.slug) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }
    setError('');
    setStep('admin');
  };

  const handleNextAdmin = () => {
    if (!adminData.name || !adminData.email) {
      setError('Por favor completa todos los campos del administrador');
      return;
    }
    setError('');
    setStep('review');
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');

    if (!access_token) {
      setError('No autorizado. Por favor inicie sesión.');
      setLoading(false);
      return;
    }

    try {
      // Create company - /api/companies/
      const companyRes = await fetch('http://localhost:8000/api/companies/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          name: companyData.name,
          email: companyData.email,
          plan: companyData.plan,
          rut: companyData.rut || null,
          industry: companyData.industry || null,
        }),
      });

      if (!companyRes.ok) {
        const errorData = await companyRes.json();
        throw new Error(errorData.detail || JSON.stringify(errorData) || 'Error creando empresa');
      }

      const company = await companyRes.json();

      // Create admin user - /api/companies/users/
      const adminRes = await fetch('http://localhost:8000/api/companies/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          email: adminData.email,
          full_name: adminData.name,
          password: 'TemporaryPassword123!', // Será cambiada por el usuario
          role: 'CLIENT_ADMIN',
          company: company.id,
        }),
      });

      if (!adminRes.ok) {
        const errorData = await adminRes.json();
        throw new Error(errorData.detail || JSON.stringify(errorData) || 'Error creando administrador');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Incorporar Nuevo Cliente</h1>
            <div className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Paso {step === 'welcome' ? 1 : step === 'company' ? 1 : step === 'admin' ? 2 : step === 'review' ? 3 : 4} de 4
            </div>
          </div>
          <p className="text-blue-100 mt-2">Proceso profesional de onboarding completo</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* WELCOME */}
          {step === 'welcome' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-semibold text-blue-900 mb-2">✨ Bienvenido al Flujo de Incorporación</h3>
                <p className="text-blue-700 text-sm">
                  Este es un proceso profesional que te guiará paso a paso para incorporar un nuevo cliente.
                  Al finalizar, la empresa estará creada con su administrador listo para operar.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Lo que haremos:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 mt-1">✓</span>
                    <span className="text-gray-700"><strong>Paso 1:</strong> Datos de la empresa</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 mt-1">✓</span>
                    <span className="text-gray-700"><strong>Paso 2:</strong> Crear administrador</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 mt-1">✓</span>
                    <span className="text-gray-700"><strong>Paso 3:</strong> Revisar información</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 mt-1">✓</span>
                    <span className="text-gray-700"><strong>Paso 4:</strong> Enviar invitación</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                <p className="text-amber-700 text-sm">
                  💡 <strong>Nota:</strong> El administrador del cliente recibirá un email con un link para crear su contraseña
                  y comenzar a usar SAFE Cloud de inmediato.
                </p>
              </div>
            </div>
          )}

          {/* COMPANY DATA */}
          {step === 'company' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={handleCompanyNameChange}
                  placeholder="Ej: Geom Industrial SpA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador Único (slug) *
                </label>
                <input
                  type="text"
                  value={companyData.slug}
                  onChange={(e) => setCompanyData({ ...companyData, slug: e.target.value })}
                  placeholder="ej-geom-industrial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">Se genera automáticamente desde el nombre</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contacto *
                </label>
                <input
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  placeholder="contacto@geomindustrial.cl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan *
                  </label>
                  <select
                    value={companyData.plan || ''}
                    onChange={(e) => {
                      const planValue = e.target.value;
                      setCompanyData({ 
                        ...companyData, 
                        plan: planValue
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industria
                  </label>
                  <input
                    type="text"
                    value={companyData.industry || ''}
                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                    placeholder="Ej: Energía Renovable"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT (opcional)
                </label>
                <input
                  type="text"
                  value={companyData.rut || ''}
                  onChange={(e) => setCompanyData({ ...companyData, rut: e.target.value })}
                  placeholder="76.123.456-k"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ADMIN DATA */}
          {step === 'admin' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">Administrador del Cliente</h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-blue-700 text-sm">
                  Este usuario tendrá acceso administrativo a la empresa y será el responsable del onboarding.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  placeholder="Ej: Manuel Llano Bocaz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  placeholder="admin@geomindustrial.cl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Recibirá un email con link para crear contraseña
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={adminData.phone || ''}
                  onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* REVIEW */}
          {step === 'review' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">Revisar Información</h3>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-5 h-5 mr-2">🏢</span>
                    Empresa
                  </h4>
                  <div className="space-y-2 ml-7">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium text-gray-900">{companyData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slug:</span>
                      <span className="font-medium text-gray-900">{companyData.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{companyData.email}</span>
                    </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium text-blue-600">
                          {companyData.plan ? (
                            plans.find(p => p.id === companyData.plan)?.name_display || 'Plan seleccionado'
                          ) : (
                            'Sin seleccionar'
                          )}
                        </span>
                      </div>
                    {companyData.industry && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Industria:</span>
                        <span className="font-medium text-gray-900">{companyData.industry}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-5 h-5 mr-2">👤</span>
                    Administrador
                  </h4>
                  <div className="space-y-2 ml-7">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium text-gray-900">{adminData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{adminData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rol:</span>
                      <span className="font-medium text-green-600">CLIENT_ADMIN</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-yellow-700 text-sm">
                  ✉️ Al confirmar, se enviará un email a <strong>{adminData.email}</strong> con instrucciones para 
                  crear contraseña e iniciar sesión.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✅</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Cliente Incorporado!</h3>
                <p className="text-gray-600">
                  {companyData.name} ha sido creado exitosamente
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 text-left">
                <h4 className="font-semibold text-green-900 mb-2">✓ Completado:</h4>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>✓ Empresa creada con plan {companyData.plan ? plans.find(p => p.id === companyData.plan)?.name_display : 'PRO'}</li>
                  <li>✓ Administrador {adminData.name} creado</li>
                  <li>✓ Email de bienvenida enviado a {adminData.email}</li>
                  <li>✓ Ambiente listo para el cliente</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Próximos Pasos:</h4>
                <ol className="space-y-2 text-blue-700 text-sm">
                  <li>1. El cliente recibe email en {adminData.email}</li>
                  <li>2. Cliente crea su contraseña mediante link seguro</li>
                  <li>3. Cliente inicia sesión en SAFE Cloud</li>
                  <li>4. Cliente crea proyectos y agrega usuarios</li>
                  <li>5. Comenzar operación</li>
                </ol>
              </div>
            </div>
          )}

          {/* Error global */}
          {error && step !== 'review' && step !== 'company' && step !== 'admin' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 border-t px-8 py-4 flex justify-between">
          {step !== 'welcome' && step !== 'success' && (
            <button
              onClick={() => {
                setError('');
                if (step === 'admin') setStep('company');
                else if (step === 'review') setStep('admin');
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              ← Atrás
            </button>
          )}

          {step === 'welcome' && (
            <div />
          )}

          <div className="flex gap-3 ml-auto">
            {step !== 'success' && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
            )}

            {step === 'welcome' && (
              <button
                onClick={() => setStep('company')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Comenzar →
              </button>
            )}

            {step === 'company' && (
              <button
                onClick={handleNextCompany}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Siguiente →
              </button>
            )}

            {step === 'admin' && (
              <button
                onClick={handleNextAdmin}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Revisar →
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Confirmar Incorporación'}
              </button>
            )}

            {step === 'success' && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
