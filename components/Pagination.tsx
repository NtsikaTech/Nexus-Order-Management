
import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  // Logic for displaying page numbers (e.g., first, last, current, ellipsis)
  // For simplicity, showing a few pages around current
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    endPage = Math.min(totalPages, 5);
  }
  if (currentPage > totalPages - 3) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-between mt-6" aria-label="Pagination">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="ghost"
        size="sm"
      >
        Previous
      </Button>
      
      <div className="hidden sm:flex space-x-1">
        {startPage > 1 && (
          <>
            <Button onClick={() => onPageChange(1)} variant={1 === currentPage ? "primary" : "ghost"} size="sm">1</Button>
            {startPage > 2 && <span className="px-3 py-1.5 text-sm">...</span>}
          </>
        )}
        {pageNumbers.map(number => (
          <Button
            key={number}
            onClick={() => onPageChange(number)}
            variant={number === currentPage ? "primary" : "ghost"}
            size="sm"
          >
            {number}
          </Button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages -1 && <span className="px-3 py-1.5 text-sm">...</span>}
            <Button onClick={() => onPageChange(totalPages)} variant={totalPages === currentPage ? "primary" : "ghost"} size="sm">{totalPages}</Button>
          </>
        )}
      </div>
       <div className="sm:hidden">
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="ghost"
        size="sm"
      >
        Next
      </Button>
    </nav>
  );
};

export default Pagination;
