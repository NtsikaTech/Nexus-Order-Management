
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import { 
  getOrders as fetchOrders, 
  deleteOrder as apiDeleteOrder
} from '../services/orderService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/helpers';
import { ORDER_STATUS_OPTIONS, ITEMS_PER_PAGE } from '../constants';

const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [isStorageFull, setIsStorageFull] = useState<boolean>(false); 

  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);


  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await fetchOrders();
      setOrders(fetchedOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError('Failed to load orders. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearchTerm = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.packageName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      return matchesSearchTerm && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const openDeleteModal = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setOrderToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await apiDeleteOrder(orderToDelete.id);
      await loadOrders(); // Re-fetch orders after deletion
      closeDeleteModal();
    } catch (err) {
      setError(`Failed to delete order ${orderToDelete.id}.`);
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading && orders.length === 0) { 
    return <div className="p-8"><LoadingSpinner message="Loading orders..." /></div>;
  }

  if (error && orders.length === 0) { 
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }
  
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-brand-text-light">Order Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsStorageFull(prev => !prev)} variant={isStorageFull ? "warning" : "secondary"} size="sm">
              {isStorageFull ? "Resolve Storage Issue" : "Simulate Storage Full"}
            </Button>
            <Link to="/orders/new">
              <Button variant="primary" leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}>
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {isStorageFull && (
          <div className="mb-6 p-4 bg-yellow-600 border-l-4 border-yellow-400 text-yellow-100 rounded-md">
            <p className="font-bold">Storage Alert</p>
            <p>Due to current storage limitations, access to certain domain functions such as email deletion is restricted. Kindly upgrade your package to restore full functionality.</p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="searchTerm"
              placeholder="Search by ID, client, service..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <Input
              as="select"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setCurrentPage(1); }}
              options={[{ value: '', label: 'All Statuses' }, ...ORDER_STATUS_OPTIONS.map(s => ({ value: s, label: s }))]}
            />
          </div>
        </div>
        
        {error && 
            <div className="my-4 p-3 text-sm text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>
        }
        
        {/* Orders List / Table */}
        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedOrders.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-brand-text-light-secondary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.25 2.25v3.75M2.25 13.5h3.86a2.25 2.25 0 002.25-2.25V6.75M2.25 13.5V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25H5.106M12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              <p className="text-xl font-semibold">No orders found.</p>
              <p>Try adjusting your search or filter, or create a new order.</p>
            </div>
          ) : (
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {paginatedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-600 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-accent hover:underline">
                    <Link to={`/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">
                    <div>{order.client.name}</div>
                    <div className="text-xs text-brand-text-light-secondary">{order.client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">
                     <div>{order.serviceType}</div>
                     <div className="text-xs ">{order.packageName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link to={`/orders/${order.id}`} className="text-brand-accent hover:text-brand-accent-hover">View</Link>
                    <button onClick={() => openDeleteModal(order)} className="text-red-500 hover:text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        
        {paginatedOrders.length > 0 && totalPages > 1 && (
           <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Confirm Deletion"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteOrder} isLoading={isDeleting} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </Button>
          </div>
        }
      >
        <p className="text-brand-text-light">Are you sure you want to delete order <span className="font-semibold">{orderToDelete?.id}</span> for client <span className="font-semibold">{orderToDelete?.client.name}</span>?</p>
        <p className="text-sm text-brand-text-light-secondary mt-2">This action cannot be undone.</p>
      </Modal>

    </div>
  );
};

export default DashboardPage;
