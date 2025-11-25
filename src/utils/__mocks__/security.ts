// Mock version of security.ts for Jest testing
export const sanitizeHtml = jest.fn((dirty: string): string => {
  return dirty.replace(/<[^>]*>/g, '');
});

export const sanitizeText = jest.fn((input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .substring(0, 5000);
});

export const isValidEmail = jest.fn((email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
});

export const isValidPassword = jest.fn((password: string): boolean => {
  return password.length >= 6;
});

export const apiRateLimiter = {
  canMakeRequest: jest.fn(() => true),
  getRemainingRequests: jest.fn(() => 100),
  getResetTime: jest.fn(() => 0)
};
