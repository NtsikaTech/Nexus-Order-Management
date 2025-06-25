import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import { getOrders as fetchOrders } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/helpers';
import { ORDER_STATUS_OPTIONS, ITEMS_PER_PAGE } from '../../constants';
import { Eye, PlusCircle } from 'lucide-react';

const ClientOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadOrders = useCallback(async () => {
    if (!user || !user.username) {
        setError("User information not available.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await fetchOrders();
      // Filter orders for the current client (username is email)
      const clientOrders = fetchedOrders.filter(order => order.client.email.toLowerCase() === user.username.toLowerCase());
      setAllOrders(clientOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError('Failed to load your orders. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesSearchTerm = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.packageName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      return matchesSearchTerm && matchesStatus;
    });
  }, [allOrders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  if (isLoading && allOrders.length === 0) { 
    return <div className="p-8"><LoadingSpinner message="Loading your orders..." /></div>;
  }

  if (error && allOrders.length === 0) { 
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }
  
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-brand-text-light">My Orders</h1>
           <Link to="/portal/services/new">
              <Button variant="primary" leftIcon={<PlusCircle size={20} />}>
                Place New Service Order
              </Button>
            </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="searchTerm"
              placeholder="Search by Order ID, service..."
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
        
        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedOrders.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-brand-text-light-secondary">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.353-.026.692-.026 1.032 0 1.13.094 1.976 1.057 1.976 2.192V7.5M12 14.25v-2.625c0-.921-.654-1.708-1.561-1.855-.03-.003-.06-.005-.09-.008h-.094c-.03-.003-.06-.005-.09-.008c-.907-.147-1.561.934-1.561 1.855v2.625m3.151 0A3 3 0 0113.5 12.75V9.75M8.25 7.5H6.75a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25H15.75M12 14.25h.008v.008H12v-.008z" />
              </svg>
              <p className="text-xl font-semibold">You have no orders matching this criteria.</p>
              <p>Try adjusting your search or filter, or <Link to="/portal/services/new" className="text-brand-accent hover:underline">place a new service order</Link>.</p>
            </div>
          ) : (
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Package</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {paginatedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-600 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-accent hover:underline">
                    <Link to={`/portal/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">{order.serviceType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{order.packageName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/portal/orders/${order.id}`} className="text-brand-accent hover:text-brand-accent-hover flex items-center">
                      <Eye size={18} className="mr-1"/> View
                    </Link>
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
    </div>
  );
};

export default ClientOrdersPage;