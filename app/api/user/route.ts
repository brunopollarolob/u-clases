import { getApiUser, getOptionalUser } from '@/lib/auth/dal';
import { NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { SPECIALIZATION_OPTIONS } from '@/lib/academic-profile';

// Cache the user data for the current request cycle
const getCachedUserData = cache(async () => {
  return await getOptionalUser();
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Use cached DAL function to prevent duplicate database calls
    const userData = await getCachedUserData();
    
    if (!userData) {
      // Return null for unauthenticated users to maintain compatibility
      // with components that check authentication state
      return NextResponse.json(null);
    }
    
    // Return the database user record
    return NextResponse.json(userData.dbUser);
  } catch (error) {
    console.error('Error in /api/user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const updateUserProfileSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    academicYear: z.number().int().min(1).max(10).nullable(),
    isGraduated: z.boolean(),
    specialization: z.enum(SPECIALIZATION_OPTIONS).nullable(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.isGraduated || data.academicYear !== null, {
    message: 'Debes indicar año académico si no estás titulado',
    path: ['academicYear'],
  });

const deleteAccountSchema = z.object({
  confirmText: z.literal('ELIMINAR', {
    errorMap: () => ({ message: 'Debes escribir ELIMINAR para confirmar' }),
  }),
});

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const userData = await getApiUser();
    const payload = await request.json();
    const parsed = updateUserProfileSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Payload inválido' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();

    if (data.email && data.email !== userData.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: data.email });
      if (emailError) {
        return NextResponse.json(
          { error: `No se pudo actualizar email: ${emailError.message}` },
          { status: 400 }
        );
      }
    }

    if (typeof data.fullName === 'string') {
      const { error: fullNameError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName || null,
          specialization: data.specialization,
        },
      });

      if (fullNameError) {
        return NextResponse.json(
          { error: `No se pudo actualizar nombre: ${fullNameError.message}` },
          { status: 400 }
        );
      }
    }

    const { data: updatedUser, error } = await serviceSupabase
      .from('users')
      .update({
        full_name: data.fullName || null,
        phone: data.phone || null,
        academic_year: data.isGraduated ? null : data.academicYear,
        is_graduated: data.isGraduated,
        specialization: data.specialization,
      })
      .eq('id', userData.dbUser.id)
      .select('*')
      .single();

    if (error || !updatedUser) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: data.email && data.email !== userData.email
        ? 'Perfil actualizado. Revisa tu correo para confirmar el nuevo email.'
        : 'Perfil actualizado correctamente.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Error in PUT /api/user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const userData = await getApiUser();
    const payload = await request.json();
    const parsed = deleteAccountSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Confirmación inválida' },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();
    const { error } = await serviceSupabase.auth.admin.deleteUser(userData.userId);

    if (error) {
      console.error('Error deleting auth user:', error);
      return NextResponse.json({ error: 'No se pudo eliminar la cuenta' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Error in DELETE /api/user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
