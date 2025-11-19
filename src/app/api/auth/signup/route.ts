import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
  
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // For this simple system, only allow signup if email matches admin email
    // In a real system, you'd save new users to a database
    if (email !== adminEmail) {
      return NextResponse.json(
        { error: 'Registration is currently limited to admin users only' },
        { status: 403 }
      );
    }

    // Hash the password for display (in real system, you'd save this to database)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('New password hash for environment variable:', hashedPassword);

    // Set authentication cookie
    const response = NextResponse.json( 
      { 
        message: 'Account created successfully',
        note: 'Check server logs for password hash to update environment variables'
      },
      { status: 201 }
    );

    // Set a simple auth cookie
    response.cookies.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Sign-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 