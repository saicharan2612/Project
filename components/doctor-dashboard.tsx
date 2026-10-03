'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  APPOINTMENT_TIME_SLOTS,
  AppointmentRequest,
  DEFAULT_DOCTOR_AVAILABILITY,
  EMPTY_ACCOUNT,
  DemoAccount,
  DoctorAvailability,
  getAllAccounts,
  getDemoAccountByRole,
  getDoctorAvailability,
  getStoredAppointments,
  getStoredPatients,
  INITIAL_APPOINTMENTS,
  INITIAL_PATIENTS,
  PatientRecord,
  saveAppointments,
  saveDoctorAvailability,
  savePatients
} from '@/lib/demo-accounts'
import { SettingsModal } from '@/components/settings-modal'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Clock3,
  DoorOpen,
  FileCheck,
  FileText,
  Filter,
  HeartPulse,
  History,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Stethoscope,
  Timer,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap
} from 'lucide-react'

type DoctorTab =
  | 'overview'
  | 'requests'
  | 'patient-queue'
  | 'availability'
  | 'reschedule-center'
  | 'schedule'
  | 'patients'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ALL_WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDisplayDate(isoDate: string) {
  if (!isoDate) return 'Unscheduled'
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsed.getTime())) return isoDate
  return `${WEEKDAYS[parsed.getUTCDay()]}, ${MONTHS[month - 1]} ${day}, ${year}`
}

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

function formatMinutesToTimeString(minutes: number): string {
  const hours24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const formattedHours = hours12 < 10 ? `0${hours12}` : `${hours12}`
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`
  return `${formattedHours}:${formattedMins} ${period}`
}

function getTodayIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function statusClasses(status: AppointmentRequest['status']) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (status === 'rescheduled') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-blue-100 text-blue-800 border-blue-200'
}

function visitTypeBadgeClass(visitType: AppointmentRequest['visitType']) {
  switch (visitType) {
    case 'New Consultation':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Follow-up':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Telehealth':
      return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'Post-op Review':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function DoctorDashboard() {
  const router = useRouter()
  const defaultAccount = getDemoAccountByRole('doctor') || EMPTY_ACCOUNT
  const [currentUser, setCurrentUser] = useState<DemoAccount>(defaultAccount)
  const [allRoleAccounts, setAllRoleAccounts] = useState<DemoAccount[]>([])
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DoctorTab>('requests')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [appointments, setAppointments] = useState<AppointmentRequest[]>(INITIAL_APPOINTMENTS)
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS)
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentRequest['status']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bannerNotice, setBannerNotice] = useState<{ message: string; type?: 'success' | 'info' | 'warning' } | null>(
    null
  )

  // Doctor Availability & Clinic Hours State
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability>(DEFAULT_DOCTOR_AVAILABILITY)
  const [availIsActive, setAvailIsActive] = useState(true)
  const [availDays, setAvailDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [availStartTime, setAvailStartTime] = useState('09:00 AM')
  const [availEndTime, setAvailEndTime] = useState('05:00 PM')
  const [availBreakStart, setAvailBreakStart] = useState('01:00 PM')
  const [availBreakEnd, setAvailBreakEnd] = useState('02:00 PM')
  const [availStatusNote, setAvailStatusNote] = useState('Consulting in OPD Clinic Room 204 (Cardiology)')

  // Walk-in Patient Modal State
  const [showWalkinModal, setShowWalkinModal] = useState(false)
  const [walkinName, setWalkinName] = useState('')
  const [walkinAge, setWalkinAge] = useState('42')
  const [walkinGender, setWalkinGender] = useState<'Female' | 'Male' | 'Other'>('Female')
  const [walkinSymptoms, setWalkinSymptoms] = useState('')
  const [walkinPriority, setWalkinPriority] = useState<'Normal' | 'Urgent' | 'STAT'>('Normal')

  // Side panel drawer for appointment details & instant reschedule/approval
  const [drawerAppointment, setDrawerAppointment] = useState<AppointmentRequest | null>(null)

  // Reschedule form state
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentRequest | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState(getTodayIso())
  const rescheduleDateRef = React.useRef<HTMLInputElement>(null)
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleNote, setRescheduleNote] = useState('')
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  // Live Clock for slot availability cutoffs
  const [liveClockMinutes, setLiveClockMinutes] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  // Keep live clock updated
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date()
      setLiveClockMinutes(d.getHours() * 60 + d.getMinutes())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Load accounts, appointments, patients, and doctor availability
  useEffect(() => {
    const allAccs = getAllAccounts()
    setAllRoleAccounts(allAccs)
    setAppointments(getStoredAppointments())
    setPatients(getStoredPatients())

    const storedAvail = getDoctorAvailability('demo-doctor')
    setDoctorAvailability(storedAvail)
    setAvailIsActive(storedAvail.isAvailable)
    setAvailDays(storedAvail.availableDays)
    setAvailStartTime(storedAvail.startTime)
    setAvailEndTime(storedAvail.endTime)
    setAvailBreakStart(storedAvail.breakStartTime || '01:00 PM')
    setAvailBreakEnd(storedAvail.breakEndTime || '02:00 PM')
    setAvailStatusNote(storedAvail.statusNote || 'Consulting in OPD Clinic Room 204 (Cardiology)')

    const stored = localStorage.getItem('carelink_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DemoAccount
        if (parsed && parsed.roleSlug === 'doctor') {
          setCurrentUser(parsed)
          return
        }
      } catch {
        // ignore parsing error
      }
    }

    const matched = getDemoAccountByRole('doctor')
    if (matched) {
      setCurrentUser(matched)
      localStorage.setItem('carelink_user', JSON.stringify(matched))
    }
  }, [])

  const effectiveCurrentMinutes = liveClockMinutes
  const effectiveCurrentTimeDisplay = formatMinutesToTimeString(effectiveCurrentMinutes)
  const todayIso = getTodayIso()

  const showNotice = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setBannerNotice({ message, type })
    window.setTimeout(() => setBannerNotice(null), 5000)
  }

  const persistAppointments = (next: AppointmentRequest[]) => {
    setAppointments(next)
    saveAppointments(next)
  }

  const persistPatients = (next: PatientRecord[]) => {
    setPatients(next)
    savePatients(next)
  }

  const handleSignOut = () => {
    localStorage.removeItem('carelink_user')
    router.push('/sign-in')
  }

  const handleSwitchRole = (account: DemoAccount) => {
    localStorage.setItem('carelink_user', JSON.stringify(account))
    setRoleMenuOpen(false)
    router.push(`/${account.roleSlug}`)
  }

  // Filter appointments for this doctor
  const doctorAppointments = useMemo(() => {
    return appointments.filter(
      (appt) =>
        appt.doctorId === currentUser.id ||
        appt.doctorName.toLowerCase().includes(currentUser.name.split(',')[0].toLowerCase()) ||
        !appt.doctorId
    )
  }, [appointments, currentUser])

  const pendingCount = doctorAppointments.filter((appt) => appt.status === 'pending').length
  const approvedCount = doctorAppointments.filter((appt) => appt.status === 'approved').length
  const rescheduledCount = doctorAppointments.filter((appt) => appt.status === 'rescheduled').length

  // Filtered appointments based on active tab, search, and status filter
  const visibleAppointments = useMemo(() => {
    return doctorAppointments.filter((appt) => {
      if (activeTab === 'schedule' && appt.status === 'pending') return false

      if (activeTab === 'requests' && statusFilter !== 'all' && appt.status !== statusFilter) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = appt.patientName.toLowerCase().includes(q)
        const matchesMrn = appt.mrn?.toLowerCase().includes(q)
        const matchesReason = appt.reason.toLowerCase().includes(q)
        const matchesVisitType = appt.visitType.toLowerCase().includes(q)
        return matchesName || matchesMrn || matchesReason || matchesVisitType
      }

      return true
    })
  }, [doctorAppointments, activeTab, statusFilter, searchQuery])

  // --- PATIENT QUEUE CALCULATIONS & MANAGEMENT ---
  const doctorQueuePatients = useMemo(() => {
    const docName = currentUser.name.toLowerCase()
    return patients.filter((p) => {
      const matchDoc =
        p.assignedDoctor?.toLowerCase().includes('wright') ||
        p.assignedDoctor?.toLowerCase().includes(docName.split(' ')[1] || 'wright') ||
        p.department.toLowerCase().includes('cardio')
      return matchDoc
    })
  }, [patients, currentUser])

  const inRoomPatient = doctorQueuePatients.find((p) => p.status === 'diagnosing')
  const waitingQueue = doctorQueuePatients.filter((p) => p.status === 'waiting' || p.status === 'registered')
  const completedQueue = doctorQueuePatients.filter((p) => p.status === 'completed')
  const estimatedQueueWaitTotal = waitingQueue.length * 15

  // Call Next Patient in Queue
  const handleCallNextPatient = () => {
    if (waitingQueue.length === 0) {
      showNotice('No more patients waiting in queue!', 'info')
      return
    }

    const nextPatient = waitingQueue[0]
    const updated = patients.map((p) => {
      // If there was a patient already diagnosing, complete them
      if (p.id === inRoomPatient?.id) {
        return {
          ...p,
          status: 'completed' as const,
          completedTime: effectiveCurrentTimeDisplay,
          notes: p.notes || 'Consultation finished by Dr. Alexander Wright'
        }
      }
      // Set the next patient to diagnosing
      if (p.id === nextPatient.id) {
        return {
          ...p,
          status: 'diagnosing' as const,
          assignedDoctor: currentUser.name
        }
      }
      return p
    })

    persistPatients(updated)
    showNotice(
      `Called Token #${waitingQueue[0].mrn.slice(-2)}: ${nextPatient.name} into Consultation Room!`,
      'success'
    )
  }

  // Call Specific Patient
  const handleCallSpecificPatient = (patient: PatientRecord) => {
    const updated = patients.map((p) => {
      if (p.id === inRoomPatient?.id) {
        return {
          ...p,
          status: 'completed' as const,
          completedTime: effectiveCurrentTimeDisplay
        }
      }
      if (p.id === patient.id) {
        return {
          ...p,
          status: 'diagnosing' as const,
          assignedDoctor: currentUser.name
        }
      }
      return p
    })
    persistPatients(updated)
    showNotice(`Called ${patient.name} (${patient.mrn}) into Consultation Room!`, 'success')
  }

  // Complete Active Patient Consultation
  const handleCompleteActiveConsultation = (patientId: string) => {
    const updated = patients.map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'completed' as const,
          completedTime: effectiveCurrentTimeDisplay,
          notes: 'Consultation concluded. Prescriptions issued.'
        }
      }
      return p
    })
    persistPatients(updated)
    showNotice(`Consultation completed for ${inRoomPatient?.name}. Room is now free.`, 'success')
  }

  // Quick Add Walk-in Patient to Queue
  const handleAddWalkinToQueue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkinName.trim()) return

    const newPatient: PatientRecord = {
      id: `pt-${Date.now()}`,
      mrn: `MRN-${Math.floor(80000 + Math.random() * 19000)}`,
      name: walkinName.trim(),
      age: parseInt(walkinAge) || 35,
      gender: walkinGender,
      registeredTime: effectiveCurrentTimeDisplay,
      status: 'waiting',
      department: 'Cardiology',
      assignedDoctor: currentUser.name,
      symptoms: walkinSymptoms.trim() || 'Walk-in cardiology consultation',
      triagePriority: walkinPriority,
      notes: 'Direct queue entry by physician'
    }

    const updated = [newPatient, ...patients]
    persistPatients(updated)
    setShowWalkinModal(false)
    setWalkinName('')
    setWalkinSymptoms('')
    showNotice(`Walk-in patient ${newPatient.name} added to live queue!`, 'success')
  }

  // Save Updated Doctor Availability
  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault()
    if (availDays.length === 0) {
      showNotice('Please select at least one available day of the week.', 'warning')
      return
    }

    const updated: DoctorAvailability = {
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      isAvailable: availIsActive,
      availableDays: availDays,
      startTime: availStartTime,
      endTime: availEndTime,
      breakStartTime: availBreakStart,
      breakEndTime: availBreakEnd,
      statusNote: availStatusNote.trim(),
      lastUpdated: 'Just now'
    }

    setDoctorAvailability(updated)
    saveDoctorAvailability(updated)
    showNotice(
      `Hospital Availability updated for ${currentUser.name}! Patients will see your new schedule and available slots in real-time.`,
      'success'
    )
  }

  // --- TIME SLOT FILTERING LOGIC (CORE REQUIREMENT) ---
  // When rescheduling:
  // If chosen date is TODAY:
  //   Only show slots STRICTLY AFTER current reference time (e.g. > 1:00 PM).
  //   Slots at or before 1:00 PM for today MUST NOT be shown!
  // If chosen date is a future date:
  //   Show all standard slots within doctor availability.
  const availableRescheduleSlots = useMemo(() => {
    const isForToday = rescheduleDate === todayIso

    if (isForToday) {
      return APPOINTMENT_TIME_SLOTS.filter((slot) => {
        const slotMinutes = parseTimeToMinutes(slot)
        return slotMinutes > effectiveCurrentMinutes
      })
    }

    return APPOINTMENT_TIME_SLOTS
  }, [rescheduleDate, todayIso, effectiveCurrentMinutes])

  useEffect(() => {
    if (availableRescheduleSlots.length > 0) {
      if (!rescheduleTime || !availableRescheduleSlots.includes(rescheduleTime as any)) {
        setRescheduleTime(availableRescheduleSlots[0])
      }
    } else {
      setRescheduleTime('')
    }
  }, [availableRescheduleSlots, rescheduleTime])

  // Handle Approve
  const handleApprove = (appointment: AppointmentRequest, customNote?: string) => {
    const next = appointments.map((appt) =>
      appt.id === appointment.id
        ? {
            ...appt,
            status: 'approved' as const,
            doctorNote: customNote?.trim() || 'Appointment confirmed by Dr. Alexander Wright. Clinic room assigned.'
          }
        : appt
    )
    persistAppointments(next)
    showNotice(
      `Approved ${appointment.patientName}'s ${appointment.visitType} for ${formatDisplayDate(
        appointment.requestedDate
      )} at ${appointment.requestedTime}.`,
      'success'
    )
    if (drawerAppointment?.id === appointment.id) {
      setDrawerAppointment({
        ...drawerAppointment,
        status: 'approved',
        doctorNote: customNote?.trim() || 'Appointment confirmed by Dr. Alexander Wright. Clinic room assigned.'
      })
    }

    // Dispatch SMTP email alert to patient
    try {
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment',
          to: appointment.patientEmail || 'dullasaicharan2612@gmail.com',
          appointmentData: {
            patientName: appointment.patientName,
            doctorName: currentUser.name,
            date: formatDisplayDate(appointment.requestedDate),
            time: appointment.requestedTime,
            status: 'Approved & Confirmed',
            notes: customNote?.trim() || 'Your consultation has been confirmed. Please arrive 10 minutes prior.',
            department: appointment.department
          }
        })
      }).catch(() => {})
    } catch {
      // ignore network errors
    }
  }

  // Open Reschedule Modal
  const openRescheduleModal = (appointment: AppointmentRequest) => {
    setRescheduleTarget(appointment)
    setRescheduleError(null)

    const initialDate = appointment.requestedDate >= todayIso ? appointment.requestedDate : todayIso
    setRescheduleDate(initialDate)

    const isToday = initialDate === todayIso
    const validSlots = isToday
      ? APPOINTMENT_TIME_SLOTS.filter((s) => parseTimeToMinutes(s) > effectiveCurrentMinutes)
      : APPOINTMENT_TIME_SLOTS

    if (validSlots.length > 0) {
      setRescheduleTime(validSlots[0])
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
        tomorrow.getDate()
      ).padStart(2, '0')}`
      setRescheduleDate(tomorrowIso)
      setRescheduleTime(APPOINTMENT_TIME_SLOTS[0])
    }

    setRescheduleNote(
      appointment.status === 'rescheduled' && appointment.doctorNote
        ? appointment.doctorNote
        : 'Doctor is unavailable at requested time. Proposed new consultation slot.'
    )
  }

  // Submit Reschedule
  const handleConfirmReschedule = () => {
    if (!rescheduleTarget) return
    if (!rescheduleDate) {
      setRescheduleError('Please pick a valid date.')
      return
    }
    if (rescheduleDate < todayIso) {
      setRescheduleError('Cannot reschedule to a past date.')
      return
    }
    if (!rescheduleTime) {
      setRescheduleError('No available time slot selected. Please choose a slot after current time.')
      return
    }

    if (rescheduleDate === todayIso) {
      const slotMins = parseTimeToMinutes(rescheduleTime)
      if (slotMins <= effectiveCurrentMinutes) {
        setRescheduleError(
          `Selected time (${rescheduleTime}) is in the past for today (current time: ${effectiveCurrentTimeDisplay}). Choose a time after ${effectiveCurrentTimeDisplay}.`
        )
        return
      }
    }

    const next = appointments.map((appt) =>
      appt.id === rescheduleTarget.id
        ? {
            ...appt,
            status: 'rescheduled' as const,
            rescheduledDate: rescheduleDate,
            rescheduledTime: rescheduleTime,
            doctorNote: rescheduleNote.trim() || 'Please confirm the updated appointment slot proposed by your physician.'
          }
        : appt
    )

    persistAppointments(next)
    showNotice(
      `Successfully rescheduled ${rescheduleTarget.patientName} to ${formatDisplayDate(
        rescheduleDate
      )} at ${rescheduleTime}!`,
      'success'
    )

    if (drawerAppointment?.id === rescheduleTarget.id) {
      setDrawerAppointment({
        ...drawerAppointment,
        status: 'rescheduled',
        rescheduledDate: rescheduleDate,
        rescheduledTime: rescheduleTime,
        doctorNote: rescheduleNote.trim() || 'Please confirm the updated appointment slot proposed by your physician.'
      })
    }

    // Dispatch SMTP email alert to patient
    try {
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment',
          to: rescheduleTarget.patientEmail || 'dullasaicharan2612@gmail.com',
          appointmentData: {
            patientName: rescheduleTarget.patientName,
            doctorName: currentUser.name,
            date: formatDisplayDate(rescheduleDate),
            time: rescheduleTime,
            status: 'Rescheduled by Physician',
            notes: rescheduleNote.trim() || 'Physician schedule adjustment. Please review new slot.',
            department: rescheduleTarget.department
          }
        })
      }).catch(() => {})
    } catch {
      // ignore network errors
    }

    setRescheduleTarget(null)
    setRescheduleError(null)
  }

  // Quick simulate a patient booking
  const handleSimulatePatientRequest = () => {
    const demoPatients = [
      { name: 'Elena Gomez', mrn: 'MRN-84930', type: 'New Consultation' as const, reason: 'Chest flutter and shortness of breath during morning jog.' },
      { name: 'Marcus Chen', mrn: 'MRN-84931', type: 'Follow-up' as const, reason: 'Post-stent placement checkup and medication adjustment.' },
      { name: 'Priya Sharma', mrn: 'MRN-84932', type: 'Telehealth' as const, reason: 'Review blood pressure log and hypertension prescription.' },
      { name: 'David Kim', mrn: 'MRN-84933', type: 'Post-op Review' as const, reason: 'Routine valve repair follow-up and suture inspection.' }
    ]
    const randomPatient = demoPatients[Math.floor(Math.random() * demoPatients.length)]

    const newAppt: AppointmentRequest = {
      id: `appt-${Date.now()}`,
      patientId: `pt-${Date.now().toString().slice(-4)}`,
      patientName: randomPatient.name,
      patientEmail: `${randomPatient.name.toLowerCase().replace(/\s+/g, '.')}@patient.carelink.health`,
      mrn: randomPatient.mrn,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      department: currentUser.specialization || currentUser.department,
      requestedDate: todayIso,
      requestedTime: APPOINTMENT_TIME_SLOTS[Math.floor(Math.random() * APPOINTMENT_TIME_SLOTS.length)],
      visitType: randomPatient.type,
      reason: randomPatient.reason,
      status: 'pending',
      submittedAt: 'Just now'
    }

    const updated = [newAppt, ...appointments]
    persistAppointments(updated)
    setActiveTab('requests')
    setStatusFilter('pending')
    showNotice(`New patient appointment requested by ${randomPatient.name}! Ready for review.`, 'info')
  }

  const displayedSwitchers = allRoleAccounts

  return (
    <div className="flex min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDE PANEL / SIDEBAR NAVIGATION */}
      {/* ========================================================================= */}
      <aside className="sticky top-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
        {/* Brand & Doctor Role Badge */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--care-border)] px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--care-primary)] text-white shadow-sm">
              <Activity className="size-5" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
              <span className="ml-1.5 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-800">
                DOCTOR
              </span>
            </div>
          </Link>
        </div>

        {/* Doctor Identity & Live Status Pill */}
        <div className="border-b border-[var(--care-border)] bg-[var(--care-bg)]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--care-primary)] text-sm font-bold text-white shadow-sm" suppressHydrationWarning>
                {currentUser.avatarInitials}
              </span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white ${
                  doctorAvailability.isAvailable ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-[var(--care-ink)]" suppressHydrationWarning>{currentUser.name}</div>
              <div className="truncate text-[10px] text-[var(--care-muted)]">
                {currentUser.specialization || currentUser.title}
              </div>
              <div
                className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
                  doctorAvailability.isAvailable ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    doctorAvailability.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                {doctorAvailability.isAvailable ? 'Accepting Patients' : 'Off-Duty / Unavailable'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {/* Group 1: Patient Consultation & Queue */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
              Consultation & Queue
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <LayoutDashboard className="size-4" />
              <span>Clinical Overview</span>
            </button>

            {/* Live Patient Queue with Count Badge */}
            <button
              type="button"
              onClick={() => setActiveTab('patient-queue')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'patient-queue'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="size-4" />
                <span>Live Patient Queue</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  waitingQueue.length > 0
                    ? activeTab === 'patient-queue'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-900 animate-pulse'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {waitingQueue.length} in line
              </span>
            </button>

            {/* Appointment Requests with Live Badge */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('requests')
                setStatusFilter('all')
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'requests'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="size-4" />
                <span>Appointment Requests</span>
              </div>
              {pendingCount > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold animate-pulse ${
                    activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {pendingCount} new
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-[var(--care-bg)] text-[var(--care-muted)]'
                  }`}
                >
                  {doctorAppointments.length}
                </span>
              )}
            </button>

            {/* Reschedule & Approval Center */}
            <button
              type="button"
              onClick={() => setActiveTab('reschedule-center')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'reschedule-center'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarClock className="size-4" />
                <span>Reschedule & Approvals</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'reschedule-center' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}
              >
                Cutoff
              </span>
            </button>

            {/* Confirmed Clinic Schedule */}
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'schedule'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="size-4" />
                <span>Confirmed Schedule</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {approvedCount + rescheduledCount}
              </span>
            </button>
          </div>

          {/* Group 2: Doctor Schedule & Availability Management */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
              Hospital Availability
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('availability')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'availability'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock3 className="size-4" />
                <span>Doctor Availability & Hours</span>
              </div>
              <span
                className={`size-2 rounded-full ${
                  doctorAvailability.isAvailable ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('patients')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTab === 'patients'
                  ? 'bg-[var(--care-primary)] text-white shadow-sm'
                  : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartPulse className="size-4" />
                <span>Assigned Patients (EMR)</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'patients' ? 'bg-white/20 text-white' : 'bg-[var(--care-highlight)] text-[var(--care-ink)]'
                }`}
              >
                {patients.length}
              </span>
            </button>
          </div>
        </nav>

        {/* Side Panel Footer & User Info */}
        <div className="border-t border-[var(--care-border)] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-2.5 overflow-hidden rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-2 text-xs">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <div className="truncate">
                <p className="font-semibold text-[var(--care-ink)] truncate">{currentUser.name}</p>
                <p className="text-[10px] text-[var(--care-muted)] truncate">{currentUser.roleLabel}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="rounded-xl border border-[var(--care-border)] p-2 text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)] transition"
              title="Settings & Password"
            >
              <Settings className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-[var(--care-border)] p-2 text-red-600 hover:bg-red-50 transition"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={currentUser}
      />

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top App Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--care-border)] bg-[var(--care-surface)]/95 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[var(--care-ink)] sm:text-lg">
              {activeTab === 'overview' && 'Clinical Overview & Schedule'}
              {activeTab === 'patient-queue' && 'Live Patient Consultation Queue'}
              {activeTab === 'availability' && 'Doctor Availability & Consultation Hours'}
              {activeTab === 'requests' && 'Patient Appointment Requests Queue'}
              {activeTab === 'reschedule-center' && 'Reschedule & Approval Center'}
              {activeTab === 'schedule' && 'Confirmed Clinic Schedule & Calendar'}
              {activeTab === 'patients' && 'Assigned Clinical Patients (EMR)'}
            </h1>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Dr. Alexander Wright Â· Cardiology
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Walkin Queue Button */}
            <button
              type="button"
              onClick={() => setShowWalkinModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-1.5 text-xs font-bold text-[var(--care-ink)] shadow-xs transition hover:bg-[var(--care-highlight)]"
            >
              <UserPlus className="size-3.5 text-[var(--care-primary)]" />
              <span className="hidden sm:inline">Add Walk-in Patient</span>
            </button>

            {/* Quick Simulate Appointment Request Button */}
            <button
              type="button"
              onClick={handleSimulatePatientRequest}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-highlight)] px-3 py-1.5 text-xs font-bold text-[var(--care-primary-dark)] transition hover:bg-[var(--care-primary)] hover:text-white"
            >
              <Plus className="size-3.5" />
              <span>Simulate Request</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Banner Notice Alert */}
          {bannerNotice && (
            <div
              className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 ${
                bannerNotice.type === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : bannerNotice.type === 'info'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{bannerNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerNotice(null)}
                className="rounded-lg p-1 hover:bg-black/5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: CLINICAL OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Doctor Status Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                      <Stethoscope className="size-7" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold sm:text-2xl">{currentUser.name}</h2>
                        <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-800">
                          {currentUser.specialization || 'Cardiologist'}
                        </span>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-xs font-bold border ${
                            doctorAvailability.isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {doctorAvailability.isAvailable
                            ? `â— Active (${doctorAvailability.startTime} â€“ ${doctorAvailability.endTime})`
                            : 'â—‹ Off-Duty'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--care-muted)] sm:text-sm">
                        {currentUser.title} Â· {currentUser.department} Â· {doctorAvailability.statusNote}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--care-muted)]">
                        Manage patient consultation queues, review incoming appointment requests, and configure your clinic availability in real-time.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('patient-queue')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--care-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[var(--care-primary-dark)]"
                    >
                      <Users className="size-4" />
                      <span>Live Queue ({waitingQueue.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('availability')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] px-4 py-2.5 text-xs font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                    >
                      <Clock3 className="size-4" />
                      <span>Edit Availability</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab('patient-queue')}
                  className="cursor-pointer rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm transition hover:border-[var(--care-primary)] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--care-muted)]">Waiting in Queue</p>
                    <span className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                      <Users className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{waitingQueue.length} Patients</p>
                  <p className="mt-1 text-xs font-semibold text-purple-600">
                    Est. wait ~{estimatedQueueWaitTotal} mins
                  </p>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('requests')
                    setStatusFilter('pending')
                  }}
                  className="cursor-pointer rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm transition hover:border-[var(--care-primary)] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--care-muted)]">Pending Requests</p>
                    <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                      <ClipboardList className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{pendingCount}</p>
                  <p className="mt-1 text-xs font-semibold text-amber-600">Awaiting doctor approval</p>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('requests')
                    setStatusFilter('approved')
                  }}
                  className="cursor-pointer rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm transition hover:border-[var(--care-primary)] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--care-muted)]">Approved Visits</p>
                    <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                      <CalendarCheck className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{approvedCount}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-600">Confirmed at patient slot</p>
                </div>

                <div
                  onClick={() => setActiveTab('availability')}
                  className="cursor-pointer rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm transition hover:border-[var(--care-primary)] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--care-muted)]">Available Hours</p>
                    <span className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
                      <Clock3 className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold truncate">
                    {doctorAvailability.startTime} â€“ {doctorAvailability.endTime}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-600">
                    {doctorAvailability.availableDays.join(', ')}
                  </p>
                </div>
              </div>

              {/* Active Consultation Spotlight */}
              {inRoomPatient && (
                <div className="rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-sm">
                        <DoorOpen className="size-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                            IN CONSULTATION ROOM NOW
                          </span>
                          <span className="font-mono text-xs text-emerald-800">{inRoomPatient.mrn}</span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-emerald-950">{inRoomPatient.name}</h3>
                        <p className="text-xs text-emerald-800">
                          {inRoomPatient.age} yrs Â· {inRoomPatient.gender} Â· <strong>Symptoms:</strong> {inRoomPatient.symptoms}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteActiveConsultation(inRoomPatient.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Complete Visit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Queue Preview */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="font-bold text-[var(--care-ink)]">Incoming Appointment Requests</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Approve requested visit or propose new clinic hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('requests')
                      setStatusFilter('pending')
                    }}
                    className="text-xs font-bold text-[var(--care-primary)] hover:underline"
                  >
                    View All ({pendingCount}) â†’
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {pendingCount === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--care-border)] bg-[var(--care-bg)] p-8 text-center text-xs text-[var(--care-muted)]">
                      <CheckCircle2 className="mx-auto size-8 text-emerald-500 mb-2" />
                      All appointment requests have been processed! No pending items in queue.
                    </div>
                  ) : (
                    doctorAppointments
                      .filter((a) => a.status === 'pending')
                      .slice(0, 3)
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex flex-col gap-3 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)]/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[var(--care-ink)]">
                                {appointment.patientName}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${visitTypeBadgeClass(
                                  appointment.visitType
                                )}`}
                              >
                                {appointment.visitType}
                              </span>
                              {appointment.mrn && (
                                <span className="font-mono text-[10px] text-[var(--care-muted)]">
                                  {appointment.mrn}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-[var(--care-muted)] line-clamp-1">{appointment.reason}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-[var(--care-muted)]">
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--care-ink)]">
                                <Clock className="size-3 text-[var(--care-primary)]" />
                                Requested: {formatDisplayDate(appointment.requestedDate)} at {appointment.requestedTime}
                              </span>
                              <span>â€¢ Submitted {appointment.submittedAt}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(appointment)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[var(--care-primary)] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)]"
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openRescheduleModal(appointment)}
                              className="inline-flex items-center gap-1 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3.5 py-2 text-xs font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                            >
                              <CalendarClock className="size-3.5" />
                              <span>Reschedule</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDrawerAppointment(appointment)}
                              className="rounded-xl border border-[var(--care-border)] p-2 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                              title="Open in Side Panel"
                            >
                              <PanelRightOpen className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PATIENT QUEUE (VIEW-ONLY MONITOR MANAGED BY NURSE) */}
          {activeTab === 'patient-queue' && (
            <div className="space-y-6">
              {/* Queue Header Metrics */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--care-border)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--care-ink)]">Patient Consultation Queue Monitor</h2>
                      <span className="rounded-full bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                        Managed by Ward Nurse (Elena Rostova, RN)
                      </span>
                    </div>
                    <p className="text-xs text-[var(--care-muted)] mt-0.5">
                      Live status of patients assigned to {currentUser.name}. Queue flow and room intake are controlled by the Nurse Station.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--care-ink)]">
                      Room: <strong>OPD Room 204</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4">
                    <p className="text-xs text-[var(--care-muted)] font-semibold">Active In Consultation Room</p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">
                      {inRoomPatient ? inRoomPatient.name : 'Room is Free'}
                    </p>
                    <p className="text-[11px] text-[var(--care-muted)]">
                      {inRoomPatient ? `${inRoomPatient.mrn} Â· In Consultation` : 'Awaiting next patient from Nurse'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4">
                    <p className="text-xs text-[var(--care-muted)] font-semibold">Patients In Waiting Queue</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">{waitingQueue.length} Patients</p>
                    <p className="text-[11px] text-[var(--care-muted)]">
                      Est. Remaining Time: ~{estimatedQueueWaitTotal} mins
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4">
                    <p className="text-xs text-[var(--care-muted)] font-semibold">Completed Consultations Today</p>
                    <p className="mt-1 text-xl font-bold text-[var(--care-ink)]">{completedQueue.length} Patients</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Prescriptions logged</p>
                  </div>
                </div>
              </div>

              {/* In Consultation Room Card */}
              {inRoomPatient && (
                <div className="rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-sm">
                        <DoorOpen className="size-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                            CURRENTLY CONSULTING IN ROOM
                          </span>
                          <span className="font-mono text-xs text-emerald-800">{inRoomPatient.mrn}</span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-emerald-950">{inRoomPatient.name}</h3>
                        <p className="text-xs text-emerald-800">
                          {inRoomPatient.age} yrs Â· {inRoomPatient.gender} Â· <strong>Symptoms:</strong> {inRoomPatient.symptoms}
                        </p>
                        {inRoomPatient.notes && (
                          <p className="text-[11px] text-teal-900 mt-1">
                            <strong>Nurse Handoff:</strong> {inRoomPatient.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteActiveConsultation(inRoomPatient.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Conclude Consultation</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting Queue Monitor (Read-Only sequence) */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--care-ink)] flex items-center gap-2">
                    <Users className="size-4 text-[var(--care-primary)]" />
                    <span>Patients in Line (Nurse Queue Flow)</span>
                  </h3>
                  <span className="text-xs text-[var(--care-muted)]">Nurse will advance and call next patient</span>
                </div>

                {waitingQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--care-border)] bg-[var(--care-bg)] p-10 text-center text-xs text-[var(--care-muted)]">
                    <CheckCircle2 className="mx-auto size-8 text-emerald-500 mb-2" />
                    No patients currently waiting in line.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitingQueue.map((patient, index) => (
                      <div
                        key={patient.id}
                        className="flex flex-col gap-3 rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-extrabold text-sm border border-amber-200">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-[var(--care-ink)]">{patient.name}</span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  patient.triagePriority === 'STAT'
                                    ? 'bg-red-100 text-red-800'
                                    : patient.triagePriority === 'Urgent'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {patient.triagePriority} Triage
                              </span>
                              <span className="font-mono text-xs text-[var(--care-muted)]">{patient.mrn}</span>
                            </div>
                            <p className="mt-1 text-xs text-[var(--care-ink)]">
                              <strong>Symptoms:</strong> {patient.symptoms}
                            </p>
                            <p className="mt-1 text-[11px] text-[var(--care-muted)]">
                              {patient.age} yrs Â· {patient.gender} Â· Registered at {patient.registeredTime} Â· Est. Wait:{' '}
                              <strong>~{index * 15} mins</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[var(--care-muted)]">
                          <span className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-teal-800">
                            Nurse Intake Ready
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Consultations Log */}
              {completedQueue.length > 0 && (
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-[var(--care-ink)]">Completed Consultations Today</h3>
                  <div className="divide-y divide-[var(--care-border)]">
                    {completedQueue.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[var(--care-ink)]">{p.name}</span>
                          <span className="ml-2 font-mono text-[10px] text-[var(--care-muted)]">{p.mrn}</span>
                          <span className="ml-2 text-[11px] text-[var(--care-muted)]">({p.symptoms})</span>
                        </div>
                        <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Completed at {p.completedTime || 'Earlier'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCTOR AVAILABILITY & HOURS (FEATURE REQUIREMENT) */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[var(--care-ink)]">
                      Update Hospital Availability & Consultation Hours
                    </h2>
                    <p className="text-xs text-[var(--care-muted)]">
                      Configure your clinic days, working hours, and lunch breaks. Patients can only book slots within this schedule.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold border ${
                      availIsActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    {availIsActive ? 'â— Accepting Appointments' : 'â—‹ Unavailable / On Leave'}
                  </span>
                </div>

                <form onSubmit={handleSaveAvailability} className="mt-6 space-y-6">
                  {/* Availability Toggle */}
                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-bold text-xs text-[var(--care-ink)]">Clinic Status</div>
                        <div className="text-[11px] text-[var(--care-muted)]">
                          Enable to allow patients to request consultation appointments online.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={availIsActive}
                        onChange={(e) => setAvailIsActive(e.target.checked)}
                        className="size-5 rounded border-[var(--care-border)] text-[var(--care-primary)] focus:ring-[var(--care-primary)]"
                      />
                    </label>
                  </div>

                  {/* Available Days */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--care-ink)] mb-2">
                      Available Days of the Week
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_WEEKDAYS_SHORT.map((day) => {
                        const isSelected = availDays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setAvailDays(availDays.filter((d) => d !== day))
                              } else {
                                setAvailDays([...availDays, day])
                              }
                            }}
                            className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                              isSelected
                                ? 'bg-[var(--care-primary)] text-white border-[var(--care-primary)] shadow-xs'
                                : 'bg-[var(--care-surface)] text-[var(--care-muted)] border-[var(--care-border)] hover:bg-[var(--care-bg)]'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Consultation Hours */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                      Consultation Start Time
                      <select
                        value={availStartTime}
                        onChange={(e) => setAvailStartTime(e.target.value)}
                        className="h-11 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                      >
                        {APPOINTMENT_TIME_SLOTS.slice(0, 8).map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                      Consultation End Time
                      <select
                        value={availEndTime}
                        onChange={(e) => setAvailEndTime(e.target.value)}
                        className="h-11 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                      >
                        {APPOINTMENT_TIME_SLOTS.slice(8).map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Break / Lunch Interval */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                      Physician Break / Rounds Start
                      <select
                        value={availBreakStart}
                        onChange={(e) => setAvailBreakStart(e.target.value)}
                        className="h-11 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                      >
                        {APPOINTMENT_TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                      Physician Break / Rounds End
                      <select
                        value={availBreakEnd}
                        onChange={(e) => setAvailBreakEnd(e.target.value)}
                        className="h-11 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                      >
                        {APPOINTMENT_TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Clinic Room / Status Note */}
                  <label className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                    OPD Clinic Room & Location Instructions
                    <input
                      type="text"
                      value={availStatusNote}
                      onChange={(e) => setAvailStatusNote(e.target.value)}
                      placeholder="e.g. OPD Clinic Room 204 (Cardiology Wing)"
                      className="h-11 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                    />
                  </label>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--care-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)] transition"
                    >
                      <SaveIcon className="size-4" />
                      <span>Save Availability Settings</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENT REQUESTS QUEUE */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      statusFilter === 'all'
                        ? 'bg-[var(--care-primary)] text-white shadow-sm'
                        : 'bg-[var(--care-bg)] text-[var(--care-muted)] hover:text-[var(--care-ink)]'
                    }`}
                  >
                    All ({doctorAppointments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      statusFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-[var(--care-bg)] text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    Pending Review ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('approved')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      statusFilter === 'approved'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[var(--care-bg)] text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    Approved ({approvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('rescheduled')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      statusFilter === 'rescheduled'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[var(--care-bg)] text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    Rescheduled ({rescheduledCount})
                  </button>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--care-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by patient or MRN..."
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] pl-9 pr-3 text-xs outline-none focus:border-[var(--care-primary)]"
                  />
                </div>
              </div>

              {/* Requests List */}
              <div className="space-y-3">
                {visibleAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--care-border)] bg-[var(--care-surface)] p-12 text-center text-xs text-[var(--care-muted)]">
                    <ClipboardList className="mx-auto size-10 text-[var(--care-muted)] mb-3 opacity-50" />
                    <p className="font-bold text-sm text-[var(--care-ink)]">No appointment requests found</p>
                    <p className="mt-1">Try clearing filters or click "Simulate Request" to generate a sample request.</p>
                  </div>
                ) : (
                  visibleAppointments.map((appointment) => {
                    const isPending = appointment.status === 'pending'
                    const isRescheduled = appointment.status === 'rescheduled'
                    const isApproved = appointment.status === 'approved'

                    const effectiveDate = appointment.rescheduledDate || appointment.requestedDate
                    const effectiveTime = appointment.rescheduledTime || appointment.requestedTime

                    return (
                      <article
                        key={appointment.id}
                        className={`rounded-2xl border p-5 shadow-sm transition bg-[var(--care-surface)] ${
                          isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-[var(--care-border)]'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-[var(--care-ink)]">
                                {appointment.patientName}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusClasses(
                                  appointment.status
                                )}`}
                              >
                                {appointment.status.toUpperCase()}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${visitTypeBadgeClass(
                                  appointment.visitType
                                )}`}
                              >
                                {appointment.visitType}
                              </span>
                              {appointment.mrn && (
                                <span className="font-mono text-xs text-[var(--care-muted)] bg-[var(--care-bg)] px-2 py-0.5 rounded border border-[var(--care-border)]">
                                  {appointment.mrn}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-medium text-[var(--care-ink)]">{appointment.reason}</p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--care-muted)]">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--care-ink)]">
                                <Clock className="size-3.5 text-[var(--care-primary)]" />
                                Requested: {formatDisplayDate(appointment.requestedDate)} at{' '}
                                {appointment.requestedTime}
                              </span>

                              {isRescheduled && (
                                <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  <CalendarClock className="size-3.5 text-amber-600" />
                                  Doctor Offered: {formatDisplayDate(effectiveDate)} at {effectiveTime}
                                </span>
                              )}

                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CalendarCheck className="size-3.5 text-emerald-600" />
                                  Confirmed: {formatDisplayDate(effectiveDate)} at {effectiveTime}
                                </span>
                              )}

                              <span className="text-[11px] text-[var(--care-muted)]">
                                Submitted: {appointment.submittedAt}
                              </span>
                            </div>

                            {appointment.doctorNote && (
                              <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)]/80 p-2.5 text-xs text-[var(--care-muted)]">
                                <span className="font-bold text-[var(--care-ink)]">Doctor Note:</span>{' '}
                                {appointment.doctorNote}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(appointment)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)]"
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  <span>Approve Slot</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openRescheduleModal(appointment)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
                                >
                                  <CalendarClock className="size-3.5" />
                                  <span>Reschedule Slot</span>
                                </button>
                              </>
                            )}

                            {isRescheduled && (
                              <button
                                type="button"
                                onClick={() => openRescheduleModal(appointment)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-1.5 text-xs font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                              >
                                <CalendarClock className="size-3.5" />
                                <span>Modify Reschedule</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDrawerAppointment(appointment)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--care-muted)] hover:text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                            >
                              <PanelRightOpen className="size-3.5" />
                              <span>Details Drawer</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RESCHEDULE WORKBENCH */}
          {activeTab === 'reschedule-center' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[var(--care-ink)]">
                      Rescheduling & Appointment Management Workbench
                    </h2>
                    <p className="text-xs text-[var(--care-muted)]">
                      Review clinic load, approve patient requests, or select new consultation slots adhering to real-time cutoffs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--care-muted)]">Current Time:</span>
                    <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-extrabold text-blue-900 font-mono">
                      {effectiveCurrentTimeDisplay}
                    </span>
                  </div>
                </div>

                {/* Information Card on Slot Availability */}
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold">
                    <Info className="size-4 text-blue-600 shrink-0" />
                    <span>Active Time Filtering Rule:</span>
                  </div>
                  <p className="mt-1 text-blue-800 leading-relaxed">
                    When rescheduling today ({formatDisplayDate(todayIso)}), any slot up to{' '}
                    <strong>{effectiveCurrentTimeDisplay}</strong> is suppressed. Only slots after{' '}
                    <strong>{effectiveCurrentTimeDisplay}</strong> ({availableRescheduleSlots.slice(0, 3).join(', ')}
                    {availableRescheduleSlots.length > 3 ? '...' : ''}) are available.
                  </p>
                </div>

                {/* Reschedule List Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--care-border)] text-[var(--care-muted)] font-bold">
                        <th className="pb-3">Patient & MRN</th>
                        <th className="pb-3">Visit Type</th>
                        <th className="pb-3">Requested Slot</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {doctorAppointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-[var(--care-bg)]/60">
                          <td className="py-3 font-semibold text-[var(--care-ink)]">
                            <div>{appt.patientName}</div>
                            <div className="text-[10px] font-mono text-[var(--care-muted)]">{appt.mrn || 'N/A'}</div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${visitTypeBadgeClass(
                                appt.visitType
                              )}`}
                            >
                              {appt.visitType}
                            </span>
                          </td>
                          <td className="py-3 text-[var(--care-ink)]">
                            <div>{formatDisplayDate(appt.requestedDate)}</div>
                            <div className="text-[10px] text-[var(--care-muted)]">{appt.requestedTime}</div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusClasses(
                                appt.status
                              )}`}
                            >
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {appt.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(appt)}
                                  className="rounded-lg bg-[var(--care-primary)] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[var(--care-primary-dark)]"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openRescheduleModal(appt)}
                                className="rounded-lg border border-[var(--care-border)] bg-[var(--care-surface)] px-2.5 py-1 text-[11px] font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                              >
                                {appt.status === 'rescheduled' ? 'Re-adjust' : 'Reschedule'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONFIRMED CLINIC SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-[var(--care-ink)]">Confirmed Clinic Calendar</h2>
                  <p className="text-xs text-[var(--care-muted)]">
                    All approved and rescheduled patient appointments scheduled with Dr. Alexander Wright.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {approvedCount + rescheduledCount} Confirmed Consultations
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                {doctorAppointments.filter((a) => a.status !== 'pending').length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--care-border)] bg-[var(--care-surface)] p-10 text-center text-xs text-[var(--care-muted)]">
                    No confirmed or rescheduled appointments yet. Go to "Appointment Requests" to approve visits.
                  </div>
                ) : (
                  doctorAppointments
                    .filter((a) => a.status !== 'pending')
                    .map((appointment) => {
                      const effectiveDate = appointment.rescheduledDate || appointment.requestedDate
                      const effectiveTime = appointment.rescheduledTime || appointment.requestedTime
                      const isRescheduled = appointment.status === 'rescheduled'

                      return (
                        <div
                          key={appointment.id}
                          className="flex flex-col gap-3 rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200">
                              <CalendarCheck className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--care-ink)]">
                                  {appointment.patientName}
                                </span>
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusClasses(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status.toUpperCase()}
                                </span>
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${visitTypeBadgeClass(
                                    appointment.visitType
                                  )}`}
                                >
                                  {appointment.visitType}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[var(--care-muted)]">{appointment.reason}</p>
                              <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                                <span className="inline-flex items-center gap-1 text-[var(--care-primary)]">
                                  <Clock className="size-3.5" />
                                  {formatDisplayDate(effectiveDate)} at {effectiveTime}
                                </span>
                                {isRescheduled && (
                                  <span className="text-[10px] text-amber-700 font-medium">
                                    (Rescheduled from {appointment.requestedTime})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ASSIGNED PATIENTS (EMR) */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm">
                <h2 className="text-base font-bold text-[var(--care-ink)]">Assigned Cardiology Patients (EMR)</h2>
                <p className="text-xs text-[var(--care-muted)]">
                  Registered inpatient and outpatient records under Dr. Alexander Wright's clinical care.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-800">
                          {patient.name[0]}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-[var(--care-ink)]">{patient.name}</div>
                          <div className="text-[10px] font-mono text-[var(--care-muted)]">{patient.mrn}</div>
                        </div>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          patient.triagePriority === 'STAT'
                            ? 'bg-red-100 text-red-800'
                            : patient.triagePriority === 'Urgent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {patient.triagePriority} Triage
                      </span>
                    </div>

                    <div className="text-xs text-[var(--care-muted)]">
                      <div>
                        <strong>Age/Gender:</strong> {patient.age} yrs Â· {patient.gender}
                      </div>
                      <div>
                        <strong>Symptoms:</strong> {patient.symptoms}
                      </div>
                      {patient.notes && (
                        <div className="mt-1 text-[11px] text-[var(--care-ink)] bg-[var(--care-bg)] p-2 rounded-lg">
                          <strong>Note:</strong> {patient.notes}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[var(--care-border)] flex items-center justify-between text-[11px] text-[var(--care-muted)]">
                      <span>Attending: <strong>Dr. Alexander Wright</strong></span>
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-800 border border-teal-200">
                        Nurse Rx Desk Managed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OVER DETAIL & ACTION SIDE PANEL (RIGHT DRAWER) */}
      {/* ========================================================================= */}
      {drawerAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="flex h-full w-full max-w-md flex-col border-l border-[var(--care-border)] bg-[var(--care-surface)] shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[var(--care-border)] px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-[var(--care-ink)]">Patient Request Details</h3>
                <p className="text-xs text-[var(--care-muted)]">CareLink Clinical EMR Review</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerAppointment(null)}
                className="rounded-lg p-1.5 text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* Patient Badge Card */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--care-primary)] text-base font-bold text-white">
                    {drawerAppointment.patientName[0]}
                  </span>
                  <div>
                    <h4 className="font-bold text-[var(--care-ink)]">{drawerAppointment.patientName}</h4>
                    <p className="text-xs font-mono text-[var(--care-muted)]">{drawerAppointment.mrn || 'MRN-84920'}</p>
                    <p className="text-[11px] text-[var(--care-muted)]">{drawerAppointment.patientEmail}</p>
                  </div>
                </div>
              </div>

              {/* Request Status & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                    Current Status
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${statusClasses(
                      drawerAppointment.status
                    )}`}
                  >
                    {drawerAppointment.status.toUpperCase()}
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                    Visit Type
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${visitTypeBadgeClass(
                      drawerAppointment.visitType
                    )}`}
                  >
                    {drawerAppointment.visitType}
                  </span>
                </div>
              </div>

              {/* Patient Chief Complaint / Symptoms */}
              <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4">
                <div className="text-xs font-bold text-[var(--care-ink)]">Chief Complaint / Visit Reason</div>
                <p className="mt-1.5 text-xs text-[var(--care-ink)] leading-relaxed">{drawerAppointment.reason}</p>
              </div>

              {/* Requested Time vs Proposed Slot */}
              <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--care-muted)]">Patient Requested:</span>
                  <span className="font-bold text-[var(--care-ink)]">
                    {formatDisplayDate(drawerAppointment.requestedDate)} at {drawerAppointment.requestedTime}
                  </span>
                </div>

                {drawerAppointment.status === 'rescheduled' && (
                  <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <span>Rescheduled Slot:</span>
                    <span>
                      {formatDisplayDate(drawerAppointment.rescheduledDate || '')} at{' '}
                      {drawerAppointment.rescheduledTime}
                    </span>
                  </div>
                )}

                {drawerAppointment.status === 'approved' && (
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span>Approved Slot:</span>
                    <span>
                      {formatDisplayDate(drawerAppointment.requestedDate)} at {drawerAppointment.requestedTime}
                    </span>
                  </div>
                )}
              </div>

              {/* Doctor Note */}
              {drawerAppointment.doctorNote && (
                <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3 text-xs">
                  <div className="font-bold text-[var(--care-ink)]">Physician Instructions:</div>
                  <p className="mt-1 text-[var(--care-muted)]">{drawerAppointment.doctorNote}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-[var(--care-border)] p-4 space-y-2">
              {drawerAppointment.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(drawerAppointment)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--care-primary)] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)]"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openRescheduleModal(drawerAppointment)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <CalendarClock className="size-4" />
                    <span>Reschedule</span>
                  </button>
                </div>
              )}

              {drawerAppointment.status !== 'pending' && (
                <button
                  type="button"
                  onClick={() => openRescheduleModal(drawerAppointment)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] py-2.5 text-xs font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                >
                  <CalendarClock className="size-4" />
                  <span>Modify Schedule</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RESCHEDULE MODAL / WORKBENCH DIALOG (STRICT TIME CUTOFF) */}
      {/* ========================================================================= */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--care-border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold">
                    <CalendarClock className="size-4" />
                  </span>
                  <h2 className="text-base font-bold text-[var(--care-ink)] sm:text-lg">Reschedule Appointment</h2>
                </div>
                <p className="mt-1 text-xs text-[var(--care-muted)]">
                  Propose an updated clinic consultation slot for{' '}
                  <strong className="text-[var(--care-ink)]">{rescheduleTarget.patientName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRescheduleTarget(null)
                  setRescheduleError(null)
                }}
                className="rounded-xl p-1.5 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-4">
              {/* Error Message */}
              {rescheduleError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              {/* Time Rule Info Pill */}
              {rescheduleDate === todayIso && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950">
                  <p className="text-[11px] text-blue-800">
                    Showing consultation slots <strong>strictly after current time ({effectiveCurrentTimeDisplay})</strong> for today.
                  </p>
                </div>
              )}

              {/* Patient Requested Info */}
              <div className="rounded-xl bg-[var(--care-bg)] p-3 text-xs text-[var(--care-muted)] flex justify-between">
                <span>Patient Originally Requested:</span>
                <span className="font-bold text-[var(--care-ink)]">
                  {formatDisplayDate(rescheduleTarget.requestedDate)} at {rescheduleTarget.requestedTime}
                </span>
              </div>

              {/* Form Inputs */}
              <div className="grid gap-3 sm:grid-cols-2 items-start">
                <div>
                  <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 text-xs">
                    Select New Date (Interactive Calendar)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={rescheduleDateRef}
                      type="date"
                      min={todayIso}
                      value={rescheduleDate}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value)
                        setRescheduleError(null)
                      }}
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-3 pr-9 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          rescheduleDateRef.current?.showPicker()
                        } catch {
                          rescheduleDateRef.current?.focus()
                        }
                      }}
                      className="absolute right-2 flex size-7 items-center justify-center rounded-lg text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 transition"
                      title="Click calendar to pick date"
                    >
                      <Calendar className="size-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 text-xs">
                    Select Available Time Slot
                  </label>
                  {availableRescheduleSlots.length > 0 ? (
                    <select
                      value={rescheduleTime}
                      onChange={(e) => {
                        setRescheduleTime(e.target.value)
                        setRescheduleError(null)
                      }}
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                    >
                      {availableRescheduleSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex h-11 items-center rounded-xl border-2 border-red-300 bg-red-50 px-3 text-[11px] font-bold text-red-800">
                      No slots left today. Pick tomorrow.
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Note */}
              <label className="grid gap-1.5 text-xs font-bold text-slate-800">
                Reason & Instructions to Patient
                <textarea
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Physician schedule adjustment. Please confirm this afternoon slot."
                  className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 placeholder:text-slate-400"
                />
              </label>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--care-border)] pt-4">
              <button
                type="button"
                onClick={() => {
                  setRescheduleTarget(null)
                  setRescheduleError(null)
                }}
                className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={availableRescheduleSlots.length === 0}
                onClick={handleConfirmReschedule}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-3.5" />
                <span>Confirm & Send Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD WALK-IN PATIENT TO LIVE QUEUE MODAL */}
      {/* ========================================================================= */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--care-border)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--care-ink)]">Register Walk-in Patient</h3>
                <p className="text-xs text-[var(--care-muted)]">Insert directly into {currentUser.name}'s queue.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkinModal(false)}
                className="rounded-xl p-1.5 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddWalkinToQueue} className="mt-4 space-y-3">
              <label className="grid gap-1 text-xs font-bold text-[var(--care-ink)]">
                Patient Full Name
                <input
                  type="text"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Samantha Vance"
                  className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs font-bold text-[var(--care-ink)]">
                  Age
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={walkinAge}
                    onChange={(e) => setWalkinAge(e.target.value)}
                    className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs"
                    required
                  />
                </label>

                <label className="grid gap-1 text-xs font-bold text-[var(--care-ink)]">
                  Gender
                  <select
                    value={walkinGender}
                    onChange={(e) => setWalkinGender(e.target.value as any)}
                    className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-xs font-bold text-[var(--care-ink)]">
                Triage Priority
                <select
                  value={walkinPriority}
                  onChange={(e) => setWalkinPriority(e.target.value as any)}
                  className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold"
                >
                  <option value="Normal">Normal (Routine)</option>
                  <option value="Urgent">Urgent (Chest Discomfort / Fever)</option>
                  <option value="STAT">STAT (Critical / Acute Emergency)</option>
                </select>
              </label>

              <label className="grid gap-1 text-xs font-bold text-[var(--care-ink)]">
                Chief Complaint / Symptoms
                <textarea
                  value={walkinSymptoms}
                  onChange={(e) => setWalkinSymptoms(e.target.value)}
                  rows={2}
                  placeholder="e.g. Palpitations, dizziness after morning exertion"
                  className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-2 text-xs"
                  required
                />
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--care-border)]">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--care-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--care-primary-dark)]"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  )
}
