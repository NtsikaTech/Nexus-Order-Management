
import { Order, OrderStatus, NewOrderFormData, Client, ActivityLogEntry, OrderUpdatePayload } from '../types';
import { MOCK_API_DELAY, SERVICE_TYPES, SERVICE_PACKAGES, ORDER_STATUS_OPTIONS } from '../constants';
import { generateUniqueId, formatDate } from '../utils/helpers';

const ORDERS_STORAGE_KEY = 'omsOrders';

const generateRandomActivityLogEntry = (text: string, actor: string = 'System'): ActivityLogEntry => ({
  id: generateUniqueId(),
  timestamp: new Date().toISOString(),
  text,
  actor,
});

const getInitialMockOrders = (): Order[] => [
  {
    id: 'ORD001',
    client: { id: 'CLI001', name: 'John Doe', email: 'john.doe@example.com', contactNumber: '0821234567', address: '123 Main St, Anytown', idNumber: '8001015000080' },
    serviceType: 'Fibre',
    packageName: '50/50 Mbps Uncapped',
    notes: 'Client requests installation on a weekend.',
    status: OrderStatus.NEW,
    vispReferenceId: '',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    activityLog: [generateRandomActivityLogEntry("Order created by Admin.", "Admin User")],
  },
  {
    id: 'ORD002',
    client: { id: 'CLI002', name: 'Jane Smith', email: 'jane.smith@example.com', contactNumber: '0739876543', address: '456 Oak Ave, Otherville', idNumber: '8502026000085' },
    serviceType: 'LTE',
    packageName: '20GB Anytime',
    status: OrderStatus.UNDER_REVIEW,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    activityLog: [generateRandomActivityLogEntry("Order created by Admin.", "Admin User")],
  },
   {
    id: 'ORD003',
    client: { id: 'CLI003', name: 'Tech Solutions Inc.', email: 'support@techsolutions.com', contactNumber: '0115550000', address: '789 Tech Park, Silicon Valley', idNumber: 'CK2005/012345/07' },
    serviceType: 'Web Hosting',
    packageName: 'Advanced Windows Hosting',
    notes: 'Needs SSL certificate and daily backups.',
    status: OrderStatus.COMPLETED,
    vispReferenceId: 'VISP_REF_98765',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    activityLog: [
        generateRandomActivityLogEntry("Order created.", "Admin User"),
        generateRandomActivityLogEntry("Submitted to VISP with Ref ID: VISP_REF_98765.", "System"),
        generateRandomActivityLogEntry("Order marked as Completed.", "System"),
    ],
  },
];

const getStoredOrders = (): Order[] => {
  const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (stored) {
    try {
      const parsedOrders = JSON.parse(stored) as Order[];
      if (Array.isArray(parsedOrders)) {
        // Ensure client objects have idNumber if they are from older storage
        return parsedOrders.map(order => ({
          ...order,
          client: {
            ...order.client,
            idNumber: order.client.idNumber || undefined 
          }
        }));
      }
    } catch (e) {
      console.error("Error parsing orders from localStorage:", e);
    }
  }
  const initialOrders = getInitialMockOrders();
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialOrders));
  return initialOrders;
};

// Expose saveOrders for authService to use during client profile update cascade
export const saveOrders = (orders: Order[]): void => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

export const getOrders = async (): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredOrders());
    }, MOCK_API_DELAY);
  });
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getStoredOrders();
      resolve(orders.find(order => order.id === id));
    }, MOCK_API_DELAY / 2);
  });
};

export const createOrder = async (formData: NewOrderFormData): Promise<Order> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getStoredOrders();
      const newClient: Client = {
        id: `CLI${generateUniqueId()}`,
        name: formData.clientName,
        email: formData.clientEmail,
        contactNumber: formData.clientContactNumber,
        address: formData.clientAddress,
        // idNumber could be collected on order form if desired, or left for profile
      };
      const now = new Date().toISOString();
      const newOrder: Order = {
        id: `ORD${generateUniqueId()}`,
        client: newClient,
        serviceType: formData.serviceType,
        packageName: formData.packageName,
        notes: formData.notes,
        status: OrderStatus.NEW,
        createdAt: now,
        updatedAt: now,
        activityLog: [generateRandomActivityLogEntry(`Order created by ${formData.clientName}.`, "Admin User")],
      };
      const updatedOrders = [...orders, newOrder];
      saveOrders(updatedOrders);
      resolve(newOrder);
    }, MOCK_API_DELAY);
  });
};

export const updateOrder = async (id: string, payload: OrderUpdatePayload): Promise<Order | undefined> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === id);
      if (orderIndex === -1) {
        reject(new Error('Order not found'));
        return;
      }
      
      const originalOrder = orders[orderIndex];
      const updatedClientInfo = { ...originalOrder.client };
      const newActivityLogEntries: ActivityLogEntry[] = [];
      const now = new Date().toISOString();

      if (payload.clientName !== undefined && payload.clientName !== originalOrder.client.name) {
        newActivityLogEntries.push(generateRandomActivityLogEntry(`Client name updated from "${originalOrder.client.name}" to "${payload.clientName}".`, 'Admin User'));
        updatedClientInfo.name = payload.clientName;
      }
      if (payload.clientEmail !== undefined && payload.clientEmail !== originalOrder.client.email) {
         newActivityLogEntries.push(generateRandomActivityLogEntry(`Client email updated from "${originalOrder.client.email}" to "${payload.clientEmail}".`, 'Admin User'));
        updatedClientInfo.email = payload.clientEmail;
      }
      if (payload.clientContactNumber !== undefined && payload.clientContactNumber !== originalOrder.client.contactNumber) {
        newActivityLogEntries.push(generateRandomActivityLogEntry(`Client contact number updated.`, 'Admin User'));
        updatedClientInfo.contactNumber = payload.clientContactNumber;
      }
      if (payload.clientAddress !== undefined && payload.clientAddress !== originalOrder.client.address) {
        newActivityLogEntries.push(generateRandomActivityLogEntry(`Client address updated.`, 'Admin User'));
        updatedClientInfo.address = payload.clientAddress;
      }
      // Note: ID number is not typically updated via general order update, but via profile.

      const updatedOrder = { 
        ...originalOrder, 
        ...payload, 
        client: updatedClientInfo, 
        updatedAt: now 
      };
      
      delete updatedOrder.clientName;
      delete updatedOrder.clientEmail;
      delete updatedOrder.clientContactNumber;
      delete updatedOrder.clientAddress;

      if (payload.status && payload.status !== originalOrder.status) {
        newActivityLogEntries.push(generateRandomActivityLogEntry(`Status changed from ${originalOrder.status} to ${payload.status}.`, 'Admin User'));
      }
      if (payload.notes !== undefined && payload.notes !== (originalOrder.notes || '')) {
         newActivityLogEntries.push(generateRandomActivityLogEntry(`Notes updated.`, 'Admin User'));
      }
       if (payload.vispReferenceId !== undefined && payload.vispReferenceId !== (originalOrder.vispReferenceId || '')) {
         newActivityLogEntries.push(generateRandomActivityLogEntry(`VISP Reference ID updated to ${payload.vispReferenceId}.`, 'Admin User'));
      }

      updatedOrder.activityLog = [...originalOrder.activityLog, ...newActivityLogEntries];
      orders[orderIndex] = updatedOrder;
      saveOrders(orders);
      resolve(updatedOrder);
    }, MOCK_API_DELAY);
  });
};

export const deleteOrder = async (id: string): Promise<boolean> => {
   return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const updatedOrders = orders.filter(order => order.id !== id);
      if (orders.length === updatedOrders.length) {
        resolve(false); 
      } else {
        saveOrders(updatedOrders);
        resolve(true);
      }
    }, MOCK_API_DELAY);
  });
};
