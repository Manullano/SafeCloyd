import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/auth';

const LoginPage = () => {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      console.log('[LOGIN DEBUG] Using API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('[LOGIN DEBUG] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Credenciales inválidas');
      }

      const data = await response.json();
      console.log('[LOGIN DEBUG] Login successful, saving tokens and user...');
      
      // Guardar tokens y usuario en Zustand + localStorage
      const user = data.user;
      const accessToken = data.access;
      const refreshToken = data.refresh;
      
      // Usar setUser y setTokens del store
      setUser(user);
      setTokens(accessToken, refreshToken);
      
      // Esperar un poco para que Zustand persista
      setTimeout(() => {
        console.log('[LOGIN DEBUG] Redirecting to dashboard...');
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      setError(err.message || 'Error al iniciar sesión');
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
            <p className="text-gray-500 text-sm mt-2">Accede a tu plataforma segura</p>
          </div>

          <form onSubmit={handleSubmit}>
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

            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mb-4" size="md">
              {loading ? 'Checking credentials...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿Primera vez aquí?</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            No tienes cuenta?{' '}
            <Link href="/register" className="text-primary-500 hover:text-primary-600 font-semibold">
              Regístrate aquí
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
