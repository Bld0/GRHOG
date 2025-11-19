import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Signout request received');
    
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    console.log('Attempting to signout with backend:', `${backendUrl}/auth/signout`);
    
    const response = await fetch(`${backendUrl}/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: We don't send the request body here since the backend might not need it
    });

    console.log('Backend signout response status:', response.status);

    // Always return success for signout, even if backend fails
    // This ensures the frontend can clear local state
    return NextResponse.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Auth signout route error:', error);
    
    // Even on error, return success to allow frontend to clear state
    return NextResponse.json({ message: 'Logged out successfully' });
  }
}
