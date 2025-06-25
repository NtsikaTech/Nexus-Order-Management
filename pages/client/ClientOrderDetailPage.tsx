
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, ActivityLogEntry } from '../../types';
import { getOrderById as fetchOrderById } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import { formatDate } from '../../utils/helpers';
import { ORDER_STATUS_COLORS } from '../../constants';

const DetailItem: React.FC<{ label: string; value?: string | number | React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? "col-span-1 sm:col-span-2" : ""}>
    <dt className="text-sm font-medium text-brand-text-light-secondary">{label}</dt>
    <dd className="mt-1 text-sm text-brand-text-light">{value || 'N/A'}</dd>
  </div>
);

const ClientOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is missing.");
      setIsLoading(false);
      return;
    }
    if (!user || !user.username) {
        setError("User information not available.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrder = await fetchOrderById(orderId);
      if (fetchedOrder) {
        // Verify this order belongs to the logged-in client
        if (fetchedOrder.client.email.toLowerCase() === user.username.toLowerCase()) {
          setOrder(fetchedOrder);
        } else {
          setError("Access Denied: You do not have permission to view this order.");
          setOrder(null);
        }
      } else {
        setError(`Order with ID ${orderId} not found.`);
      }
    } catch (err) {
      setError('Failed to load order details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (isLoading) {
    return <div className="p-8"><LoadingSpinner message="Loading order details..." /></div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-100 bg-red-700 border border-red-500 rounded-md p-4 mb-4">{error}</p>
        <Link to="/portal/orders"><Button variant="primary">Back to My Orders</Button></Link>
      </div>
    );
  }

  if (!order) {
    return (
        <div className="p-8 text-center">
            <p className="text-brand-text-light-secondary mb-4">Order not found or access denied.</p>
            <Link to="/portal/orders"><Button variant="secondary">Back to My Orders</Button></Link>
        </div>
    );
  }
  
  const activityLogDotColorClass = ORDER_STATUS_COLORS[order.status] ? 
                                   ORDER_STATUS_COLORS[order.status].split(' ')[0] 
                                   : 'bg-gray-400';

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-text-light">Order Details: <span className="text-brand-accent">{order.id}</span></h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2">Order Summary</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <DetailItem label="Order ID" value={<span className="font-semibold text-brand-accent">{order.id}</span>} />
              <DetailItem label="Status" value={<StatusBadge status={order.status} />} />
              <DetailItem label="Service Type" value={order.serviceType} />
              <DetailItem label="Package" value={order.packageName} />
              <DetailItem label="VISP Reference ID" value={order.vispReferenceId} />
              <DetailItem label="Notes" value={order.notes} fullWidth />
              <DetailItem label="Created At" value={formatDate(order.createdAt)} />
              <DetailItem label="Last Updated" value={formatDate(order.updatedAt)} />
            </dl>
          </section>

          <section className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2">Your Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <DetailItem label="Name" value={order.client.name} />
              <DetailItem label="Email" value={order.client.email} />
              <DetailItem label="Contact Number" value={order.client.contactNumber} />
              <DetailItem label="Address" value={order.client.address} fullWidth />
            </dl>
          </section>
        </div>

        <div className="md:col-span-1">
          <section className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6 h-full">
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2">Activity Log</h2>
            {order.activityLog && order.activityLog.length > 0 ? (
              <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {order.activityLog.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry: ActivityLogEntry) => (
                  <li key={entry.id} className="relative pl-6">
                    <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full ${activityLogDotColorClass}`}></div>
                    <p className="text-sm text-brand-text-light">{entry.text}</p>
                    <p className="text-xs text-brand-text-light-secondary">
                      {formatDate(entry.timestamp)}
                       {/* For clients, maybe hide actor if it's 'Admin User' or 'System' unless specifically relevant */}
                      {entry.actor && (entry.actor === 'System' || entry.actor.toLowerCase().includes('admin')) ? '' : ` by ${entry.actor}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-text-light-secondary">No activity logged for this order yet.</p>
            )}
          </section>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between items-center">
        <Link to="/portal/orders"><Button variant="secondary">Back to My Orders</Button></Link>
        <Link to="/portal/requests/new" state={{ orderId: order.id, orderService: order.serviceType }}>
            <Button variant="primary">Need help with this order?</Button>
        </Link>
      </div>
    </div>
  );
};

export default ClientOrderDetailPage;
