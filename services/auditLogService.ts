
import { AuditLogEntry, AuditActionType, AuditEntityType, Actor } from '../types';
import { MOCK_API_DELAY, AUDIT_LOG_STORAGE_KEY } from '../constants';
import { generateUniqueId } from '../utils/helpers';

// Helper to get current logs from localStorage
const getStoredAuditLogs = (): AuditLogEntry[] => {
  const stored = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
  if (stored) {
    try {
      const parsedLogs = JSON.parse(stored) as AuditLogEntry[];
      if (Array.isArray(parsedLogs)) {
        return parsedLogs;
      }
    } catch (e) {
      console.error("Error parsing audit logs from localStorage:", e);
    }
  }
  return [];
};

// Helper to save logs to localStorage
const saveAuditLogs = (logs: AuditLogEntry[]): void => {
  localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(logs));
};

/**
 * Records an audit event.
 * @param eventData - The data for the event, excluding id and timestamp.
 */
export const recordAuditEvent = async (
  eventData: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newLogEntry: AuditLogEntry = {
        id: `AUD${generateUniqueId()}`,
        timestamp: new Date().toISOString(),
        ...eventData,
      };
      
      const currentLogs = getStoredAuditLogs();
      // Add to the beginning for chronological order (newest first) in storage,
      // though display sort might be different. Or sort on retrieval.
      // For now, add to end and sort on retrieval if needed.
      const updatedLogs = [...currentLogs, newLogEntry]; 
      saveAuditLogs(updatedLogs);
      resolve();
    }, MOCK_API_DELAY / 4); // Make audit logging quick
  });
};

/**
 * Retrieves all audit logs, sorted by timestamp descending (newest first).
 * Filters can be applied if provided.
 */
export const getAuditLogs = async (filters?: any): Promise<AuditLogEntry[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs = getStoredAuditLogs();
      // Simple sort by timestamp, newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Basic filtering example (can be expanded)
      if (filters) {
        // Implement filtering logic here based on filters object
        // e.g., filter by userId, actionType, date range etc.
      }
      resolve(logs);
    }, MOCK_API_DELAY / 2);
  });
};
