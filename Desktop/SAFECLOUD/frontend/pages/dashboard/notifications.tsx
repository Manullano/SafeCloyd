import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useRouter } from 'next/router';

const NotificationsDashboard = () => {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [filterType, setFilterType] = useState<string>('ALL');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'INFO':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-50 border-green-200 border-l-4 border-l-green-500';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
      case 'ERROR':
        return 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
      case 'INFO':
      default:
        return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
    }
  };

  const filteredNotifications = filterType === 'ALL'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">🔔 Centro de Notificaciones</h1>
        <p className="text-gray-600 mt-2">Todas tus notificaciones en un solo lugar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
            <p className="text-4xl font-bold text-gray-900">{notifications.length}</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Sin Leer</p>
            <p className="text-4xl font-bold text-blue-600">{unreadCount}</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Éxito</p>
            <p className="text-4xl font-bold text-green-600">
              {notifications.filter(n => n.type === 'SUCCESS').length}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Errores</p>
            <p className="text-4xl font-bold text-red-600">
              {notifications.filter(n => n.type === 'ERROR').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            {['ALL', 'SUCCESS', 'WARNING', 'ERROR', 'INFO'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'ALL' ? '📋 Todas' : type}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              onClick={markAllAsRead}
              className="text-sm"
            >
              ✓ Marcar todas como leídas
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getNotificationColor(notification.type)} ${
                notification.read ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <span className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                      {!notification.read && (
                        <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(notification.timestamp).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700">{notification.message}</p>

                  {notification.related_entity && (
                    <p className="text-xs text-gray-600 mt-2 opacity-75">
                      📍 {notification.related_entity} {notification.related_id && `(ID: ${notification.related_id})`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {notification.action_url && (
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-3 whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(notification.action_url!);
                      }}
                    >
                      Ver →
                    </Button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Card>
            <div className="text-center py-16">
              <p className="text-gray-500 text-xl">
                {filterType === 'ALL' 
                  ? '📭 No tienes notificaciones' 
                  : `📭 No tienes notificaciones de tipo ${filterType}`}
              </p>
              <p className="text-gray-400 mt-2">
                Recibirás notificaciones cuando suceda algo importante
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsDashboard;
