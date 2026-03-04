'use client';

import { useCallback, useMemo } from 'react';
import React from 'react';
import { usePermission } from '@/context/PermissionContext';

/**
 * useCanAccess Hook
 */
export const useCanAccess = () => {
  const { canAccess, canAccessModule, role, permissions } = usePermission();

  const can = useCallback(
    (module: string, action: string): boolean => {
      return canAccess(module, action);
    },
    [canAccess]
  );

  const canView = useCallback(
    (module: string): boolean => {
      return canAccess(module, 'VIEW');
    },
    [canAccess]
  );

  const canCreate = useCallback(
    (module: string): boolean => {
      return canAccess(module, 'CREATE');
    },
    [canAccess]
  );

  const canEdit = useCallback(
    (module: string): boolean => {
      return canAccess(module, 'EDIT');
    },
    [canAccess]
  );

  const canDelete = useCallback(
    (module: string): boolean => {
      return canAccess(module, 'DELETE');
    },
    [canAccess]
  );

  const canDownload = useCallback(
    (module: string): boolean => {
      return canAccess(module, 'DOWNLOAD');
    },
    [canAccess]
  );

  const isSuperAdmin = useMemo(() => role === 'SUPERADMIN', [role]);

  const isStaff = useMemo(
    () => role?.startsWith('STAFF_') || role === 'SUPERADMIN',
    [role]
  );

  const isClientAdmin = useMemo(() => role === 'CLIENT_ADMIN', [role]);

  const isClient = useMemo(
    () => role?.startsWith('CLIENT_') || false,
    [role]
  );

  const isViewer = useMemo(() => role === 'CLIENT_VIEWER', [role]);

  return {
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canDownload,
    canAccessModule,
    role,
    isSuperAdmin,
    isStaff,
    isClientAdmin,
    isClient,
    isViewer,
    permissions,
  };
};

/**
 * IfCan Component
 */
interface IfCanProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const IfCan: React.FC<IfCanProps> = ({
  module,
  action,
  children,
  fallback = null,
}) => {
  const { can } = useCanAccess();
  return <>{can(module, action) ? children : fallback}</>;
};

/**
 * IfRole Component
 */
interface IfRoleProps {
  roles: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const IfRole: React.FC<IfRoleProps> = ({ 
  roles, 
  children, 
  fallback = null 
}) => {
  const { role } = useCanAccess();
  const rolesArray = typeof roles === 'string' ? [roles] : roles;
  return <>{rolesArray.includes(role || '') ? children : fallback}</>;
};
