
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import { Briefcase, FileText, MessageSquare, Repeat, ArrowRight } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; linkTo: string; icon: React.ReactNode; linkText?: string }> = ({ title, value, linkTo, icon, linkText = "View Details" }) => (
  <div className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6 flex flex-col justify-between">
    <div>
      <div className="flex items-center text-brand-text-light-secondary mb-2">
        {icon}
        <h3 className="ml-2 text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-brand-text-light mb-1">{value}</p>
      {/* <p className="text-sm text-brand-text-light-secondary mb-4">Description or additional info</p> */}
    </div>
    <Link to={linkTo}>
      <Button variant="ghost" size="sm" className="w-full mt-4 !text-brand-accent hover:!bg-brand-accent hover:!text-white">
        {linkText} <ArrowRight size={16} className="ml-1" />
      </Button>
    </Link>
  </div>
);


const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in a real app, this would come from API calls
  const mockStats = {
    activeOrders: 3, // Example
    pendingRequests: 1,
    activeSubscriptions: 2,
    unpaidInvoices: 1
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 p-6 bg-brand-interactive-dark-hover rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-brand-text-light mb-2">
            Welcome back, <span className="text-brand-accent">{user?.username || 'Client'}</span>!
          </h1>
          <p className="text-brand-text-light-secondary">
            This is your personal portal to manage your services, track orders, and get support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="My Orders" value={`${mockStats.activeOrders} Active`} linkTo="/portal/orders" icon={<Briefcase size={24} />} linkText="Manage Orders" />
          <StatCard title="My Invoices" value={`${mockStats.unpaidInvoices} Unpaid`} linkTo="/portal/invoices" icon={<FileText size={24} />} linkText="View Invoices" />
          <StatCard title="My Requests" value={`${mockStats.pendingRequests} Pending`} linkTo="/portal/requests" icon={<MessageSquare size={24} />} linkText="Track Requests" />
          <StatCard title="My Subscriptions" value={`${mockStats.activeSubscriptions} Active`} linkTo="/portal/subscriptions" icon={<Repeat size={24} />} linkText="Manage Subscriptions" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold text-brand-text-light mb-4">Recent Activity</h2>
                <ul className="space-y-3 text-brand-text-light-secondary">
                    {/* Mock recent activity */}
                    <li className="text-sm">Order <Link to="/portal/orders/ORD001" className="text-brand-accent hover:underline">ORD001</Link> status changed to 'Under Review'.</li>
                    <li className="text-sm">New invoice <Link to="/portal/invoices" className="text-brand-accent hover:underline">INV003</Link> generated.</li>
                    <li className="text-sm">Support request <Link to="/portal/requests" className="text-brand-accent hover:underline">REQ005</Link> was updated.</li>
                </ul>
            </div>
             <div className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold text-brand-text-light mb-4">Quick Actions</h2>
                <div className="space-y-3">
                    <Link to="/portal/requests/new">
                        <Button variant="primary" className="w-full">Submit a New Request</Button>
                    </Link>
                    <Link to="/portal/orders">
                        <Button variant="secondary" className="w-full">View All My Orders</Button>
                    </Link>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDashboardPage;
