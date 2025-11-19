'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG } from '@/config/api';

export default function TestBackendPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/test`);
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Backend connection successful!\n\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResult(`❌ Backend connection failed!\n\nStatus: ${response.status}\nStatus Text: ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Backend connection error!\n\nError: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/status`);
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Auth endpoint test successful!\n\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResult(`❌ Auth endpoint test failed!\n\nStatus: ${response.status}\nStatus Text: ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Auth endpoint test error!\n\nError: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Backend Connection Test</h1>
        <p className="text-muted-foreground">
          Test the connection to the backend API server
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backend Configuration</CardTitle>
            <CardDescription>Current API configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Base URL:</strong> {API_CONFIG.BASE_URL}
            </div>
            <div>
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
            <div>
              <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Test backend connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testBackendConnection} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Backend Connection'}
            </Button>
            
            <Button 
              onClick={testAuthEndpoint} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Auth Endpoint'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm overflow-auto">
              {testResult}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>Common issues and solutions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">If you get connection errors:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Make sure the backend server is running on port 8989</li>
              <li>Check if the backend is accessible at http://device.grhog.mn</li>
              <li>Verify the API_CONFIG.BASE_URL is correct</li>
              <li>Check browser console for CORS errors</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">To fix CORS issues:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ensure backend CORS configuration allows frontend origin</li>
              <li>Check if backend is configured to accept requests from http://localhost:3000</li>
              <li>Verify JWT token configuration in backend</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
