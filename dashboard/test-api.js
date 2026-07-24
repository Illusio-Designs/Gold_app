// Test script to verify API configuration
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);

// Simulate the same logic as in adminApiService.js
const BASE_URL = process.env.VITE_API_BASE_URL || 
  (process.env.NODE_ENV === 'development' ? "/api" : "https://amrutkumargovinddasllp.com/api");

console.log('Final BASE_URL:', BASE_URL);

