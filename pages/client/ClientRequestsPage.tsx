
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClientRequest, ClientRequestStatus, ClientRequestCategory } from '../../types';
import { getRequestsByClientId } from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { formatDate } from '../../utils/helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import Pagination from '../../components/Pagination';
import { PlusCircle, Eye, MessageSquare } from 'lucide-react';
import Modal from '../../components/Modal';

const requestStatusColors: Record<ClientRequestStatus, string> = {
  Open: 'bg-status-new text-white',
  'In Progress': 'bg-status-review text-black',
  Resolved: 'bg-status-completed text-white',
  Closed: 'bg-gray-500 text-white',
};

const ClientRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<ClientRequestStatus | ''>('');
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user || !user.username) {
      setError("User information not available.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRequests = await getRequestsByClientId(user.username);
      setRequests(fetchedRequests);
    } catch (err) {
      setError('Failed to load your requests. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => 
      statusFilter ? request.status === statusFilter : true
    );
  }, [requests, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openDetailModal = (request: ClientRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  if (isLoading && requests.length === 0) {
    return <div className="p-8"><LoadingSpinner message="Loading your requests..." /></div>;
  }

  if (error && requests.length === 0) {
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-text-light">My Requests</h1>
          <Link to="/portal/requests/new">
            <Button variant="primary" leftIcon={<PlusCircle size={20} />}>
              Submit New Request
            </Button>
          </Link>
        </div>

        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-brand-text-light-secondary mb-1">Filter by status:</label>
          <select
            id="statusFilter"
            name="statusFilter"
            className="mt-1 block w-full md:w-1/3 px-3 py-2 bg-slate-700 text-brand-text-light border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
            value={statusFilter}
            onChange={(e) => {setStatusFilter(e.target.value as ClientRequestStatus | ''); setCurrentPage(1);}}
          >
            <option value="">All Statuses</option>
            {(Object.keys(requestStatusColors) as ClientRequestStatus[]).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        {error && 
            <div className="my-4 p-3 text-sm text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>
        }

        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedRequests.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
              <MessageSquare size={48} className="mx-auto mb-4" />
              <p className="text-xl font-semibold">No requests found.</p>
              <p>Try adjusting your filters or submit a new request if you need assistance.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Request ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Submitted</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {paginatedRequests.map(request => (
                  <tr key={request.id} className="hover:bg-slate-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-light">{request.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light max-w-xs truncate" title={request.subject}>{request.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{request.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${requestStatusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(request.submittedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => openDetailModal(request)} title="View Details">
                        <Eye size={16} /> <span className="ml-1 hidden sm:inline">Details</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {paginatedRequests.length > 0 && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      {selectedRequest && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Request Details: ${selectedRequest.id}`}
          size="lg"
        >
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-brand-text-light-secondary">Subject</h3>
                    <p className="text-brand-text-light">{selectedRequest.subject}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-medium text-brand-text-light-secondary">Category</h3>
                    <p className="text-brand-text-light">{selectedRequest.category}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-brand-text-light-secondary">Status</h3>
                    <p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${requestStatusColors[selectedRequest.status]}`}>
                            {selectedRequest.status}
                        </span>
                    </p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-brand-text-light-secondary">Description</h3>
                    <p className="text-brand-text-light whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-brand-text-light-secondary">Submitted At</h3>
                    <p className="text-brand-text-light">{formatDate(selectedRequest.submittedAt)}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-brand-text-light-secondary">Last Updated</h3>
                    <p className="text-brand-text-light">{formatDate(selectedRequest.lastUpdatedAt)}</p>
                </div>
                {selectedRequest.resolvedAt && (
                    <div>
                        <h3 className="text-sm font-medium text-brand-text-light-secondary">Resolved At</h3>
                        <p className="text-brand-text-light">{formatDate(selectedRequest.resolvedAt)}</p>
                    </div>
                )}
            </div>
             <div className="mt-6 flex justify-end">
                <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientRequestsPage;
