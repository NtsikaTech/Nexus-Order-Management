
import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { AuditLogEntry, AuditActionType, AuditEntityType } from '../../types';
import { getAuditLogs as fetchAuditLogs } from '../../services/auditLogService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { formatDate } from '../../utils/helpers';
import { ITEMS_PER_PAGE, AuditActionDisplayNames, AuditEntityDisplayNames } from '../../constants';
import { Filter, Search, X } from 'lucide-react';

const AdminAuditTrailPage: React.FC = () => {
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filters State
  const [userFilter, setUserFilter] = useState<string>(''); // For username or userId
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [actionTypeFilter, setActionTypeFilter] = useState<AuditActionType | ''>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | ''>('');
  const [entityIdFilter, setEntityIdFilter] = useState<string>('');


  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLogs = await fetchAuditLogs(); // Already sorts by newest first
      setAllLogs(fetchedLogs);
    } catch (err) {
      setError('Failed to load audit logs.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const filteredAuditLogs = useMemo(() => {
    setCurrentPage(1); // Reset to first page on filter change
    return allLogs.filter(log => {
      const matchesUser = userFilter === '' || 
                          log.username.toLowerCase().includes(userFilter.toLowerCase()) ||
                          log.userId.toLowerCase().includes(userFilter.toLowerCase());
      
      const logTimestamp = new Date(log.timestamp).getTime();
      const matchesStartDate = startDateFilter === '' || logTimestamp >= new Date(startDateFilter).getTime();
      // For end date, we want to include the whole day, so set time to end of day.
      const matchesEndDate = endDateFilter === '' || logTimestamp <= new Date(endDateFilter + "T23:59:59.999Z").getTime();

      const matchesActionType = actionTypeFilter === '' || log.actionType === actionTypeFilter;
      const matchesEntityType = entityTypeFilter === '' || log.entityType === entityTypeFilter;
      const matchesEntityId = entityIdFilter === '' || (log.entityId && log.entityId.toLowerCase().includes(entityIdFilter.toLowerCase()));

      return matchesUser && matchesStartDate && matchesEndDate && matchesActionType && matchesEntityType && matchesEntityId;
    });
  }, [allLogs, userFilter, startDateFilter, endDateFilter, actionTypeFilter, entityTypeFilter, entityIdFilter]);

  const totalPages = Math.ceil(filteredAuditLogs.length / ITEMS_PER_PAGE);
  const paginatedAuditLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAuditLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAuditLogs, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const clearFilters = () => {
    setUserFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setActionTypeFilter('');
    setEntityTypeFilter('');
    setEntityIdFilter('');
    setCurrentPage(1);
  };

  if (isLoading && allLogs.length === 0) {
    return <div className="p-8"><LoadingSpinner message="Loading audit trail..." /></div>;
  }

  if (error && allLogs.length === 0) {
    return <div className="p-8 text-red-100 bg-red-700 border border-red-500 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-text-light mb-8">System Audit Trail</h1>

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-brand-interactive-dark-hover shadow rounded-lg">
            <h2 className="text-xl font-semibold text-brand-text-light mb-3 flex items-center"><Filter size={20} className="mr-2"/> Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Input label="User (Name/ID)" name="userFilter" value={userFilter} onChange={e => setUserFilter(e.target.value)} placeholder="Search user..." />
                <Input label="Entity ID" name="entityIdFilter" value={entityIdFilter} onChange={e => setEntityIdFilter(e.target.value)} placeholder="Order ID, User ID etc." />
                <Input label="Start Date" name="startDateFilter" type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                <Input label="End Date" name="endDateFilter" type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                <Input 
                    as="select" 
                    label="Action Type" 
                    name="actionTypeFilter" 
                    value={actionTypeFilter} 
                    onChange={e => setActionTypeFilter(e.target.value as AuditActionType | '')}
                    options={[{value: '', label: 'All Actions'}, ...Object.values(AuditActionType).map(at => ({value: at, label: AuditActionDisplayNames[at]}))]}
                />
                <Input 
                    as="select" 
                    label="Entity Type" 
                    name="entityTypeFilter" 
                    value={entityTypeFilter} 
                    onChange={e => setEntityTypeFilter(e.target.value as AuditEntityType | '')}
                    options={[{value: '', label: 'All Entities'}, ...Object.values(AuditEntityType).map(et => ({value: et, label: AuditEntityDisplayNames[et]}))]}
                />
                 <div className="col-span-full sm:col-span-1 md:col-span-1 lg:col-span-2 flex items-end">
                    <Button onClick={clearFilters} variant="ghost" leftIcon={<X size={18}/>} className="w-full sm:w-auto">Clear Filters</Button>
                </div>
            </div>
        </div>

        {error && <p className="text-red-400 p-4">{error}</p>}

        <div className="bg-brand-interactive-dark-hover shadow-md rounded-lg overflow-x-auto">
          {paginatedAuditLogs.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-brand-text-light-secondary">
              <Search size={48} className="mx-auto mb-4" />
              <p className="text-xl font-semibold">No audit logs found matching your criteria.</p>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">User</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Entity Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Entity ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-light-secondary uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {paginatedAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-600 transition-colors text-sm">
                    <td className="px-4 py-3 whitespace-nowrap text-brand-text-light-secondary">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-text-light">
                        <div>{log.username}</div>
                        <div className="text-xs text-brand-text-light-secondary">({log.userId})</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-text-light">{AuditActionDisplayNames[log.actionType] || log.actionType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-text-light">{AuditEntityDisplayNames[log.entityType] || log.entityType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-text-light-secondary">{log.entityId || 'N/A'}</td>
                    <td className="px-4 py-3 text-brand-text-light max-w-md">
                      <div className="truncate" title={log.details}>{log.details}</div>
                      {log.previousValue && <div className="text-xs text-brand-text-light-secondary truncate" title={`Old: ${String(log.previousValue)}`}>Old: {String(log.previousValue).substring(0,50)}{String(log.previousValue).length > 50 ? '...' : ''}</div>}
                      {log.newValue && <div className="text-xs text-brand-text-light-secondary truncate" title={`New: ${String(log.newValue)}`}>New: {String(log.newValue).substring(0,50)}{String(log.newValue).length > 50 ? '...' : ''}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {paginatedAuditLogs.length > 0 && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
};

export default AdminAuditTrailPage;
