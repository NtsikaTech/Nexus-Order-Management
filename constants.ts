import { OrderStatus, AuditActionType, AuditEntityType, ProductCategory } from './types';

export const APP_NAME = "Nexus- Order Management";

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.UNDER_REVIEW,
  OrderStatus.SUBMITTED_TO_VISP,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'bg-status-new text-white',
  [OrderStatus.UNDER_REVIEW]: 'bg-status-review text-black',
  [OrderStatus.SUBMITTED_TO_VISP]: 'bg-status-submitted text-white',
  [OrderStatus.COMPLETED]: 'bg-status-completed text-white',
  [OrderStatus.CANCELLED]: 'bg-status-cancelled text-white',
};

export const MOCK_API_DELAY = 500; // ms

// Example service types and packages
export const SERVICE_TYPES = ['Fibre', 'LTE', 'ADSL', 'Domain Hosting', 'Web Hosting'];
export const SERVICE_PACKAGES: Record<string, string[]> = {
  'Fibre': ['10/10 Mbps Uncapped', '25/25 Mbps Uncapped', '50/50 Mbps Uncapped', '100/100 Mbps Uncapped'],
  'LTE': ['10GB Anytime', '20GB Anytime', '50GB Anytime + 50GB Night Owl'],
  'ADSL': ['Up to 10Mbps Uncapped', 'Up to 20Mbps Uncapped'],
  'Domain Hosting': ['Standard Domain Registration (.co.za)', 'Premium Domain Registration (.com)'],
  'Web Hosting': ['Basic Linux Hosting', 'Advanced Windows Hosting'],
};

export const ITEMS_PER_PAGE = 10;

export const BILLING_SETTINGS_STORAGE_KEY = 'omsBillingSettings';
export const AUDIT_LOG_STORAGE_KEY = 'omsAuditLogs';


// Display names for Audit Log
export const AuditActionDisplayNames: Record<AuditActionType, string> = {
  [AuditActionType.ORDER_CREATE]: 'Order Created',
  [AuditActionType.ORDER_UPDATE]: 'Order Updated',
  [AuditActionType.ORDER_DELETE]: 'Order Deleted',
  [AuditActionType.USER_CREATE]: 'User Account Created',
  [AuditActionType.USER_UPDATE]: 'User Account Updated',
  [AuditActionType.USER_DELETE]: 'User Account Deleted',
  [AuditActionType.USER_ROLE_CHANGE]: 'User Role Changed',
  [AuditActionType.USER_LOGIN]: 'User Login',
  [AuditActionType.USER_LOGOUT]: 'User Logout',
  [AuditActionType.INVOICE_STATUS_UPDATE]: 'Invoice Status Updated',
  [AuditActionType.BILLING_SETTINGS_UPDATE]: 'Billing Settings Updated',
  [AuditActionType.CLIENT_REQUEST_CREATE]: 'Client Request Created',
  [AuditActionType.CLIENT_REQUEST_STATUS_UPDATE]: 'Client Request Status Updated',
  [AuditActionType.SUBSCRIPTION_STATUS_UPDATE]: 'Subscription Status Updated',
  [AuditActionType.SYSTEM_ERROR]: 'System Error',
  [AuditActionType.UNKNOWN]: 'Unknown Action',
};

export const AuditEntityDisplayNames: Record<AuditEntityType, string> = {
  [AuditEntityType.ORDER]: 'Order',
  [AuditEntityType.USER]: 'User Account',
  [AuditEntityType.INVOICE]: 'Invoice',
  [AuditEntityType.BILLING_SETTINGS]: 'Billing Configuration',
  [AuditEntityType.CLIENT_REQUEST]: 'Client Request',
  [AuditEntityType.SUBSCRIPTION]: 'Subscription',
  [AuditEntityType.SYSTEM]: 'System',
  [AuditEntityType.NONE]: 'N/A',
};

export const SERVICE_CATALOG: ProductCategory[] = [
  {
    id: 'cat_fibre',
    name: 'Fibre Internet Services',
    products: [
      { id: 'fibre_home_basic', name: 'Basic Fibre (25 Mbps)', price: 'R499/month', description: 'Uncapped, Shaped Traffic, Standard Router Included.' },
      { id: 'fibre_home_standard', name: 'Standard Fibre (50 Mbps)', price: 'R699/month', description: 'Uncapped, Unshaped Traffic, Wi-Fi Router Included.' },
      { id: 'fibre_home_premium', name: 'Premium Fibre (100 Mbps)', price: 'R899/month', description: 'Uncapped, Unshaped, Premium Wi-Fi Router, Priority Support.' },
      { id: 'fibre_home_ultra', name: 'Ultra Fibre (200 Mbps)', price: 'R1199/month', description: 'Uncapped, Unshaped, High-performance Router, Dedicated Support Channel.' },
      { id: 'fibre_biz_starter', name: 'Business Starter (50 Mbps)', price: 'R999/month', description: 'Static IP, Uncapped, Basic SLA, Standard Router.' },
      { id: 'fibre_biz_pro', name: 'Business Pro (100 Mbps)', price: 'R1499/month', description: 'Static IP, Uncapped, Premium SLA, Business Router.' },
      { id: 'fibre_biz_enterprise', name: 'Business Enterprise (250 Mbps)', price: 'R2799/month', description: 'Multiple Static IPs, Uncapped, Enterprise SLA, Managed Business Router.' },
    ],
  },
  {
    id: 'cat_web',
    name: 'Web Services',
    products: [
      { id: 'web_hosting_starter', name: 'Starter Hosting', price: 'R49/month', description: '5 GB SSD Storage, Unlimited Bandwidth, 5 Email Accounts, Free SSL.' },
      { id: 'web_hosting_business', name: 'Business Hosting', price: 'R129/month', description: '20 GB SSD Storage, Unlimited Bandwidth, 50 Email Accounts, Free SSL, Daily Backups.' },
      { id: 'web_hosting_enterprise', name: 'Enterprise Hosting', price: 'R299/month', description: '100 GB SSD Storage, Unlimited Bandwidth, Unlimited Email Accounts, Enhanced Security, SSL, Priority Support.' },
      { id: 'domain_coza', name: '.co.za Domains', price: 'R99/year', description: 'Standard .co.za domain registration.' },
      { id: 'domain_com', name: '.com Domains', price: 'R199/year', description: 'Premium .com domain registration.' },
      { id: 'domain_transfer', name: 'Domain Transfer', price: 'Free with annual subscription plans', description: 'Transfer your existing domain to us.' },
    ],
  },
  {
    id: 'cat_m365',
    name: 'Microsoft 365 Packages',
    products: [
      { id: 'm365_basic', name: 'Microsoft 365 Business Basic', price: 'R89/user/month', description: 'Email Hosting, Web versions of Office apps, 1 TB OneDrive storage, Microsoft Teams.' },
      { id: 'm365_standard', name: 'Microsoft 365 Business Standard', price: 'R179/user/month', description: 'Desktop Office apps (Outlook, Word, Excel, PowerPoint), Email hosting, 1 TB storage, Microsoft Teams.' },
      { id: 'm365_premium', name: 'Microsoft 365 Business Premium', price: 'R299/user/month', description: 'Advanced security, Mobile device management, Desktop Office apps, Email hosting, Teams, Enhanced Security.' },
      { id: 'm365_apps', name: 'Microsoft 365 Apps for Business', price: 'R159/user/month', description: 'Desktop Office apps, 1 TB cloud storage, without email hosting.' },
    ],
  },
  {
    id: 'cat_cloud_infra',
    name: 'Cloud Migration and Infrastructure',
    products: [
      { id: 'cloud_migration_assess', name: 'Cloud Migration (Assessment & Planning)', price: 'from R10,000/project', description: 'Initial Cloud Readiness Assessment, Planning, and Detailed Migration Roadmap.' },
      { id: 'cloud_azure', name: 'Azure Cloud Hosting', price: 'from R2,500/month', description: 'Infrastructure setup, management, Azure Virtual Machines, Managed Backups.' },
      { id: 'cloud_aws', name: 'AWS Cloud Hosting', price: 'from R2,500/month', description: 'AWS Infrastructure, managed services, security, backups, and disaster recovery.' },
    ],
  },
  {
    id: 'cat_cybersecurity',
    name: 'Cybersecurity and Cloud Firewalls',
    products: [
      { id: 'fw_basic', name: 'Basic Firewall Protection', price: 'R999/month', description: 'Managed firewall, standard threat detection, monthly reporting.' },
      { id: 'fw_advanced', name: 'Advanced Cybersecurity', price: 'R2,999/month', description: 'Enhanced Firewall Management, Intrusion Detection, Endpoint Security, Email Filtering, Monthly Security Audits.' },
      { id: 'fw_enterprise', name: 'Enterprise Security Suite', price: 'R4,999+/month', description: 'Comprehensive Managed Security including firewall, IDS, Penetration Testing, ATP, Real-time Security Dashboard.' },
    ],
  },
  {
    id: 'cat_managed_it',
    name: 'Managed ICT Support',
    products: [
      { id: 'support_remote', name: 'Remote ICT Support', price: 'from R299/hour or R3,999/month', description: 'Remote desktop assistance, software troubleshooting, virus/malware removal, remote management.' },
      { id: 'support_onsite', name: 'On-site ICT Support', price: 'from R699/hour or R7,999/month', description: 'Dedicated on-site visits, hardware maintenance, installations, repairs, preventative maintenance.' },
      { id: 'support_full', name: 'Full Managed ICT Service', price: 'from R14,999/month', description: 'Comprehensive managed ICT service, proactive monitoring, ICT strategy consulting, monthly audits, priority support.' },
    ],
  },
  {
    id: 'cat_ai_chatbots',
    name: 'Chatbots and Specialised AI Agents',
    products: [
      { id: 'chatbot_std', name: 'Standard Chatbot Development', price: 'from R15,000/project', description: 'Basic chatbot integration, Q&A style chatbot, basic AI training.' },
      { id: 'ai_agent_adv', name: 'Advanced AI Agent Development', price: 'from R40,000/project', description: 'Custom conversational AI with data integration, Azure AI or OpenAI models, advanced workflow integration, ongoing AI model training.' },
      { id: 'ai_managed', name: 'Managed Chatbot and AI Service', price: 'from R4,999/month', description: 'Continuous management, AI model updates, real-time analytics, custom API integrations.' },
    ],
  },
  {
    id: 'cat_hybrid_work',
    name: 'Hybrid Work Environments & Frameworks',
    products: [
      { id: 'hybrid_virt_workspace', name: 'Virtual Workspace Implementation', price: 'from R9,999/project', description: 'Setup of virtual desktops, Microsoft Teams, collaboration tools integration, secure remote access.' },
      { id: 'hybrid_collab_mgmt', name: 'Collaboration Suite Management', price: 'from R2,999/month', description: 'Management of Microsoft Teams, SharePoint, virtual conferencing tools, document collaboration systems.' },
      { id: 'hybrid_consulting', name: 'Hybrid Workplace Consulting', price: 'from R5,000/session', description: 'Tailored hybrid working strategy, infrastructure advisory, cloud infrastructure integration, hybrid workplace best practices.' },
    ],
  },
  {
    id: 'cat_helpdesk',
    name: 'Ticketing & Helpdesk System',
    products: [
      { id: 'helpdesk_bytedesk', name: 'ByteDesk Helpdesk Software', price: 'from R499/month', description: 'AI-powered helpdesk, customer ticketing system, incident management, escalation workflows, analytics and reporting.' },
      { id: 'helpdesk_bytedesk_adv', name: 'Advanced ByteDesk Integration', price: 'from R1,999/month', description: 'Custom workflows, CRM integration, API connections, AI-enhanced support systems, proactive customer support.' },
    ],
  },
  {
    id: 'cat_gpu_rental',
    name: 'GPU Rental Services (NB Accelerate)',
    products: [
      { id: 'gpu_basic', name: 'Basic GPU Instance', price: 'R199/hour', description: 'NVIDIA GTX GPU instance, ideal for basic AI & graphic tasks.' },
      { id: 'gpu_pro', name: 'Pro GPU Instance', price: 'R399/hour', description: 'NVIDIA RTX GPU instance, suitable for AI/ML workloads, data processing.' },
      { id: 'gpu_enterprise', name: 'Enterprise GPU Instance', price: 'R799/hour', description: 'NVIDIA A100 GPU, advanced deep learning, intensive computational needs.' },
    ],
  },
  {
    id: 'cat_backup_recovery',
    name: 'Data Backup & Recovery Solutions',
    products: [
      { id: 'backup_cloud', name: 'Cloud Backup', price: 'from R299/month', description: 'Automated backups, encrypted data storage, cloud-based recovery.' },
      { id: 'backup_draas', name: 'Disaster Recovery as a Service (DRaaS)', price: 'from R2,499/month', description: 'Comprehensive disaster recovery planning, redundant cloud infrastructure, rapid data recovery solutions.' },
    ],
  },
  {
    id: 'cat_custom_solutions',
    name: 'Additional Customised Solutions',
    products: [
      { id: 'custom_dev', name: 'Customised Development Projects', price: 'Quote on request', description: 'Specialised software solutions, custom integrations, enterprise app development.' },
      { id: 'custom_compliance', name: 'ICT Compliance and Governance Consulting', price: 'from R5,999/session', description: 'Consulting for ICT policies, governance, cybersecurity audits, regulatory compliance assessments.' },
    ],
  },
];
