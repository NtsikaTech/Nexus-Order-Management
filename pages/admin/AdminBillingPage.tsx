
import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { Invoice, InvoiceStatus, BillingSettings, PaymentGatewaySettings, Actor } from '../../types';
import { getAllInvoices as fetchAllInvoices, updateInvoiceStatus as apiUpdateInvoiceStatus } from '../../services/invoiceService';
import { getBillingSettings, saveBillingSettings as apiSaveBillingSettings } from '../../services/billingSettingsService';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import { Eye, Edit3, Save, Settings, CreditCard, Percent, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge'; // Re-use for consistency on Order Status if shown, or adapt for Invoice Status

const invoiceStatusColors: Record<InvoiceStatus, string> = {
  Paid: 'bg-status-completed text-white',
  Unpaid: 'bg-status-review text-black',
  Overdue: 'bg-status-cancelled text-white',
};

const invoiceStatusIcons: Record<InvoiceStatus, React.ReactNode> = {
  Paid: <CheckCircle size={16} className="mr-1.5" />,
  Unpaid: <Clock size={16} className="mr-1.5" />,
  Overdue: <AlertTriangle size={16} className="mr-1.5" />,
};

const AdminBillingPage: React.FC = () => {
  const { user: currentUser } = useAuth(); // Get current user for actor
  const [activeTab, setActiveTab] = useState<'invoices' | 'settings'>('invoices');
  
  // For Invoices Tab
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(true);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // For Settings Tab
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsForm, setSettingsForm] = useState<BillingSettings | null>(null);


  const loadInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);
    setErrorInvoices(null);
    try {
      const fetchedInvoices = await fetchAllInvoices();
      setInvoices(fetchedInvoices.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
    } catch (err) {
      setErrorInvoices('Failed to load invoices.');
      console.error(err);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    setErrorSettings(null);
    try {
      const fetchedSettings = await getBillingSettings();
      setBillingSettings(fetchedSettings);
      setSettingsForm(fetchedSettings); // Initialize form with loaded settings
    } catch (err) {
      setErrorSettings('Failed to load billing settings.');
      console.error(err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoices();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, loadInvoices, loadSettings]);

  // Invoice Tab Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = searchTerm === '' ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        invoice.clientId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const totalInvoicePages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handleInvoicePageChange = (page: number) => setCurrentPage(page);

  const openInvoiceDetailModal = (invoice: Invoice) => {
    setSelectedInvoiceForModal(invoice);
    setIsInvoiceDetailModalOpen(true);
  };
  
  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    if (!currentUser) {
        alert("Action cannot be performed: current user not identified.");
        return;
    }
    setIsUpdatingStatus(true);
    const actor: Actor = { userId: currentUser.id, username: currentUser.username };
    try {
        await apiUpdateInvoiceStatus(invoiceId, newStatus, actor);
        await loadInvoices(); // Refresh
        if (selectedInvoiceForModal && selectedInvoiceForModal.id === invoiceId) {
            setSelectedInvoiceForModal(prev => prev ? {...prev, status: newStatus} : null);
        }
    } catch (err) {
        alert(`Failed to update status for invoice ${invoiceId}.`);
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  // Settings Tab Logic
  const handleSettingsChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
  
    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
      // Assuming checkbox name format like "payfast.enabled"
      processedValue = (e.target as HTMLInputElement).checked;
    }
  
    setSettingsForm(prevSettings => {
      if (!prevSettings) return null;
      // Handle nested properties like payfast.enabled
      if (name.includes('.')) {
        const [parentKey, childKey] = name.split('.') as [keyof BillingSettings, keyof PaymentGatewaySettings];
        const parentObject = prevSettings[parentKey] as PaymentGatewaySettings; // Type assertion
        return {
          ...prevSettings,
          [parentKey]: {
            ...parentObject,
            [childKey]: processedValue,
          },
        };
      }
      return { ...prevSettings, [name]: processedValue };
    });
  };
  

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsForm || !currentUser) {
        alert("Action cannot be performed: form data or user not available.");
        return;
    }
    setIsSavingSettings(true);
    setErrorSettings(null);
    const actor: Actor = { userId: currentUser.id, username: currentUser.username };
    try {
      await apiSaveBillingSettings(settingsForm, actor);
      setBillingSettings(settingsForm); // Update main state
      alert('Billing settings saved successfully!');
    } catch (err) {
      setErrorSettings('Failed to save settings.');
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };


  const renderInvoicesTab = () => {
    if (isLoadingInvoices && invoices.length === 0) return <LoadingSpinner message="Loading invoices..." />;
    if (errorInvoices && invoices.length === 0) return <p className="text-red-400 p-4">{errorInvoices}</p>;

    return (
      <>
        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="searchTerm"
              placeholder="Search by Invoice #, Order ID, Client..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <Input
              as="select"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as InvoiceStatus | ''); setCurrentPage(1); }}
              options={[{ value: '', label: 'All Statuses' }, ...Object.keys(invoiceStatusColors).map(s => ({ value: s, label: s }))]}
            />
          </div>
        </div>
        {errorInvoices && <p className="text-red-400 p-4">{errorInvoices}</p>}

        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedInvoices.length === 0 && !isLoadingInvoices ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
              <CreditCard size={48} className="mx-auto mb-4" />
              <p className="text-xl font-semibold">No invoices found.</p>
              <p>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {paginatedInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-accent">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">{invoice.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">
                        <div>{invoice.clientName || 'N/A'}</div>
                        <div className="text-xs text-brand-text-light-secondary">{invoice.clientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light-secondary">{formatDate(invoice.issueDate).split(',')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">R {invoice.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center ${invoiceStatusColors[invoice.status]}`}>
                        {invoiceStatusIcons[invoice.status]}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => openInvoiceDetailModal(invoice)} title="View Details">
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {paginatedInvoices.length > 0 && totalInvoicePages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalInvoicePages} onPageChange={handleInvoicePageChange} />
        )}
        {selectedInvoiceForModal && (
            <Modal
                isOpen={isInvoiceDetailModalOpen}
                onClose={() => setIsInvoiceDetailModalOpen(false)}
                title={`Invoice Details: ${selectedInvoiceForModal.invoiceNumber}`}
                size="lg"
            >
                <div className="space-y-4 text-brand-text-light">
                    <p><strong>Order ID:</strong> {selectedInvoiceForModal.orderId}</p>
                    <p><strong>Client:</strong> {selectedInvoiceForModal.clientName} ({selectedInvoiceForModal.clientId})</p>
                    <p><strong>Issue Date:</strong> {formatDate(selectedInvoiceForModal.issueDate)}</p>
                    <p><strong>Due Date:</strong> {formatDate(selectedInvoiceForModal.dueDate)}</p>
                    {selectedInvoiceForModal.subTotal !== undefined && <p><strong>Subtotal:</strong> R {selectedInvoiceForModal.subTotal.toFixed(2)}</p>}
                    {selectedInvoiceForModal.taxAmount !== undefined && <p><strong>Tax ({billingSettings?.vatRate || 0}%):</strong> R {selectedInvoiceForModal.taxAmount.toFixed(2)}</p>}
                    <p><strong>Total Amount:</strong> R {selectedInvoiceForModal.amount.toFixed(2)}</p>
                    <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${invoiceStatusColors[selectedInvoiceForModal.status]}`}>
                            {invoiceStatusIcons[selectedInvoiceForModal.status]}
                            {selectedInvoiceForModal.status}
                        </span>
                    </p>
                     <p><strong>Mock PDF:</strong> <a href={selectedInvoiceForModal.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">{selectedInvoiceForModal.pdfUrl}</a></p>

                    {selectedInvoiceForModal.status !== 'Paid' && (
                        <Button 
                            variant='success' 
                            onClick={() => handleUpdateInvoiceStatus(selectedInvoiceForModal.id, 'Paid')}
                            isLoading={isUpdatingStatus}
                            disabled={isUpdatingStatus}
                            className="mr-2"
                        >Mark as Paid</Button>
                    )}
                     {selectedInvoiceForModal.status === 'Paid' && ( // Allow making it unpaid if it was paid
                        <Button 
                            variant='warning' 
                            onClick={() => handleUpdateInvoiceStatus(selectedInvoiceForModal.id, 'Unpaid')}
                            isLoading={isUpdatingStatus}
                            disabled={isUpdatingStatus}
                            className="mr-2"
                        >Mark as Unpaid</Button>
                    )}
                     {selectedInvoiceForModal.status !== 'Overdue' && new Date(selectedInvoiceForModal.dueDate) < new Date() && selectedInvoiceForModal.status !== 'Paid' && (
                        <Button 
                            variant='danger' 
                            onClick={() => handleUpdateInvoiceStatus(selectedInvoiceForModal.id, 'Overdue')}
                            isLoading={isUpdatingStatus}
                            disabled={isUpdatingStatus}
                        >Mark as Overdue</Button>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="ghost" onClick={() => setIsInvoiceDetailModalOpen(false)}>Close</Button>
                </div>
            </Modal>
        )}
      </>
    );
  };

  const renderSettingsTab = () => {
    if (isLoadingSettings || !settingsForm) return <LoadingSpinner message="Loading settings..." />;
    if (errorSettings) return <p className="text-red-400 p-4">{errorSettings}</p>;

    return (
      <form onSubmit={handleSaveSettings} className="space-y-8 bg-brand-interactive-dark-hover p-8 shadow-lg rounded-xl">
        {errorSettings && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{errorSettings}</p>}
        
        <section>
          <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2 flex items-center">
            <Percent size={20} className="mr-2 text-brand-accent"/> Tax Settings
          </h2>
          <Input
            label="Default VAT Rate (%)"
            name="vatRate"
            type="number"
            value={settingsForm.vatRate}
            onChange={handleSettingsChange}
            min="0"
            max="100"
            step="0.1"
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2 flex items-center">
            <CreditCard size={20} className="mr-2 text-brand-accent"/> Payment Gateways (Mock)
          </h2>
          {/* PayFast */}
          <div className="p-4 border border-slate-600 rounded-md space-y-3 mb-4">
            <h3 className="text-lg text-brand-text-light">PayFast</h3>
            <label className="flex items-center text-brand-text-light-secondary">
              <input type="checkbox" name="payfast.enabled" checked={settingsForm.payfast.enabled} onChange={handleSettingsChange} className="mr-2 h-4 w-4 rounded text-brand-accent focus:ring-brand-accent border-slate-500 bg-slate-700"/>
              Enable PayFast
            </label>
            {settingsForm.payfast.enabled && (
              <>
                <Input label="Merchant ID (Mock)" name="payfast.merchantId" value={settingsForm.payfast.merchantId || ''} onChange={handleSettingsChange} />
                <Input label="API Key (Mock)" name="payfast.apiKey" value={settingsForm.payfast.apiKey || ''} onChange={handleSettingsChange} type="password"/>
              </>
            )}
          </div>
          {/* PayPal */}
          <div className="p-4 border border-slate-600 rounded-md space-y-3">
            <h3 className="text-lg text-brand-text-light">PayPal</h3>
            <label className="flex items-center text-brand-text-light-secondary">
              <input type="checkbox" name="paypal.enabled" checked={settingsForm.paypal.enabled} onChange={handleSettingsChange} className="mr-2 h-4 w-4 rounded text-brand-accent focus:ring-brand-accent border-slate-500 bg-slate-700"/>
              Enable PayPal
            </label>
            {settingsForm.paypal.enabled && (
              <>
                <Input label="Merchant Email/ID (Mock)" name="paypal.merchantId" value={settingsForm.paypal.merchantId || ''} onChange={handleSettingsChange} />
                <Input label="API Secret (Mock)" name="paypal.apiKey" value={settingsForm.paypal.apiKey || ''} onChange={handleSettingsChange} type="password"/>
              </>
            )}
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2 flex items-center">
            <Settings size={20} className="mr-2 text-brand-accent"/> Invoice Appearance
          </h2>
            <Input label="Company Name" name="companyName" value={settingsForm.companyName || ''} onChange={handleSettingsChange} placeholder="Your Company LLC" />
            <Input label="Company Address" name="companyAddress" as="textarea" rows={3} value={settingsForm.companyAddress || ''} onChange={handleSettingsChange} placeholder="123 Invoice St, Taxington" />
            <Input label="Invoice Footer Text" name="invoiceFooter" as="textarea" rows={2} value={settingsForm.invoiceFooter || ''} onChange={handleSettingsChange} placeholder="Questions? Email billing@example.com" />
        </section>


        <div className="flex justify-end pt-6 border-t border-slate-600 mt-8">
          <Button type="submit" variant="primary" isLoading={isSavingSettings} disabled={isSavingSettings || !currentUser} leftIcon={<Save size={18}/>}>
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-text-light mb-6">Billing & Invoicing</h1>
        
        <div className="mb-6 border-b border-slate-600">
          <nav className="flex space-x-1 -mb-px">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                ${activeTab === 'invoices' 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-brand-text-light-secondary hover:text-brand-text-light hover:border-slate-500'}`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                ${activeTab === 'settings' 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-brand-text-light-secondary hover:text-brand-text-light hover:border-slate-500'}`}
            >
              Billing Settings
            </button>
          </nav>
        </div>

        {activeTab === 'invoices' && renderInvoicesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default AdminBillingPage;
