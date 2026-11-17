import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password, confirm_password } = await request.json();

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirm_password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (password !== confirm_password) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    // Check existing email
    const { data: existing } = await supabase
      .from('medislot_users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: insertError } = await supabase
      .from('medislot_users')
      .insert({
        name: cleanName,
        email: cleanEmail,
        password_hash: passwordHash,
        role: 'patient',
      })
      .select('id, name, email, role')
      .single();

    if (insertError || !newUser) {
      console.error('Registration insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    await setSessionCookie({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      redirectTo: '/patient',
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
