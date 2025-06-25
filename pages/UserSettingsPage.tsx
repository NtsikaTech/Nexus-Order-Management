
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserCircle, Lock, LogOut as LogOutIcon, Trash2, Camera } from 'lucide-react'; // Placeholder icons

// Mock avatar image URL
const MOCK_AVATAR_URL = 'https://via.placeholder.com/100/4A5568/EBF4FF?text=User'; // Placeholder image similar to provided

const UserSettingsPage: React.FC = () => {
  const { tab = 'account' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab.toLowerCase());

  useEffect(() => {
    setActiveTab(tab.toLowerCase());
  }, [tab]);

  // Personal Information State
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [username, setUsername] = useState('johndoe');
  const [timezone, setTimezone] = useState('Pacific Standard Time');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Log Out Other Sessions State
  const [logoutPassword, setLogoutPassword] = useState('');

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    navigate(`/settings/${tabName.toLowerCase()}`);
  };
  
  const handleSavePersonalInfo = (e: FormEvent) => {
    e.preventDefault();
    console.log('Saving personal info:', { firstName, lastName, email, username, timezone });
    alert('Personal information saved (mock)!');
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    console.log('Changing password (mock)');
    alert('Password changed (mock)!');
  };

  const handleLogOutOtherSessions = (e: FormEvent) => {
    e.preventDefault();
    console.log('Logging out other sessions (mock)');
    alert('Logged out other sessions (mock)!');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is not reversible.')) {
      console.log('Deleting account (mock)');
      alert('Account deleted (mock)!');
      // Potentially navigate to logout or login page
    }
  };

  const tabs = [
    { name: 'Account', id: 'account' },
    { name: 'Notifications', id: 'notifications' },
    { name: 'Billing', id: 'billing' },
    { name: 'Teams', id: 'teams' },
    { name: 'Integrations', id: 'integrations' },
  ];

  const timezones = [
    { value: 'Pacific Standard Time', label: 'Pacific Standard Time' },
    { value: 'Mountain Standard Time', label: 'Mountain Standard Time' },
    { value: 'Central Standard Time', label: 'Central Standard Time' },
    { value: 'Eastern Standard Time', label: 'Eastern Standard Time' },
  ];

  const renderAccountSettings = () => (
    <div className="space-y-10 divide-y divide-slate-700">
      {/* Personal Information */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 pt-10">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-brand-text-light">Personal Information</h2>
          <p className="mt-1 text-sm leading-6 text-brand-text-light-secondary">Use a permanent address where you can receive mail.</p>
        </div>

        <form onSubmit={handleSavePersonalInfo} className="bg-brand-interactive-dark-hover shadow-sm ring-1 ring-slate-700/50 sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="col-span-full flex items-center gap-x-8">
                <img src={MOCK_AVATAR_URL} alt="Current avatar" className="h-24 w-24 flex-none rounded-lg bg-slate-700 object-cover" />
                <div>
                  <Button type="button" variant="primary" onClick={() => alert('Change avatar clicked (mock)!')}>
                    Change avatar
                  </Button>
                  <p className="mt-2 text-xs leading-5 text-brand-text-light-secondary">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div className="sm:col-span-3">
                <Input label="First name" name="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="sm:col-span-3">
                <Input label="Last name" name="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
              <div className="col-span-full">
                <Input label="Email address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="col-span-full">
                 <Input label="Username" name="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="example.com/username" />
              </div>
              <div className="col-span-full">
                <Input
                    as="select"
                    label="Timezone"
                    name="timezone"
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    options={timezones}
                    required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-slate-700/50 px-4 py-4 sm:px-8">
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 pt-10">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-brand-text-light">Change password</h2>
          <p className="mt-1 text-sm leading-6 text-brand-text-light-secondary">Update your password associated with your account.</p>
        </div>
        <form onSubmit={handleChangePassword} className="bg-brand-interactive-dark-hover shadow-sm ring-1 ring-slate-700/50 sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-y-8">
                <Input label="Current password" name="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
                <Input label="New password" name="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
                <Input label="Confirm password" name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-slate-700/50 px-4 py-4 sm:px-8">
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </div>

      {/* Log out other sessions */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 pt-10">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-brand-text-light">Log out other sessions</h2>
          <p className="mt-1 text-sm leading-6 text-brand-text-light-secondary">Please enter your password to confirm you would like to log out of your other sessions across all of your devices.</p>
        </div>
        <form onSubmit={handleLogOutOtherSessions} className="bg-brand-interactive-dark-hover shadow-sm ring-1 ring-slate-700/50 sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
             <Input label="Your password" name="logoutPassword" type="password" value={logoutPassword} onChange={e => setLogoutPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-slate-700/50 px-4 py-4 sm:px-8">
            <Button type="submit" variant="primary">Log out other sessions</Button>
          </div>
        </form>
      </div>
      
      {/* Delete account */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 pt-10">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-brand-text-light">Delete account</h2>
          <p className="mt-1 text-sm leading-6 text-brand-text-light-secondary">No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently.</p>
        </div>
        <div className="bg-brand-interactive-dark-hover shadow-sm ring-1 ring-slate-700/50 sm:rounded-xl md:col-span-2 flex items-center px-4 py-6 sm:p-8">
            <Button type="button" variant="danger" onClick={handleDeleteAccount}>Yes, delete my account</Button>
        </div>
      </div>
    </div>
  );

  const renderOtherTabContent = (tabName: string) => (
    <div className="py-10 px-4 sm:px-0">
      <h2 className="text-xl font-semibold text-brand-text-light">{tabName} Settings</h2>
      <p className="mt-2 text-brand-text-light-secondary">Content for {tabName.toLowerCase()} settings will be here. (Coming Soon)</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-brand-text-light">
      <div className="border-b border-slate-700 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.name}
              onClick={() => handleTabClick(tabItem.id)}
              className={`${
                activeTab === tabItem.id
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-brand-text-light-secondary hover:text-brand-text-light hover:border-slate-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
              aria-current={activeTab === tabItem.id ? 'page' : undefined}
            >
              {tabItem.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'account' && renderAccountSettings()}
      {activeTab === 'notifications' && renderOtherTabContent('Notifications')}
      {activeTab === 'billing' && renderOtherTabContent('Billing')}
      {activeTab === 'teams' && renderOtherTabContent('Teams')}
      {activeTab === 'integrations' && renderOtherTabContent('Integrations')}
    </div>
  );
};

export default UserSettingsPage;
