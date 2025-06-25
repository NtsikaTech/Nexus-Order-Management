
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const ReportsPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-text-light mb-8">Reporting &amp; Analytics</h1>
      
      <div className="bg-brand-interactive-dark-hover shadow-lg rounded-xl p-6">
        <p className="text-brand-text-light mb-4">
          This section will provide comprehensive reporting and analytics capabilities to help you gain insights into your order processing and sales performance.
        </p>
        <p className="text-brand-text-light mb-2">
          Planned functionalities include:
        </p>
        <ul className="list-disc list-inside text-brand-text-light-secondary space-y-1 mb-6">
          <li>Sales performance reports (e.g., revenue over time, by service type).</li>
          <li>Order status distribution and processing times.</li>
          <li>Service and package popularity analysis.</li>
          <li>Client activity summaries and trends.</li>
          <li>Key performance indicators (KPIs) dashboard.</li>
          <li>Customizable report generation and export options.</li>
        </ul>
        <p className="text-brand-text-light mb-4">
          Currently, you can view individual order details and their activity logs through the Dashboard or Order Management sections.
        </p>
        <Link to="/">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default ReportsPage;
