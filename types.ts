export enum OrderStatus {
  NEW = 'New',
  UNDER_REVIEW = 'Under Review',
  SUBMITTED_TO_VISP = 'Submitted to VISP',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface Client {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  idNumber?: string; // Added ID Number
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO date string
  text: string;
  actor?: string; // e.g., 'Admin User' or 'System'
}

export interface Order {
  id: string;
  client: Client;
  serviceType: string; // e.g., 'Fibre', 'LTE', 'ADSL'
  packageName: string;
  notes?: string;
  status: OrderStatus;
  vispReferenceId?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  activityLog: ActivityLogEntry[];
}

export type UserRole = 'admin' | 'user' | 'client'; // Added 'client' role

export interface AdminUser {
  id: string;
  username: string; // For clients, this will be their email
  role: UserRole;
  // Extended for client profile
  name?: string; // Client's full name, for easier access
  contactNumber?: string;
  address?: string;
  idNumber?: string; // Added ID Number
}

// For form handling
export type NewOrderFormData = Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'activityLog' | 'client'> & {
  clientName: string;
  clientEmail: string;
  clientContactNumber: string;
  clientAddress: string;
};

export type OrderUpdatePayload = Partial<Pick<Order, 'status' | 'notes' | 'vispReferenceId'>> & {
  clientName?: string;
  clientEmail?: string;
  clientContactNumber?: string;
  clientAddress?: string;
};

// Client Profile Update Payload
export type ClientProfileUpdatePayload = {
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  idNumber?: string;
};


// Client Portal Specific Types

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';
export interface Invoice {
  id: string;
  orderId: string;
  clientId: string; // Client's email or ID
  clientName?: string; // Added for admin view convenience
  invoiceNumber: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number; // This will be the total amount including tax
  subTotal?: number; // Amount before tax
  taxAmount?: number; // Tax amount
  status: InvoiceStatus;
  pdfUrl?: string; // Mock URL to a PDF
}

export type ClientRequestCategory = 'Support' | 'Billing Inquiry' | 'Service Upgrade' | 'General Question';
export type ClientRequestStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ClientRequest {
  id: string;
  clientId: string; // Client's email or ID
  subject: string;
  description: string;
  category: ClientRequestCategory;
  status: ClientRequestStatus;
  submittedAt: string; // ISO date string
  lastUpdatedAt: string; // ISO date string
  resolvedAt?: string; // ISO date string
}

// Moved from services/requestService.ts
export type NewClientRequestPayload = Omit<ClientRequest, 'id' | 'clientId' | 'status' | 'submittedAt' | 'lastUpdatedAt' | 'resolvedAt'>;


export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Pending Cancellation' | 'Expired';
export interface Subscription {
  id: string;
  clientId: string; // Client's email or ID
  orderId: string; // Original order ID that initiated the subscription
  serviceType: string;
  packageName: string;
  startDate: string; // ISO date string
  renewalDate?: string; // ISO date string (for services that renew)
  status: SubscriptionStatus;
  pricePerCycle?: number;
  cycle?: 'Monthly' | 'Annually'; // Billing cycle
}

// Billing Settings
export interface PaymentGatewaySettings {
  enabled: boolean;
  merchantId?: string;
  apiKey?: string; // Or other relevant mock fields
}
export interface BillingSettings {
  vatRate: number; // Percentage, e.g., 15 for 15%
  payfast: PaymentGatewaySettings;
  paypal: PaymentGatewaySettings;
  // We can add more settings here like company address for invoices etc.
  companyName?: string;
  companyAddress?: string;
  invoiceFooter?: string;
}

// Audit Log Types
export enum AuditActionType {
  // Order actions
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_DELETE = 'ORDER_DELETE',
  // User actions
  USER_CREATE = 'USER_CREATE', // If self-registration or admin creates user
  USER_UPDATE = 'USER_UPDATE', // For profile changes
  USER_DELETE = 'USER_DELETE', // If admin can delete users
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  USER_LOGIN = 'USER_LOGIN', 
  USER_LOGOUT = 'USER_LOGOUT',
  // Invoice actions
  INVOICE_STATUS_UPDATE = 'INVOICE_STATUS_UPDATE',
  // Billing Settings actions
  BILLING_SETTINGS_UPDATE = 'BILLING_SETTINGS_UPDATE',
  // Client Request actions
  CLIENT_REQUEST_CREATE = 'CLIENT_REQUEST_CREATE',
  CLIENT_REQUEST_STATUS_UPDATE = 'CLIENT_REQUEST_STATUS_UPDATE', 
  // Subscription actions
  SUBSCRIPTION_STATUS_UPDATE = 'SUBSCRIPTION_STATUS_UPDATE',
  // General/System
  SYSTEM_ERROR = 'SYSTEM_ERROR', 
  UNKNOWN = 'UNKNOWN',
}

export enum AuditEntityType {
  ORDER = 'Order',
  USER = 'User',
  INVOICE = 'Invoice',
  BILLING_SETTINGS = 'BillingSettings',
  CLIENT_REQUEST = 'ClientRequest',
  SUBSCRIPTION = 'Subscription',
  SYSTEM = 'System',
  NONE = 'None', 
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO date string
  userId: string; 
  username: string; 
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId?: string; 
  details: string; 
  previousValue?: string | number | boolean | null | Record<string, any>; 
  newValue?: string | number | boolean | null | Record<string, any>; 
}

export interface Actor {
  userId: string;
  username: string;
}

// Service Catalog Types
export interface Product {
  id: string; // Unique ID for the product
  name: string;
  price: string; // e.g., "R499/month", "R99/year", "from R10,000/project"
  description: string;
  details?: string[]; // Optional bullet points for more details
}

export interface ProductCategory {
  id: string; // Unique ID for the category
  name: string;
  products: Product[];
}