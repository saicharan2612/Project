import { notFound } from 'next/navigation'
import { roles } from '@/components/carelink-header'
import { RoleDashboard } from '@/components/role-dashboard'
import { AdminDashboard } from '@/components/admin-dashboard'
import { DoctorDashboard } from '@/components/doctor-dashboard'
import { NurseDashboard } from '@/components/nurse-dashboard'
import { MedicineStaffDashboard } from '@/components/medicine-staff-dashboard'
import { BillingStaffDashboard } from '@/components/billing-staff-dashboard'
import { ReceptionistDashboard } from '@/components/receptionist-dashboard'
import { PatientDashboard } from '@/components/patient-dashboard'

// Force dynamic rendering — dashboards read auth state from the browser (localStorage / Supabase session)
export const dynamic = 'force-dynamic'

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  const current = roles.find((item) => item.path.slice(1) === role)
  if (!current) notFound()

  if (role === 'admin') {
    return <AdminDashboard />
  }

  if (role === 'doctor') {
    return <DoctorDashboard />
  }

  if (role === 'nurse') {
    return <NurseDashboard />
  }

  if (role === 'medical-staff') {
    return <MedicineStaffDashboard />
  }

  if (role === 'billing') {
    return <BillingStaffDashboard />
  }

  if (role === 'receptionist') {
    return <ReceptionistDashboard />
  }

  if (role === 'patient') {
    return <PatientDashboard />
  }

  return <RoleDashboard roleSlug={role} />
}
