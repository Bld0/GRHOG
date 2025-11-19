/**
 * Utility to handle mixed content issues when making HTTP requests from HTTPS pages
 */

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://device.grhog.mn';
  
  // If we're in the browser and the page is HTTPS, try to use HTTPS first
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Try HTTPS first, fallback to HTTP if needed
    const httpsUrl = baseUrl.replace('http://', 'https://');
    return `${httpsUrl}${endpoint}`;
  }
  
  return `${baseUrl}${endpoint}`;
};

export const createMixedContentSafeFetch = (url: string, options: RequestInit = {}) => {
  // If the URL is HTTP and we're on HTTPS, try to handle it gracefully
  if (url.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Try to use HTTPS version first
    const httpsUrl = url.replace('http://', 'https://');
    
    return fetch(httpsUrl, options).catch(() => {
      // If HTTPS fails, fall back to HTTP (this might be blocked by the browser)
      console.warn('HTTPS request failed, falling back to HTTP (may be blocked by browser)');
      return fetch(url, options);
    });
  }
  
  return fetch(url, options);
};
