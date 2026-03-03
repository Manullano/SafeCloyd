/**
 * Protected Route Component
 * Guards routes based on user role and permissions
 */
import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/stores/auth';
import { usePermission, UserRole } from '@/context/PermissionContext';

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredModule?: string;
  requiredAction?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredModule,
  requiredAction,
  fallback,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { role, canAccess, isLoading } = usePermission();

  if (isLoading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  // Check if user is authenticated
  if (!user || !role) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder a este recurso.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      )
    );
  }

  // Check required role
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(role)) {
      return (
        fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              Tu rol ({role}) no tiene permiso para acceder a esta sección.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver al Dashboard
            </button>
          </div>
        )
      );
    }
  }

  // Check required permission
  if (requiredModule && requiredAction) {
    if (!canAccess(requiredModule, requiredAction)) {
      return (
        fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes permiso para {requiredAction} en {requiredModule}.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver al Dashboard
            </button>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
};

/**
 * Higher-order component to protect a component
 * Usage: withProtectedRoute(MyComponent, { requiredRole: 'CLIENT_ADMIN' })
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  const Wrapped = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  Wrapped.displayName = `withProtectedRoute(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
