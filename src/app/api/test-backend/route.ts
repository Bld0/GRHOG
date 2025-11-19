import { NextResponse } from 'next/server';

const API_BASE_URL = '/api/proxy';

interface TestResult {
  name: string;
  status: 'success' | 'failed';
  responseTime?: string;
  httpStatus?: number;
  hasToken?: boolean;
  details?: string;
  error?: string;
}

export async function GET() {
  const results: {
    timestamp: string;
    backendUrl: string;
    tests: TestResult[];
    error?: string;
  } = {
    timestamp: new Date().toISOString(),
    backendUrl: API_BASE_URL,
    tests: []
  };

  try {
    // Test 1: Basic connectivity
    console.log('Testing backend connectivity...');
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        }),
      });
      
      const responseTime = Date.now() - startTime;
      
      results.tests.push({
        name: 'Backend Connectivity',
        status: 'success',
        responseTime: `${responseTime}ms`,
        httpStatus: response.status,
        details: `Backend is reachable. Status: ${response.status}`
      });
      
    } catch (error) {
      results.tests.push({
        name: 'Backend Connectivity',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Cannot connect to backend server'
      });
    }

    // Test 2: Try with admin credentials
    try {
      const adminResponse = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'pass#s1'
        }),
      });
      
      const responseText = await adminResponse.text();
      
      results.tests.push({
        name: 'Admin Authentication Test',
        status: adminResponse.ok ? 'success' : 'failed',
        httpStatus: adminResponse.status,
        hasToken: adminResponse.ok && responseText.length > 0,
        details: adminResponse.ok ? 'Admin login successful' : `Admin login failed: ${adminResponse.statusText}`
      });
      
    } catch (error) {
      results.tests.push({
        name: 'Admin Authentication Test',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(results);
    
  } catch (error) {
    return NextResponse.json({
      ...results,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 