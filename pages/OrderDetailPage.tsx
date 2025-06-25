
import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Order, OrderStatus, OrderUpdatePayload, ActivityLogEntry } from '../types';
import { getOrderById as fetchOrderById, updateOrder as apiUpdateOrder } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_COLORS } from '../constants'; 
import { formatDate, isValidEmail, isNotEmpty } from '../utils/helpers';

const DetailItem: React.FC<{ label: string; value?: string | number | React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? "col-span-1 sm:col-span-2" : ""}>
    <dt className="text-sm font-medium text-brand-text-light-secondary">{label}</dt>
    <dd className="mt-1 text-sm text-brand-text-light">{value || 'N/A'}</dd>
  </div>
);

interface EditableFieldsState extends OrderUpdatePayload {
  clientName?: string;
  clientEmail?: string;
  clientContactNumber?: string;
  clientAddress?: string;
}

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editableFields, setEditableFields] = useState<EditableFieldsState>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ clientEmail?: string }>({});


  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrder = await fetchOrderById(orderId);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        // Initialize editableFields with all relevant data from the fetched order
        setEditableFields({
            status: fetchedOrder.status,
            notes: fetchedOrder.notes || '',
            vispReferenceId: fetchedOrder.vispReferenceId || '',
            clientName: fetchedOrder.client.name,
            clientEmail: fetchedOrder.client.email,
            clientContactNumber: fetchedOrder.client.contactNumber,
            clientAddress: fetchedOrder.client.address,
        });
      } else {
        setError(`Order with ID ${orderId} not found.`);
      }
    } catch (err) {
      setError('Failed to load order details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleEditFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({ ...prev, [name]: value }));
    if (name === 'clientEmail') {
        setFormErrors(prev => ({ ...prev, clientEmail: undefined })); // Clear email error on change
    }
  };

  const openEditModal = () => {
    if(order) {
        setEditableFields({
            status: order.status,
            notes: order.notes || '',
            vispReferenceId: order.vispReferenceId || '',
            clientName: order.client.name,
            clientEmail: order.client.email,
            clientContactNumber: order.client.contactNumber,
            clientAddress: order.client.address,
        });
    }
    setIsEditModalOpen(true);
    setUpdateError(null);
    setFormErrors({});
  };

  const validateManagementForm = (): boolean => {
    const errors: { clientEmail?: string } = {};
    if (editableFields.clientEmail && !isValidEmail(editableFields.clientEmail)) {
        errors.clientEmail = "Invalid client email format.";
    }
    // Add other validations if needed
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleUpdateOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderId || !order) return;

    if (!validateManagementForm()) {
        return;
    }
    
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const payloadToUpdate: OrderUpdatePayload = {};
      
      // Order specific fields
      if (editableFields.status !== order.status) payloadToUpdate.status = editableFields.status;
      if (editableFields.notes !== (order.notes || '')) payloadToUpdate.notes = editableFields.notes;
      if (editableFields.vispReferenceId !== (order.vispReferenceId || '')) payloadToUpdate.vispReferenceId = editableFields.vispReferenceId;

      // Client specific fields
      if (editableFields.clientName !== order.client.name) payloadToUpdate.clientName = editableFields.clientName;
      if (editableFields.clientEmail !== order.client.email) payloadToUpdate.clientEmail = editableFields.clientEmail;
      if (editableFields.clientContactNumber !== order.client.contactNumber) payloadToUpdate.clientContactNumber = editableFields.clientContactNumber;
      if (editableFields.clientAddress !== order.client.address) payloadToUpdate.clientAddress = editableFields.clientAddress;


      if (Object.keys(payloadToUpdate).length > 0) {
        const updatedOrder = await apiUpdateOrder(orderId, payloadToUpdate);
        if (updatedOrder) {
          setOrder(updatedOrder); // Update local order state
          // Re-initialize editableFields with potentially updated (and sorted by service) data
           setEditableFields({
            status: updatedOrder.status,
            notes: updatedOrder.notes || '',
            vispReferenceId: updatedOrder.vispReferenceId || '',
            clientName: updatedOrder.client.name,
            clientEmail: updatedOrder.client.email,
            clientContactNumber: updatedOrder.client.contactNumber,
            clientAddress: updatedOrder.client.address,
          });
        }
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update order.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="p-8"><LoadingSpinner message="Loading order details..." /></div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-100 bg-red-700 border border-red-500 rounded-md p-4 mb-4">{error}</p>
        <Link to="/"><Button variant="primary">Back to Dashboard</Button></Link>
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center text-brand-text-light-secondary">Order not found.</div>;
  }

  const activityLogDotColorClass = ORDER_STATUS_COLORS[order.status] ? 
                                   ORDER_STATUS_COLORS[order.status].split(' ')[0] 
                                   : 'bg-gray-400';


  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-text-light">Order Details: <span className="text-brand-accent">{order.id}</span></h1>
        <Button variant="primary" onClick={openEditModal} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
        }>
          Manage Order
        </Button>
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
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2">Client Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <DetailItem label="Client Name" value={order.client.name} />
              <DetailItem label="Client ID" value={order.client.id} />
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
                      {entry.actor && ` by ${entry.actor}`}
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
      
      <div className="mt-8 text-center">
        <Link to="/"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Manage Order Details: ${order.id}`}
        size="lg"
      >
        <form onSubmit={handleUpdateOrder} className="space-y-6">
           {updateError && <p className="text-sm text-red-100 bg-red-700 p-3 rounded-md mb-4">{updateError}</p>}
          
          <section>
            <h3 className="text-lg font-semibold text-brand-text-light mb-3 border-b border-slate-600 pb-2">Order Status &amp; References</h3>
            <Input
              as="select"
              label="Status"
              name="status"
              value={editableFields.status || ''}
              onChange={handleEditFieldChange}
              options={ORDER_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
            />
            <Input
              label="VISP Reference ID"
              name="vispReferenceId"
              value={editableFields.vispReferenceId || ''}
              onChange={handleEditFieldChange}
              placeholder="Enter VISP Ref ID if applicable"
            />
            <Input
              as="textarea"
              label="Notes"
              name="notes"
              rows={4}
              value={editableFields.notes || ''}
              onChange={handleEditFieldChange}
              placeholder="Add or update order notes"
            />
          </section>

          <section>
            <h3 className="text-lg font-semibold text-brand-text-light mb-3 pt-3 border-b border-slate-600 pb-2">Client Details</h3>
            <Input
              label="Client Name"
              name="clientName"
              value={editableFields.clientName || ''}
              onChange={handleEditFieldChange}
              placeholder="Client's full name"
            />
             <Input
              label="Client Email"
              name="clientEmail"
              type="email"
              value={editableFields.clientEmail || ''}
              onChange={handleEditFieldChange}
              placeholder="Client's email address"
              error={formErrors.clientEmail}
              touched={!!formErrors.clientEmail}
            />
            <Input
              label="Client Contact Number"
              name="clientContactNumber"
              type="tel"
              value={editableFields.clientContactNumber || ''}
              onChange={handleEditFieldChange}
              placeholder="Client's contact number"
            />
            <Input
              as="textarea"
              label="Client Address"
              name="clientAddress"
              rows={3}
              value={editableFields.clientAddress || ''}
              onChange={handleEditFieldChange}
              placeholder="Client's physical address"
            />
          </section>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating} disabled={isUpdating}>
              {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
