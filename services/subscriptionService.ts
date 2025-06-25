
import { Subscription, SubscriptionStatus, Order, OrderStatus, Actor, AuditActionType, AuditEntityType } from '../types';
import { MOCK_API_DELAY } from '../constants';
import { generateUniqueId } from '../utils/helpers';
import { getOrders } from './orderService'; // To derive subscriptions from orders
import { recordAuditEvent } from './auditLogService'; // Import audit service

const SUBSCRIPTIONS_STORAGE_KEY = 'omsClientSubscriptions';

// Helper to determine if a service type is typically subscription-based
const isSubscriptionService = (serviceType: string): boolean => {
  const subscriptionTypes = ['Fibre', 'LTE', 'ADSL', 'Web Hosting', 'Domain Hosting']; // Domain Hosting can be a recurring subscription
  return subscriptionTypes.includes(serviceType);
};

const generateMockSubscriptionsForOrder = (order: Order): Subscription[] => {
  const subscriptions: Subscription[] = [];
  if (!isSubscriptionService(order.serviceType)) {
    return subscriptions; // Not a service type that typically has subscriptions
  }

  const now = new Date();
  const startDate = new Date(order.createdAt);
  let status: SubscriptionStatus;
  let renewalDateInstance: Date | undefined = new Date(startDate);
  
  let cycle: 'Monthly' | 'Annually' = 'Monthly';
  let pricePerCycle: number = 0;

  if (order.serviceType === 'Fibre') pricePerCycle = Math.random() * 200 + 499; // e.g. 499-699
  else if (order.serviceType === 'LTE') pricePerCycle = Math.random() * 100 + 149; // e.g. 149-249
  else if (order.serviceType === 'ADSL') pricePerCycle = Math.random() * 100 + 399; // e.g. 399-499
  else if (order.serviceType === 'Web Hosting' || order.serviceType === 'Domain Hosting') {
      pricePerCycle = Math.random() * 50 + 99; // e.g. 99-149
      cycle = 'Annually';
  }
  pricePerCycle = parseFloat(pricePerCycle.toFixed(2));

  if (order.status === OrderStatus.CANCELLED) {
    status = 'Cancelled';
    renewalDateInstance = undefined;
  } else if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SUBMITTED_TO_VISP || order.status === OrderStatus.NEW || order.status === OrderStatus.UNDER_REVIEW) {
    status = 'Active'; // Default for these statuses

    if (cycle === 'Monthly') {
        renewalDateInstance.setMonth(renewalDateInstance.getMonth() + 1);
        while(renewalDateInstance < now) {
            renewalDateInstance.setMonth(renewalDateInstance.getMonth() + 1);
        }
    } else { // Annually
        renewalDateInstance.setFullYear(renewalDateInstance.getFullYear() + 1);
        while(renewalDateInstance < now) {
            renewalDateInstance.setFullYear(renewalDateInstance.getFullYear() + 1);
        }
    }

    // Simulate some active subscriptions becoming expired if they are old and completed
    // This is a mock logic, real system would have explicit expiry or renewal failure.
    const orderUpdatedAt = new Date(order.updatedAt);
    if (status === 'Active' && order.status === OrderStatus.COMPLETED) {
      // If order was completed more than (cycle duration + a bit) ago, and random chance, mark as expired.
      let expiryThreshold = new Date(now);
      if (cycle === 'Monthly') {
        expiryThreshold.setMonth(expiryThreshold.getMonth() - 2); // e.g. completed more than 2 months ago
      } else { // Annually
        expiryThreshold.setFullYear(expiryThreshold.getFullYear() - 1);
        expiryThreshold.setMonth(expiryThreshold.getMonth() - 2); // e.g. completed more than 1 year 2 months ago
      }
      if (orderUpdatedAt < expiryThreshold && Math.random() < 0.3) { // 30% chance for old completed orders
        status = 'Expired';
      }
    }
    
  } else {
    // For any other unhandled order status, don't create a subscription.
    return subscriptions;
  }
  
  // If status ended up Cancelled or Expired, renewalDate should be undefined.
  if (status === 'Cancelled' || status === 'Expired') {
    renewalDateInstance = undefined;
  }

  subscriptions.push({
    id: `SUB${generateUniqueId()}`,
    clientId: order.client.email,
    orderId: order.id,
    serviceType: order.serviceType,
    packageName: order.packageName,
    startDate: startDate.toISOString(),
    renewalDate: renewalDateInstance ? renewalDateInstance.toISOString() : undefined,
    status: status,
    pricePerCycle: pricePerCycle,
    cycle: cycle,
  });
  
  return subscriptions;
};

const getInitialMockSubscriptions = async (): Promise<Subscription[]> => {
  const allOrders = await getOrders(); // System actor for initial data
  let allSubscriptions: Subscription[] = [];
  allOrders.forEach(order => {
    allSubscriptions = [...allSubscriptions, ...generateMockSubscriptionsForOrder(order)];
  });
  return allSubscriptions.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
};

const getStoredSubscriptions = async (): Promise<Subscription[]> => {
  const stored = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
  if (stored) {
    try {
      const parsedSubs = JSON.parse(stored) as Subscription[];
      if (Array.isArray(parsedSubs)) {
        // Simple validation, ensure required fields exist on first item if not empty
        if (parsedSubs.length > 0 && parsedSubs[0].id && parsedSubs[0].clientId && parsedSubs[0].status) {
            return parsedSubs;
        }
      }
    } catch (e) {
      console.error("Error parsing subscriptions from localStorage:", e);
    }
  }
  // If nothing valid in storage, generate initial mocks and save them
  const initialSubs = await getInitialMockSubscriptions();
  localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(initialSubs));
  return initialSubs;
};

const saveSubscriptions = (subscriptions: Subscription[]): void => {
  localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions));
};

export const getSubscriptionsByClientId = async (clientId: string): Promise<Subscription[]> => {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      // Always get potentially fresh list based on orders or current stored state
      // For this demo, let's allow stored subscriptions to persist independently of orders after initial generation
      // to reflect cancellations made through the portal.
      const allSubscriptions = await getStoredSubscriptions(); 
      const clientSubscriptions = allSubscriptions.filter(sub => sub.clientId.toLowerCase() === clientId.toLowerCase());
      resolve(clientSubscriptions);
    }, MOCK_API_DELAY);
  });
};

export const requestSubscriptionCancellation = async (subscriptionId: string, actor: Actor): Promise<Subscription | undefined> => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      let allSubscriptions = await getStoredSubscriptions();
      const subIndex = allSubscriptions.findIndex(s => s.id === subscriptionId && s.clientId.toLowerCase() === actor.username.toLowerCase());
      if (subIndex !== -1) {
        const originalSubscription = { ...allSubscriptions[subIndex] };
        if (allSubscriptions[subIndex].status === 'Active') {
          allSubscriptions[subIndex].status = 'Pending Cancellation';
          saveSubscriptions(allSubscriptions);

          // Audit event
          try {
            await recordAuditEvent({
                userId: actor.userId,
                username: actor.username,
                actionType: AuditActionType.SUBSCRIPTION_STATUS_UPDATE,
                entityType: AuditEntityType.SUBSCRIPTION,
                entityId: subscriptionId,
                details: `Subscription '${originalSubscription.serviceType} - ${originalSubscription.packageName}' status changed from '${originalSubscription.status}' to 'Pending Cancellation' by '${actor.username}'.`,
                previousValue: originalSubscription.status,
                newValue: 'Pending Cancellation'
            });
          } catch (auditError) {
              console.error("Audit event failed for subscription cancellation request:", auditError);
          }
          resolve(allSubscriptions[subIndex]);
        } else {
          reject(new Error(`Subscription is not Active, current status: ${allSubscriptions[subIndex].status}`));
        }
      } else {
        reject(new Error('Subscription not found or does not belong to client.'));
      }
    }, MOCK_API_DELAY / 2);
  });
};