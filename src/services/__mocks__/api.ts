// Mock version of api.ts for Jest testing
export const supabaseRequest = jest.fn(async (operation: any) => {
  try {
    const result = await operation();
    if (result && result.error) {
      throw new Error(result.error.message || 'Database error');
    }
    return result && result.data !== undefined ? result.data : result;
  } catch (error: any) {
    throw error;
  }
});

export const handleApiError = jest.fn((error: any) => {
  if (error.message) {
    return error.message;
  }
  return 'An error occurred';
});

export default {
  supabaseRequest,
  handleApiError
};
