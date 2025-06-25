
import React, { useState } from 'react';
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME } from '../constants';
import Button from './Button';
import { BellIcon, UserCircle, Briefcase, FileText, Settings as SettingsIcon, Repeat, CreditCard, ListChecks, UserCog, LogOut, Menu, X as CloseIcon } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = () => {
    alert("Notifications clicked! Future notification panel will open here.");
  };

  const baseNavLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 flex items-center gap-2";
  const activeNavLinkClasses = "text-brand-accent font-semibold bg-brand-interactive-dark-hover";
  const inactiveNavLinkClasses = "text-brand-text-light-secondary hover:text-brand-text-light hover:bg-brand-interactive-dark-hover";

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `${baseNavLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`;
  
  const mobileBaseNavLinkClasses = "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 flex items-center gap-2";
  const mobileActiveNavLinkClasses = "text-brand-accent font-semibold bg-brand-interactive-dark-hover";
  const mobileInactiveNavLinkClasses = "text-brand-text-light-secondary hover:text-brand-text-light hover:bg-brand-interactive-dark-hover";
  
  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `${mobileBaseNavLinkClasses} ${isActive ? mobileActiveNavLinkClasses : mobileInactiveNavLinkClasses}`;

  const isAdminOrUser = user?.role === 'admin' || user?.role === 'user';
  const isClient = user?.role === 'client';

  const dashboardPath = isClient ? "/portal/dashboard" : "/";

  const adminNavLinks = [
    { to: "/", text: "Dashboard", end: true, icon: <SettingsIcon size={18}/> },
    { to: "/orders/new", text: "New Order", icon: <Briefcase size={18}/> },
    // { to: "/orders/managed", text: "Order Managed", icon: <FileText size={18}/> },
    // { to: "/reports", text: "Report", icon: <FileText size={18}/> },
    ...(user?.role === 'admin' ? [
      { to: "/admin/billing", text: "Billing", icon: <CreditCard size={18}/> },
      { to: "/admin/management", text: "User Management", icon: <UserCircle size={18}/> },
      { to: "/admin/audit-trail", text: "Audit Trail", icon: <ListChecks size={18}/> }
    ] : []),
    ...(isAdminOrUser ? [{ to: "/settings", text: "Settings", icon: <UserCog size={18}/> }] : []) // Added Settings Link for admin/user
  ];

  const clientNavLinks = [
    { to: "/portal/dashboard", text: "Dashboard", end: true, icon: <SettingsIcon size={18}/> },
    { to: "/portal/orders", text: "My Orders", icon: <Briefcase size={18}/> },
    { to: "/portal/invoices", text: "My Invoices", icon: <FileText size={18}/> },
    { to: "/portal/requests", text: "My Requests", icon: <Briefcase size={18}/> },
    { to: "/portal/subscriptions", text: "My Subscriptions", icon: <Repeat size={18}/> },
    { to: "/portal/profile", text: "My Profile", icon: <UserCog size={18}/> },
  ];
  
  let navLinksToDisplay = isAdminOrUser ? adminNavLinks : (isClient ? clientNavLinks : []);

  return (
    <header className="bg-brand-bg-dark shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={dashboardPath} className="text-xl font-bold text-brand-accent flex-shrink-0">
              {APP_NAME.split('-')[0]}
              <span className="text-brand-text-light">{APP_NAME.includes('-') ? `-${APP_NAME.split('-')[1]}` : ''}</span>
              {isClient && <span className="text-sm font-normal text-brand-text-light-secondary ml-1.5">Client Portal</span>}
            </Link>
            <nav className="hidden md:flex md:ml-6 md:space-x-1 lg:space-x-2">
              {navLinksToDisplay.map(link => (
                <NavLink key={link.to} to={link.to} end={link.end ?? false} className={navLinkClasses}>
                  {link.icon}{link.text}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleNotificationClick}
              className="p-1.5 mr-2 sm:mr-3 rounded-full text-brand-text-light-secondary hover:text-brand-text-light hover:bg-brand-interactive-dark-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-accent transition-colors"
              aria-label="View notifications"
            >
              <BellIcon size={22} />
            </button>
            {user && (
              <span className="text-brand-text-light-secondary mr-2 sm:mr-4 hidden sm:inline text-sm sm:text-base">
                Welcome, {user.name || user.username} 
              </span>
            )}
            <Button 
              onClick={handleLogout} 
              size="sm"
              variant="ghost"
              className="!text-brand-text-light-secondary !border-brand-text-light-secondary hover:!bg-brand-interactive-dark-hover hover:!text-brand-text-light focus:!ring-brand-interactive-dark-hover"
              leftIcon={<LogOut size={16}/>}
            >
              Logout
            </Button>
            <div className="ml-2 md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-brand-text-light-secondary hover:text-brand-text-light hover:bg-brand-interactive-dark-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <CloseIcon className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-brand-interactive-dark-hover">
             {navLinksToDisplay.map(link => (
                <NavLink key={`mobile-${link.to}`} to={link.to} end={link.end ?? false} className={mobileNavLinkClasses} onClick={closeMobileMenu}>
                   {link.icon}{link.text}
                </NavLink>
              ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
