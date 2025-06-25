
import { BillingSettings, Actor, AuditActionType, AuditEntityType, PaymentGatewaySettings } from '../types';
import { MOCK_API_DELAY, BILLING_SETTINGS_STORAGE_KEY } from '../constants';
import { recordAuditEvent } from './auditLogService'; // Import audit service

const getDefaultBillingSettings = (): BillingSettings => ({
  vatRate: 0, // Default to 0% VAT
  payfast: {
    enabled: false,
    merchantId: '',
    apiKey: '', // Mock field
  },
  paypal: {
    enabled: false,
    merchantId: '', // Mock field for PayPal email or ID
    apiKey: '', // Mock field
  },
  companyName: 'Your Company Name',
  companyAddress: '123 Business Rd, Suite 456, Cityville',
  invoiceFooter: 'Thank you for your business!',
});

export const getBillingSettings = async (): Promise<BillingSettings> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem(BILLING_SETTINGS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as BillingSettings;
          // Merge with defaults to ensure all keys are present if settings were saved with an older structure
          resolve({ ...getDefaultBillingSettings(), ...parsed });
        } catch (e) {
          console.error("Error parsing billing settings from localStorage:", e);
          resolve(getDefaultBillingSettings());
        }
      } else {
        resolve(getDefaultBillingSettings());
      }
    }, MOCK_API_DELAY / 2);
  });
};

const auditSettingChange = async (
    actor: Actor,
    settingName: string,
    oldValue: any,
    newValue: any
  ) => {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) { // Basic comparison for nested objects too
      await recordAuditEvent({
        userId: actor.userId,
        username: actor.username,
        actionType: AuditActionType.BILLING_SETTINGS_UPDATE,
        entityType: AuditEntityType.BILLING_SETTINGS,
        entityId: 'global_billing_settings', // Fixed ID for global settings
        details: `Billing setting '${settingName}' changed by '${actor.username}'.`,
        previousValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue,
        newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
      });
    }
};

export const saveBillingSettings = async (settings: BillingSettings, actor: Actor): Promise<void> => {
  return new Promise(async (resolve) => {
    const oldSettings = await getBillingSettings(); // Get current settings for comparison
    
    setTimeout(async () => {
      localStorage.setItem(BILLING_SETTINGS_STORAGE_KEY, JSON.stringify(settings));

      // Audit individual changes
      try {
        await auditSettingChange(actor, 'VAT Rate', oldSettings.vatRate, settings.vatRate);
        await auditSettingChange(actor, 'Company Name', oldSettings.companyName, settings.companyName);
        await auditSettingChange(actor, 'Company Address', oldSettings.companyAddress, settings.companyAddress);
        await auditSettingChange(actor, 'Invoice Footer', oldSettings.invoiceFooter, settings.invoiceFooter);
        
        // Audit PayFast settings
        await auditSettingChange(actor, 'PayFast Settings', oldSettings.payfast, settings.payfast);
        // Audit PayPal settings
        await auditSettingChange(actor, 'PayPal Settings', oldSettings.paypal, settings.paypal);

      } catch (auditError) {
        console.error("Audit event failed for billing settings update:", auditError);
      }
      resolve();
    }, MOCK_API_DELAY / 2);
  });
};
