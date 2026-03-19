import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/app';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const configuredBase = config.app.url.replace(/\/$/, '');
  const requestOrigin = origin.replace(/\/$/, '');
  const isLocalOrigin = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');

  const appBaseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : config.app.env === 'production' && isLocalOrigin
      ? configuredBase
      : requestOrigin;

  const safeNextPath = next.startsWith('/') ? next : '/app';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    const errorMessage = encodeURIComponent(
      error_description || 'Authentication failed. Please try again.'
    );
    return NextResponse.redirect(`${appBaseUrl}${config.auth.paths.signIn}?error=${errorMessage}`);
  }

  if (code) {
    const supabase = await createClient();
    
    try {
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.user) {
        console.log(`User authenticated: ${data.user.id} (${data.user.email})`);

        // Create user record in database if it doesn't exist using secure RPC
        try {
          const { error: rpcError } = await supabase.rpc('create_user_profile');
          if (rpcError) {
            console.error('Error calling create_user_profile RPC:', rpcError);
            // Don't fail the auth flow for this - user can still sign in
          } else {
            console.log(`Created database record for user: ${data.user.id}`);
          }
        } catch (createError) {
          console.error('Error creating user record:', createError);
          // Don't fail the auth flow for this - user can still sign in
        }

        // Best-effort sync for signup metadata into public.users.
        try {
          const serviceSupabase = await createServiceClient();
          const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
          const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
          const phone = typeof metadata.phone === 'string' ? metadata.phone.trim() : '';
          const rawIsGraduated = metadata.is_graduated;
          const isGraduated =
            typeof rawIsGraduated === 'boolean'
              ? rawIsGraduated
              : typeof rawIsGraduated === 'string'
                ? rawIsGraduated.toLowerCase() === 'true'
                : false;
          const rawAcademicYear = metadata.academic_year;
          const academicYear =
            typeof rawAcademicYear === 'number'
              ? rawAcademicYear
              : typeof rawAcademicYear === 'string'
                ? Number(rawAcademicYear)
                : null;
          const specialization = typeof metadata.specialization === 'string' ? metadata.specialization.trim() : '';

          const hasProfileFields =
            fullName.length > 0 ||
            phone.length > 0 ||
            rawIsGraduated !== undefined ||
            specialization.length > 0;

          if (hasProfileFields) {
            const { error: syncError } = await serviceSupabase
              .from('users')
              .update({
                full_name: fullName.length > 0 ? fullName : undefined,
                phone: phone.length > 0 ? phone : undefined,
                is_graduated: rawIsGraduated !== undefined ? isGraduated : undefined,
                academic_year:
                  rawIsGraduated !== undefined
                    ? isGraduated
                      ? null
                      : academicYear && Number.isFinite(academicYear) && academicYear >= 1 && academicYear <= 10
                        ? academicYear
                        : null
                    : undefined,
                specialization: specialization.length > 0 ? specialization : undefined,
              })
              .eq('supabase_user_id', data.user.id);

            if (syncError) {
              console.error('Error syncing profile metadata after auth callback:', syncError);
            }
          }
        } catch (syncUnexpectedError) {
          console.error('Unexpected error syncing profile metadata:', syncUnexpectedError);
        }

        const destination = safeNextPath;

        return NextResponse.redirect(`${appBaseUrl}${destination}`);
      } else {
        console.error('Session exchange error:', error);
        const errorMessage = encodeURIComponent('Failed to complete authentication. Please try again.');
        return NextResponse.redirect(`${appBaseUrl}${config.auth.paths.signIn}?error=${errorMessage}`);
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err);
      const errorMessage = encodeURIComponent('An unexpected error occurred. Please try again.');
      return NextResponse.redirect(`${appBaseUrl}${config.auth.paths.signIn}?error=${errorMessage}`);
    }
  }

  // No code and no error - invalid callback
  const errorMessage = encodeURIComponent('Invalid authentication callback. Please try signing in again.');
  return NextResponse.redirect(`${appBaseUrl}${config.auth.paths.signIn}?error=${errorMessage}`);
} 