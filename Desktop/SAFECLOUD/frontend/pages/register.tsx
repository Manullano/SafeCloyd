import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';
import { useRouter } from 'next/router';

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrarse');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-0 shadow-card">
          <div className="text-center mb-8">
            <img src="/logos/safecloud_logo.png" alt="SAFE Cloud" className="h-32 w-auto mx-auto mb-4" />
            <p className="text-gray-500 text-sm mt-2">Únete a SAFE Cloud</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Nombre Completo"
              name="full_name"
              type="text"
              placeholder="Tu nombre"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="tu@empresa.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Confirmar Contraseña"
              name="password_confirm"
              type="password"
              placeholder="••••••••"
              value={formData.password_confirm}
              onChange={handleChange}
              required
            />

            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mb-4" size="md">
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿Ya tienes cuenta?</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
              Inicia sesión aquí
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default RegisterPage;
