
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClientRequestCategory, NewClientRequestPayload, Actor } from '../../types'; // Updated import
import { createClientRequest as apiCreateRequest } from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES: ClientRequestCategory[] = ['Support', 'Billing Inquiry', 'Service Upgrade', 'General Question'];

type FormErrors = Partial<Record<keyof NewClientRequestPayload, string>>;

const NewClientRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // To get prefill data from Link state
  const { state } = location as { state?: { orderId?: string, orderService?: string } };
  
  const { user } = useAuth();
  
  const initialSubject = state?.orderId ? `Inquiry about Order ${state.orderId}` : '';
  const initialDescription = state?.orderId 
    ? `Regarding Order ID: ${state.orderId}\nService: ${state.orderService || 'N/A'}\n\nPlease describe your issue or question:\n` 
    : '';

  const [formData, setFormData] = useState<NewClientRequestPayload>({
    subject: initialSubject,
    description: initialDescription,
    category: 'Support',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateField = (name: keyof NewClientRequestPayload, value: string): string => {
    switch (name) {
      case 'subject':
        return value.trim() ? '' : 'Subject is required.';
      case 'description':
        return value.trim() ? '' : 'Description is required.';
      case 'category':
        return value.trim() ? '' : 'Category is required.';
      default:
        return '';
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof NewClientRequestPayload]) {
       setErrors({ ...errors, [name]: validateField(name as keyof NewClientRequestPayload, value) });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setErrors({
      ...errors,
      [name]: validateField(name as keyof NewClientRequestPayload, value)
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof NewClientRequestPayload>).forEach(key => {
      const error = validateField(key, formData[key] as string);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    if (!user || !user.username) {
        setServerError("User not authenticated. Please log in again.");
        return;
    }
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    const actor: Actor = { userId: user.id, username: user.username };
    try {
      await apiCreateRequest(formData, actor);
      navigate('/portal/requests'); 
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit request. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-text-light mb-8">Submit a New Request</h1>
      {serverError && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{serverError}</p>}
      
      {isLoading ? <LoadingSpinner message="Submitting request..." /> : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-interactive-dark-hover p-8 shadow-lg rounded-xl">
          <Input
            as="select"
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.category}
            touched={!!errors.category}
            options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
            required
          />
          <Input
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.subject}
            touched={!!errors.subject}
            required
            maxLength={100}
          />
          <Input
            as="textarea"
            label="Description"
            name="description"
            rows={8}
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.description}
            touched={!!errors.description}
            required
            placeholder="Please provide as much detail as possible regarding your request."
          />
          <div className="flex justify-end pt-6 border-t border-slate-600 mt-8">
            <Button type="button" variant="ghost" onClick={() => navigate('/portal/requests')} className="mr-3">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !user}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewClientRequestPage;
