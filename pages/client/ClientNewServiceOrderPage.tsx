import React, { useState, ChangeEvent, FormEvent, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewOrderFormData, ProductCategory, Product as ServiceProduct } from '../../types';
import { createOrder as apiCreateOrder } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SERVICE_CATALOG } from '../../constants';
import { isValidEmail, isNotEmpty } from '../../utils/helpers';
import { ShoppingCart, Package, Info, User, Phone, MapPin, Edit3 } from 'lucide-react';

type FormErrors = Partial<Pick<NewOrderFormData, 'clientContactNumber' | 'clientAddress' | 'serviceType' | 'packageName'>>;

interface OrderDetailsForm {
  clientContactNumber: string;
  clientAddress: string;
  notes: string;
}

const ClientNewServiceOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [orderDetailsForm, setOrderDetailsForm] = useState<OrderDetailsForm>({
    clientContactNumber: user?.contactNumber || '',
    clientAddress: user?.address || '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedCategory = useMemo(() => {
    return SERVICE_CATALOG.find(cat => cat.id === selectedCategoryId) || null;
  }, [selectedCategoryId]);

  const availableProducts = useMemo(() => {
    return selectedCategory ? selectedCategory.products : [];
  }, [selectedCategory]);

  const selectedProduct = useMemo(() => {
    return availableProducts.find(prod => prod.id === selectedProductId) || null;
  }, [selectedProductId, availableProducts]);

  useEffect(() => {
    // Reset product if category changes
    setSelectedProductId('');
  }, [selectedCategoryId]);

  useEffect(() => {
    // Prefill form when user data is available or changes
    if (user) {
      setOrderDetailsForm(prev => ({
        ...prev,
        clientContactNumber: user.contactNumber || prev.clientContactNumber,
        clientAddress: user.address || prev.clientAddress,
      }));
    }
  }, [user]);


  const validateField = (name: keyof OrderDetailsForm | 'category' | 'product', value: string): string => {
    switch (name) {
      case 'category':
        return isNotEmpty(value) ? '' : 'Service category is required.';
      case 'product':
        return isNotEmpty(value) ? '' : 'Service product/package is required.';
      case 'clientContactNumber':
        return isNotEmpty(value) ? '' : 'Contact number for this order is required.';
      case 'clientAddress':
        return isNotEmpty(value) ? '' : 'Address for this order is required.';
      default:
        return '';
    }
  };
  
  const handleDetailsFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderDetailsForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
       setErrors({ ...errors, [name]: validateField(name as keyof OrderDetailsForm, value) });
    }
  };

  const handleDetailsFormBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name as keyof OrderDetailsForm, value) }));
  };


  const validateFullForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!selectedCategory) {
      newErrors.serviceType = 'Service category is required.';
      isValid = false;
    }
    if (!selectedProduct) {
      newErrors.packageName = 'Service product/package is required.';
      isValid = false;
    }
    
    const contactError = validateField('clientContactNumber', orderDetailsForm.clientContactNumber);
    if (contactError) { newErrors.clientContactNumber = contactError; isValid = false; }

    const addressError = validateField('clientAddress', orderDetailsForm.clientAddress);
    if (addressError) { newErrors.clientAddress = addressError; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    if (!user || !user.name || !user.username) {
      setServerError("User information is incomplete. Please ensure your profile is up to date.");
      return;
    }
    if (!validateFullForm() || !selectedCategory || !selectedProduct) {
      return;
    }
    setIsLoading(true);

    const orderData: NewOrderFormData = {
      clientName: user.name,
      clientEmail: user.username, // User's email is their username
      clientContactNumber: orderDetailsForm.clientContactNumber,
      clientAddress: orderDetailsForm.clientAddress,
      serviceType: selectedCategory.name,
      packageName: `${selectedProduct.name} (${selectedProduct.price})`,
      notes: orderDetailsForm.notes,
    };

    try {
      const newOrder = await apiCreateOrder(orderData);
      navigate(`/portal/orders/${newOrder.id}`); 
    } catch (err: any) {
      setServerError(err.message || 'Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-text-light mb-8 flex items-center">
        <ShoppingCart size={30} className="mr-3 text-brand-accent"/> Place New Service Order
      </h1>
      
      {serverError && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{serverError}</p>}
      
      {isLoading ? <LoadingSpinner message="Placing your order..." /> : (
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Service Selection */}
          <section className="bg-brand-interactive-dark-hover p-6 shadow-lg rounded-xl">
            <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2 flex items-center">
              <Package size={22} className="mr-2 text-brand-accent"/>1. Select Service
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                as="select"
                label="Service Category"
                name="category"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                onBlur={(e) => setErrors(prev => ({...prev, serviceType: validateField('category', e.target.value)}))}
                error={errors.serviceType}
                touched={!!errors.serviceType}
                options={[{ value: '', label: 'Select a category...' }, ...SERVICE_CATALOG.map(cat => ({ value: cat.id, label: cat.name }))]}
                required
              />
              <Input
                as="select"
                label="Product / Package"
                name="product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                onBlur={(e) => setErrors(prev => ({...prev, packageName: validateField('product', e.target.value)}))}
                error={errors.packageName}
                touched={!!errors.packageName}
                options={[{ value: '', label: 'Select a product...' }, ...availableProducts.map(prod => ({ value: prod.id, label: `${prod.name} (${prod.price})` }))]}
                required
                disabled={!selectedCategory}
              />
            </div>
          </section>

          {/* Selected Product Details */}
          {selectedProduct && (
            <section className="bg-brand-interactive-dark-hover p-6 shadow-lg rounded-xl">
              <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2 flex items-center">
                <Info size={22} className="mr-2 text-brand-accent"/>2. Service Details
              </h2>
              <h3 className="text-lg font-semibold text-brand-accent">{selectedProduct.name}</h3>
              <p className="text-2xl font-bold text-brand-text-light my-2">{selectedProduct.price}</p>
              <p className="text-brand-text-light-secondary mb-3">{selectedProduct.description}</p>
              {selectedProduct.details && selectedProduct.details.length > 0 && (
                <ul className="list-disc list-inside text-brand-text-light-secondary space-y-1 text-sm">
                  {selectedProduct.details.map((detail, index) => <li key={index}>{detail}</li>)}
                </ul>
              )}
            </section>
          )}

          {/* Order & Client Details */}
          {selectedProduct && ( // Only show if a product is selected
            <section className="bg-brand-interactive-dark-hover p-6 shadow-lg rounded-xl">
              <h2 className="text-xl font-semibold text-brand-text-light mb-4 border-b border-slate-600 pb-2 flex items-center">
                <Edit3 size={22} className="mr-2 text-brand-accent"/>3. Confirm Details & Notes
              </h2>
               <div className="mb-4 p-3 bg-slate-700 rounded-md">
                  <p className="text-sm text-brand-text-light-secondary flex items-center"><User size={16} className="mr-2 text-brand-accent" />Name: <span className="text-brand-text-light ml-1">{user?.name || 'N/A'}</span></p>
                  <p className="text-sm text-brand-text-light-secondary flex items-center mt-1">Email: <span className="text-brand-text-light ml-1">{user?.username || 'N/A'}</span></p>
              </div>

              <Input 
                label="Contact Number (for this order)" 
                name="clientContactNumber" 
                type="tel" 
                value={orderDetailsForm.clientContactNumber} 
                onChange={handleDetailsFormChange} 
                onBlur={handleDetailsFormBlur} 
                error={errors.clientContactNumber} 
                touched={!!errors.clientContactNumber} 
                required 
                leftIcon={<Phone size={16} className="text-brand-text-light-secondary" />}
              />
              <Input 
                as="textarea" 
                label="Delivery/Installation Address (for this order)" 
                name="clientAddress" 
                rows={3} 
                value={orderDetailsForm.clientAddress} 
                onChange={handleDetailsFormChange} 
                onBlur={handleDetailsFormBlur} 
                error={errors.clientAddress} 
                touched={!!errors.clientAddress} 
                required 
              />
              <Input 
                as="textarea" 
                label="Additional Notes (Optional)" 
                name="notes" 
                rows={3} 
                value={orderDetailsForm.notes} 
                onChange={handleDetailsFormChange}
              />
            </section>
          )}

          {selectedProduct && (
            <div className="flex justify-end pt-6 border-t border-slate-600 mt-8">
              <Button type="button" variant="ghost" onClick={() => navigate('/portal/orders')} className="mr-3">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !user || !selectedProduct}>
                {isLoading ? 'Placing Order...' : 'Confirm & Place Order'}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default ClientNewServiceOrderPage;