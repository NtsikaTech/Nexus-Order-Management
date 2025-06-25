
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Subscription, SubscriptionStatus, Actor } from '../../types';
import { getSubscriptionsByClientId, requestSubscriptionCancellation as apiRequestCancellation } from '../../services/subscriptionService';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { formatDate } from '../../utils/helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import Pagination from '../../components/Pagination';
import { Repeat, XCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Modal from '../../components/Modal';

const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  Active: 'bg-status-completed text-white',
  Cancelled: 'bg-status-cancelled text-white',
  'Pending Cancellation': 'bg-status-review text-black',
  Expired: 'bg-gray-500 text-white',
};

const subscriptionStatusIcons: Record<SubscriptionStatus, React.ReactNode> = {
  Active: <CheckCircle size={16} className="mr-1.5" />,
  Cancelled: <XCircle size={16} className="mr-1.5" />,
  'Pending Cancellation': <Clock size={16} className="mr-1.5" />,
  Expired: <AlertCircle size={16} className="mr-1.5" />,
};

const ClientSubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isProcessingCancellation, setIsProcessingCancellation] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    if (!user || !user.username) {
      setError("User information not available.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSubscriptions = await getSubscriptionsByClientId(user.username);
      setSubscriptions(fetchedSubscriptions.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    } catch (err) {
      setError('Failed to load your subscriptions. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => 
      statusFilter ? sub.status === statusFilter : true
    );
  }, [subscriptions, statusFilter]);

  const totalPages = Math.ceil(filteredSubscriptions.length / ITEMS_PER_PAGE);
  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubscriptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubscriptions, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openCancelModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsCancelModalOpen(true);
  };

  const handleRequestCancellation = async () => {
    if (!selectedSubscription || !user?.username || !user?.id) {
        setError("Action cannot be performed: subscription or user details missing.");
        return;
    }
    setIsProcessingCancellation(true);
    const actor: Actor = { userId: user.id, username: user.username };
    try {
        await apiRequestCancellation(selectedSubscription.id, actor);
        // alert(`Cancellation requested for subscription ${selectedSubscription.id}`);
        await loadSubscriptions(); // Refresh subscriptions
        setIsCancelModalOpen(false);
        setSelectedSubscription(null);
    } catch (err: any) {
        setError(`Error requesting cancellation: ${err.message}`);
        // Optionally keep modal open or show error within modal
    } finally {
        setIsProcessingCancellation(false);
    }
  };


  if (isLoading && subscriptions.length === 0) {
    return <div className="p-8"><LoadingSpinner message="Loading your subscriptions..." /></div>;
  }

  if (error && subscriptions.length === 0) {
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-text-light mb-8">My Subscriptions</h1>

        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-brand-text-light-secondary mb-1">Filter by status:</label>
          <select
            id="statusFilter"
            name="statusFilter"
            className="mt-1 block w-full md:w-1/3 px-3 py-2 bg-slate-700 text-brand-text-light border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
            value={statusFilter}
            onChange={(e) => {setStatusFilter(e.target.value as SubscriptionStatus | ''); setCurrentPage(1);}}
          >
            <option value="">All Statuses</option>
            {(Object.keys(subscriptionStatusColors) as SubscriptionStatus[]).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
         {error && 
            <div className="my-4 p-3 text-sm text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>
        }

        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedSubscriptions.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
               <Repeat size={48} className="mx-auto mb-4" />
              <p className="text-xl font-semibold">No subscriptions found.</p>
              <p>Your active services will appear here once provisioned.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Service</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Package</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Price/Cycle</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Start Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Renewal Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {paginatedSubscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-light">{sub.serviceType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{sub.packageName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">
                        {sub.pricePerCycle ? `R ${sub.pricePerCycle.toFixed(2)}` : 'N/A'} {sub.cycle && `(${sub.cycle})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(sub.startDate).split(',')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{sub.renewalDate ? formatDate(sub.renewalDate).split(',')[0] : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center ${subscriptionStatusColors[sub.status]}`}>
                        {subscriptionStatusIcons[sub.status]}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {sub.status === 'Active' ? (
                        <Button variant="warning" size="sm" onClick={() => openCancelModal(sub)} title="Request Cancellation" disabled={!user}>
                           Request Cancellation
                        </Button>
                      ) : (
                        <span className="text-xs text-brand-text-light-secondary italic">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {paginatedSubscriptions.length > 0 && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
       <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Request Subscription Cancellation`}
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} disabled={isProcessingCancellation}>
              Back
            </Button>
            <Button variant="danger" onClick={handleRequestCancellation} isLoading={isProcessingCancellation} disabled={isProcessingCancellation || !user}>
              {isProcessingCancellation ? 'Processing...' : 'Confirm Cancellation Request'}
            </Button>
          </div>
        }
      >
        <p className="text-brand-text-light mb-2">
          You are about to request cancellation for the following subscription:
        </p>
        <div className="my-4 p-4 bg-slate-700 rounded-md text-brand-text-light-secondary">
            <strong>Service:</strong> {selectedSubscription?.serviceType} <br/>
            <strong>Package:</strong> {selectedSubscription?.packageName} <br/>
            <strong>Renewal Date:</strong> {selectedSubscription?.renewalDate ? formatDate(selectedSubscription.renewalDate).split(',')[0] : 'N/A'}
        </div>
        <p className="text-sm text-brand-text-light-secondary">
          Upon confirmation, your subscription status will be updated to "Pending Cancellation". 
          Further details regarding the cancellation process and any applicable terms will be communicated to you.
        </p>
      </Modal>
    </div>
  );
};

export default ClientSubscriptionsPage;
