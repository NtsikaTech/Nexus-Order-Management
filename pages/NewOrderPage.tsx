
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewOrderFormData, OrderStatus } from '../types';
import { createOrder as apiCreateOrder } from '../services/orderService';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { SERVICE_TYPES, SERVICE_PACKAGES } from '../constants';
import { isValidEmail, isNotEmpty } from '../utils/helpers';

type FormErrors = Partial<Record<keyof NewOrderFormData, string>>;

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NewOrderFormData>({
    clientName: '',
    clientEmail: '',
    clientContactNumber: '',
    clientAddress: '',
    serviceType: SERVICE_TYPES[0] || '',
    packageName: SERVICE_PACKAGES[SERVICE_TYPES[0]]?.[0] || '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const availablePackages = SERVICE_PACKAGES[formData.serviceType] || [];

  const validateField = (name: keyof NewOrderFormData, value: string): string => {
    switch (name) {
      case 'clientName':
        return isNotEmpty(value) ? '' : 'Client name is required.';
      case 'clientEmail':
        if (!isNotEmpty(value)) return 'Client email is required.';
        return isValidEmail(value) ? '' : 'Invalid email format.';
      case 'clientContactNumber':
        return isNotEmpty(value) ? '' : 'Client contact number is required.';
      case 'clientAddress':
        return isNotEmpty(value) ? '' : 'Client address is required.';
      case 'serviceType':
        return isNotEmpty(value) ? '' : 'Service type is required.';
      case 'packageName':
        return isNotEmpty(value) ? '' : 'Package is required.';
      default:
        return '';
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'serviceType') {
      newFormData.packageName = SERVICE_PACKAGES[value]?.[0] || '';
    }
    
    setFormData(newFormData);

    if (errors[name as keyof NewOrderFormData]) {
       setErrors({ ...errors, [name]: validateField(name as keyof NewOrderFormData, value) });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setErrors({
      ...errors,
      [name]: validateField(name as keyof NewOrderFormData, value)
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof NewOrderFormData>).forEach(key => {
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
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const newOrder = await apiCreateOrder(formData);
      navigate(`/orders/${newOrder.id}`); // Navigate to the new order's detail page
    } catch (err: any) {
      setServerError(err.message || 'Failed to create order. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto"> {/* Changed from max-w-4xl */}
      <h1 className="text-3xl font-bold text-brand-text-light mb-8">Create New Order</h1>
      {isLoading && <LoadingSpinner message="Creating order..." />}
      {serverError && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{serverError}</p>}
      
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-interactive-dark-hover p-8 shadow-lg rounded-xl">
          {/* Client Information */}
          <section>
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" name="clientName" value={formData.clientName} onChange={handleChange} onBlur={handleBlur} error={errors.clientName} touched={!!errors.clientName} required />
              <Input label="Email Address" name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} onBlur={handleBlur} error={errors.clientEmail} touched={!!errors.clientEmail} required />
              <Input label="Contact Number" name="clientContactNumber" type="tel" value={formData.clientContactNumber} onChange={handleChange} onBlur={handleBlur} error={errors.clientContactNumber} touched={!!errors.clientContactNumber} required />
              <Input label="Physical Address" name="clientAddress" as="textarea" rows={3} value={formData.clientAddress} onChange={handleChange} onBlur={handleBlur} error={errors.clientAddress} touched={!!errors.clientAddress} required className="md:col-span-2" />
            </div>
          </section>

          {/* Order Details */}
          <section>
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                as="select"
                label="Service Type"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.serviceType}
                touched={!!errors.serviceType}
                options={SERVICE_TYPES.map(st => ({ value: st, label: st }))}
                required
              />
              <Input
                as="select"
                label="Package"
                name="packageName"
                value={formData.packageName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.packageName}
                touched={!!errors.packageName}
                options={availablePackages.map(pkg => ({ value: pkg, label: pkg }))}
                required
                disabled={availablePackages.length === 0}
              />
              <Input label="Notes (Optional)" name="notes" as="textarea" rows={4} value={formData.notes || ''} onChange={handleChange} className="md:col-span-2" />
            </div>
          </section>

          <div className="flex justify-end pt-6 border-t border-slate-600 mt-8">
            <Button type="button" variant="ghost" onClick={() => navigate('/')} className="mr-3">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Create Order'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewOrderPage;
