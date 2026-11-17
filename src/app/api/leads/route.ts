import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type LeadPayload = {
  name?: string;
  phone?: string;
  department?: string;
  preferred_day?: string;
  note?: string;
};

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function storeLocally(lead: Record<string, string>) {
  const dir = path.join(process.cwd(), '.data');
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(
    path.join(dir, 'leads.ndjson'),
    `${JSON.stringify({ ...lead, created_at: new Date().toISOString() })}\n`,
    'utf8'
  );
}

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = clean(payload.name, 120);
  const phone = clean(payload.phone, 40);
  const department = clean(payload.department, 80) || 'General Medicine';
  const preferredDay = clean(payload.preferred_day, 40) || 'Any day';
  const note = clean(payload.note, 600);

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 6) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }

  const lead = {
    name,
    phone,
    department,
    preferred_day: preferredDay,
    note: note || null,
  };

  const { error } = await supabase.from('medislot_leads').insert(lead);

  if (!error) {
    return NextResponse.json({ ok: true, stored: 'db' });
  }

  const missingTable =
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    error.message?.toLowerCase().includes('medislot_leads');

  if (!missingTable) {
    console.error('Lead insert failed:', error);
    return NextResponse.json({ error: 'Could not save your request.' }, { status: 500 });
  }

  // The table has not been created on this database yet. Keep the lead in a
  // local NDJSON file so the form still works; run the SQL in database.sql to
  // switch to Postgres persistence automatically.
  try {
    await storeLocally({ ...lead, note: note || '' });
    console.warn('medislot_leads is missing — lead stored locally in .data/leads.ndjson');
    return NextResponse.json({ ok: true, stored: 'file' });
  } catch (err) {
    console.error('Local lead fallback failed:', err);
    return NextResponse.json({ error: 'Could not save your request.' }, { status: 500 });
  }
}
