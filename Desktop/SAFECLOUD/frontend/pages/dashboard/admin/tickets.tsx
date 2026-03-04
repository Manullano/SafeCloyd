import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  company?: string;
  assigned_to?: string;
  created_at: string;
}

const AdminTicketsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { isSuperAdmin } = useCanAccess();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [assigningTo, setAssigningTo] = useState('');

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchTickets();
    fetchStaffUsers();
  }, [user, authLoading, isSuperAdmin, router, access_token]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(Array.isArray(data.results) ? data.results : data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/companies/users/?role=STAFF_SUPPORT&role=STAFF_PM`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaffUsers(Array.isArray(data.results) ? data.results : data);
      }
    } catch (error) {
      console.error('Error fetching staff users:', error);
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/change_status/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Error changing ticket status:', error);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    if (!assigningTo) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/assign/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to: assigningTo }),
      });

      if (response.ok) {
        setAssigningTo('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA':
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIA':
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAJA':
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABIERTO':
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'EN_PROGRESO':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ESPERANDO_CLIENTE':
      case 'WAITING_CUSTOMER':
        return 'bg-purple-100 text-purple-800';
      case 'RESUELTO':
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800';
      case 'CERRADO':
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus && ticket.status !== filterStatus) return false;
    if (filterPriority && ticket.priority !== filterPriority) return false;
    return true;
  });

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tickets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tienes acceso a esta página.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Gestión de Tickets (Todas las Empresas)</h1>
        <p className="text-gray-500 mt-2">Administra tickets globales, asigna a staff y cambia estados.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-4 flex-wrap">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="ABIERTO">Abierto</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="ESPERANDO_CLIENTE">Esperando Cliente</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="CERRADO">Cerrado</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">Todas las prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              setFilterStatus('');
              setFilterPriority('');
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} hoverable>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{ticket.description}</p>
                  <div className="mt-3 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    {ticket.assigned_to && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Asignado: {ticket.assigned_to}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDetailsModal(true);
                    }}
                  >
                    Ver Detalle
                  </Button>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={ticket.status}
                    onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
                  >
                    <option value="ABIERTO">Abierto</option>
                    <option value="EN_PROGRESO">En Progreso</option>
                    <option value="ESPERANDO_CLIENTE">Esperando Cliente</option>
                    <option value="RESUELTO">Resuelto</option>
                    <option value="CERRADO">Cerrado</option>
                  </select>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No hay tickets con los filtros seleccionados.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-screen overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{selectedTicket.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600">{selectedTicket.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Estado</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Prioridad</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Asignar a Staff</h3>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    value={assigningTo}
                    onChange={(e) => setAssigningTo(e.target.value)}
                  >
                    <option value="">Seleccionar staff</option>
                    {staffUsers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.role})
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    onClick={() => handleAssignTicket(selectedTicket.id)}
                  >
                    Asignar
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default AdminTicketsPage;
