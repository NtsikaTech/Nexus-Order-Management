
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Invoice, InvoiceStatus, BillingSettings, Actor } from '../../types';
import { getInvoicesByClientId, markInvoiceAsPaid as apiMarkInvoiceAsPaid } from '../../services/invoiceService';
import { getBillingSettings } from '../../services/billingSettingsService'; // Import to check gateway status
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { formatDate } from '../../utils/helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import Pagination from '../../components/Pagination';
import { Download, CheckCircle, AlertTriangle, Clock, FileText, CreditCard } from 'lucide-react';
import Modal from '../../components/Modal';

const invoiceStatusColors: Record<InvoiceStatus, string> = {
  Paid: 'bg-status-completed text-white',
  Unpaid: 'bg-status-review text-black',
  Overdue: 'bg-status-cancelled text-white',
};

const invoiceStatusIcons: Record<InvoiceStatus, React.ReactNode> = {
  Paid: <CheckCircle size={16} className="mr-1.5" />,
  Unpaid: <Clock size={16} className="mr-1.5" />,
  Overdue: <AlertTriangle size={16} className="mr-1.5" />,
}

const ClientInvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  const loadData = useCallback(async () => {
    if (!user || !user.username) {
      setError("User information not available.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedInvoices, fetchedSettings] = await Promise.all([
        getInvoicesByClientId(user.username),
        getBillingSettings()
      ]);
      setInvoices(fetchedInvoices.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
      setBillingSettings(fetchedSettings);
    } catch (err) {
      setError('Failed to load your invoices or billing settings. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => 
      statusFilter ? invoice.status === statusFilter : true
    );
  }, [invoices, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    alert(`Simulating download for invoice ${invoice.invoiceNumber}... \nURL: ${invoice.pdfUrl || 'N/A'}`);
  };

  const openPayModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPayModalOpen(true);
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice || !user) {
        alert("Action cannot be performed: invoice or user not available.");
        return;
    }
    setIsProcessingPayment(true);
    const actor: Actor = { userId: user.id, username: user.username };
    try {
        await apiMarkInvoiceAsPaid(selectedInvoice.id, actor);
        await loadData(); // Refresh invoices and settings potentially
        setIsPayModalOpen(false);
        setSelectedInvoice(null);
    } catch (err: any) {
        alert(`Error processing payment: ${err.message}`);
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const getPaymentButtonText = () => {
    if (!billingSettings) return "Pay Now";
    if (billingSettings.payfast.enabled) return "Pay with PayFast";
    if (billingSettings.paypal.enabled) return "Pay with PayPal";
    return "Pay Now (Simulated)";
  };

  if (isLoading && invoices.length === 0) {
    return <div className="p-8"><LoadingSpinner message="Loading your invoices..." /></div>;
  }

  if (error && invoices.length === 0) {
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-text-light mb-8">My Invoices</h1>

        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-brand-text-light-secondary mb-1">Filter by status:</label>
          <select
            id="statusFilter"
            name="statusFilter"
            className="mt-1 block w-full md:w-1/3 px-3 py-2 bg-slate-700 text-brand-text-light border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
            value={statusFilter}
            onChange={(e) => {setStatusFilter(e.target.value as InvoiceStatus | ''); setCurrentPage(1);}}
          >
            <option value="">All Statuses</option>
            {(Object.keys(invoiceStatusColors) as InvoiceStatus[]).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
         {error && 
            <div className="my-4 p-3 text-sm text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>
        }

        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedInvoices.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
               <FileText size={48} className="mx-auto mb-4" />
              <p className="text-xl font-semibold">No invoices found.</p>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Invoice #</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Issue Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {paginatedInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-light">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-accent hover:underline">
                      <Link to={`/portal/orders/${invoice.orderId}`}>{invoice.orderId}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(invoice.issueDate).split(',')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(invoice.dueDate).split(',')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">
                        R {invoice.amount.toFixed(2)}
                        {invoice.taxAmount && invoice.taxAmount > 0 && 
                            <span className="text-xs block text-brand-text-light-secondary">(incl. R {invoice.taxAmount.toFixed(2)} VAT)</span>
                        }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center ${invoiceStatusColors[invoice.status]}`}>
                        {invoiceStatusIcons[invoice.status]}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)} title="Download Invoice" aria-label="Download Invoice">
                        <Download size={16} />
                      </Button>
                      {invoice.status !== 'Paid' && (
                        <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => openPayModal(invoice)} 
                            title={getPaymentButtonText()}
                            leftIcon={<CreditCard size={14}/>}
                            disabled={!user}
                        >
                           {getPaymentButtonText()}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {paginatedInvoices.length > 0 && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
       <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`${getPaymentButtonText()} for Invoice: ${selectedInvoice?.invoiceNumber || ''}`}
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsPayModalOpen(false)} disabled={isProcessingPayment}>
              Cancel
            </Button>
            <Button variant="success" onClick={handlePayInvoice} isLoading={isProcessingPayment} disabled={isProcessingPayment || !user} leftIcon={<CreditCard size={16}/>}>
              {isProcessingPayment ? 'Processing...' : `Confirm Payment: R ${selectedInvoice?.amount.toFixed(2)}`}
            </Button>
          </div>
        }
      >
        <p className="text-brand-text-light mb-2">
          You are about to pay invoice <span className="font-semibold text-brand-accent">{selectedInvoice?.invoiceNumber}</span> for order <span className="font-semibold text-brand-accent">{selectedInvoice?.orderId}</span>.
        </p>
        <p className="text-brand-text-light text-2xl font-bold my-4 text-center">
          Amount Due: R {selectedInvoice?.amount.toFixed(2)}
        </p>
        <p className="text-sm text-brand-text-light-secondary">
          This is a mock payment. Clicking "Confirm Payment" will simulate a successful payment and update the invoice status.
          {(billingSettings?.payfast.enabled || billingSettings?.paypal.enabled) && (
            <span className="block mt-1">Payment would be processed via {billingSettings?.payfast.enabled ? 'PayFast' : 'PayPal'}.</span>
          )}
        </p>
      </Modal>
    </div>
  );
};

export default ClientInvoicesPage;
