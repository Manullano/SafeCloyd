import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useCanAccess } from '@/hooks/useCanAccess';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isNavOpen, toggleNav, closeNav } = useUIStore();
  const { isSuperAdmin } = useCanAccess();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Build navigation based on role
  const getNavLinks = () => {
    if (!user) return [];

    // STAFF_PM (Gestor de Proyectos)
    if (user.role === 'STAFF_PM') {
      return [
        { name: 'Panel', href: '/dashboard' },
        { name: '🎯 Kanban', href: '/dashboard/kanban' },
        { name: '📁 Mis Proyectos', href: '/dashboard/staff/projects' },
        { name: '📄 Documentos', href: '/dashboard/documents' },
        { name: '🎫 Tickets', href: '/dashboard/tickets' },
        { name: '🔐 Auditoría', href: '/dashboard/audit' },
      ];
    }

    // STAFF_SUPPORT
    if (user.role === 'STAFF_SUPPORT') {
      return [
        { name: 'Panel', href: '/dashboard' },
        { name: '🎫 Panel de Soporte', href: '/dashboard/staff/tickets' },
        { name: '📄 Documentos', href: '/dashboard/documents' },
        { name: '💬 Comentarios', href: '/dashboard' },
      ];
    }

    // CLIENT_ADMIN, CLIENT_USER, CLIENT_VIEWER
    if (user.role?.startsWith('CLIENT_')) {
      return [
        { name: 'Panel', href: '/dashboard/client' },
        { name: '🎯 Kanban', href: '/dashboard/kanban' },
        { name: '📁 Proyectos', href: '/dashboard/projects' },
        { name: '📄 Documentos', href: '/dashboard/documents' },
        { name: '🎫 Tickets', href: '/dashboard/tickets' },
      ];
    }

    // Default
    return [
      { name: 'Panel', href: '/dashboard' },
    ];
  };

  const navLinks = [
    ...getNavLinks(),
    ...(isSuperAdmin ? [
      { name: '📊 Analytics', href: '/dashboard/analytics' },
      { name: '🔎 Auditoría', href: '/dashboard/audit/trail' },
      { name: '⚙️ Administración', href: '/dashboard/settings' },
    ] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logos/safecloud_logo.png" alt="SAFE Cloud" className="h-14 w-auto" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  router.pathname === link.href
                    ? 'bg-primary-50 text-primary-500'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <NotificationCenter />

                <button
                  onClick={() => router.push('/dashboard/tickets')}
                  className="hidden sm:flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Crear Ticket
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>

                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-500">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-error p-1 rounded transition-colors"
                    title="Cerrar sesión"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-primary-500 hover:text-primary-600"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleNav}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50"
            >
              {isNavOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isNavOpen && user && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                onClick={closeNav}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => router.push('/dashboard/tickets')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Crear Ticket
            </button>
            <button
              onClick={() => {
                handleLogout();
                closeNav();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-error hover:bg-red-50 rounded-lg text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
