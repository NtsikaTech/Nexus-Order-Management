
import { ClientRequest, ClientRequestCategory, ClientRequestStatus, NewClientRequestPayload, Actor, AuditActionType, AuditEntityType } from '../types';
import { MOCK_API_DELAY } from '../constants';
import { generateUniqueId } from '../utils/helpers';
import { recordAuditEvent } from './auditLogService'; // Import audit service

const REQUESTS_STORAGE_KEY = 'omsClientRequests';

const getInitialMockRequests = (clientId: string): ClientRequest[] => {
  // Only create initial mocks if no requests for this client exist.
  // This helps avoid re-adding mocks on every call if localStorage is empty but not for *this* client.
  const now = new Date().toISOString();
  return [
    {
      id: `REQ${generateUniqueId()}`,
      clientId: clientId,
      subject: 'Billing question about last invoice',
      description: 'I have a question regarding invoice INV-001-202301. Could someone please clarify the "Service Adjustment" charge?',
      category: 'Billing Inquiry',
      status: 'Open',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      lastUpdatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `REQ${generateUniqueId()}`,
      clientId: clientId,
      subject: 'Internet speed issue - Fibre 50/50',
      description: 'My fibre internet connection seems slower than usual today. I have already restarted my router and ONT.',
      category: 'Support',
      status: 'In Progress',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      lastUpdatedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    },
     {
      id: `REQ${generateUniqueId()}`,
      clientId: clientId,
      subject: 'Inquire about upgrading to 100/100 Mbps Fibre',
      description: 'I am interested in upgrading my current Fibre package to the 100/100 Mbps Uncapped option. Please provide details and pricing.',
      category: 'Service Upgrade',
      status: 'Resolved',
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
      lastUpdatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

const getStoredRequests = (): ClientRequest[] => {
  const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
  if (stored) {
    try {
      const parsedRequests = JSON.parse(stored) as ClientRequest[];
      if (Array.isArray(parsedRequests)) {
        return parsedRequests;
      }
    } catch (e) {
      console.error("Error parsing requests from localStorage:", e);
    }
  }
  return []; // Start with an empty array, initial mocks added per client if none exist
};

const saveRequests = (requests: ClientRequest[]): void => {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
};

export const getRequestsByClientId = async (clientId: string): Promise<ClientRequest[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let allRequests = getStoredRequests();
      let clientRequests = allRequests.filter(req => req.clientId.toLowerCase() === clientId.toLowerCase());

      if (clientRequests.length === 0 && clientId !== 'system') { // Don't generate for 'system' calls
        // No requests for this client, add initial mocks and save
        const initialClientRequests = getInitialMockRequests(clientId);
        clientRequests = initialClientRequests;
        allRequests = [...allRequests, ...initialClientRequests];
        saveRequests(allRequests);
      }
      
      resolve(clientRequests.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, MOCK_API_DELAY);
  });
};

export const getRequestById = async (requestId: string, clientId: string): Promise<ClientRequest | undefined> => {
    return new Promise((resolve) => {
        setTimeout(async () => {
            const clientRequests = await getRequestsByClientId(clientId);
            resolve(clientRequests.find(req => req.id === requestId));
        }, MOCK_API_DELAY / 2);
    });
};

// NewClientRequestPayload is now imported from types.ts

export const createClientRequest = async (payload: NewClientRequestPayload, actor: Actor): Promise<ClientRequest> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const allRequests = getStoredRequests();
      const now = new Date().toISOString();
      const newRequest: ClientRequest = {
        id: `REQ${generateUniqueId()}`,
        clientId: actor.username, // Client's username (email) is their ID for requests
        ...payload,
        status: 'Open',
        submittedAt: now,
        lastUpdatedAt: now,
      };
      const updatedRequests = [...allRequests, newRequest];
      saveRequests(updatedRequests);

      // Audit event
      try {
        await recordAuditEvent({
            userId: actor.userId,
            username: actor.username,
            actionType: AuditActionType.CLIENT_REQUEST_CREATE,
            entityType: AuditEntityType.CLIENT_REQUEST,
            entityId: newRequest.id,
            details: `Client request '${newRequest.subject.substring(0,50)}...' created by '${actor.username}'.`,
            newValue: { subject: newRequest.subject, category: newRequest.category }
        });
      } catch (auditError) {
          console.error("Audit event failed for client request creation:", auditError);
      }

      resolve(newRequest);
    }, MOCK_API_DELAY);
  });
};

// Mock update for demo, e.g., admin updates status
export const updateClientRequestStatus = async (requestId: string, newStatus: ClientRequestStatus, actor: Actor): Promise<ClientRequest | undefined> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            let allRequests = getStoredRequests();
            const requestIndex = allRequests.findIndex(req => req.id === requestId);
            if (requestIndex !== -1) {
                const originalRequest = { ...allRequests[requestIndex] };
                allRequests[requestIndex].status = newStatus;
                allRequests[requestIndex].lastUpdatedAt = new Date().toISOString();
                if (newStatus === 'Resolved' || newStatus === 'Closed') {
                    allRequests[requestIndex].resolvedAt = new Date().toISOString();
                }
                saveRequests(allRequests);

                // Audit event
                try {
                    await recordAuditEvent({
                        userId: actor.userId,
                        username: actor.username,
                        actionType: AuditActionType.CLIENT_REQUEST_STATUS_UPDATE,
                        entityType: AuditEntityType.CLIENT_REQUEST,
                        entityId: requestId,
                        details: `Client request '${originalRequest.subject.substring(0,50)}...' status changed from '${originalRequest.status}' to '${newStatus}' by '${actor.username}'.`,
                        previousValue: originalRequest.status,
                        newValue: newStatus
                    });
                } catch (auditError) {
                    console.error("Audit event failed for client request status update:", auditError);
                }
                resolve(allRequests[requestIndex]);
            } else {
                reject(new Error("Request not found"));
            }
        }, MOCK_API_DELAY);
    });
};
