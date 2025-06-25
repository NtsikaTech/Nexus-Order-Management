
import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AdminUser, ClientProfileUpdatePayload, Actor } from '../../types';
import { updateClientProfile as apiUpdateClientProfile } from '../../services/authService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { UserCog, Edit3, Save, X, CreditCard, DollarSign, University, CheckCircle, Lock, ShieldCheck, QrCode, Smartphone, Mail, Eye } from 'lucide-react';
import { isValidEmail, isNotEmpty } from '../../utils/helpers';

// --- SVG Icon Components ---
const VisaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" {...props}>
    <path fill="#1A1F71" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
    <path fill="#fff" d="M12.9 14.3H9.8L8.1 3.8h3.2l1.8 10.5zM22.7 3.8L20.2 13h-2.9l2.5-9.2h2.9zM28.1 5.2l-3.6 7.4h2.5l3.5-7.4h-2.4zM16.9 3.8h3.2l2.4 9.2h-3.2L16.9 3.8zM31.7 3.8L30 9.7l-.4-2.1c-.2-.9-.5-1.7-1-2.1-.3-.3-.7-.4-1.2-.4H24c-.2 0-.4 0-.5.2-.2.1-.3.3-.3.5l-2.4 9.2h3.2l.9-3.2c.1-.2.2-.4.4-.4h.1c.1 0 .2.1.3.2l1.6 3.4h3.2L31.7 3.8z"/>
  </svg>
);

const MastercardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" {...props}>
    <path fill="#fff" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
    <circle fill="#EB001B" cx="15" cy="12" r="7"/>
    <circle fill="#F79E1B" cx="23" cy="12" r="7"/>
    <path fill="#FF5F00" d="M22 12c0-3.9-3.1-7-7-7s-7 3.1-7 7 3.1 7 7 7 7-3.1 7-7z"/>
  </svg>
);

const AmexIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" {...props}>
    <path fill="#0077A0" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
    <path fill="#fff" d="M11.6 8.3H7.9V6.8h7.1v1.1h-3.4v6.8H9.9V9.4h1.7zm15.7 6.4h-1.7l1.7-6.9h1.7l-1.7 6.9zm-7-2.9h4.3v1.3H20v-5h1.7v3.7zm-4.3 2.9h-1.7l1.7-6.9h1.7l-1.7 6.9z"/>
  </svg>
);

const PayFastIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" width="38" height="24" {...props}>
        <rect width="100" height="60" rx="5" ry="5" fill="#36A432"/>
        <text x="50" y="38" fontSize="24" fill="white" textAnchor="middle" fontWeight="bold">PayFast</text>
    </svg>
);

const EFTIcon: React.FC<{ className?: string }> = ({ className }) => (
    <University size={24} className={`text-brand-text-light-secondary ${className || ''}`.trim()} />
);
const GenericCardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <CreditCard size={24} className={`text-brand-text-light-secondary ${className || ''}`.trim()} />
);

const MockQRCodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="128" height="128" fill="#ECF0F1"/>
    <rect x="16" y="16" width="32" height="32" fill="#2C3E50"/>
    <rect x="24" y="24" width="16" height="16" fill="#ECF0F1"/>
    <rect x="80" y="16" width="32" height="32" fill="#2C3E50"/>
    <rect x="88" y="24" width="16" height="16" fill="#ECF0F1"/>
    <rect x="16" y="80" width="32" height="32" fill="#2C3E50"/>
    <rect x="24" y="88" width="16" height="16" fill="#ECF0F1"/>
    <rect x="60" y="60" width="8" height="8" fill="#2C3E50"/>
    <rect x="80" y="52" width="8" height="8" fill="#2C3E50"/>
    <rect x="92" y="60" width="8" height="8" fill="#2C3E50"/>
    <rect x="52" y="80" width="8" height="8" fill="#2C3E50"/>
    <rect x="68" y="92" width="8" height="8" fill="#2C3E50"/>
    <rect x="80" y="80" width="8" height="8" fill="#2C3E50"/>
    <rect x="96" y="88" width="8" height="8" fill="#2C3E50"/>
    <rect x="60" y="48" width="8" height="8" fill="#27AE60"/>
    <rect x="48" y="60" width="8" height="8" fill="#27AE60"/>
    <rect x="72" y="72" width="8" height="8" fill="#27AE60"/>
  </svg>
);
// --- End SVG Icon Components ---

const DetailRow: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-brand-text-light-secondary">{label}</dt>
    <dd className="mt-1 text-sm text-brand-text-light sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
  </div>
);

type FormErrors = Partial<Record<keyof ClientProfileUpdatePayload, string>>;

type PaymentMethodType = 'card' | 'payfast' | 'eft';

interface CardBillingDetails {
  cardholderName: string;
  cardNumberLast4: string; 
  expiryDate: string; // MM/YY
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'unknown';
}

interface BillingDetails {
  paymentMethodType: PaymentMethodType;
  cardDetails?: CardBillingDetails;
}

interface CardBillingFormDetails {
  cardholderName: string;
  cardNumber: string; 
  expiryDate: string; 
  cvv: string;
}

type BillingFormErrors = Partial<Record<keyof CardBillingFormDetails, string>>;

const maskCardNumberDisplay = (cardNumberLast4: string, brand: string): string => {
  if (!cardNumberLast4) return 'N/A';
  const brandUpper = brand ? brand.toUpperCase() : 'CARD';
  return `${brandUpper} **** **** **** ${cardNumberLast4}`;
};

const getCardBrand = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
  const num = cardNumber.replace(/\s/g, '');
  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(num) && (num.length === 13 || num.length === 16)) return 'visa';
  if (/^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/.test(num) && num.length === 16) return 'mastercard';
  if (/^3[47][0-9]{13}$/.test(num) && num.length === 15) return 'amex';
  return 'unknown';
};

type PasswordFormFields = 'currentPassword' | 'newPassword' | 'confirmNewPassword';
type PasswordErrors = Partial<Record<PasswordFormFields, string>>;

type ForgotPasswordStep = 'initial' | 'selectOtpMethod' | 'enterOtp' | 'resetPasswordForm';
type OtpDeliveryMethod = 'email' | 'phone' | null;


const ClientProfilePage: React.FC = () => {
  const { user, login: updateUserContext } = useAuth();
  
  // Personal Info State
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [personalInfoFormData, setPersonalInfoFormData] = useState<ClientProfileUpdatePayload>({
    name: '', email: '', contactNumber: '', address: '', idNumber: '',
  });
  const [personalInfoErrors, setPersonalInfoErrors] = useState<FormErrors>({});
  const [isLoadingPersonalInfo, setIsLoadingPersonalInfo] = useState(false);
  const [serverPersonalInfoError, setServerPersonalInfoError] = useState<string | null>(null);

  // Billing Info State
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('card');
  const [formDataCardBilling, setFormDataCardBilling] = useState<CardBillingFormDetails>({
    cardholderName: '', cardNumber: '', expiryDate: '', cvv: '',
  });
  const [billingErrors, setBillingErrors] = useState<BillingFormErrors>({});
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [serverBillingError, setServerBillingError] = useState<string | null>(null);
  const [detectedCardBrand, setDetectedCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');

  // Password Management State
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string>('');
  const [passwordServerError, setPasswordServerError] = useState<string>('');
  const [isLoadingPasswordChange, setIsLoadingPasswordChange] = useState(false);

  // Forgot Password Flow State
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('initial');
  const [otpDeliveryMethod, setOtpDeliveryMethod] = useState<OtpDeliveryMethod>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); 
  const [setup2FAStep, setSetup2FAStep] = useState<'initial' | 'showQR' | 'verifyCode'>('initial');
  const [twoFaCodeInput, setTwoFaCodeInput] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [twoFaSuccessMessage, setTwoFaSuccessMessage] = useState('');
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const MOCK_2FA_SECRET_KEY = "NXSSECRETKEY1234567"; 


  useEffect(() => {
    if (user) {
      setPersonalInfoFormData({
        name: user.name || '',
        email: user.username, 
        contactNumber: user.contactNumber || '',
        address: user.address || '',
        idNumber: user.idNumber || '',
      });
      
      const savedBilling = localStorage.getItem(`billingDetails_${user.id}`);
      if (savedBilling && savedBilling !== 'null' && savedBilling !== 'undefined') {
        try {
          const parsed = JSON.parse(savedBilling);
          // Ensure parsed is an object and has expected structure (basic check)
          if (parsed && typeof parsed === 'object' && 'paymentMethodType' in parsed) {
            setBillingDetails(parsed as BillingDetails);
          } else {
            console.warn("Billing details in localStorage was not a valid BillingDetails object:", parsed);
            localStorage.removeItem(`billingDetails_${user.id}`);
            setBillingDetails(null);
          }
        } catch (e) {
          console.error("Failed to parse billingDetails from localStorage:", e);
          localStorage.removeItem(`billingDetails_${user.id}`); 
          setBillingDetails(null); 
        }
      } else {
        setBillingDetails(null); // Explicitly set to null if nothing valid in localStorage
      }

      const saved2FAStatus = localStorage.getItem(`2faStatus_${user.id}`);
      setIs2FAEnabled(saved2FAStatus === 'true');
    }
  }, [user]);

  // Personal Info Handlers
  const validatePersonalInfoField = (name: keyof ClientProfileUpdatePayload, value: string): string => {
    switch (name) {
      case 'name': return isNotEmpty(value) ? '' : 'Full name is required.';
      case 'email':
        if (!isNotEmpty(value)) return 'Email is required.';
        return isValidEmail(value) ? '' : 'Invalid email format.';
      case 'contactNumber': return isNotEmpty(value) ? '' : 'Contact number is required.';
      case 'address': return isNotEmpty(value) ? '' : 'Address is required.';
      case 'idNumber': return ''; 
      default: return '';
    }
  };

  const handlePersonalInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalInfoFormData(prev => ({ ...prev, [name]: value }));
    if (personalInfoErrors[name as keyof ClientProfileUpdatePayload]) {
      setPersonalInfoErrors({ ...personalInfoErrors, [name]: validatePersonalInfoField(name as keyof ClientProfileUpdatePayload, value) });
    }
  };

  const handlePersonalInfoBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalInfoErrors(prev => ({ ...prev, [name]: validatePersonalInfoField(name as keyof ClientProfileUpdatePayload, value) }));
  };

  const validatePersonalInfoForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    (Object.keys(personalInfoFormData) as Array<keyof ClientProfileUpdatePayload>).forEach(key => {
      const error = validatePersonalInfoField(key, personalInfoFormData[key] as string);
      if (error) { newErrors[key] = error; isValid = false; }
    });
    setPersonalInfoErrors(newErrors);
    return isValid;
  };

  const handlePersonalInfoSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerPersonalInfoError(null);
    if (!user) { setServerPersonalInfoError("User not authenticated."); return; }
    if (!validatePersonalInfoForm()) return;

    setIsLoadingPersonalInfo(true);
    const actor: Actor = { userId: user.id, username: user.username };
    try {
      const updatedUser = await apiUpdateClientProfile(user.id, personalInfoFormData, actor);
      if (updatedUser) {
        updateUserContext(updatedUser); 
        setIsEditingPersonalInfo(false);
        alert("Personal profile updated successfully!");
      } else { throw new Error("Failed to get updated user details from service."); }
    } catch (err: any) {
      setServerPersonalInfoError(err.message || "Failed to update profile.");
    } finally { setIsLoadingPersonalInfo(false); }
  };

  // Billing Info Handlers
  const validateCardBillingField = (name: keyof CardBillingFormDetails, value: string): string => {
    const rawCardNumber = name === 'cardNumber' ? value.replace(/\s/g, '') : value;
    switch (name) {
      case 'cardholderName': return isNotEmpty(value) ? '' : 'Cardholder name is required.';
      case 'cardNumber':
        if (!isNotEmpty(rawCardNumber)) return 'Card number is required.';
        const brand = getCardBrand(rawCardNumber);
        if (brand === 'amex' && rawCardNumber.length !== 15) return 'Amex # must be 15 digits.';
        if ((brand === 'visa' || brand === 'mastercard') && rawCardNumber.length !== 16) return 'Visa/MC # must be 16 digits.';
        if (brand === 'unknown' && !/^\d{13,19}$/.test(rawCardNumber)) return 'Card # must be 13-19 digits.';
        return '';
      case 'expiryDate':
        if (!isNotEmpty(value)) return 'Expiry date is required.';
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return 'Expiry MM/YY format.';
        const [monthStr, yearStr] = value.split('/');
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth) ) return 'Card is expired.';
        return '';
      case 'cvv':
        if (!isNotEmpty(value)) return 'CVV is required.';
        if (!/^\d{3,4}$/.test(value)) return 'CVV must be 3-4 digits.';
        return '';
      default: return '';
    }
  };
  const handleCardBillingChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'cardNumber') {
      const rawDigits = value.replace(/\D/g, ''); 
      const brand = getCardBrand(rawDigits);
      setDetectedCardBrand(brand);
      const limit = brand === 'amex' ? 15 : (brand === 'unknown' ? 19 : 16) ; // Amex 15, Visa/MC 16, others up to 19
      processedValue = rawDigits.slice(0, limit);
      if (brand === 'amex') processedValue = processedValue.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, '$1 $2 $3').trim();
      else processedValue = processedValue.replace(/(.{4})/g, '$1 ').trim();
    } else if (name === 'expiryDate') {
      processedValue = value.replace(/[^0-9/]/g, '').slice(0, 5);
      if (processedValue.length === 2 && !processedValue.includes('/') && value.length === 2 && value.indexOf('/') === -1) {
         processedValue += '/';
      } else if (processedValue.length === 3 && processedValue.charAt(2) !== '/') {
         processedValue = processedValue.slice(0,2) + '/' + processedValue.charAt(2);
      }
    } else if (name === 'cvv') processedValue = value.replace(/\D/g, '').slice(0, 4);
    setFormDataCardBilling(prev => ({ ...prev, [name]: processedValue }));
    const valueToValidate = name === 'cardNumber' ? value.replace(/\s/g, '') : value;
    if (billingErrors[name as keyof CardBillingFormDetails]) setBillingErrors({ ...billingErrors, [name]: validateCardBillingField(name as keyof CardBillingFormDetails, valueToValidate) });
  };
  const handleCardBillingBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const valueToValidate = name === 'cardNumber' ? value.replace(/\s/g, '') : value;
    setBillingErrors(prev => ({ ...prev, [name]: validateCardBillingField(name as keyof CardBillingFormDetails, valueToValidate) }));
  };
  const validateCardBillingForm = (): boolean => {
    const newErrors: BillingFormErrors = {}; let isValid = true;
    (Object.keys(formDataCardBilling) as Array<keyof CardBillingFormDetails>).forEach(key => {
      const valueToValidate = key === 'cardNumber' ? formDataCardBilling[key].replace(/\s/g, '') : formDataCardBilling[key];
      const error = validateCardBillingField(key, valueToValidate);
      if (error) { newErrors[key] = error; isValid = false; }
    });
    setBillingErrors(newErrors); return isValid;
  };
  const handleSaveBilling = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setServerBillingError(null); setIsLoadingBilling(true);
    let newBillingDetails: BillingDetails | null = null;
    if (selectedPaymentMethod === 'card') {
      if (!validateCardBillingForm()) { setIsLoadingBilling(false); return; }
      const rawCardNumber = formDataCardBilling.cardNumber.replace(/\s/g, '');
      newBillingDetails = { paymentMethodType: 'card', cardDetails: {
          cardholderName: formDataCardBilling.cardholderName, cardNumberLast4: rawCardNumber.slice(-4),
          expiryDate: formDataCardBilling.expiryDate, cardBrand: getCardBrand(rawCardNumber),
      }};
    } else if (selectedPaymentMethod === 'payfast') newBillingDetails = { paymentMethodType: 'payfast' };
    else if (selectedPaymentMethod === 'eft') newBillingDetails = { paymentMethodType: 'eft' };
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setBillingDetails(newBillingDetails);
    if (user && newBillingDetails) localStorage.setItem(`billingDetails_${user.id}`, JSON.stringify(newBillingDetails));
    setIsLoadingBilling(false); setIsEditingBilling(false);
    setFormDataCardBilling({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' });
    setDetectedCardBrand('unknown'); alert(`Billing info saved: ${selectedPaymentMethod.toUpperCase()} (mock).`);
  };
  const handleEditBilling = () => {
    setIsEditingBilling(true); setServerBillingError(null); setBillingErrors({});
    if (billingDetails) {
      setSelectedPaymentMethod(billingDetails.paymentMethodType);
      if (billingDetails.paymentMethodType === 'card' && billingDetails.cardDetails) {
        setFormDataCardBilling({ cardholderName: billingDetails.cardDetails.cardholderName, cardNumber: '', expiryDate: billingDetails.cardDetails.expiryDate, cvv: '' });
        setDetectedCardBrand(billingDetails.cardDetails.cardBrand || 'unknown');
      } else { setFormDataCardBilling({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' }); setDetectedCardBrand('unknown');}
    } else { setSelectedPaymentMethod('card'); setFormDataCardBilling({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' }); setDetectedCardBrand('unknown');}
  };
  const handleCancelBilling = () => { setIsEditingBilling(false); setBillingErrors({}); setServerBillingError(null); setDetectedCardBrand('unknown');};
  const renderCardBrandLogo = (brand: 'visa' | 'mastercard' | 'amex' | 'unknown', className?: string) => {
    if (brand === 'visa') return <VisaIcon className={className} />; if (brand === 'mastercard') return <MastercardIcon className={className} />;
    if (brand === 'amex') return <AmexIcon className={className} />; return <GenericCardIcon className={className} />;
  };

  // Password Management Handlers
  const handlePasswordFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name as PasswordFormFields]) { 
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPasswordSuccessMessage(''); setPasswordServerError('');
  };

  const validatePasswordForm = (isForgotPasswordFlow: boolean = false): boolean => {
    const errors: PasswordErrors = {};
    if (!isForgotPasswordFlow && !passwordFormData.currentPassword) errors.currentPassword = 'Current password is required.';
    if (!passwordFormData.newPassword) errors.newPassword = 'New password is required.';
    else if (passwordFormData.newPassword.length < 8) errors.newPassword = 'New password must be at least 8 characters.';
    if (!passwordFormData.confirmNewPassword) errors.confirmNewPassword = 'Confirm new password is required.';
    else if (passwordFormData.newPassword && passwordFormData.confirmNewPassword !== passwordFormData.newPassword) {
      errors.confirmNewPassword = 'Passwords do not match.';
    }
    setPasswordErrors(errors); 
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordSuccessMessage(''); setPasswordServerError('');
    if (!validatePasswordForm()) return;
    
    setIsLoadingPasswordChange(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate current password check
    if (passwordFormData.currentPassword === "oldpassword123" || passwordFormData.currentPassword) { 
        setPasswordSuccessMessage('Password updated successfully! (Mock)');
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setPasswordErrors({});
    } else {
        setPasswordServerError('Incorrect current password. (Mock)');
        setPasswordErrors(prev => ({...prev, currentPassword: 'Incorrect current password. (Mock)'}));
    }
    setIsLoadingPasswordChange(false);
  };

  const handleForgotPasswordInitiate = () => {
    setForgotPasswordStep('selectOtpMethod');
    setPasswordServerError(''); setPasswordSuccessMessage(''); setPasswordErrors({});
    setForgotPasswordMessage('');
  };

  const handleSendOtp = async (method: OtpDeliveryMethod) => {
    setOtpDeliveryMethod(method);
    setIsLoadingPasswordChange(true); 
    setForgotPasswordMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setForgotPasswordStep('enterOtp');
    setForgotPasswordMessage(`OTP sent to your ${method}. (Mock - use 123456)`);
    setIsLoadingPasswordChange(false);
  };
  
  const handleVerifyOtp = async () => {
    setIsLoadingPasswordChange(true);
    setOtpError(''); setForgotPasswordMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (otpInput === '123456') { 
      setForgotPasswordStep('resetPasswordForm');
      setPasswordFormData(prev => ({ ...prev, currentPassword: '' })); 
      setOtpInput('');
    } else {
      setOtpError('Invalid OTP. Please try again. (Mock)');
    }
    setIsLoadingPasswordChange(false);
  };

  const handleSubmitNewPasswordAfterOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordSuccessMessage(''); setPasswordServerError('');
    if (!validatePasswordForm(true)) return; 

    setIsLoadingPasswordChange(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPasswordSuccessMessage('New password set successfully! (Mock)');
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setForgotPasswordStep('initial');
    setOtpDeliveryMethod(null);
    setOtpInput('');
    setOtpError('');
    setForgotPasswordMessage('');
    setPasswordErrors({});
    setIsLoadingPasswordChange(false);
  };

  const handleCancelForgotPassword = () => {
    setForgotPasswordStep('initial');
    setOtpDeliveryMethod(null);
    setOtpInput('');
    setOtpError('');
    setForgotPasswordMessage('');
    setPasswordErrors({});
    setPasswordServerError('');
    setPasswordSuccessMessage('');
  }

  // 2FA Handlers
  const handleEnable2FA = () => {
    setSetup2FAStep('showQR');
    setTwoFaError(''); setTwoFaSuccessMessage('');
  };

  const handleVerifyAndEnable2FA = async () => {
    setIsLoading2FA(true);
    setTwoFaError('');
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    if (twoFaCodeInput === '654321') { 
      setIs2FAEnabled(true);
      if(user) localStorage.setItem(`2faStatus_${user.id}`, 'true');
      setSetup2FAStep('initial');
      setTwoFaSuccessMessage('2FA enabled successfully! (Mock)');
      setTwoFaCodeInput('');
    } else {
      setTwoFaError('Invalid authenticator code. Please try again. (Mock)');
    }
    setIsLoading2FA(false);
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      setIsLoading2FA(true);
      setTwoFaError(''); setTwoFaSuccessMessage('');
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      setIs2FAEnabled(false);
      if(user) localStorage.setItem(`2faStatus_${user.id}`, 'false');
      setTwoFaSuccessMessage('2FA disabled successfully. (Mock)');
      setIsLoading2FA(false);
    }
  };

  const handleCancel2FASetup = () => {
    setSetup2FAStep('initial');
    setTwoFaCodeInput('');
    setTwoFaError('');
  }


  if (!user) {
    return <div className="p-8"><LoadingSpinner message="Loading profile..." /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-12">
      {/* Personal Information Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-brand-text-light flex items-center">
            <UserCog size={30} className="mr-3 text-brand-accent" /> My Profile
          </h1>
          {!isEditingPersonalInfo && (
            <Button variant="primary" onClick={() => setIsEditingPersonalInfo(true)} leftIcon={<Edit3 size={18} />}>
              Edit Details
            </Button>
          )}
        </div>
        {serverPersonalInfoError && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{serverPersonalInfoError}</p>}
        {isEditingPersonalInfo ? (
          <form onSubmit={handlePersonalInfoSubmit} className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
            <Input label="Full Name" name="name" value={personalInfoFormData.name} onChange={handlePersonalInfoChange} onBlur={handlePersonalInfoBlur} error={personalInfoErrors.name} touched={!!personalInfoErrors.name} required />
            <Input label="Email Address" name="email" type="email" value={personalInfoFormData.email} onChange={handlePersonalInfoChange} onBlur={handlePersonalInfoBlur} error={personalInfoErrors.email} touched={!!personalInfoErrors.email} required />
            <Input label="Contact Number" name="contactNumber" type="tel" value={personalInfoFormData.contactNumber} onChange={handlePersonalInfoChange} onBlur={handlePersonalInfoBlur} error={personalInfoErrors.contactNumber} touched={!!personalInfoErrors.contactNumber} required />
            <Input label="ID Number (Optional)" name="idNumber" value={personalInfoFormData.idNumber || ''} onChange={handlePersonalInfoChange} onBlur={handlePersonalInfoBlur} error={personalInfoErrors.idNumber} touched={!!personalInfoErrors.idNumber} />
            <Input as="textarea" label="Physical Address" name="address" rows={3} value={personalInfoFormData.address} onChange={handlePersonalInfoChange} onBlur={handlePersonalInfoBlur} error={personalInfoErrors.address} touched={!!personalInfoErrors.address} required />
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
              <Button type="button" variant="ghost" onClick={() => { setIsEditingPersonalInfo(false); setPersonalInfoErrors({}); setServerPersonalInfoError(null); }} disabled={isLoadingPersonalInfo} leftIcon={<X size={18}/>}> Cancel </Button>
              <Button type="submit" variant="primary" isLoading={isLoadingPersonalInfo} disabled={isLoadingPersonalInfo} leftIcon={<Save size={18}/>}> {isLoadingPersonalInfo ? 'Saving...' : 'Save Changes'} </Button>
            </div>
          </form>
        ) : (
          <div className="bg-brand-interactive-dark-hover shadow-xl rounded-xl overflow-hidden">
            <div className="px-4 py-5 sm:px-6"><h3 className="text-lg leading-6 font-medium text-brand-text-light"> Personal Information </h3></div>
            <div className="border-t border-slate-600 px-4 py-5 sm:px-6 sm:py-5">
              <dl className="sm:divide-y sm:divide-slate-600">
                <DetailRow label="Full Name" value={user.name} /> <DetailRow label="Email Address" value={user.username} />
                <DetailRow label="Contact Number" value={user.contactNumber} /> <DetailRow label="ID Number" value={user.idNumber} />
                <DetailRow label="Physical Address" value={user.address} />
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Billing Information Section */}
      <div>
        <div className="flex justify-between items-center mb-6 pt-8 border-t border-slate-700">
          <h2 className="text-2xl font-bold text-brand-text-light flex items-center">
            <CreditCard size={26} className="mr-3 text-brand-accent" /> Billing Information
          </h2>
          {!isEditingBilling && (
            <Button variant="primary" onClick={handleEditBilling} leftIcon={<Edit3 size={18} />}>
              {billingDetails ? 'Update Payment Method' : 'Add Payment Method'}
            </Button>
          )}
        </div>
        {serverBillingError && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{serverBillingError}</p>}
        {isEditingBilling ? (
          <form onSubmit={handleSaveBilling} className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-text-light-secondary mb-2">Select Payment Method</label>
              <div className="flex space-x-4">
                {(['card', 'payfast', 'eft'] as PaymentMethodType[]).map(method => (
                  <label key={method} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                    <input type="radio" name="paymentMethod" value={method} checked={selectedPaymentMethod === method} onChange={() => setSelectedPaymentMethod(method)} className="form-radio h-4 w-4 text-brand-accent bg-slate-600 border-slate-500 focus:ring-brand-accent"/>
                    <span className="text-brand-text-light capitalize flex items-center">
                      {method === 'card' && <CreditCard size={18} className="mr-1.5"/>} {method === 'payfast' && <PayFastIcon className="mr-1.5" style={{width: '28px', height: '18px'}}/>}
                      {method === 'eft' && <EFTIcon className="mr-1.5" />} {method}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {selectedPaymentMethod === 'card' && (
              <>
                <Input label="Cardholder Name" name="cardholderName" value={formDataCardBilling.cardholderName} onChange={handleCardBillingChange} onBlur={handleCardBillingBlur} error={billingErrors.cardholderName} touched={!!billingErrors.cardholderName} required />
                <div className="relative">
                  <Input label="Card Number" name="cardNumber" type="text" value={formDataCardBilling.cardNumber} onChange={handleCardBillingChange} onBlur={handleCardBillingBlur} error={billingErrors.cardNumber} touched={!!billingErrors.cardNumber} required placeholder="0000 0000 0000 0000" inputMode="numeric" />
                  <div className="absolute right-3 top-[calc(50%)] transform -translate-y-1/2 pointer-events-none">
                     {renderCardBrandLogo(detectedCardBrand, 'h-6 w-auto')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Input label="Expiry Date (MM/YY)" name="expiryDate" type="text" value={formDataCardBilling.expiryDate} onChange={handleCardBillingChange} onBlur={handleCardBillingBlur} error={billingErrors.expiryDate} touched={!!billingErrors.expiryDate} required placeholder="MM/YY" />
                  <Input label="CVV" name="cvv" type="text" value={formDataCardBilling.cvv} onChange={handleCardBillingChange} onBlur={handleCardBillingBlur} error={billingErrors.cvv} touched={!!billingErrors.cvv} required placeholder="123" inputMode="numeric" />
                </div>
              </>
            )}
            {selectedPaymentMethod === 'payfast' && (<div className="p-4 bg-slate-700 rounded-md text-brand-text-light-secondary"><div className="flex items-center">
                   <PayFastIcon className="mr-2" style={{width: '38px', height: '24px'}}/> <p>PayFast selected. (Mock setup - no details collected).</p></div></div>)}
            {selectedPaymentMethod === 'eft' && (<div className="p-4 bg-slate-700 rounded-md text-brand-text-light-secondary space-y-2">
                 <div className="flex items-center mb-2"><EFTIcon className="mr-2"/> <p className="font-semibold text-brand-text-light">EFT Details (Mock):</p></div>
                <p><strong>Bank:</strong> FNB / First National Bank</p><p><strong>Account Name:</strong> {user?.name || 'Your Company Name'} - Nexus OMS</p><p><strong>Account Number:</strong> 62000000000</p>
                <p><strong>Branch Code:</strong> 250655</p><p><strong>Reference:</strong> {user?.id.slice(0, 8).toUpperCase() || 'YOUR_CLIENT_ID'}</p></div>)}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
              <Button type="button" variant="ghost" onClick={handleCancelBilling} disabled={isLoadingBilling} leftIcon={<X size={18}/>}> Cancel </Button>
              <Button type="submit" variant="primary" isLoading={isLoadingBilling} disabled={isLoadingBilling} leftIcon={<Save size={18}/>}> {isLoadingBilling ? 'Saving...' : 'Save Billing Info'} </Button>
            </div>
          </form>
        ) : billingDetails ? (
          <div className="bg-brand-interactive-dark-hover shadow-xl rounded-xl overflow-hidden">
            <div className="px-4 py-5 sm:px-6"><h3 className="text-lg leading-6 font-medium text-brand-text-light"> Current Payment Method </h3></div>
            <div className="border-t border-slate-600 px-4 py-5 sm:px-6 sm:py-5">
              <dl className="sm:divide-y sm:divide-slate-600">
                {billingDetails.paymentMethodType === 'card' && billingDetails.cardDetails ? (
                  <>
                    <DetailRow label="Method" value={<span className="flex items-center">{renderCardBrandLogo(billingDetails.cardDetails.cardBrand, "mr-2 h-6 w-auto")} Card</span>}/>
                    <DetailRow label="Cardholder Name" value={billingDetails.cardDetails.cardholderName} />
                    <DetailRow label="Card Number" value={maskCardNumberDisplay(billingDetails.cardDetails.cardNumberLast4, billingDetails.cardDetails.cardBrand)} />
                    <DetailRow label="Expiry Date" value={billingDetails.cardDetails.expiryDate} />
                  </>
                ) : billingDetails.paymentMethodType === 'payfast' ? (
                  <DetailRow label="Method" value={<span className="flex items-center"><PayFastIcon className="mr-2" style={{width: '38px', height: '24px'}} /> PayFast</span>} />
                ) : billingDetails.paymentMethodType === 'eft' ? (
                  <DetailRow label="Method" value={<span className="flex items-center"><EFTIcon className="mr-2" /> EFT (Electronic Funds Transfer)</span>}/>
                ) : <DetailRow label="Method" value="N/A" />}
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-brand-interactive-dark-hover shadow-xl rounded-xl p-6 text-center">
            <CreditCard size={40} className="mx-auto mb-4 text-brand-text-light-secondary" />
            <p className="text-brand-text-light mb-4">No billing information on file.</p>
            <Button variant="primary" onClick={handleEditBilling}>Add Payment Method</Button>
          </div>
        )}
      </div>

       {/* Password Management Section */}
      <div className="pt-8 border-t border-slate-700">
        <h2 className="text-2xl font-bold text-brand-text-light mb-6 flex items-center">
            <Lock size={26} className="mr-3 text-brand-accent"/> Security Settings
        </h2>
        {passwordSuccessMessage && <p className="mb-4 text-sm text-green-400 p-3 bg-green-900 bg-opacity-50 rounded-md">{passwordSuccessMessage}</p>}
        {passwordServerError && <p className="mb-4 text-sm text-red-400 p-3 bg-red-900 bg-opacity-50 rounded-md">{passwordServerError}</p>}
        
        {forgotPasswordStep === 'initial' && (
            <form onSubmit={handleSubmitPasswordChange} className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
                <h3 className="text-xl font-semibold text-brand-text-light">Change Password</h3>
                <Input label="Current Password" name="currentPassword" type="password" value={passwordFormData.currentPassword} onChange={handlePasswordFormChange} error={passwordErrors.currentPassword} touched={!!passwordErrors.currentPassword} required />
                <Input label="New Password" name="newPassword" type="password" value={passwordFormData.newPassword} onChange={handlePasswordFormChange} error={passwordErrors.newPassword} touched={!!passwordErrors.newPassword} required />
                <Input label="Confirm New Password" name="confirmNewPassword" type="password" value={passwordFormData.confirmNewPassword} onChange={handlePasswordFormChange} error={passwordErrors.confirmNewPassword} touched={!!passwordErrors.confirmNewPassword} required />
                <div className="flex justify-between items-center pt-4 border-t border-slate-600">
                    <Button type="button" variant="ghost" onClick={handleForgotPasswordInitiate} className="text-brand-accent hover:text-brand-accent-hover !p-0 !border-none !bg-transparent focus:!ring-0 !shadow-none">Forgot your password?</Button>
                    <Button type="submit" variant="primary" isLoading={isLoadingPasswordChange} disabled={isLoadingPasswordChange} leftIcon={<Save size={18}/>}>Update Password</Button>
                </div>
            </form>
        )}

        {forgotPasswordStep === 'selectOtpMethod' && (
            <div className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
                <h3 className="text-xl font-semibold text-brand-text-light">Reset Password - Choose Verification</h3>
                <p className="text-brand-text-light-secondary">How would you like to receive your One-Time Password (OTP)?</p>
                {forgotPasswordMessage && <p className="text-sm text-yellow-400">{forgotPasswordMessage}</p>}
                <div className="space-y-3">
                    <Button variant="secondary" onClick={() => handleSendOtp('email')} className="w-full" leftIcon={<Mail size={18}/>} isLoading={isLoadingPasswordChange && otpDeliveryMethod === 'email'} disabled={isLoadingPasswordChange}>Send OTP to Email ({user.username})</Button>
                    {user.contactNumber && <Button variant="secondary" onClick={() => handleSendOtp('phone')} className="w-full" leftIcon={<Smartphone size={18}/>} isLoading={isLoadingPasswordChange && otpDeliveryMethod === 'phone'} disabled={isLoadingPasswordChange}>Send OTP to Phone ({user.contactNumber})</Button>}
                </div>
                <Button type="button" variant="ghost" onClick={handleCancelForgotPassword} disabled={isLoadingPasswordChange}>Cancel</Button>
            </div>
        )}

        {forgotPasswordStep === 'enterOtp' && (
            <div className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
                <h3 className="text-xl font-semibold text-brand-text-light">Enter OTP</h3>
                {forgotPasswordMessage && <p className="text-sm text-green-400">{forgotPasswordMessage}</p>}
                <Input label={`Enter OTP sent to your ${otpDeliveryMethod}`} name="otpInput" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} error={otpError} touched={!!otpError} required inputMode="numeric" maxLength={6} />
                <div className="flex justify-between items-center pt-4 border-t border-slate-600">
                   <Button type="button" variant="ghost" onClick={() => otpDeliveryMethod && handleSendOtp(otpDeliveryMethod)} className="text-brand-accent hover:text-brand-accent-hover !p-0 !border-none !bg-transparent focus:!ring-0 !shadow-none" disabled={isLoadingPasswordChange}>Resend OTP</Button>
                    <div className="space-x-2">
                        <Button variant="ghost" onClick={handleCancelForgotPassword} disabled={isLoadingPasswordChange}>Cancel</Button>
                        <Button variant="primary" onClick={handleVerifyOtp} isLoading={isLoadingPasswordChange} disabled={isLoadingPasswordChange}>Verify OTP</Button>
                    </div>
                </div>
            </div>
        )}

        {forgotPasswordStep === 'resetPasswordForm' && (
            <form onSubmit={handleSubmitNewPasswordAfterOtp} className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
                 <h3 className="text-xl font-semibold text-brand-text-light">Create New Password</h3>
                <Input label="New Password" name="newPassword" type="password" value={passwordFormData.newPassword} onChange={handlePasswordFormChange} error={passwordErrors.newPassword} touched={!!passwordErrors.newPassword} required />
                <Input label="Confirm New Password" name="confirmNewPassword" type="password" value={passwordFormData.confirmNewPassword} onChange={handlePasswordFormChange} error={passwordErrors.confirmNewPassword} touched={!!passwordErrors.confirmNewPassword} required />
                 <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
                    <Button variant="ghost" onClick={handleCancelForgotPassword} disabled={isLoadingPasswordChange}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isLoadingPasswordChange} disabled={isLoadingPasswordChange} leftIcon={<Save size={18}/>}>Set New Password</Button>
                </div>
            </form>
        )}
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="pt-8 border-t border-slate-700">
        <h3 className="text-xl font-semibold text-brand-text-light mb-4">Two-Factor Authentication (2FA)</h3>
        {twoFaSuccessMessage && <p className="mb-4 text-sm text-green-400 p-3 bg-green-900 bg-opacity-50 rounded-md">{twoFaSuccessMessage}</p>}
        {twoFaError && <p className="mb-4 text-sm text-red-400 p-3 bg-red-900 bg-opacity-50 rounded-md">{twoFaError}</p>}

        <div className="bg-brand-interactive-dark-hover p-6 sm:p-8 shadow-xl rounded-xl space-y-6">
          {setup2FAStep === 'initial' && (
            <>
              <p className="text-brand-text-light-secondary">
                {is2FAEnabled ? "2FA is currently enabled for your account using an Authenticator App." : "2FA is not enabled. Add an extra layer of security to your account."}
              </p>
              {is2FAEnabled ? (
                <Button variant="danger" onClick={handleDisable2FA} isLoading={isLoading2FA} disabled={isLoading2FA}>Disable 2FA</Button>
              ) : (
                <Button variant="primary" onClick={handleEnable2FA} isLoading={isLoading2FA} disabled={isLoading2FA} leftIcon={<ShieldCheck size={18}/>}>Enable 2FA</Button>
              )}
               {is2FAEnabled && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold text-brand-text-light">Mock Recovery Codes:</h4>
                    <ul className="list-disc list-inside text-brand-text-light-secondary text-sm space-y-1 mt-2 bg-slate-700 p-3 rounded-md">
                        <li>ABCD-1234-WXYZ</li>
                        <li>EFGH-5678-UVWX</li>
                        <li>IJKL-9012-RSTU</li>
                    </ul>
                    <p className="text-xs text-brand-text-light-secondary mt-1">Store these codes in a safe place. They can be used to access your account if you lose access to your authenticator app.</p>
                </div>
              )}
            </>
          )}

          {setup2FAStep === 'showQR' && (
            <div>
              <h4 className="text-lg font-semibold text-brand-text-light mb-3">Setup Authenticator App</h4>
              <p className="text-brand-text-light-secondary mb-2">1. Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy, Microsoft Authenticator).</p>
              <div className="my-4 flex justify-center">
                 <MockQRCodeIcon aria-label="Mock QR Code for 2FA setup"/>
              </div>
              <p className="text-brand-text-light-secondary mb-2">Or, manually enter this secret key:</p>
              <p className="text-brand-accent font-mono bg-slate-700 p-2 rounded inline-block mb-4">{MOCK_2FA_SECRET_KEY}</p>
              <p className="text-brand-text-light-secondary mb-4">2. Enter the 6-digit code generated by your app below to verify and enable 2FA. (Mock - use 654321)</p>
              <Input label="Authenticator Code" name="twoFaCodeInput" value={twoFaCodeInput} onChange={(e) => setTwoFaCodeInput(e.target.value)} error={twoFaError} touched={!!twoFaError} required inputMode="numeric" maxLength={6} placeholder="123456" />
              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-slate-600">
                <Button type="button" variant="ghost" onClick={handleCancel2FASetup} disabled={isLoading2FA}>Cancel</Button>
                <Button variant="primary" onClick={handleVerifyAndEnable2FA} isLoading={isLoading2FA} disabled={isLoading2FA}>Verify & Enable 2FA</Button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ClientProfilePage;
