import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Sign out the user (Supabase handles deletion via dashboard/admin API)
    // Note: Full user deletion requires Supabase Admin API or dashboard access
    await supabase.auth.signOut();

    return NextResponse.json({ 
      success: true,
      message: 'Signed out successfully. Contact admin to permanently delete account.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
