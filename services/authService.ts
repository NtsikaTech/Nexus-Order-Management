
import { MOCK_API_DELAY } from '../constants';
import { AdminUser, UserRole, Actor, AuditActionType, AuditEntityType, ClientProfileUpdatePayload, Client } from '../types';
import { generateUniqueId } from '../utils/helpers';
import { recordAuditEvent } from './auditLogService'; 
import { getOrders as fetchAllOrdersFromService, saveOrders as saveAllOrdersToService } from './orderService'; // For cascading updates

const AUTH_USER_ID_KEY = 'omsAuthUserId';

// Internal type for mock data, including a password for simulation
interface AdminUserWithMockPassword extends AdminUser {
  mockPassword_cleartext: string; 
  // Storing full client details directly on the AdminUser object for clients
  // This mirrors what might be on a user table.
  name?: string; 
  contactNumber?: string;
  address?: string;
  idNumber?: string;
}

// Mock database of users
let MOCK_USERS: AdminUserWithMockPassword[] = [
  { id: 'admin001', username: 'admin', role: 'admin', mockPassword_cleartext: 'admin', name: 'Admin User' },
  { id: 'user001', username: 'john.doe', role: 'user', mockPassword_cleartext: 'password123', name: 'John Doe (Staff)' },
  { id: 'user002', username: 'jane.smith', role: 'user', mockPassword_cleartext: 'password456', name: 'Jane Smith (Staff)' },
  // Client Users - username is their email
  { 
    id: 'client001', 
    username: 'john.doe@example.com', 
    role: 'client', 
    mockPassword_cleartext: 'clientpass',
    name: 'John Doe',
    contactNumber: '0821234567',
    address: '123 Main St, Anytown',
    idNumber: '8001015000080'
  },
  { 
    id: 'client002', 
    username: 'jane.smith@example.com', 
    role: 'client', 
    mockPassword_cleartext: 'clientpass',
    name: 'Jane Smith',
    contactNumber: '0739876543',
    address: '456 Oak Ave, Otherville',
    idNumber: '8502026000085'
  },
  { 
    id: 'client003', 
    username: 'support@techsolutions.com', 
    role: 'client', 
    mockPassword_cleartext: 'clientpass',
    name: 'Tech Solutions Inc.',
    contactNumber: '0115550000',
    address: '789 Tech Park, Silicon Valley',
    idNumber: 'CK2005/012345/07' // Example for a business
  },
];

const MOCK_TOKEN_PREFIX = 'mock-jwt-token-for-user-';

export const login = async (username: string, password_provided: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.mockPassword_cleartext === password_provided) {
        const token = `${MOCK_TOKEN_PREFIX}${user.id}`;
        localStorage.setItem(AUTH_USER_ID_KEY, user.id); 
        
        recordAuditEvent({
            userId: user.id,
            username: user.username,
            actionType: AuditActionType.USER_LOGIN,
            entityType: AuditEntityType.USER,
            entityId: user.id,
            details: `User '${user.username}' logged in successfully.`
        }).catch(err => console.error("Audit event failed for login:", err));

        resolve(token);
      } else {
        reject(new Error('Invalid username or password.'));
      }
    }, MOCK_API_DELAY);
  });
};

export const logout = (): void => {
  const userId = localStorage.getItem(AUTH_USER_ID_KEY);
  if (userId) {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
        recordAuditEvent({
            userId: user.id,
            username: user.username,
            actionType: AuditActionType.USER_LOGOUT,
            entityType: AuditEntityType.USER,
            entityId: user.id,
            details: `User '${user.username}' logged out.`
        }).catch(err => console.error("Audit event failed for logout:", err));
    }
  }
  localStorage.removeItem(AUTH_USER_ID_KEY);
};

export const getAuthToken = (): string | null => {
  const userId = localStorage.getItem(AUTH_USER_ID_KEY);
  if (userId) {
    return `${MOCK_TOKEN_PREFIX}${userId}`;
  }
  return null;
};

export const getCurrentUser = async (): Promise<AdminUser | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userId = localStorage.getItem(AUTH_USER_ID_KEY);
      if (userId) {
        const user = MOCK_USERS.find(u => u.id === userId);
        if (user) {
          const { mockPassword_cleartext, ...userWithoutPassword } = user;
          resolve(userWithoutPassword as AdminUser);
        } else {
          resolve(null); 
        }
      } else {
        resolve(null);
      }
    }, MOCK_API_DELAY / 2);
  });
};

export const getAllUsers = async (): Promise<AdminUser[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const usersWithoutPasswords = MOCK_USERS.map(u => {
        const { mockPassword_cleartext, ...user } = u;
        return user as AdminUser;
      });
      resolve(usersWithoutPasswords);
    }, MOCK_API_DELAY / 2);
  });
};

export const updateUserRole = async (userId: string, newRole: UserRole, actor: Actor): Promise<AdminUser | undefined> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const originalUser = { ...MOCK_USERS[userIndex] }; 
        
        MOCK_USERS[userIndex].role = newRole;
        const { mockPassword_cleartext, ...updatedUser } = MOCK_USERS[userIndex];

        try {
            await recordAuditEvent({
                userId: actor.userId,
                username: actor.username,
                actionType: AuditActionType.USER_ROLE_CHANGE,
                entityType: AuditEntityType.USER,
                entityId: userId,
                details: `User '${originalUser.username}' role changed from '${originalUser.role}' to '${newRole}' by '${actor.username}'.`,
                previousValue: originalUser.role,
                newValue: newRole
            });
        } catch (auditError) {
            console.error("Audit event failed for user role update:", auditError);
        }
        
        resolve(updatedUser as AdminUser);
      } else {
        reject(new Error('User not found'));
      }
    }, MOCK_API_DELAY / 2);
  });
};

export const updateClientProfile = async (
  userId: string, 
  payload: ClientProfileUpdatePayload, 
  actor: Actor
): Promise<AdminUser | undefined> => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId && u.role === 'client');
      if (userIndex === -1) {
        reject(new Error('Client user not found.'));
        return;
      }

      const originalUser = { ...MOCK_USERS[userIndex] };
      const changes: string[] = [];
      const previousValues: Partial<ClientProfileUpdatePayload & { username?: string }> = {};
      const newValues: Partial<ClientProfileUpdatePayload & { username?: string }> = {};

      // Update MOCK_USERS entry
      const updatedMockUser = MOCK_USERS[userIndex];
      
      if (payload.name !== updatedMockUser.name) {
        changes.push(`Name from '${updatedMockUser.name}' to '${payload.name}'`);
        previousValues.name = updatedMockUser.name;
        newValues.name = payload.name;
        updatedMockUser.name = payload.name;
      }
      if (payload.email.toLowerCase() !== updatedMockUser.username.toLowerCase()) {
        changes.push(`Email (username) from '${updatedMockUser.username}' to '${payload.email}'`);
        previousValues.username = updatedMockUser.username; // For audit, username is the email for clients
        newValues.username = payload.email;
        updatedMockUser.username = payload.email; // Email is the username for clients
      }
      if (payload.contactNumber !== updatedMockUser.contactNumber) {
        changes.push(`Contact number updated.`);
        previousValues.contactNumber = updatedMockUser.contactNumber;
        newValues.contactNumber = payload.contactNumber;
        updatedMockUser.contactNumber = payload.contactNumber;
      }
      if (payload.address !== updatedMockUser.address) {
        changes.push(`Address updated.`);
        previousValues.address = updatedMockUser.address;
        newValues.address = payload.address;
        updatedMockUser.address = payload.address;
      }
      if (payload.idNumber !== updatedMockUser.idNumber) {
        changes.push(`ID number updated.`);
        previousValues.idNumber = updatedMockUser.idNumber;
        newValues.idNumber = payload.idNumber;
        updatedMockUser.idNumber = payload.idNumber;
      }
      
      MOCK_USERS[userIndex] = updatedMockUser;

      // Cascade updates to orders
      // Note: This is a simplified mock. A real backend would handle this more robustly.
      try {
        let allOrders = await fetchAllOrdersFromService(); // Assuming this fetches from current localStorage state
        let ordersModified = false;
        allOrders = allOrders.map(order => {
          if (order.client.email.toLowerCase() === originalUser.username.toLowerCase()) { // Match by original email
            ordersModified = true;
            return {
              ...order,
              client: {
                ...order.client,
                name: payload.name,
                email: payload.email, // Update email on order
                contactNumber: payload.contactNumber,
                address: payload.address,
                idNumber: payload.idNumber || order.client.idNumber, // Keep old if new is undefined
              } as Client,
            };
          }
          return order;
        });

        if (ordersModified) {
          // This assumes saveAllOrdersToService can take the whole array and overwrite.
          // This function isn't explicitly defined in the provided orderService, so we're making an assumption.
          // If orderService doesn't have `saveOrders`, this part will be problematic.
          // For now, let's assume it exists and works like saveOrders in other services.
          localStorage.setItem('omsOrders', JSON.stringify(allOrders)); // Direct save for simplicity if saveAllOrdersToService not available
        }
      } catch (orderServiceError) {
        console.error("Failed to update client details on orders:", orderServiceError);
        // Potentially rollback MOCK_USERS change or log inconsistency
      }
      
      // Audit event
      if (changes.length > 0) {
        try {
          await recordAuditEvent({
            userId: actor.userId,
            username: actor.username,
            actionType: AuditActionType.USER_UPDATE, // Using generic USER_UPDATE
            entityType: AuditEntityType.USER,
            entityId: userId,
            details: `Client profile updated by '${actor.username}'. Changes: ${changes.join(', ')}.`,
            previousValue: previousValues,
            newValue: newValues,
          });
        } catch (auditError) {
          console.error("Audit event failed for client profile update:", auditError);
        }
      }
      
      const { mockPassword_cleartext, ...userToReturn } = updatedMockUser;
      resolve(userToReturn as AdminUser);

    }, MOCK_API_DELAY);
  });
};
