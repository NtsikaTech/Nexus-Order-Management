
import { Invoice, InvoiceStatus, Order, OrderStatus, Actor, AuditActionType, AuditEntityType } from '../types';
import { MOCK_API_DELAY } from '../constants';
import { generateUniqueId, formatDate } from '../utils/helpers';
import { getOrders } from './orderService'; 
import { getBillingSettings } from './billingSettingsService'; // To get VAT rate
import { recordAuditEvent } from './auditLogService'; // Import audit service

const INVOICES_STORAGE_KEY = 'omsClientInvoices';

const generateMockInvoicesForOrder = async (order: Order): Promise<Invoice[]> => {
  const invoices: Invoice[] = [];
  const now = new Date();
  const billingSettings = await getBillingSettings(); // Get current VAT rate
  const vatRate = billingSettings.vatRate / 100; // e.g., 15% -> 0.15

  // Create one invoice for completed or submitted orders, maybe more for older orders
  if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SUBMITTED_TO_VISP || Math.random() > 0.3) {
    const issueDate = new Date(new Date(order.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after order
    const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000); // Due 14 days after issue
    
    let status: InvoiceStatus = 'Unpaid';
    if (dueDate < now && Math.random() > 0.4) status = 'Overdue';
    if (order.status === OrderStatus.COMPLETED && Math.random() > 0.3) status = 'Paid';
    if (new Date(order.createdAt) < new Date(now.getFullYear(), now.getMonth() -1, now.getDate())) status = 'Paid';

    const baseAmount = parseFloat((Math.random() * 500 + 50).toFixed(2)); // Random amount between 50 and 550
    let subTotal: number | undefined;
    let taxAmount: number | undefined;
    let totalAmount = baseAmount;

    if (vatRate > 0) {
        subTotal = baseAmount;
        taxAmount = parseFloat((subTotal * vatRate).toFixed(2));
        totalAmount = parseFloat((subTotal + taxAmount).toFixed(2));
    }


    invoices.push({
      id: `INV${generateUniqueId()}`,
      orderId: order.id,
      clientId: order.client.email, 
      clientName: order.client.name, // Add client name
      invoiceNumber: `INV-${order.id.slice(-3)}-${new Date(issueDate).getFullYear()}${(new Date(issueDate).getMonth()+1).toString().padStart(2,'0')}`,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      amount: totalAmount,
      subTotal: subTotal,
      taxAmount: taxAmount,
      status: status,
      pdfUrl: `#/mock-invoice/${order.id}.pdf` 
    });
  }
  return invoices;
};

const getInitialMockInvoices = async (): Promise<Invoice[]> => {
  const allOrders = await getOrders(); // System call for initial data
  let allInvoices: Invoice[] = [];
  for (const order of allOrders) {
    const orderInvoices = await generateMockInvoicesForOrder(order);
    allInvoices = [...allInvoices, ...orderInvoices];
  }
  return allInvoices.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
};

const getStoredInvoices = async (): Promise<Invoice[]> => {
  const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
  if (stored) {
    try {
      const parsedInvoices = JSON.parse(stored) as Invoice[];
      if (Array.isArray(parsedInvoices)) {
        return parsedInvoices.map(inv => ({...inv, clientName: inv.clientName || 'N/A' })); // Ensure clientName for older stored items
      }
    } catch (e) {
      console.error("Error parsing invoices from localStorage:", e);
    }
  }
  const initialInvoices = await getInitialMockInvoices();
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(initialInvoices));
  return initialInvoices;
};

const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
};

export const getInvoicesByClientId = async (clientId: string): Promise<Invoice[]> => {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      // Regenerate if empty, or consider if client-specific regeneration is needed
      let allInvoices = await getStoredInvoices(); 
      if(allInvoices.length === 0) { // If absolutely no invoices, try to generate them all.
          allInvoices = await getInitialMockInvoices();
          saveInvoices(allInvoices);
      }
      const clientInvoices = allInvoices.filter(invoice => invoice.clientId.toLowerCase() === clientId.toLowerCase());
      resolve(clientInvoices);
    }, MOCK_API_DELAY);
  });
};

export const getAllInvoices = async (): Promise<Invoice[]> => {
    return new Promise(async (resolve) => {
        setTimeout(async () => {
             let allInvoices = await getStoredInvoices();
             if(allInvoices.length === 0) { // If absolutely no invoices, try to generate them all.
                allInvoices = await getInitialMockInvoices();
                saveInvoices(allInvoices);
            }
            resolve(allInvoices);
        }, MOCK_API_DELAY);
    });
};

export const updateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus, actor: Actor): Promise<Invoice | undefined> => {
     return new Promise(async (resolve, reject) => {
        setTimeout(async () => {
            let invoices = await getStoredInvoices();
            const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
            if (invoiceIndex !== -1) {
                const originalInvoice = { ...invoices[invoiceIndex] };
                invoices[invoiceIndex].status = newStatus;
                saveInvoices(invoices); // Save updated invoices

                // Audit event
                try {
                    await recordAuditEvent({
                        userId: actor.userId,
                        username: actor.username,
                        actionType: AuditActionType.INVOICE_STATUS_UPDATE,
                        entityType: AuditEntityType.INVOICE,
                        entityId: invoiceId,
                        details: `Invoice '${originalInvoice.invoiceNumber}' status changed from '${originalInvoice.status}' to '${newStatus}' by '${actor.username}'.`,
                        previousValue: originalInvoice.status,
                        newValue: newStatus
                    });
                } catch (auditError) {
                    console.error("Audit event failed for invoice status update:", auditError);
                }

                resolve(invoices[invoiceIndex]);
            } else {
                reject(new Error("Invoice not found"));
            }
        }, MOCK_API_DELAY / 2);
    });
};

// Existing markInvoiceAsPaid can use updateInvoiceStatus or be kept for specific client-side simulation
export const markInvoiceAsPaid = async (invoiceId: string, actor: Actor): Promise<Invoice | undefined> => {
    return updateInvoiceStatus(invoiceId, 'Paid', actor);
};