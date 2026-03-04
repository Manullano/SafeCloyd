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
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  company?: {
    id: string;
    name: string;
  };
  assigned_to?: string;
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at?: string;
  due_date?: string;
  sla_hours?: number;
}

interface Comment {
  id: string;
  entity: string; // 'TICKET', 'PROJECT', etc
  entity_id: string;
  content: string;
  is_internal: boolean;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
}

interface KPI {
  open: number;
  critical: number;
  sla_warning: number;
  waiting_customer: number;
}

const StaffTicketsDashboard = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { isSuperAdmin } = useCanAccess();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [comments, setComments] = useState<{[key: string]: Comment[]}>({});
  const [kpis, setKpis] = useState<KPI>({ open: 0, critical: 0, sla_warning: 0, waiting_customer: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filter & Modal states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    
    // Only STAFF_SUPPORT can access this (or SUPERADMIN)
    if (!user.role || (!user.role.includes('STAFF') && !isSuperAdmin)) {
      router.push('/dashboard');
      return;
    }
    
    fetchTickets();
  }, [user, authLoading, access_token, isSuperAdmin, router]);

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
        const ticketList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setTickets(ticketList);
        calculateKPIs(ticketList);
        
        // Fetch comments for each ticket
        await fetchAllComments(ticketList);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllComments = async (ticketList: Ticket[]) => {
    const allComments: {[key: string]: Comment[]} = {};
    
    for (const ticket of ticketList) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        // Use the nested comments endpoint on the ticket
        const response = await fetch(`${apiUrl}/tickets/tickets/${ticket.id}/comments/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          allComments[ticket.id] = Array.isArray(data) ? data : (data.results ? data.results : []);
        }
      } catch (error) {
        console.error(`Error fetching comments for ticket ${ticket.id}:`, error);
      }
    }
    
    setComments(allComments);
  };

  const calculateKPIs = (ticketList: Ticket[]) => {
    const now = new Date();
    const openCount = ticketList.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
    const criticalCount = ticketList.filter(t => t.priority === 'CRITICAL' && t.status !== 'CLOSED').length;
    const waitingCount = ticketList.filter(t => t.status === 'WAITING_CUSTOMER').length;
    
    // SLA warning: tickets with due_date within 4 hours
    const slaWarningCount = ticketList.filter(ticket => {
      if (!ticket.due_date || ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') return false;
      const dueDate = new Date(ticket.due_date);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDue < 4 && hoursUntilDue >= 0;
    }).length;

    setKpis({
      open: openCount,
      critical: criticalCount,
      sla_warning: slaWarningCount,
      waiting_customer: waitingCount,
    });
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSelectedTicket(null);
        setShowDetailsModal(false);
        fetchTickets();
      } else {
        alert('Error al cambiar estado del ticket');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Error al cambiar estado');
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to: user?.id }),
      });

      if (response.ok) {
        setSelectedTicket(null);
        setShowDetailsModal(false);
        fetchTickets();
        alert('✅ Ticket asignado a ti');
      } else {
        alert('Error al asignar ticket');
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (response.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    try {
      setCommentLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // Use the add_comment action endpoint on the ticket
      const response = await fetch(`${apiUrl}/tickets/tickets/${selectedTicket.id}/add_comment/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComment,
          is_internal: isInternalComment,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setIsInternalComment(false);
        // Refresh comments by re-fetching for this ticket
        const apiUrl2 = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const commentsResponse = await fetch(
          `${apiUrl2}/tickets/tickets/${selectedTicket.id}/comments/`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          setComments({
            ...comments,
            [selectedTicket.id]: Array.isArray(data) ? data : (data.results ? data.results : []),
          });
        }
      } else {
        alert('Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar comentario');
    } finally {
      setCommentLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'WAITING_CUSTOMER':
        return 'bg-orange-100 text-orange-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: {[key: string]: string} = {
      'OPEN': '🔴 Abierto',
      'IN_PROGRESS': '🟡 En Progreso',
      'WAITING_CUSTOMER': '⏳ Esperando Cliente',
      'RESOLVED': '✅ Resuelto',
      'CLOSED': '🔒 Cerrado',
    };
    return labels[status] || status;
  };

  const filteredTickets = tickets.filter(ticket => {
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
            <p className="text-gray-600">Cargando tickets de soporte...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">🎫 Panel de Soporte</h1>
        <p className="text-gray-500 mt-2">Gestiona tickets y ayuda a los clientes.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Tickets Abiertos</p>
              <p className="text-3xl font-bold text-red-700">{kpis.open}</p>
            </div>
            <div className="text-4xl">🔴</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-2">Críticos</p>
              <p className="text-3xl font-bold text-orange-700">{kpis.critical}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 mb-2">Vencen SLA</p>
              <p className="text-3xl font-bold text-yellow-700">{kpis.sla_warning}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-2">Esperando Cliente</p>
              <p className="text-3xl font-bold text-purple-700">{kpis.waiting_customer}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">📋 Todos los estados</option>
            <option value="OPEN">🔴 Abiertos</option>
            <option value="IN_PROGRESS">🟡 En Progreso</option>
            <option value="WAITING_CUSTOMER">⏳ Esperando Cliente</option>
            <option value="RESOLVED">✅ Resueltos</option>
            <option value="CLOSED">🔒 Cerrados</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">⭐ Todas las prioridades</option>
            <option value="CRITICAL">🔴 Crítica</option>
            <option value="HIGH">🟠 Alta</option>
            <option value="MEDIUM">🟡 Media</option>
            <option value="LOW">🟢 Baja</option>
          </select>

          <Button variant="secondary" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>
            🔄 Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ticket</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Empresa</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Prioridad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Asignado a</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Creado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{ticket.title}</span>
                        <span className="text-xs text-gray-500">ID: {ticket.id.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.company?.name || 'Sin asignación'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.assigned_user?.full_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Button
                        variant="primary"
                        className="text-xs py-1 px-2"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetailsModal(true);
                        }}
                      >
                        📋 Detalles
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay tickets con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedTicket.title}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="OPEN">🔴 Abierto</option>
                    <option value="IN_PROGRESS">🟡 En Progreso</option>
                    <option value="WAITING_CUSTOMER">⏳ Esperando Cliente</option>
                    <option value="RESOLVED">✅ Resuelto</option>
                    <option value="CLOSED">🔒 Cerrado</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Prioridad</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">🟢 Baja</option>
                    <option value="MEDIUM">🟡 Media</option>
                    <option value="HIGH">🟠 Alta</option>
                    <option value="CRITICAL">🔴 Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Empresa</label>
                  <p className="mt-1 text-gray-900">{selectedTicket.company?.name || 'Sin asignación'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Asignado a</label>
                  <p className="mt-1 text-gray-900">{selectedTicket.assigned_user?.full_name || 'Sin asignar'}</p>
                </div>
              </div>

              {/* Take Button */}
              {!selectedTicket.assigned_to && (
                <Button variant="primary" onClick={() => handleAssignToMe(selectedTicket.id)}>
                  ✋ Tomar Ticket
                </Button>
              )}

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="mt-2 text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTicket.description}</p>
              </div>

              {/* Comments Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Comentarios</h3>
                
                {/* Comments List */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                  {comments[selectedTicket.id]?.length > 0 ? (
                    comments[selectedTicket.id].map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg ${
                          comment.is_internal ? 'bg-yellow-100 border-l-4 border-yellow-500' : 'bg-white border-l-4 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{comment.user?.full_name || 'Admin'}</span>
                          {comment.is_internal && <span className="text-xs bg-yellow-200 px-2 py-1 rounded">🔒 Interna</span>}
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Sin comentarios aún</p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">🔒 Nota interna (solo staff ve)</span>
                    </label>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleAddComment}
                    disabled={commentLoading || !newComment.trim()}
                  >
                    {commentLoading ? '⏳ Enviando...' : '📤 Agregar Comentario'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StaffTicketsDashboard;
