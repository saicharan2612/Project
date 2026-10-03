'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  APPOINTMENT_TIME_SLOTS,
  AppointmentRequest,
  BillingRecord,
  BillingRequest,
  BillRecord,
  EMPTY_ACCOUNT,
  DemoAccount,
  DoctorAvailability,
  getAllAccounts,
  getDemoAccountByRole,
  getDoctorAvailability,
  getStoredAppointments,
  getStoredBillingRequests,
  getStoredBillings,
  getStoredBills,
  getStoredDoctorAvailabilities,
  getStoredPatients,
  getStoredPayments,
  getStoredPrescriptions,
  PatientRecord,
  PaymentMethodType,
  PaymentRecord,
  PrescriptionRecord,
  saveAppointments,
  saveBillingRequests,
  saveBillings,
  saveBills,
  savePayments,
  savePrescriptions,
  addHospitalNotification
} from '@/lib/demo-accounts'
import { SettingsModal } from '@/components/settings-modal'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Info,
  Layers,
  LogOut,
  PackageCheck,
  Pill,
  Receipt,
  Send,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  Timer,
  UserCheck,
  Users,
  Zap
} from 'lucide-react'

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

function getDayOfWeekShort(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return ''
  const d = new Date(Date.UTC(year, month - 1, day))
  return WEEKDAYS_SHORT[d.getUTCDay()]
}

function getTodayIsoString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface RoleDashboardProps {
  roleSlug: string
}

export function RoleDashboard({ roleSlug }: RoleDashboardProps) {
  const router = useRouter()
  const defaultAccount = getDemoAccountByRole(roleSlug) || EMPTY_ACCOUNT
  const [currentUser, setCurrentUser] = useState<DemoAccount>(defaultAccount)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [allRoleAccounts, setAllRoleAccounts] = useState<DemoAccount[]>([])
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [doctorAvailabilities, setDoctorAvailabilities] = useState<Record<string, DoctorAvailability>>({})
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [billings, setBillings] = useState<BillingRecord[]>([])
  const [patientBills, setPatientBills] = useState<BillRecord[]>([])
  const [payingBill, setPayingBill] = useState<BillRecord | null>(null)
  const [patientPayMethod, setPatientPayMethod] = useState<PaymentMethodType>('UPI')
  const [patientTxnRef, setPatientTxnRef] = useState<string>('')
  
  const [bookingDoctorId, setBookingDoctorId] = useState('')
  const [bookingDate, setBookingDate] = useState(getTodayIsoString())
  const bookingDateRef = React.useRef<HTMLInputElement>(null)
  const [bookingTime, setBookingTime] = useState('')
  const [bookingVisitType, setBookingVisitType] = useState<AppointmentRequest['visitType']>('New Consultation')
  const [bookingReason, setBookingReason] = useState('')
  const [bookingError, setBookingError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const allAccs = getAllAccounts()
      setAllRoleAccounts(allAccs)
      setAppointments(getStoredAppointments())
      setPatients(getStoredPatients())
      setDoctorAvailabilities(getStoredDoctorAvailabilities())
      setPrescriptions(getStoredPrescriptions())
      setBillings(getStoredBillings())
      setPatientBills(getStoredBills())

      const firstDoctor = allAccs.find((acc) => acc.roleSlug === 'doctor')
      if (firstDoctor) setBookingDoctorId(firstDoctor.id)

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'carelink_bills') {
          setPatientBills(getStoredBills())
        }
      }
      window.addEventListener('storage', handleStorageChange)

      const stored = localStorage.getItem('carelink_user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as DemoAccount
          if (parsed && parsed.roleSlug === roleSlug) {
            setCurrentUser(parsed)
            return
          }
        } catch {
          // ignore parsing error
        }
      }
      const matched = getDemoAccountByRole(roleSlug)
      if (matched) {
        setCurrentUser(matched)
        localStorage.setItem('carelink_user', JSON.stringify(matched))
      }
    }
  }, [roleSlug])

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('carelink_user')
    }
    router.push('/sign-in')
  }

  const handleSwitchRole = (account: DemoAccount) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carelink_user', JSON.stringify(account))
    }
    setRoleMenuOpen(false)
    router.push(`/${account.roleSlug}`)
  }

  const triggerAction = (label: string) => {
    setActionFeedback(`Action simulated: "${label}" successfully processed for ${currentUser.name}.`)
    setTimeout(() => setActionFeedback(null), 4000)
  }

  const displayedSwitchers = allRoleAccounts
  const availableDoctors = displayedSwitchers.filter((acc) => acc.roleSlug === 'doctor')
  const myAppointments = appointments.filter(
    (appt) => appt.patientId === currentUser.id || appt.patientEmail === currentUser.email
  )

  // Selected doctor's availability
  const selectedDoctorAvailability = useMemo(() => {
    if (!bookingDoctorId) return null
    return getDoctorAvailability(bookingDoctorId)
  }, [bookingDoctorId, doctorAvailabilities])

  // Real-time queue for selected doctor
  const selectedDoctorQueue = useMemo(() => {
    if (!bookingDoctorId) return []
    const doc = availableDoctors.find((d) => d.id === bookingDoctorId)
    const docName = doc?.name.toLowerCase() || ''
    return patients.filter((p) => {
      const matchDoctor = p.assignedDoctor?.toLowerCase().includes(docName.split(' ')[1] || 'wright') || p.assignedDoctor?.toLowerCase().includes(docName)
      return matchDoctor && (p.status === 'waiting' || p.status === 'diagnosing' || p.status === 'registered')
    })
  }, [bookingDoctorId, patients, availableDoctors])

  const currentWaitingCount = selectedDoctorQueue.filter((p) => p.status === 'waiting' || p.status === 'registered').length
  const currentInConsultation = selectedDoctorQueue.find((p) => p.status === 'diagnosing')
  const estimatedQueueWaitMins = currentWaitingCount * 15

  // Calculate valid slots strictly based on doctor availability
  const validBookingSlots = useMemo(() => {
    if (!selectedDoctorAvailability || !selectedDoctorAvailability.isAvailable) return []
    if (!bookingDate) return []

    const selectedDay = getDayOfWeekShort(bookingDate)
    if (!selectedDoctorAvailability.availableDays.includes(selectedDay)) {
      return []
    }

    const docStartMins = parseTimeToMinutes(selectedDoctorAvailability.startTime)
    const docEndMins = parseTimeToMinutes(selectedDoctorAvailability.endTime)
    const breakStartMins = selectedDoctorAvailability.breakStartTime
      ? parseTimeToMinutes(selectedDoctorAvailability.breakStartTime)
      : null
    const breakEndMins = selectedDoctorAvailability.breakEndTime
      ? parseTimeToMinutes(selectedDoctorAvailability.breakEndTime)
      : null

    const todayIso = getTodayIsoString()
    const isToday = bookingDate === todayIso
    const now = new Date()
    const currentMinsNow = now.getHours() * 60 + now.getMinutes()

    return APPOINTMENT_TIME_SLOTS.filter((slot) => {
      const slotMins = parseTimeToMinutes(slot)
      // Must be within doctor's working hours
      if (slotMins < docStartMins || slotMins >= docEndMins) return false

      // Must not be within lunch / break hours
      if (breakStartMins !== null && breakEndMins !== null) {
        if (slotMins >= breakStartMins && slotMins < breakEndMins) return false
      }

      // If today, cannot book a past slot (e.g. before current time)
      if (isToday && slotMins <= currentMinsNow) return false

      return true
    })
  }, [selectedDoctorAvailability, bookingDate])

  // Automatically update bookingTime when valid slots change
  useEffect(() => {
    if (validBookingSlots.length > 0) {
      if (!bookingTime || !validBookingSlots.includes(bookingTime as any)) {
        setBookingTime(validBookingSlots[0])
      }
    } else {
      setBookingTime('')
    }
  }, [validBookingSlots, bookingTime])

  const handleBookAppointment = () => {
    setBookingError(null)
    const doctor = availableDoctors.find((acc) => acc.id === bookingDoctorId)
    if (!doctor) {
      setBookingError('Please select a doctor.')
      return
    }

    if (!selectedDoctorAvailability?.isAvailable) {
      setBookingError(`${doctor.name} is currently marked as unavailable/off-duty. Please select another doctor.`)
      return
    }

    if (!bookingDate) {
      setBookingError('Please choose a preferred appointment date.')
      return
    }

    const dayName = getDayOfWeekShort(bookingDate)
    if (!selectedDoctorAvailability.availableDays.includes(dayName)) {
      setBookingError(
        `${doctor.name} is not available on ${dayName}s. Available days: ${selectedDoctorAvailability.availableDays.join(
          ', '
        )}.`
      )
      return
    }

    if (!bookingTime || validBookingSlots.length === 0) {
      setBookingError('No available time slots within the doctorâ€™s working hours for the selected date.')
      return
    }

    if (!bookingReason.trim()) {
      setBookingError('Please provide a reason or symptom description for your appointment.')
      return
    }

    const request: AppointmentRequest = {
      id: `appt-${Date.now()}`,
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientEmail: currentUser.email,
      mrn: 'MRN-84920',
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.specialization || doctor.department,
      requestedDate: bookingDate,
      requestedTime: bookingTime,
      visitType: bookingVisitType,
      reason: bookingReason.trim(),
      status: 'pending',
      submittedAt: 'Just now'
    }
    const next = [request, ...getStoredAppointments()]
    saveAppointments(next)
    setAppointments(next)
    setBookingReason('')
    setActionFeedback(
      `Appointment requested with ${doctor.name} for ${bookingDate} at ${bookingTime}. Awaiting doctor confirmation.`
    )
    setTimeout(() => setActionFeedback(null), 5000)
  }

  const handlePatientSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingBill) return

    const txnId = patientTxnRef.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`

    // 1. Record Payment
    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      billId: payingBill.id,
      billNumber: payingBill.billNumber,
      patientId: payingBill.patientId,
      patientName: payingBill.patientName,
      amount: payingBill.finalAmount,
      paymentMethod: patientPayMethod,
      transactionRef: txnId,
      status: 'PAID',
      paidAt: new Date().toISOString(),
      collectedBy: 'Patient Self-Service (Online / Recorded)'
    }
    const currentPayments = getStoredPayments()
    savePayments([newPayment, ...currentPayments])

    // 2. Update Bill Status
    const allBills = getStoredBills()
    const updatedBills = allBills.map((b) => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          paymentStatus: 'PAID' as const,
          paidAt: new Date().toISOString(),
          paymentMethod: patientPayMethod,
          transactionRef: txnId,
          status: 'PAID' as const
        }
      }
      return b
    })
    saveBills(updatedBills)
    setPatientBills(updatedBills)

    // 3. Update associated Billing Request if exists
    if (payingBill.requestId) {
      const allReqs = getStoredBillingRequests()
      const updatedReqs = allReqs.map((r) => {
        if (r.id === payingBill.requestId) {
          return {
            ...r,
            status: 'PAID' as const
          }
        }
        return r
      })
      saveBillingRequests(updatedReqs)
    }

    // 4. Update associated Prescription if exists
    if (payingBill.prescriptionId) {
      const allRxs = getStoredPrescriptions()
      const updatedRxs = allRxs.map((rx) => {
        if (rx.id === payingBill.prescriptionId || rx.id === payingBill.prescriptionId.toLowerCase()) {
          return {
            ...rx,
            billingStatus: 'paid' as const,
            fulfillmentStatus: 'ready_to_collect' as const
          }
        }
        return rx
      })
      savePrescriptions(updatedRxs)
      setPrescriptions(updatedRxs)
    }

    // 5. Notify Billing Staff and Nurse
    addHospitalNotification({
      recipientRole: 'billing',
      title: 'Payment Received from Patient',
      message: `${payingBill.patientName} completed payment of â‚¹${payingBill.finalAmount.toLocaleString()} for Bill ${payingBill.billNumber} via ${patientPayMethod} (Ref: ${txnId}).`,
      type: 'PAYMENT_RECEIVED',
      referenceId: payingBill.id
    })

    addHospitalNotification({
      recipientRole: 'nurse',
      title: 'Payment Confirmed - Dispense Medicine',
      message: `Payment of â‚¹${payingBill.finalAmount.toLocaleString()} confirmed for ${payingBill.patientName} (${payingBill.billNumber}). Prescriptions are now READY FOR DISPENSING.`,
      type: 'DISPENSING_READY',
      referenceId: payingBill.prescriptionId || payingBill.id
    })

    setActionFeedback(`Payment of â‚¹${payingBill.finalAmount.toLocaleString()} for ${payingBill.billNumber} successfully processed! Prescriptions unlocked for nurse dispensing.`)
    setPayingBill(null)
    setPatientTxnRef('')
    setTimeout(() => setActionFeedback(null), 5000)
  }

  return (
    <div className="min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--care-border)] bg-[var(--care-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--care-primary)] text-white shadow-sm">
                <Activity className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
            </Link>

            <span className="hidden h-5 w-px bg-[var(--care-border)] md:block" />

            {/* Logged In User Pill */}
            <div className="flex items-center gap-2 rounded-lg border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--care-ink)]">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Role: <strong className="text-[var(--care-primary)] font-bold">{currentUser.roleLabel}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Pill */}
            <div className="hidden items-center gap-2.5 rounded-full border border-[var(--care-border)] bg-[var(--care-bg)] py-1 pl-1.5 pr-3 text-xs sm:flex">
              <span className="flex size-7 items-center justify-center rounded-full bg-[var(--care-primary)] font-bold text-white">
                {currentUser.avatarInitials}
              </span>
              <div className="text-left">
                <div className="font-semibold leading-none text-[var(--care-ink)]">{currentUser.name}</div>
                <div className="text-[10px] text-[var(--care-muted)] leading-none mt-1">{currentUser.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--care-ink)] transition hover:bg-[var(--care-highlight)]"
              title="Settings"
            >
              <Settings className="size-3.5 text-[var(--care-primary)]" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-200"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner with role credentials & badge */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm sm:p-8">
          <div className="absolute -right-8 -top-8 size-40 rounded-full bg-[var(--care-highlight)]/50 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--care-primary)] text-xl font-bold text-white shadow-md">
                {currentUser.avatarInitials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-[var(--care-ink)] sm:text-3xl">
                    {currentUser.name}
                  </h1>
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${currentUser.badgeColor}`}>
                    {currentUser.badge}
                  </span>
                  {currentUser.specialization && (
                    <span className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                      ðŸ©º {currentUser.specialization}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--care-muted)]">
                  {currentUser.title} Â· <span className="font-semibold text-[var(--care-ink)]">{currentUser.department}</span>
                </p>
                <p className="mt-3 max-w-3xl text-xs sm:text-sm leading-relaxed text-[var(--care-muted)]">
                  {currentUser.summary}
                </p>
              </div>
            </div>

            {/* Fast Switch Badges */}
            <div className="flex flex-col gap-2 rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4 shrink-0 lg:max-w-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--care-muted)] font-semibold">Role:</span>
                <span className="font-bold text-[var(--care-primary)]">{currentUser.roleLabel}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--care-muted)] font-semibold">Login Email:</span>
                <span className="font-mono text-[var(--care-ink)] text-[11px]">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--care-muted)] font-semibold">Session:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Active Session
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Simulated Notification */}
        {actionFeedback && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {roleSlug === 'patient' && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
              <div className="flex flex-col gap-1 border-b border-[var(--care-border)] pb-4">
                <h2 className="text-lg font-bold text-[var(--care-ink)]">Request Doctor Appointment</h2>
                <p className="text-xs text-[var(--care-muted)]">
                  Select a physician, check their hospital availability & current queue, and submit your consultation request.
                </p>
              </div>

              {bookingError && (
                <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                {/* Doctor Selection */}
                <label className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                  Select Physician
                  <select
                    value={bookingDoctorId}
                    onChange={(event) => setBookingDoctorId(event.target.value)}
                    className="h-11 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                  >
                    {availableDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Doctor Live Availability & Live Queue Card */}
                {selectedDoctorAvailability && (
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-blue-700" />
                        <span className="font-bold text-blue-950">{selectedDoctorAvailability.doctorName}</span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                          selectedDoctorAvailability.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {selectedDoctorAvailability.isAvailable ? 'â— Available in Clinic' : 'â—‹ Unavailable / Off-Duty'}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-blue-900">
                      <div>
                        <strong>Consultation Hours:</strong> {selectedDoctorAvailability.startTime} â€“ {selectedDoctorAvailability.endTime}
                      </div>
                      <div>
                        <strong>Available Days:</strong> {selectedDoctorAvailability.availableDays.join(', ')}
                      </div>
                      {selectedDoctorAvailability.breakStartTime && (
                        <div>
                          <strong>Physician Break:</strong> {selectedDoctorAvailability.breakStartTime} â€“ {selectedDoctorAvailability.breakEndTime}
                        </div>
                      )}
                      <div>
                        <strong>Clinic Room:</strong> {selectedDoctorAvailability.statusNote || 'OPD Room 204'}
                      </div>
                    </div>

                    {/* Live Patient Queue Badge for this Doctor */}
                    <div className="flex flex-wrap items-center justify-between rounded-xl bg-white p-3 border border-blue-200 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-[var(--care-primary)]" />
                        <span className="font-bold text-blue-950">Live Queue for This Doctor:</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-amber-900 font-bold">
                          {currentWaitingCount} {currentWaitingCount === 1 ? 'patient' : 'patients'} waiting
                        </span>
                        <span className="text-[11px] text-[var(--care-muted)]">
                          Est. wait ~{estimatedQueueWaitMins} mins
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date & Time selection */}
                <div className="grid gap-3 sm:grid-cols-2 items-start">
                  <div>
                    <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 text-xs">
                      Preferred Date (Interactive Calendar)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        ref={bookingDateRef}
                        type="date"
                        min={getTodayIsoString()}
                        value={bookingDate}
                        onChange={(event) => {
                          setBookingDate(event.target.value)
                          setBookingError(null)
                        }}
                        className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-3 pr-9 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            bookingDateRef.current?.showPicker()
                          } catch {
                            bookingDateRef.current?.focus()
                          }
                        }}
                        className="absolute right-2 flex size-7 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50 hover:text-teal-900 transition"
                        title="Click calendar to pick date"
                      >
                        <Calendar className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 text-xs">
                      Available Time Slot (Within Doctor Hours)
                    </label>
                    {validBookingSlots.length > 0 ? (
                      <select
                        value={bookingTime}
                        onChange={(event) => {
                          setBookingTime(event.target.value)
                          setBookingError(null)
                        }}
                        className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                      >
                        {validBookingSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex h-11 items-center rounded-xl border-2 border-red-300 bg-red-50 px-3 text-[11px] font-bold text-red-800">
                        {selectedDoctorAvailability && !selectedDoctorAvailability.availableDays.includes(getDayOfWeekShort(bookingDate))
                          ? `Doctor not available on ${getDayOfWeekShort(bookingDate)}s`
                          : 'No slots available for this date'}
                      </div>
                    )}
                  </div>
                </div>

                <label className="grid gap-1.5 text-xs font-bold text-slate-800">
                  Visit Type
                  <select
                    value={bookingVisitType}
                    onChange={(event) => setBookingVisitType(event.target.value as AppointmentRequest['visitType'])}
                    className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="New Consultation">New Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Telehealth">Telehealth (Remote Video)</option>
                    <option value="Post-op Review">Post-op Review</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-bold text-slate-800">
                  Reason for Visit & Symptoms
                  <textarea
                    value={bookingReason}
                    onChange={(event) => {
                      setBookingReason(event.target.value)
                      setBookingError(null)
                    }}
                    rows={3}
                    placeholder="Describe your current symptoms or reason for consulting the doctor..."
                    className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 placeholder:text-slate-400"
                  />
                </label>

                <button
                  type="button"
                  disabled={!selectedDoctorAvailability?.isAvailable || validBookingSlots.length === 0}
                  onClick={handleBookAppointment}
                  className="h-11 rounded-xl bg-teal-600 text-xs font-black text-white shadow-md hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
                >
                  Submit Appointment Request
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[var(--care-ink)]">Your requests</h2>
              <div className="mt-4 space-y-3">
                {myAppointments.length === 0 && (
                  <p className="text-sm text-[var(--care-muted)]">No appointment requests yet.</p>
                )}
                {myAppointments.map((appt) => (
                  <div key={appt.id} className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--care-ink)]">{appt.doctorName}</p>
                      <span className="rounded-md bg-[var(--care-highlight)] px-2 py-0.5 text-[10px] font-bold uppercase">
                        {appt.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--care-muted)]">
                      Requested {appt.requestedDate} at {appt.requestedTime}
                    </p>
                    {appt.status === 'rescheduled' && appt.rescheduledDate && (
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        Doctor offered {appt.rescheduledDate} at {appt.rescheduledTime}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PATIENT VIEW: Electronic Prescriptions & Medication Timetable */}
        {roleSlug === 'patient' && (
          <section className="mt-8 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-emerald-50/50 to-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-teal-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
                  <Pill className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-teal-950">
                    Your Digital Prescriptions & Daily Medication Timetable
                  </h2>
                  <p className="text-xs text-teal-800">
                    Shared directly by your Attending Nurse & Physician during clinic consultation
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-teal-100 border border-teal-300 px-3 py-1 text-xs font-bold text-teal-900 self-start sm:self-auto">
                {prescriptions.filter((rx) => rx.sharedWithPatient).length} Active Prescriptions
              </span>
            </div>

            {prescriptions.filter((rx) => rx.sharedWithPatient).length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-teal-200 bg-white/70 p-8 text-center text-xs text-teal-800">
                <FileText className="mx-auto size-8 text-teal-400 mb-2" />
                No active electronic prescriptions logged yet. They will appear here once written by the Nurse during your consult.
              </div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {prescriptions
                  .filter((rx) => rx.sharedWithPatient)
                  .map((rx) => {
                    const isDispensed = rx.status === 'dispensed'
                    const isReadyToCollect = isDispensed || rx.fulfillmentStatus === 'ready_to_collect'
                    const isPacked = rx.isReady
                    const isPaid = rx.billingStatus === 'paid'

                    return (
                      <div
                        key={rx.id}
                        className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition ${
                          isReadyToCollect
                            ? 'border-emerald-300 bg-linear-to-b from-emerald-50/60 via-white to-white ring-2 ring-emerald-400/30'
                            : isPacked
                            ? 'border-indigo-200 bg-white'
                            : 'border-teal-200 bg-white'
                        }`}
                      >
                        <div>
                          {/* Live Collection Banner if ready to collect */}
                          {isReadyToCollect && (
                            <div className="mb-3.5 rounded-xl bg-emerald-600 p-3 text-white shadow-md flex items-center gap-3">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 font-bold">
                                ðŸ””
                              </span>
                              <div>
                                <p className="text-xs font-black">
                                  ðŸŽ‰ Medicines Ready for Collection!
                                </p>
                                <p className="text-[11px] text-emerald-100">
                                  Please proceed to <strong>{rx.pickupCounter || 'Pharmacy Counter #2 (Main OPD)'}</strong>
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2 border-b border-[var(--care-border)] pb-3">
                            <div>
                              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-900">
                                Rx #{rx.id.toUpperCase()}
                              </span>
                              <h3 className="mt-1 text-sm font-bold text-[var(--care-ink)]">{rx.diagnosis}</h3>
                              <p className="text-[11px] text-[var(--care-muted)]">
                                By {rx.nurseName} Â· {rx.doctorName}
                              </p>
                            </div>
                            
                            {/* Pharmacy & Dispensing Status Pill */}
                            <div>
                              {isReadyToCollect ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                  <Check className="size-3" />
                                  Ready to Collect
                                </span>
                              ) : isPaid ? (
                                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-900 border border-indigo-200">
                                  Paid Â· Handover in Prep
                                </span>
                              ) : isPacked ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                  Packed Â· Awaiting Bill Settle
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                                  Order in Pharmacy Queue
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Vitals Recorded */}
                          {rx.vitals && (
                            <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-[10px]">
                              <div>
                                <p className="text-[var(--care-muted)] font-semibold">BP</p>
                                <p className="font-bold text-[var(--care-ink)]">{rx.vitals.bloodPressure || '120/80'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--care-muted)] font-semibold">HR</p>
                                <p className="font-bold text-[var(--care-ink)]">{rx.vitals.heartRate || '75 bpm'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--care-muted)] font-semibold">SpO2</p>
                                <p className="font-bold text-[var(--care-ink)]">{rx.vitals.spO2 || '99%'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--care-muted)] font-semibold">Temp</p>
                                <p className="font-bold text-[var(--care-ink)]">{rx.vitals.temperature || '98.6 Â°F'}</p>
                              </div>
                            </div>
                          )}

                          {/* Medication Timetable */}
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-bold text-[var(--care-ink)] flex items-center gap-1.5">
                              <Clock className="size-3.5 text-teal-600" />
                              Medication Schedule & Timings:
                            </p>
                            <div className="space-y-2">
                              {rx.medications.map((med) => (
                                <div
                                  key={med.id}
                                  className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)]/60 p-3 text-xs"
                                >
                                  <div className="flex items-center justify-between font-bold text-[var(--care-ink)]">
                                    <span>
                                      {med.name} ({med.dosage} - {med.form})
                                    </span>
                                    <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] text-teal-900 font-extrabold">
                                      {med.durationDays} Days
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="rounded bg-white px-2 py-0.5 font-bold text-teal-800 border border-teal-200">
                                      ðŸ•’ {med.scheduleTimes.join(', ')}
                                    </span>
                                    <span className="rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-900 border border-amber-200">
                                      ðŸ½ï¸ {med.timingInstructions}
                                    </span>
                                    <span className="text-[var(--care-muted)]">({med.frequency})</span>
                                  </div>
                                  {med.instructions && (
                                    <p className="mt-1.5 text-[11px] text-[var(--care-muted)] italic">
                                      "{med.instructions}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {rx.nurseNotes && (
                          <div className="mt-3 rounded-xl bg-teal-50/70 p-2.5 text-[11px] text-teal-950 border border-teal-200/60">
                            <strong>Nurse Instructions:</strong> {rx.nurseNotes}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </section>
        )}

        {/* PATIENT VIEW: Medical Bills & Invoices from Billing Staff */}
        {roleSlug === 'patient' && (
          <section className="mt-8 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-sky-50/50 to-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-blue-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                  <Receipt className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-blue-950">
                    Your Medical Bills & Hospital Invoices
                  </h2>
                  <p className="text-xs text-blue-800">
                    Generated by Billing Staff based on Nurse prescriptions. Pay online or record payment to unlock medication dispensing.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-xs font-bold text-blue-900 self-start sm:self-auto">
                {patientBills.filter((b) => b.isSharedWithPatient || b.patientId === currentUser.id).length} Shared Bills
              </span>
            </div>

            {patientBills.filter((b) => b.isSharedWithPatient || b.patientId === currentUser.id).length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-white/70 p-8 text-center text-xs text-blue-800">
                <CreditCard className="mx-auto size-8 text-blue-400 mb-2" />
                No active hospital bills currently shared with your profile. When your attending Nurse sends your prescription to Billing Staff, your itemized invoice will appear here.
              </div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {patientBills
                  .filter((b) => b.isSharedWithPatient || b.patientId === currentUser.id)
                  .map((bill) => {
                    const isPaid = bill.paymentStatus === 'PAID'
                    return (
                      <div
                        key={bill.id}
                        className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition ${
                          isPaid
                            ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/50 via-white to-white ring-1 ring-emerald-400/20'
                            : 'border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white ring-1 ring-amber-400/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 border-b border-[var(--care-border)] pb-3">
                            <div>
                              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-900">
                                {bill.billNumber}
                              </span>
                              <h3 className="mt-1 text-sm font-bold text-[var(--care-ink)]">
                                Prescription Bill Â· {bill.prescriptionId}
                              </h3>
                              <p className="text-[11px] text-[var(--care-muted)]">
                                Issued by {bill.createdBy} Â· Nurse: {bill.nurseName}
                              </p>
                            </div>

                            <div>
                              {isPaid ? (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="size-3 text-emerald-700" />
                                  PAID
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <Clock className="size-3 text-amber-700" />
                                  PAYMENT PENDING
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Medicine Line Items */}
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-bold text-[var(--care-ink)] flex items-center gap-1.5">
                              <Pill className="size-3.5 text-blue-600" />
                              Itemized Medicine Charges:
                            </p>
                            <div className="rounded-xl border border-[var(--care-border)] overflow-hidden bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-[var(--care-border)]">
                                  <tr>
                                    <th className="px-3 py-1.5">Medicine</th>
                                    <th className="px-2 py-1.5 text-center">Qty</th>
                                    <th className="px-2 py-1.5 text-right">Unit Price</th>
                                    <th className="px-3 py-1.5 text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {bill.medicines.map((m) => (
                                    <tr key={m.id}>
                                      <td className="px-3 py-2 font-medium text-slate-900">{m.name}</td>
                                      <td className="px-2 py-2 text-center text-slate-600 font-semibold">{m.quantity}</td>
                                      <td className="px-2 py-2 text-right text-slate-600">â‚¹{m.unitPrice}</td>
                                      <td className="px-3 py-2 text-right font-bold text-slate-900">â‚¹{m.total}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Calculation Breakdown */}
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 space-y-1 text-xs border border-slate-200">
                            <div className="flex justify-between text-slate-600">
                              <span>Subtotal:</span>
                              <span className="font-semibold">â‚¹{bill.subtotal.toLocaleString()}</span>
                            </div>
                            {bill.discount > 0 && (
                              <div className="flex justify-between text-emerald-700">
                                <span>Hospital Discount:</span>
                                <span className="font-semibold">- â‚¹{bill.discount.toLocaleString()}</span>
                              </div>
                            )}
                            {bill.tax > 0 && (
                              <div className="flex justify-between text-slate-600">
                                <span>GST / Taxes:</span>
                                <span className="font-semibold">+ â‚¹{bill.tax.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5 mt-1">
                              <span>Total Amount Payable:</span>
                              <span className="text-blue-900 text-base">â‚¹{bill.finalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 pt-3 border-t border-[var(--care-border)] flex items-center justify-between">
                          {isPaid ? (
                            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="size-4 text-emerald-600" />
                              <span>Paid via {bill.paymentMethod || 'UPI'} on {new Date(bill.paidAt || bill.createdAt).toLocaleDateString()} (Ref: {bill.transactionRef || 'TXN-PAID'})</span>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-amber-800">
                                Settle bill to notify nurse for instant medication handover
                              </p>
                              <button
                                type="button"
                                onClick={() => setPayingBill(bill)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 active:scale-95"
                              >
                                <CreditCard className="size-3.5" />
                                <span>Pay â‚¹{bill.finalAmount.toLocaleString()} Now</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </section>
        )}

        {/* MEDICAL STAFF (PHARMACY) VIEW: Nurse Dispatched Prescriptions Queue */}
        {roleSlug === 'medical-staff' && (
          <section className="mt-8 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                  <PackageCheck className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-indigo-950">
                    Nurse-Dispatched Digital Prescriptions & Pharmacy Dispense Queue
                  </h2>
                  <p className="text-xs text-indigo-800">
                    Live electronic prescriptions shared by Nurse Station for medication packaging & dispensing
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 border border-indigo-300 px-3 py-1 text-xs font-bold text-indigo-900 self-start sm:self-auto">
                {prescriptions.filter((rx) => rx.sharedWithPharmacy).length} Orders in Pharmacy Queue
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {prescriptions
                .filter((rx) => rx.sharedWithPharmacy)
                .map((rx) => (
                  <div
                    key={rx.id}
                    className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-[var(--care-border)] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--care-ink)]">{rx.patientName}</span>
                            <span className="font-mono text-[10px] text-[var(--care-muted)]">{rx.mrn}</span>
                          </div>
                          <p className="text-xs text-indigo-900 font-semibold mt-0.5">Diagnosis: {rx.diagnosis}</p>
                          <p className="text-[11px] text-[var(--care-muted)]">
                            Dispatched by Nurse {rx.nurseName} Â· {rx.doctorName}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            rx.status === 'dispensed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {rx.status === 'dispensed' ? 'Dispensed & Verified' : 'Awaiting Dispense'}
                        </span>
                      </div>

                      {/* Prescribed Items Schedule */}
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold text-[var(--care-ink)]">Medications to Dispense:</p>
                        <div className="space-y-1.5">
                          {rx.medications.map((med) => (
                            <div
                              key={med.id}
                              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-[var(--care-border)]"
                            >
                              <div>
                                <span className="font-bold text-[var(--care-ink)]">
                                  {med.name} {med.dosage}
                                </span>
                                <span className="ml-2 text-[11px] text-[var(--care-muted)]">
                                  ({med.form} Â· {med.durationDays} days supply)
                                </span>
                                <div className="text-[11px] text-indigo-900 mt-0.5">
                                  Schedule: <strong>{med.scheduleTimes.join(', ')}</strong> ({med.timingInstructions})
                                </div>
                              </div>
                              <span className="font-mono text-[10px] rounded bg-indigo-100 px-2 py-0.5 text-indigo-900 font-bold">
                                {med.frequency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--care-border)] pt-3">
                      <span className="text-[11px] text-[var(--care-muted)]">Transmitted {rx.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = prescriptions.map((item) =>
                            item.id === rx.id
                              ? {
                                  ...item,
                                  status: (item.status === 'dispensed' ? 'active' : 'dispensed') as PrescriptionRecord['status']
                                }
                              : item
                          )
                          setPrescriptions(updated)
                          savePrescriptions(updated)
                          triggerAction(`Prescription ${rx.id} status updated`)
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs transition ${
                          rx.status === 'dispensed'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <Check className="size-3.5" />
                        <span>{rx.status === 'dispensed' ? 'Re-open Order' : 'Mark Dispensed'}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Billing Staff: Prescription & Clinical Invoicing Queue */}
        {roleSlug === 'billing-staff' && (
          <section className="mt-8 rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 via-white to-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <Receipt className="size-3.5" />
                  Synchronized Billing Stream
                </span>
                <h2 className="mt-2 text-xl font-bold text-emerald-950">Medication & Care Invoicing Queue</h2>
                <p className="text-sm text-slate-600">
                  Real-time invoice generation synchronized directly from Nurse Prescriptions & Doctor Consultations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  {billings.filter((b) => b.status === 'pending').length} Pending Invoices
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {billings.map((bill) => {
                const linkedRx = prescriptions.find(
                  (p) => p.patientName === bill.patientName || bill.id.includes(p.id) || p.mrn === bill.mrn
                )

                return (
                  <div
                    key={bill.id}
                    className={`rounded-2xl border p-5 transition ${
                      bill.status === 'paid'
                        ? 'border-emerald-200 bg-emerald-50/40 opacity-85'
                        : 'border-emerald-200/80 bg-white shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{bill.id}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              bill.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-[var(--care-ink)]">{bill.patientName}</h3>
                        <p className="text-xs text-[var(--care-muted)]">
                          Provider: <strong>{bill.providerName}</strong> ({bill.providerRole})
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-[var(--care-muted)]">Total Amount</div>
                        <div className="text-xl font-black text-emerald-700 font-mono">${bill.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Pharmacy Readiness Status */}
                    {linkedRx && (
                      <div className="mt-3">
                        {linkedRx.status === 'dispensed' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                            âœ“ Dispensed & Collected at {linkedRx.pickupCounter || 'Counter #2'}
                          </span>
                        ) : linkedRx.isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900 border border-emerald-300">
                            ðŸŸ¢ Medicines Packed & Ready for Payment Settle
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200">
                            â³ Pharmacy Preparing Medications
                          </span>
                        )}
                      </div>
                    )}

                    {/* Line items */}
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Billable Items ({bill.items ? bill.items.length : 0})
                      </div>
                      <div className="space-y-1.5">
                        {bill.items &&
                          bill.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 truncate max-w-[200px] sm:max-w-[260px]">{item.description}</span>
                              <span className="font-mono font-semibold text-slate-900">${item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--care-border)] pt-3">
                      <span className="text-[11px] text-[var(--care-muted)]">Issued {bill.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isNowPaid = bill.status !== 'paid'
                          const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                          // Update Billing Record
                          const updatedBillings = billings.map((b) =>
                            b.id === bill.id
                              ? {
                                  ...b,
                                  status: (isNowPaid ? 'paid' : 'pending') as BillingRecord['status'],
                                  paidAt: isNowPaid ? timeString : undefined
                                }
                              : b
                          )
                          setBillings(updatedBillings)
                          saveBillings(updatedBillings)

                          // Cross-sync linked prescription
                          if (linkedRx) {
                            const updatedRx = prescriptions.map((p) =>
                              p.id === linkedRx.id
                                ? {
                                    ...p,
                                    billingStatus: (isNowPaid ? 'paid' : 'pending') as PrescriptionRecord['billingStatus'],
                                    billPaidAt: isNowPaid ? `Today at ${timeString}` : undefined
                                  }
                                : p
                            )
                            setPrescriptions(updatedRx)
                            savePrescriptions(updatedRx)
                          }

                          triggerAction(
                            isNowPaid
                              ? `Invoice for ${bill.patientName} settled ($${bill.totalAmount.toFixed(2)}). Medicine Staff notified: READY TO DISPENSE!`
                              : `Invoice for ${bill.patientName} re-opened.`
                          )
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs transition ${
                          bill.status === 'paid'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <DollarSign className="size-3.5" />
                        <span>{bill.status === 'paid' ? 'Re-open Claim' : 'Approve & Settle Invoice (Notify Pharmacy)'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Operational Stats Grid */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--care-ink)] flex items-center gap-2">
              <Zap className="size-4 text-[var(--care-primary)]" />
              Live Operational Metrics
            </h2>
            <span className="text-xs text-[var(--care-muted)]">Updated just now</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentUser.stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs font-medium text-[var(--care-muted)]">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--care-ink)]">{stat.value}</p>
                {stat.change && (
                  <p className={`mt-1.5 text-xs font-semibold ${
                    stat.tone === 'positive'
                      ? 'text-emerald-600'
                      : stat.tone === 'warning'
                      ? 'text-amber-600'
                      : 'text-[var(--care-muted)]'
                  }`}>
                    {stat.change}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Two-Column Section: Activities & Quick Actions */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Recent Role Activities */}
          <section className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[var(--care-primary)]" />
                <h3 className="font-bold text-[var(--care-ink)] text-sm sm:text-base">
                  Recent Activities & Workflow Log
                </h3>
              </div>
              <span className="rounded-md bg-[var(--care-highlight)] px-2 py-0.5 text-[11px] font-semibold text-[var(--care-ink)]">
                Real-time
              </span>
            </div>

            <div className="space-y-3">
              {currentUser.recentActivities.map((act, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)]/60 p-3.5 transition hover:bg-[var(--care-highlight)]/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 size-2 rounded-full bg-[var(--care-primary)] shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[var(--care-ink)]">{act.title}</p>
                      <p className="text-xs text-[var(--care-muted)] mt-0.5">{act.subtitle}</p>
                      <span className="text-[10px] text-[var(--care-muted)] mt-1 inline-block font-mono">
                        {act.time}
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${act.statusColor}`}>
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Role Actions & Permissions */}
          <div className="space-y-6">
            {/* Quick Actions Panel */}
            <section className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[var(--care-border)] pb-4 mb-4">
                <Sparkles className="size-4 text-[var(--care-primary)]" />
                <h3 className="font-bold text-[var(--care-ink)] text-sm sm:text-base">
                  Quick Actions
                </h3>
              </div>

              <div className="space-y-2.5">
                {currentUser.quickActions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => triggerAction(action.label)}
                    className="group flex w-full items-center justify-between rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3 text-left transition hover:border-[var(--care-primary)] hover:bg-[var(--care-highlight)]"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[var(--care-ink)] group-hover:text-[var(--care-primary-dark)]">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-[var(--care-muted)] mt-0.5">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-[var(--care-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--care-primary)] shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </section>

            {/* Role Permissions Card */}
            <section className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[var(--care-border)] pb-4 mb-4">
                <Shield className="size-4 text-[var(--care-primary)]" />
                <h3 className="font-bold text-[var(--care-ink)] text-sm sm:text-base">
                  Authorized Role Permissions
                </h3>
              </div>

              <ul className="space-y-2">
                {currentUser.permissions.map((perm, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--care-muted)]">
                    <CheckCircle2 className="size-3.5 text-[var(--care-primary)] shrink-0 mt-0.5" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>


        {/* Patient Payment Modal */}
        {payingBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-900">
                    {payingBill.billNumber}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">Make Patient Payment</h3>
                  <p className="text-xs text-slate-500">Pay medical prescription charges for dispensing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  âœ•
                </button>
              </div>

              <form onSubmit={handlePatientSubmitPayment} className="mt-4 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Patient:</span>
                    <span className="font-bold text-slate-900">{payingBill.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600">Prescription:</span>
                    <span className="font-mono text-xs font-bold text-slate-700">{payingBill.prescriptionId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600">Total Items:</span>
                    <span className="font-semibold text-slate-800">{payingBill.medicines.length} Medicines</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-black text-slate-900 border-t border-slate-200 mt-2 pt-2">
                    <span>Payable Amount:</span>
                    <span className="text-xl text-blue-900">â‚¹{payingBill.finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'Card', 'Cash'] as PaymentMethodType[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPatientPayMethod(method)}
                        className={`flex flex-col items-center justify-center rounded-xl p-3 text-xs font-bold transition border ${
                          patientPayMethod === method
                            ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base mb-1">
                          {method === 'UPI' ? 'ðŸ“±' : method === 'Card' ? 'ðŸ’³' : 'ðŸ’µ'}
                        </span>
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {patientPayMethod === 'UPI' && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 text-xs">
                    <p className="font-bold text-teal-950 flex items-center gap-1.5">
                      <span>ðŸ“± UPI QR & VPA:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-teal-200 text-teal-900">carelink.hospital@upi</span>
                    </p>
                    <p className="text-[11px] text-teal-800 mt-1">
                      Scan via Google Pay, PhonePe, Paytm or BHIM UPI app and enter the transaction reference ID below.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction / Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-948294829 or Cash Receipt #"
                    value={patientTxnRef}
                    onChange={(e) => setPatientTxnRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPayingBill(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Confirm & Complete Payment (₹{payingBill.finalAmount.toLocaleString()})</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currentUser={currentUser}
        />
      </main>
    </div>
  )
}
