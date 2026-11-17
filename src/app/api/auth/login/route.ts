import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json({ error: 'Please enter your email and password.' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('medislot_users')
      .select('id, name, email, password_hash, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password. Please try again.' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password. Please try again.' }, { status: 401 });
    }

    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo: user.role === 'assistant' ? '/admin' : '/patient',
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
