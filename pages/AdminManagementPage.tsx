
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminUser, UserRole, Actor } from '../types';
import { getAllUsers as fetchAllUsers, updateUserRole as apiUpdateUserRole } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal'; 
import Input from '../components/Input'; 
import { Users, ShieldCheck, UserCheck } from 'lucide-react';

const AdminManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null); 

  const { user: currentUser } = useAuth(); 

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const { internalUsers, clientUsers } = useMemo(() => {
    const internal: AdminUser[] = [];
    const clients: AdminUser[] = [];
    users.forEach(user => {
      if (user.role === 'admin' || user.role === 'user') {
        internal.push(user);
      } else if (user.role === 'client') {
        clients.push(user);
      }
    });
    return { internalUsers: internal, clientUsers: clients };
  }, [users]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!currentUser) {
        alert("Cannot perform action: current user not identified.");
        return;
    }
    if (userId === currentUser?.id) {
        alert("Admins cannot change their own role through this interface.");
        const selectElement = document.getElementById(`role-select-${userId}`) as HTMLSelectElement;
        if (selectElement) {
            const originalRole = users.find(u => u.id === userId)?.role;
            if (originalRole) selectElement.value = originalRole;
        }
        return;
    }

    setIsUpdatingRole(userId);
    const actor: Actor = { userId: currentUser.id, username: currentUser.username };
    try {
      await apiUpdateUserRole(userId, newRole, actor);
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (err: any) {
      alert(`Failed to update role for user ${userId}: ${err.message || 'Unknown error'}`);
      loadUsers(); 
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const renderUserTable = (title: string, userList: AdminUser[], icon: React.ReactNode, isClientTable: boolean = false) => {
    if (userList.length === 0 && !isLoading) {
      return (
        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-brand-text-light mb-4 flex items-center">{icon} {title}</h2>
            <p className="text-brand-text-light-secondary">No users found in this category.</p>
        </div>
      );
    }

    return (
        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto mb-10">
            <h2 className="text-2xl font-semibold text-brand-text-light p-6 flex items-center border-b border-slate-700">{icon} {title} ({userList.length})</h2>
            {userList.length > 0 && (
                 <table className="min-w-full divide-y divide-slate-600">
                <thead className="bg-slate-700">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">User ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Role</th>
                    {!isClientTable && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Change Role</th>}
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                {userList.map(user => (
                    <tr key={user.id} className="hover:bg-slate-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-brand-accent text-white' : (user.role === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white')}`}>
                        {user.role}
                        </span>
                    </td>
                    {!isClientTable && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isUpdatingRole === user.id ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <Input
                            as="select"
                            name={`role-select-${user.id}`}
                            id={`role-select-${user.id}`}
                            value={user.role}
                            className="!mt-0 !mb-0 text-sm py-1" 
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            options={[
                                { value: 'user', label: 'User' }, 
                                { value: 'admin', label: 'Admin' },
                            ]}
                            disabled={user.id === currentUser?.id} 
                            />
                        )}
                        </td>
                    )}
                    </tr>
                ))}
                </tbody>
            </table>
            )}
        </div>
    );
  };

  if (isLoading && users.length === 0) {
    return <div className="p-8"><LoadingSpinner message="Loading users..." /></div>;
  }

  if (error && users.length === 0) {
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-text-light mb-8 flex items-center"><Users size={30} className="mr-3 text-brand-accent"/>User Account Management</h1>
      {error && <p className="mb-4 text-sm text-red-100 bg-red-700 p-3 rounded-md">{error}</p>}
      
      {renderUserTable("Internal Staff Accounts", internalUsers, <ShieldCheck size={24} className="mr-2 text-brand-accent"/>, false)}
      {renderUserTable("Client Accounts", clientUsers, <UserCheck size={24} className="mr-2 text-blue-500"/>, true)}
      
    </div>
  );
};

export default AdminManagementPage;
