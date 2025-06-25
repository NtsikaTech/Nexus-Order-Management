
import React from 'react';
import { OrderStatus } from '../types';
import { ORDER_STATUS_COLORS } from '../constants';

interface StatusBadgeProps {
  status: OrderStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClass = ORDER_STATUS_COLORS[status] || 'bg-gray-500 text-white';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
