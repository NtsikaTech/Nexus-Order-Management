
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Simple email validation regex
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Simple non-empty validator
export const isNotEmpty = (value: string | undefined | null): boolean => {
  return value !== null && value !== undefined && value.trim() !== '';
};
