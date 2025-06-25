
import React, { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login as apiLogin, getCurrentUser } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { APP_NAME } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { AdminUser } from '../types';
import { isValidEmail } from '../utils/helpers';
// import { Aperture } from 'lucide-react'; // Example icon

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string>('');
  const [isSendingReset, setIsSendingReset] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiLogin(username, password); 
      const user = await getCurrentUser();
      if(user){
        auth.login(user as AdminUser);
        if (user.role === 'client') {
          navigate('/portal/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('Login successful, but failed to fetch user details.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    if (!isValidEmail(forgotPasswordEmail)) {
      setForgotPasswordMessage('Please enter a valid email address.');
      return;
    }
    setIsSendingReset(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setForgotPasswordMessage(`If an account matching "${forgotPasswordEmail}" exists, password reset instructions have been sent.`);
    setForgotPasswordEmail('');
    setIsSendingReset(false);
  };

  if (auth.isLoading) {
    return <div className="h-screen flex items-center justify-center bg-brand-bg-dark"><LoadingSpinner message="Checking authentication..." /></div>;
  }
  
  if (auth.isAuthenticated) {
     if (auth.user?.role === 'client') {
        return <Navigate to="/portal/dashboard" replace />;
     }
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <div className="min-h-screen bg-brand-bg-dark lg:flex">
        {/* Left Decorative Panel */}
        <div className="hidden lg:flex lg:w-2/5 bg-brand-interactive-dark-hover items-center justify-center p-12 relative">
          {/* Optional: Subtle background pattern can be added here as an absolute positioned SVG */}
          <div className="text-center">
            <div className="mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent mx-auto">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">
                <span className="text-brand-accent">{APP_NAME.split('-')[0]}</span><span className="text-brand-text-light">- {APP_NAME.split('-').slice(1).join(' ')}</span>
            </h1>
            <p className="text-lg xl:text-xl text-brand-text-light-secondary">
                Your central hub for efficient ICT service order processing.
            </p>
          </div>
        </div>

        {/* Right Login Form Panel */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-8 md:p-12">
          <div className="max-w-md w-full space-y-8 bg-brand-interactive-dark-hover p-8 sm:p-10 rounded-xl shadow-2xl">
            <div>
              <h2 className="text-center text-3xl font-bold text-brand-text-light">
                Sign In
              </h2>
              <p className="mt-2 text-center text-sm text-brand-text-light-secondary">
                Access your dashboard and manage orders.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Username / Email"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or your.email@example.com"
              />
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin or clientpass"
              />
              
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <div>
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>
            <div className="text-sm text-center">
              <button
                onClick={() => {
                  setIsForgotPasswordModalOpen(true);
                  setForgotPasswordMessage('');
                  setForgotPasswordEmail('');
                }}
                className="font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                Forgot password?
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-brand-text-light-secondary">
                Demo credentials: <br/>
                Admin: admin / admin <br/>
                User: john.doe / password123 <br />
                Client: john.doe@example.com / clientpass
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        title="Reset Password"
        size="md"
      >
        <form onSubmit={handleForgotPasswordSubmit}>
          <p className="text-sm text-brand-text-light-secondary mb-4">
            Enter the email address associated with your account, and we'll send you a link to reset your password.
          </p>
          <Input
            label="Email Address"
            name="forgotPasswordEmail"
            type="email"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={isSendingReset}
          />
          {forgotPasswordMessage && (
            <p className={`mt-2 text-sm ${forgotPasswordMessage.startsWith('If an account') ? 'text-green-400' : 'text-red-400'}`}>
              {forgotPasswordMessage}
            </p>
          )}
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsForgotPasswordModalOpen(false)} disabled={isSendingReset}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSendingReset} disabled={isSendingReset}>
              {isSendingReset ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default LoginPage;
