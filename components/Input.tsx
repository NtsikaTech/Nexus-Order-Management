
import React, { ChangeEvent, FocusEvent, ReactNode } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  label?: string;
  name: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  touched?: boolean;
  as?: 'input' | 'textarea' | 'select';
  options?: { value: string; label: string }[]; // For select
  rows?: number; // For textarea
  leftIcon?: ReactNode; // Added leftIcon prop
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  error,
  touched,
  as = 'input',
  options,
  rows = 3,
  className = '',
  leftIcon, // Destructure leftIcon
  ...props
}) => {
  const baseClasses = "mt-1 block w-full px-3 py-2 bg-slate-700 text-brand-text-light border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
  const normalClasses = "border-slate-600 focus:ring-brand-accent focus:border-brand-accent";

  const Element = as;
  // Modify className for elementProps to include padding for the icon
  let elementProps: any = {
    ...props,
    id: name,
    name: name,
    className: `${baseClasses} ${touched && error ? errorClasses : normalClasses} ${leftIcon ? 'pl-10' : ''} ${className}`,
  };

  if (as === 'textarea') {
    elementProps.rows = rows;
  }
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-light-secondary">
          {label}
        </label>
      )}
      {/* Add a wrapper for relative positioning of the icon */}
      <div className="relative"> 
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        {as === 'select' ? (
          <select {...elementProps}>
            {props.placeholder && <option value="">{props.placeholder}</option>}
            {options?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <Element {...elementProps} />
        )}
      </div>
      {touched && error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
