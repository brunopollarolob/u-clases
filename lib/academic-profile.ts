export const SPECIALIZATION_OPTIONS = [
  'Plan Común',
  'Ingeniería Civil en Biotecnología',
  'Ingeniería Civil en Computación',
  'Ingeniería Civil Eléctrica',
  'Ingeniería Civil Industrial',
  'Ingeniería Civil Matemática',
  'Ingeniería Civil Mecánica',
  'Ingeniería Civil en Minas',
  'Ingeniería Civil Química',
  'Ingeniería Civil (estructuras, hidráulica, etc.)',
  'Geofísica',
  'Geología',
  'Licenciatura en Ciencias, Mención Astronomía',
  'Licenciatura en Ciencias, Mención Física',
] as const;

export type SpecializationOption = (typeof SPECIALIZATION_OPTIONS)[number];

export function isValidSpecialization(value: string | null | undefined): value is SpecializationOption {
  if (!value) return false;
  return SPECIALIZATION_OPTIONS.includes(value as SpecializationOption);
}

export function getAcademicStatusLabel(isGraduated: boolean, academicYear: number | null): string {
  if (isGraduated) {
    return 'Titulado/a';
  }

  if (academicYear && Number.isFinite(academicYear) && academicYear > 0) {
    return `${academicYear}° año`;
  }

  return 'Año no informado';
}

export function getAcademicSummary(
  specialization: string | null,
  isGraduated: boolean,
  academicYear: number | null
): string {
  const status = getAcademicStatusLabel(isGraduated, academicYear);
  if (specialization && specialization.trim().length > 0) {
    return `${specialization} · ${status}`;
  }

  return status;
}
