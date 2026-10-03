'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AppointmentRequest,
  BillRecord,
  DemoAccount,
  DoctorTimeSlot,
  HospitalDoctor,
  HospitalLocation,
  HospitalNotification,
  HospitalService,
  LeaveRequest,
  MedicationItem,
  PatientRecord,
  PrescriptionRecord,
  QueueEntry,
  HOSPITAL_SPECIALIZATIONS,
  addHospitalNotification,
  findDemoAccount,
  generateDoctorTimeSlots,
  getDemoAccountByRole,
  getStoredAppointments,
  getStoredBills,
  getStoredHospitalDoctors,
  getStoredHospitalLocations,
  getStoredHospitalServices,
  getStoredLeaveRequests,
  getStoredNotifications,
  getStoredPatients,
  getStoredPrescriptions,
  getStoredQueueEntries,
  getStoredQueueTransfers,
  getTodayDateIso,
  parseSlotTimeToMinutes,
  saveAppointments,
  validateAppointmentBooking
} from '@/lib/demo-accounts'
import { SettingsModal } from '@/components/settings-modal'
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  HeartPulse,
  History,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Navigation,
  Pencil,
  Phone,
  Pill,
  Plus,
  PlusCircle,
  Receipt,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react'

type PatientTab =
  | 'overview'
  | 'appointments'
  | 'book'
  | 'bills'
  | 'medicines'
  | 'queue'
  | 'navigation'
  | 'services'
  | 'profile'

export function PatientDashboard() {
  const router = useRouter()

  // State: Patient user & data
  const [currentUser, setCurrentUser] = useState<DemoAccount | null>(null)
  const [activeTab, setActiveTab] = useState<PatientTab>('overview')
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [bills, setBills] = useState<BillRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([])
  const [locations, setLocations] = useState<HospitalLocation[]>([])
  const [services, setServices] = useState<HospitalService[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [notifications, setNotifications] = useState<HospitalNotification[]>([])

  // Notifications popup & toast
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

  // Appointment Sub-tab & Filters
  const [apptSubTab, setApptSubTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [cancellingAppt, setCancellingAppt] = useState<AppointmentRequest | null>(null)

  // Booking Flow State
  const [bookingSpec, setBookingSpec] = useState<string>('Cardiology')
  const [bookingDoctorId, setBookingDoctorId] = useState<string>('demo-doctor')
  const [bookingDate, setBookingDate] = useState<string>(getTodayDateIso())
  const [bookingTime, setBookingTime] = useState<string>('')
  const [bookingVisitType, setBookingVisitType] = useState<AppointmentRequest['visitType']>('New Consultation')
  const [bookingReason, setBookingReason] = useState<string>('Routine checkup & heart rate review.')
  const [bookingValidationError, setBookingValidationError] = useState<string | null>(null)
  const [showBookingConfirmModal, setShowBookingConfirmModal] = useState<boolean>(false)

  // Bills Modal State
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<BillRecord | null>(null)

  // Prescription Detail Modal State
  const [selectedRxForDetail, setSelectedRxForDetail] = useState<PrescriptionRecord | null>(null)

  // Navigation & Floor Map State
  const [navSearchQuery, setNavSearchQuery] = useState<string>('')
  const [navCategoryFilter, setNavCategoryFilter] = useState<string>('ALL')
  const [selectedFloorTab, setSelectedFloorTab] = useState<'ALL' | 'Ground Floor' | '1st Floor' | '2nd Floor' | '3rd Floor' | '4th Floor' | 'Basement'>('ALL')
  const [selectedDestination, setSelectedDestination] = useState<HospitalLocation | null>(null)

  // Hospital Services Search & Filter
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('')
  const [serviceDeptFilter, setServiceDeptFilter] = useState<string>('ALL')
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<HospitalService | null>(null)

  const showToast = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }

  // Initial Data Load
  useEffect(() => {
    let account: DemoAccount | null = null
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('carelink_user')
      if (storedUser) {
        try {
          account = JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }
      if (!account) {
        const sessionEmail = localStorage.getItem('carelink_session_email')
        account = sessionEmail ? findDemoAccount(sessionEmail) : null
      }
    }
    if (!account) {
      account = getDemoAccountByRole('patient') || null
    }
    setCurrentUser(account)

    setAppointments(getStoredAppointments())
    setBills(getStoredBills())
    setPrescriptions(getStoredPrescriptions())
    setQueueEntries(getStoredQueueEntries())
    setDoctors(getStoredHospitalDoctors())
    setLocations(getStoredHospitalLocations())
    setServices(getStoredHospitalServices())
    setLeaveRequests(getStoredLeaveRequests())
    setNotifications(getStoredNotifications())
  }, [])

  // Patient Identity (MRN & Name)
  const isDemoPatient = !currentUser || currentUser.id === 'demo-patient' || currentUser.email === 'patient@carelink.health'
  const patientMrn = currentUser?.mrn || (currentUser?.id ? 'MRN-' + currentUser.id.slice(-6).toUpperCase() : 'MRN-84920')
  const patientName = currentUser?.name || 'Patient'
  const patientId = currentUser?.id || 'demo-patient'

  // Security & Object-Level Isolation: Filter datasets exclusively for the logged-in patient
  const myAppointments = useMemo(() => {
    if (!currentUser) return []
    return appointments.filter(
      (a) =>
        a.patientId === patientId ||
        a.mrn === patientMrn ||
        (currentUser.email && a.patientEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (isDemoPatient && a.patientName.toLowerCase() === patientName.toLowerCase())
    )
  }, [appointments, patientId, patientMrn, patientName, currentUser, isDemoPatient])

  const myBills = useMemo(() => {
    if (!currentUser) return []
    return bills.filter(
      (b) =>
        b.patientId === patientId ||
        b.patientMrn === patientMrn ||
        (isDemoPatient && b.patientName.toLowerCase() === patientName.toLowerCase())
    )
  }, [bills, patientId, patientMrn, patientName, currentUser, isDemoPatient])

  const myPrescriptions = useMemo(() => {
    if (!currentUser) return []
    return prescriptions.filter(
      (p) =>
        p.patientId === patientId ||
        p.mrn === patientMrn ||
        (isDemoPatient && p.patientName.toLowerCase() === patientName.toLowerCase())
    )
  }, [prescriptions, patientId, patientMrn, patientName, currentUser, isDemoPatient])

  const myQueueEntry = useMemo(() => {
    if (!currentUser) return undefined
    return queueEntries.find(
      (q) =>
        (q.patientId === patientId ||
          q.patientMrn === patientMrn ||
          (isDemoPatient && q.patientName.toLowerCase() === patientName.toLowerCase())) &&
        q.status !== 'COMPLETED' &&
        q.status !== 'CANCELLED'
    )
  }, [queueEntries, patientId, patientMrn, patientName, currentUser, isDemoPatient])

  const myQueueHistory = useMemo(() => {
    if (!currentUser) return []
    return queueEntries.filter(
      (q) =>
        q.patientId === patientId ||
        q.patientMrn === patientMrn ||
        (isDemoPatient && q.patientName.toLowerCase() === patientName.toLowerCase())
    )
  }, [queueEntries, patientId, patientMrn, patientName, currentUser, isDemoPatient])

  // Real-time Queue Calculation
  const queueStats = useMemo(() => {
    if (!myQueueEntry) return null

    // Count how many patients are ahead in the same doctor's queue with status WAITING or CALLED
    const doctorQueue = queueEntries.filter(
      (q) => q.doctorId === myQueueEntry.doctorId && (q.status === 'WAITING' || q.status === 'CALLED')
    )
    const myIndex = doctorQueue.findIndex((q) => q.id === myQueueEntry.id)
    const position = myIndex >= 0 ? myIndex + 1 : 1
    const patientsAhead = Math.max(0, position - 1)
    const estimatedMinutes = patientsAhead * 12 + (myQueueEntry.status === 'CALLED' ? 2 : 10)

    const doctorLocation = locations.find((l) => l.doctorId === myQueueEntry.doctorId)

    return {
      entry: myQueueEntry,
      position,
      patientsAhead,
      estimatedMinutes,
      isTransferred: Boolean(myQueueEntry.transferredFromDoctorName),
      doctorLocation
    }
  }, [myQueueEntry, queueEntries, locations])

  // Summary Metrics
  const upcomingAppt = useMemo(() => {
    return myAppointments.find((a) => a.status === 'approved' || a.status === 'pending' || a.status === 'rescheduled')
  }, [myAppointments])

  const pendingBill = useMemo(() => {
    return myBills.find((b) => b.paymentStatus === 'PENDING' || b.paymentStatus === 'PARTIALLY_PAID')
  }, [myBills])

  const totalActiveMeds = useMemo(() => {
    return myPrescriptions.reduce((count, rx) => {
      if (rx.status === 'active') {
        return count + (rx.medications ? rx.medications.length : 0)
      }
      return count
    }, 0)
  }, [myPrescriptions])

  // Available Time Slots for Booking
  const availableSlots: DoctorTimeSlot[] = useMemo(() => {
    if (!bookingDoctorId || !bookingDate) return []
    return generateDoctorTimeSlots(bookingDoctorId, bookingDate, appointments, leaveRequests)
  }, [bookingDoctorId, bookingDate, appointments, leaveRequests])

  // Filtered Locations for Navigation
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchCategory = navCategoryFilter === 'ALL' || loc.category === navCategoryFilter
      const matchFloor = selectedFloorTab === 'ALL' || loc.floor === selectedFloorTab
      const q = navSearchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.department.toLowerCase().includes(q) ||
        loc.roomNumber.toLowerCase().includes(q) ||
        loc.building.toLowerCase().includes(q) ||
        loc.landmarks.toLowerCase().includes(q)

      return matchCategory && matchFloor && matchQuery
    })
  }, [locations, navCategoryFilter, selectedFloorTab, navSearchQuery])

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchDept = serviceDeptFilter === 'ALL' || s.department.toLowerCase() === serviceDeptFilter.toLowerCase()
      const q = serviceSearchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.locationName.toLowerCase().includes(q) ||
        s.availableDoctors.some((d) => d.toLowerCase().includes(q))

      return matchDept && matchQuery
    })
  }, [services, serviceDeptFilter, serviceSearchQuery])

  // Launch Navigation to a specific Location or Doctor Room
  const handleLaunchNavigationToLocation = (location: HospitalLocation) => {
    setSelectedDestination(location)
    setActiveTab('navigation')
  }

  const handleLaunchNavigationToDoctor = (doctorId: string) => {
    const loc = locations.find((l) => l.doctorId === doctorId)
    if (loc) {
      setSelectedDestination(loc)
      setActiveTab('navigation')
    } else {
      showToast('Navigation details for this doctor are located in Main OPD 2nd Floor.', 'info')
      setActiveTab('navigation')
    }
  }

  // Quick Book with pre-selected Doctor & Department
  const handleQuickBookWithDoctor = (doc: HospitalDoctor) => {
    setBookingSpec(doc.specialization)
    setBookingDoctorId(doc.id)
    setBookingDate(getTodayDateIso())
    setBookingTime('')
    setActiveTab('book')
  }

  // Appointment Submission
  const handleInitiateBookAppointment = (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookingDoctorId || !bookingDate || !bookingTime) {
      setBookingValidationError('Please select a doctor, appointment date, and available time slot.')
      return
    }

    const validation = validateAppointmentBooking(
      bookingDoctorId,
      bookingDate,
      bookingTime,
      appointments,
      leaveRequests
    )

    if (!validation.isValid) {
      setBookingValidationError(validation.error || 'Invalid appointment selection.')
      return
    }

    setBookingValidationError(null)
    setShowBookingConfirmModal(true)
  }

  const handleConfirmAppointmentSubmission = () => {
    const selectedDoc = doctors.find((d) => d.id === bookingDoctorId) || {
      id: bookingDoctorId,
      name: 'Dr. Alexander Wright, MD',
      specialization: bookingSpec
    }

    // Double check race condition / double-booking before finalizing
    const validation = validateAppointmentBooking(
      bookingDoctorId,
      bookingDate,
      bookingTime,
      appointments,
      leaveRequests
    )

    if (!validation.isValid) {
      setShowBookingConfirmModal(false)
      setBookingValidationError(validation.error || 'Slot is no longer available.')
      showToast(validation.error || 'Slot is no longer available. Please select another time.', 'error')
      return
    }

    const newAppt: AppointmentRequest = {
      id: `appt-${Date.now()}`,
      patientId,
      patientName,
      patientEmail: currentUser?.email || 'patient@carelink.health',
      mrn: patientMrn,
      doctorId: selectedDoc.id,
      doctorName: selectedDoc.name,
      department: selectedDoc.specialization || bookingSpec,
      requestedDate: bookingDate,
      requestedTime: bookingTime,
      visitType: bookingVisitType,
      reason: bookingReason,
      status: 'pending',
      submittedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    const updated = [newAppt, ...appointments]
    setAppointments(updated)
    saveAppointments(updated)

    // Notify Doctor & Receptionist
    addHospitalNotification({
      toRole: 'doctor',
      toUserId: selectedDoc.id,
      title: 'New Patient Appointment Request',
      message: `${patientName} (${patientMrn}) requested a ${bookingVisitType} appointment for ${bookingDate} at ${bookingTime}.`,
      type: 'info'
    })

    addHospitalNotification({
      toRole: 'receptionist',
      title: 'Appointment Request Created',
      message: `Patient ${patientName} requested appointment with ${selectedDoc.name} on ${bookingDate} at ${bookingTime}.`,
      type: 'info'
    })

    // Notify Patient Confirmation
    addHospitalNotification({
      toRole: 'patient',
      toUserId: patientId,
      title: 'Appointment Requested Successfully',
      message: `Your appointment request with ${selectedDoc.name} on ${bookingDate} at ${bookingTime} has been submitted (ID: ${newAppt.id}).`,
      type: 'success'
    })

    setShowBookingConfirmModal(false)
    showToast(`Appointment with ${selectedDoc.name} on ${bookingDate} at ${bookingTime} requested successfully!`, 'success')
    setActiveTab('appointments')
    setApptSubTab('upcoming')
  }

  // Cancel Appointment Handler
  const handleConfirmCancelAppointment = () => {
    if (!cancellingAppt) return

    const updated = appointments.map((a) => (a.id === cancellingAppt.id ? { ...a, status: 'cancelled' as const } : a))
    setAppointments(updated)
    saveAppointments(updated)

    addHospitalNotification({
      toRole: 'doctor',
      toUserId: cancellingAppt.doctorId,
      title: 'Appointment Cancelled by Patient',
      message: `Patient ${cancellingAppt.patientName} cancelled their appointment for ${cancellingAppt.requestedDate} at ${cancellingAppt.requestedTime}.`,
      type: 'warning'
    })

    addHospitalNotification({
      toRole: 'patient',
      toUserId: patientId,
      title: 'Appointment Cancelled',
      message: `Your appointment with ${cancellingAppt.doctorName} for ${cancellingAppt.requestedDate} was cancelled.`,
      type: 'info'
    })

    showToast(`Appointment with ${cancellingAppt.doctorName} was cancelled successfully.`, 'info')
    setCancellingAppt(null)
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && (n.toRole === 'patient' || n.toUserId === patientId)).length
  }, [notifications, patientId])

  return (
    <div className="flex min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-2xl border p-4 shadow-2xl transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : toastMessage.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : toastMessage.type === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-cyan-200 bg-cyan-50 text-cyan-900'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === 'error' && <AlertOctagon className="size-5 shrink-0 text-rose-600" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="size-5 shrink-0 text-amber-600" />}
          {toastMessage.type === 'info' && <Info className="size-5 shrink-0 text-cyan-600" />}
          <div className="text-sm font-medium">{toastMessage.text}</div>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-xs opacity-70 hover:opacity-100">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PATIENT SIDEBAR (EXACT SAME DESIGN AS ADMIN / RECEPTIONIST SIDEBAR) */}
      {/* ========================================================================= */}
      <aside className="sticky top-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
        {/* Brand & Badge */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--care-border)] px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
              <HeartPulse className="size-5" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
              <span className="ml-1.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-800">
                PATIENT PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
            Personal Health & Services
          </div>

          {/* Dashboard Overview */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Patient Dashboard</span>
          </button>

          {/* My Appointments */}
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'appointments'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="size-4" />
              <span>My Appointments</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'appointments'
                  ? 'bg-[var(--care-primary)] text-white'
                  : 'bg-[var(--care-muted)] text-[var(--care-ink)]'
              }`}
            >
              {myAppointments.filter((a) => a.status === 'approved' || a.status === 'pending').length}
            </span>
          </button>

          {/* Request Appointment */}
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'book'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4" />
              <span>Request Appointment</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'book' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Book
            </span>
          </button>

          {/* My Bills */}
          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'bills'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Receipt className="size-4" />
              <span>My Bills</span>
            </div>
            {pendingBill && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'bills' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                ₹{pendingBill.finalAmount} Due
              </span>
            )}
          </button>

          {/* My Medicines */}
          <button
            type="button"
            onClick={() => setActiveTab('medicines')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'medicines'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Pill className="size-4" />
              <span>My Medicines</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'medicines' ? 'bg-white/20 text-white' : 'bg-[var(--care-highlight)] text-[var(--care-ink)]'
              }`}
            >
              {totalActiveMeds} Active
            </span>
          </button>

          {/* My Queue Tracker */}
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'queue'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="size-4" />
              <span>My Queue Tracker</span>
            </div>
            {myQueueEntry ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'queue'
                    ? 'bg-white/20 text-white'
                    : myQueueEntry.status === 'CALLED'
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                #{myQueueEntry.queueNumber}
              </span>
            ) : null}
          </button>

          {/* Hospital Navigation */}
          <button
            type="button"
            onClick={() => setActiveTab('navigation')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'navigation'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass className="size-4" />
              <span>Hospital Navigation</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'navigation' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-800'
              }`}
            >
              Map
            </span>
          </button>

          {/* Hospital Services */}
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'services'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="size-4" />
              <span>Hospital Services</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'services' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
              }`}
            >
              {services.length}
            </span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <User className="size-4" />
            <span>Patient Profile & Health Info</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[var(--care-border)] p-4">
          <div className="flex items-center justify-between rounded-xl bg-[var(--care-bg)] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-purple-600 font-bold text-white text-xs" suppressHydrationWarning>
                {currentUser?.avatarInitials || 'AO'}
              </span>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--care-ink)] leading-none" suppressHydrationWarning>{patientName}</div>
                <div className="text-[10px] text-purple-700 font-bold leading-none mt-1" suppressHydrationWarning>{patientMrn}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="rounded-lg p-1.5 text-purple-700 hover:bg-purple-50 transition"
                title="Settings"
              >
                <Settings className="size-4" />
              </button>
              <Link
                href="/sign-in"
                className="rounded-lg p-1.5 text-purple-700 hover:bg-purple-50 transition"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN PATIENT WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--care-border)] bg-[var(--care-surface)]/95 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--care-ink)]">
              {activeTab === 'overview' && 'Patient Dashboard & Health Overview'}
              {activeTab === 'appointments' && 'My Hospital Appointments'}
              {activeTab === 'book' && 'Request Doctor Appointment'}
              {activeTab === 'bills' && 'My Hospital Invoices & Bills'}
              {activeTab === 'medicines' && 'My Prescribed Medicines'}
              {activeTab === 'queue' && 'My Live Doctor Consultation Queue'}
              {activeTab === 'navigation' && 'Interactive Hospital Navigation & Floor Map'}
              {activeTab === 'services' && 'CareLink Hospital Specialties & Clinical Services'}
              {activeTab === 'profile' && 'Patient Medical Profile & Emergency Contacts'}
            </h1>
            <span className="hidden rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800 sm:inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-purple-600 animate-pulse" /> Patient Portal Live
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'book' && (
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
              >
                <PlusCircle className="size-4" />
                <span>Request Appointment</span>
              </button>
            )}

            {activeTab !== 'navigation' && (
              <button
                type="button"
                onClick={() => setActiveTab('navigation')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
              >
                <Compass className="size-4 text-purple-600" />
                <span>Find Room / Doctor</span>
              </button>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex size-10 items-center justify-center rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] text-[var(--care-ink)] transition hover:bg-[var(--care-highlight)]"
                aria-label="Notifications"
              >
                <Megaphone className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <Megaphone className="size-4 text-purple-600" />
                      <span>My Notifications</span>
                    </div>
                    <button
                      onClick={() => {
                        const marked = notifications.map((n) =>
                          n.toRole === 'patient' || n.toUserId === patientId ? { ...n, read: true } : n
                        )
                        setNotifications(marked)
                      }}
                      className="text-xs font-medium text-purple-600 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {notifications.filter((n) => n.toRole === 'patient' || n.toUserId === patientId).length === 0 ? (
                      <p className="py-4 text-center text-xs text-[var(--care-muted)]">No active notifications</p>
                    ) : (
                      notifications
                        .filter((n) => n.toRole === 'patient' || n.toUserId === patientId)
                        .slice(0, 8)
                        .map((notif) => (
                          <div
                            key={notif.id}
                            className={`rounded-xl border p-3 text-xs transition ${
                              notif.read
                                ? 'border-transparent bg-[var(--care-highlight)]/50 opacity-70'
                                : 'border-purple-200 bg-purple-50/50 text-[var(--care-ink)] font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>{notif.title}</span>
                              <span className="text-[10px] text-[var(--care-muted)]">{notif.createdAt}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--care-muted)] leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Queue Transfer Alert Banner if redirected by Receptionist */}
              {queueStats?.isTransferred && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white">
                      <ArrowRightLeft className="size-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">
                        Queue Updated — Assigned Doctor Transferred
                      </h4>
                      <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                        Your assigned Doctor has changed from{' '}
                        <strong>{queueStats.entry.transferredFromDoctorName}</strong> to{' '}
                        <strong>{queueStats.entry.doctorName}</strong> ({queueStats.entry.specialization}).
                        {' '}Reason: <em>{queueStats.entry.transferReason || 'Emergency doctor reallocation'}</em>.
                        {' '}Your new token is <strong>#{queueStats.entry.queueNumber}</strong>.
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => setActiveTab('queue')}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                        >
                          View Live Queue Tracker
                        </button>
                        {queueStats.doctorLocation && (
                          <button
                            onClick={() => handleLaunchNavigationToLocation(queueStats.doctorLocation!)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                          >
                            <Compass className="size-3.5" />
                            Navigate to {queueStats.doctorLocation.roomNumber}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5 Core Feature Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* 1. Upcoming Appointment */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                      <span>Upcoming Appointment</span>
                      <Calendar className="size-4 text-purple-600" />
                    </div>
                    {upcomingAppt ? (
                      <div className="mt-3">
                        <div className="text-sm font-bold text-[var(--care-ink)]">{upcomingAppt.doctorName}</div>
                        <div className="text-xs text-purple-700 font-semibold">{upcomingAppt.department}</div>
                        <div className="mt-2 text-xs text-[var(--care-muted)]">
                          {upcomingAppt.requestedDate} · {upcomingAppt.requestedTime}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-[var(--care-muted)] italic">
                        No upcoming appointments scheduled.
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-2 border-t border-[var(--care-border)]">
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                    >
                      {upcomingAppt ? 'View Details' : 'Book Now'} →
                    </button>
                  </div>
                </div>

                {/* 2. Current Queue */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                      <span>Current Queue Status</span>
                      <Clock className="size-4 text-amber-600" />
                    </div>
                    {myQueueEntry ? (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-black text-amber-700">
                            #{myQueueEntry.queueNumber}
                          </span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            {myQueueEntry.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--care-ink)] font-semibold">
                          {myQueueEntry.doctorName}
                        </div>
                        <div className="text-[11px] text-[var(--care-muted)]">
                          ~{queueStats?.estimatedMinutes || 10} mins wait ({queueStats?.patientsAhead || 0} ahead)
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-[var(--care-muted)] italic">
                        Not currently in an active OPD queue.
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-2 border-t border-[var(--care-border)]">
                    <button
                      onClick={() => setActiveTab('queue')}
                      className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      Open Queue Tracker →
                    </button>
                  </div>
                </div>

                {/* 3. Pending Bills */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                      <span>Pending Bills</span>
                      <Receipt className="size-4 text-emerald-600" />
                    </div>
                    {pendingBill ? (
                      <div className="mt-3">
                        <div className="text-xl font-black text-emerald-700">
                          ₹{pendingBill.finalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-[var(--care-ink)] font-semibold">
                          {pendingBill.billNumber}
                        </div>
                        <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Payment Pending
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="text-xl font-black text-emerald-700">₹0.00 Due</div>
                        <div className="text-xs text-emerald-700 font-semibold mt-1">All accounts settled</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-2 border-t border-[var(--care-border)]">
                    <button
                      onClick={() => setActiveTab('bills')}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      View Billing History →
                    </button>
                  </div>
                </div>

                {/* 4. Active Medicines */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                      <span>Prescribed Medicines</span>
                      <Pill className="size-4 text-indigo-600" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-indigo-700">{totalActiveMeds}</div>
                      <div className="text-xs text-[var(--care-ink)] font-semibold">
                        {myPrescriptions.filter((p) => p.status === 'active').length} Active Prescriptions
                      </div>
                      <div className="text-[11px] text-[var(--care-muted)] mt-1">Ready for pickup / eMAR synced</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[var(--care-border)]">
                    <button
                      onClick={() => setActiveTab('medicines')}
                      className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      Check My Medicines →
                    </button>
                  </div>
                </div>

                {/* 5. Hospital Navigation */}
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-cyan-800">
                      <span>Hospital Map & Rooms</span>
                      <Compass className="size-4 text-cyan-700" />
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-bold text-cyan-950">Floor-by-Floor Navigation</div>
                      <p className="mt-1 text-xs text-cyan-800 leading-relaxed">
                        Find doctors, consultation rooms, emergency, labs, and pharmacy.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-cyan-200">
                    <button
                      onClick={() => setActiveTab('navigation')}
                      className="text-xs font-bold text-cyan-800 hover:underline flex items-center gap-1"
                    >
                      Open Hospital Map →
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Department Navigation Hub */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  onClick={() => setActiveTab('book')}
                  className="flex items-center gap-4 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-left shadow-sm transition hover:border-purple-300 hover:bg-purple-100/60"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                    <CalendarClock className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-950">Book New Appointment</h4>
                    <p className="text-xs text-purple-800">
                      Select specialization, doctor, and live future available time slot.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('queue')}
                  className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-100/60"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                    <Clock className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">Live Queue Position</h4>
                    <p className="text-xs text-amber-800">
                      Track patients ahead, call alerts, and estimated waiting time.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className="flex items-center gap-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-100/60"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-950">Hospital Specialties</h4>
                    <p className="text-xs text-teal-800">
                      Browse diagnostic facilities, operating hours, and doctor profiles.
                    </p>
                  </div>
                </button>
              </div>

              {/* Active Prescriptions Snapshot & Doctor Roster */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Active Prescriptions Card */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--care-ink)]">My Prescribed Medicines</h3>
                      <p className="text-xs text-[var(--care-muted)]">Currently active medications prescribed by your care team</p>
                    </div>
                    <Pill className="size-5 text-purple-600" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {myPrescriptions.length === 0 ? (
                      <p className="py-6 text-center text-xs text-[var(--care-muted)] italic">
                        No active prescriptions recorded yet.
                      </p>
                    ) : (
                      myPrescriptions.slice(0, 2).map((rx) => (
                        <div key={rx.id} className="rounded-xl border border-[var(--care-border)] p-3 text-xs">
                          <div className="flex items-center justify-between font-bold text-[var(--care-ink)]">
                            <span>{rx.diagnosis}</span>
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              {rx.doctorName}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {rx.medications.map((m) => (
                              <div key={m.id} className="flex items-center justify-between text-[11px] text-[var(--care-muted)]">
                                <span className="font-semibold text-[var(--care-ink)]">
                                  {m.name} ({m.dosage})
                                </span>
                                <span>{m.frequency} · {m.timingInstructions}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--care-border)]">
                    <button
                      onClick={() => setActiveTab('medicines')}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      View All Prescriptions & Instructions →
                    </button>
                  </div>
                </div>

                {/* Available Doctors Roster */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--care-ink)]">Featured Hospital Specialists</h3>
                      <p className="text-xs text-[var(--care-muted)]">Consult certified physicians and book appointments</p>
                    </div>
                    <Stethoscope className="size-5 text-teal-600" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {doctors.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[var(--care-border)] p-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 font-bold text-teal-800">
                            {doc.avatarInitials || doc.name.slice(3, 5).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--care-ink)]">{doc.name}</div>
                            <div className="text-[10px] text-teal-700 font-semibold">{doc.specialization}</div>
                            <div className="text-[10px] text-[var(--care-muted)]">{doc.roomNumber}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLaunchNavigationToDoctor(doc.id)}
                            className="rounded-lg border border-[var(--care-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                            title="Navigate"
                          >
                            <Compass className="size-3.5 text-cyan-600" />
                          </button>
                          <button
                            onClick={() => handleQuickBookWithDoctor(doc)}
                            className="rounded-lg bg-purple-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-purple-700"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--care-border)]">
                    <button
                      onClick={() => setActiveTab('services')}
                      className="text-xs font-bold text-teal-700 hover:underline"
                    >
                      Browse All Hospital Services & Departments →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MY APPOINTMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">My Hospital Appointments</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      View your scheduled consultations, past visits, or cancel upcoming slots
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('book')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
                  >
                    <PlusCircle className="size-4" />
                    <span>Request New Appointment</span>
                  </button>
                </div>

                {/* Sub-tabs: Upcoming, Past, Cancelled */}
                <div className="mt-4 flex items-center gap-2 border-b border-[var(--care-border)] pb-3">
                  {[
                    { id: 'upcoming', label: 'Upcoming Appointments', count: myAppointments.filter((a) => a.status === 'approved' || a.status === 'pending' || a.status === 'rescheduled').length },
                    { id: 'past', label: 'Past Completed', count: myAppointments.filter((a) => a.status === 'completed').length },
                    { id: 'cancelled', label: 'Cancelled / Rejected', count: myAppointments.filter((a) => a.status === 'cancelled' || a.status === 'rejected').length }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setApptSubTab(sub.id as any)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        apptSubTab === sub.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)]'
                      }`}
                    >
                      <span>{sub.label}</span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${apptSubTab === sub.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                        {sub.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Appointments List */}
                <div className="mt-4 space-y-3">
                  {myAppointments.filter((a) => {
                    if (apptSubTab === 'upcoming') return a.status === 'approved' || a.status === 'pending' || a.status === 'rescheduled'
                    if (apptSubTab === 'past') return a.status === 'completed'
                    return a.status === 'cancelled' || a.status === 'rejected'
                  }).length === 0 ? (
                    <div className="py-12 text-center text-xs text-[var(--care-muted)]">
                      <Calendar className="mx-auto size-8 text-[var(--care-muted)] opacity-50 mb-2" />
                      <p className="font-semibold text-sm">No {apptSubTab} appointments found.</p>
                      <p className="mt-1">You can request a new consultation with any available hospital specialist.</p>
                      <button
                        onClick={() => setActiveTab('book')}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                      >
                        Book Appointment Now
                      </button>
                    </div>
                  ) : (
                    myAppointments
                      .filter((a) => {
                        if (apptSubTab === 'upcoming') return a.status === 'approved' || a.status === 'pending' || a.status === 'rescheduled'
                        if (apptSubTab === 'past') return a.status === 'completed'
                        return a.status === 'cancelled' || a.status === 'rejected'
                      })
                      .map((appt) => {
                        const docLoc = locations.find((l) => l.doctorId === appt.doctorId)
                        return (
                          <div
                            key={appt.id}
                            className="rounded-2xl border border-[var(--care-border)] p-4 shadow-sm transition hover:border-purple-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[var(--care-ink)]">{appt.doctorName}</span>
                                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    {appt.department}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                      appt.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : appt.status === 'pending'
                                        ? 'bg-amber-100 text-amber-800'
                                        : appt.status === 'rescheduled'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {appt.status.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--care-muted)] flex items-center gap-3">
                                  <span className="font-semibold text-purple-700">
                                    📅 {appt.requestedDate} at {appt.requestedTime}
                                  </span>
                                  <span>·</span>
                                  <span>Type: {appt.visitType}</span>
                                </div>
                                <p className="text-xs text-[var(--care-ink)] italic mt-1">&quot;{appt.reason}&quot;</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {docLoc && (
                                  <button
                                    onClick={() => handleLaunchNavigationToLocation(docLoc)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900 hover:bg-cyan-100"
                                  >
                                    <Compass className="size-3.5" />
                                    <span>Room {docLoc.roomNumber}</span>
                                  </button>
                                )}

                                {(appt.status === 'approved' || appt.status === 'pending' || appt.status === 'rescheduled') && (
                                  <button
                                    onClick={() => setCancellingAppt(appt)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: REQUEST APPOINTMENT (STRICT FUTURE DATE & TIME ENFORCEMENT) */}
          {/* ========================================================================= */}
          {activeTab === 'book' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">Request Doctor Appointment</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Select department, doctor, future date, and live available time slot
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 border border-purple-200">
                    <ShieldCheck className="size-4 text-purple-600" />
                    Strict Future-Time Rule Enforced
                  </div>
                </div>

                {/* Validation Error Alert */}
                {bookingValidationError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-900">
                    <AlertOctagon className="size-4 shrink-0 text-rose-600" />
                    <span>{bookingValidationError}</span>
                  </div>
                )}

                <form onSubmit={handleInitiateBookAppointment} className="mt-6 space-y-6">
                  {/* Step 1 & 2: Department and Doctor Selection */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)]">
                        1. Select Department / Specialization *
                      </label>
                      <select
                        value={bookingSpec}
                        onChange={(e) => {
                          const spec = e.target.value
                          setBookingSpec(spec)
                          const matching = doctors.filter((d) => d.specialization.toLowerCase() === spec.toLowerCase())
                          if (matching.length > 0) {
                            setBookingDoctorId(matching[0].id)
                          }
                          setBookingTime('')
                        }}
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-semibold outline-none focus:border-purple-600"
                      >
                        {HOSPITAL_SPECIALIZATIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)]">2. Select Doctor *</label>
                      <select
                        value={bookingDoctorId}
                        onChange={(e) => {
                          setBookingDoctorId(e.target.value)
                          setBookingTime('')
                        }}
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-semibold outline-none focus:border-purple-600"
                      >
                        {doctors
                          .filter((d) => d.specialization.toLowerCase() === bookingSpec.toLowerCase())
                          .map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.roomNumber || 'OPD'})
                            </option>
                          ))}
                        {doctors.filter((d) => d.specialization.toLowerCase() === bookingSpec.toLowerCase()).length === 0 && (
                          <option value="demo-doctor">Dr. Alexander Wright, MD (Cardiology)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Step 3: Future Date Picker (min = today) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)] flex items-center justify-between">
                        <span>3. Select Appointment Date *</span>
                        <span className="text-[10px] text-purple-700 font-semibold">Today or Future Dates Only</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={getTodayDateIso()}
                        value={bookingDate}
                        onChange={(e) => {
                          setBookingDate(e.target.value)
                          setBookingTime('')
                          setBookingValidationError(null)
                        }}
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-bold outline-none focus:border-purple-600"
                      />
                      <p className="mt-1 text-[10px] text-[var(--care-muted)]">
                        Past dates are strictly disabled by system appointment rules.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)]">Consultation Visit Type *</label>
                      <select
                        value={bookingVisitType}
                        onChange={(e) => setBookingVisitType(e.target.value as any)}
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-semibold outline-none focus:border-purple-600"
                      >
                        <option value="New Consultation">New Consultation</option>
                        <option value="Follow-up">Follow-up Review</option>
                        <option value="Telehealth">Telehealth Video Consult</option>
                        <option value="Post-op Review">Post-op Recovery Review</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Live Available Time Slot Grid (Expired & Passed Times Blocked) */}
                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-highlight)]/30 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[var(--care-ink)]">
                        4. Select Available Time Slot *
                      </label>
                      <span className="text-[11px] text-[var(--care-muted)]">
                        Times that have already passed are automatically disabled.
                      </span>
                    </div>

                    {availableSlots.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[var(--care-muted)]">
                        No slots generated for selected date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                        {availableSlots.map((slot) => {
                          const isSelected = bookingTime === slot.time
                          const isAvailable = slot.status === 'AVAILABLE'

                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => {
                                if (isAvailable) {
                                  setBookingTime(slot.time)
                                  setBookingValidationError(null)
                                }
                              }}
                              className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition ${
                                !isAvailable
                                  ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                                  : isSelected
                                  ? 'border-2 border-purple-600 bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                                  : 'border border-[var(--care-border)] bg-[var(--care-surface)] text-[var(--care-ink)] hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <span className="font-bold">{slot.time}</span>
                              <span className="mt-0.5 text-[9px] font-semibold">
                                {slot.status === 'AVAILABLE' && (isSelected ? 'Selected' : 'Available')}
                                {slot.status === 'EXPIRED' && 'Passed'}
                                {slot.status === 'BOOKED' && 'Booked'}
                                {slot.status === 'DOCTOR_ON_LEAVE' && 'On Leave'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="text-xs font-bold text-[var(--care-ink)]">Reason for Appointment *</label>
                    <textarea
                      rows={2}
                      required
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      placeholder="Briefly describe your symptoms or reason for visit..."
                      className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-3 text-xs outline-none focus:border-purple-600 leading-relaxed"
                    />
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-3 border-t border-[var(--care-border)] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!bookingTime}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CalendarCheck className="size-4" />
                      Review & Confirm Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MY BILLS & PAYMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">My Hospital Bills & Payments</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      View itemized prescription invoices, payment receipts, and settlement status
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <Receipt className="size-4" />
                    <span>Total Invoices: {myBills.length}</span>
                  </div>
                </div>

                {/* Bills Table */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-highlight)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3 sm:px-6">Bill ID</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Medicines & Items</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Payment Status</th>
                        <th className="px-4 py-3">Dispensing Status</th>
                        <th className="px-4 py-3 text-right sm:pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {myBills.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-[var(--care-muted)] italic">
                            You don&apos;t have any bills yet.
                          </td>
                        </tr>
                      ) : (
                        myBills.map((bill) => (
                          <tr key={bill.id} className="transition hover:bg-[var(--care-highlight)]/30">
                            <td className="px-4 py-3.5 sm:px-6 font-mono font-bold text-purple-700">
                              {bill.billNumber}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-[var(--care-ink)]">{bill.createdAt || 'Today'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-xs font-medium text-[var(--care-ink)]">
                                {bill.medicines?.length || 0} Medication Items
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-sm text-[var(--care-ink)]">
                              ₹{bill.finalAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                  bill.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800 animate-pulse'
                                }`}
                              >
                                {bill.paymentStatus === 'PAID' && <CheckCircle2 className="size-3" />}
                                {bill.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  bill.status === 'DISPENSED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : bill.status === 'READY_FOR_DISPENSING'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {bill.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right sm:pr-6">
                              <button
                                onClick={() => setSelectedBillForDetail(bill)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--care-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                              >
                                <Eye className="size-3" />
                                Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MY MEDICINES & PRESCRIPTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'medicines' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">My Prescribed Medicines & e-Prescriptions</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      View full dosage schedules, intake timings, duration, and doctor instructions
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-800 border border-indigo-200">
                    <Pill className="size-4" />
                    <span>{myPrescriptions.length} Prescriptions Found</span>
                  </div>
                </div>

                {myPrescriptions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--care-muted)]">
                    <Pill className="mx-auto size-8 text-[var(--care-muted)] opacity-50 mb-2" />
                    <p className="font-semibold text-sm">No active medicines found.</p>
                    <p className="mt-1">When your doctor prescribes medications, they will appear here with instructions.</p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {myPrescriptions.map((rx) => (
                      <div key={rx.id} className="rounded-2xl border border-[var(--care-border)] p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--care-border)] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[var(--care-ink)]">{rx.diagnosis}</span>
                              <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                                Rx ID: {rx.id}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--care-muted)] mt-0.5">
                              Prescribed by <strong>{rx.doctorName}</strong> · Nurse: {rx.nurseName} · Date: {rx.createdAt}
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              rx.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {rx.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Medicine Items Grid */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {rx.medications.map((m) => (
                            <div key={m.id} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-indigo-950">
                                <span>{m.name}</span>
                                <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-extrabold text-indigo-800">
                                  {m.dosage}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--care-muted)]">
                                <strong>Frequency:</strong> {m.frequency} ({m.timingInstructions})
                              </div>
                              <div className="text-[11px] text-[var(--care-muted)]">
                                <strong>Duration:</strong> {m.durationDays} Days
                              </div>
                              {m.instructions && (
                                <div className="text-[11px] text-indigo-900 italic pt-1 border-t border-indigo-100/60">
                                  &quot;{m.instructions}&quot;
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Nurse Notes / Advice */}
                        {rx.nurseNotes && (
                          <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-highlight)]/40 p-3 text-xs">
                            <span className="font-bold text-[var(--care-ink)]">Nurse Care Notes: </span>
                            <span className="text-[var(--care-muted)]">{rx.nurseNotes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MY QUEUE TRACKER */}
          {/* ========================================================================= */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">My Live Consultation Queue Tracker</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Real-time queue updates, call alerts, and waiting room positioning
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
                    <span className="size-2 rounded-full bg-amber-600 animate-pulse" /> Live Polling Active
                  </span>
                </div>

                {/* Queue Card */}
                {myQueueEntry ? (
                  <div className="mt-6 space-y-6">
                    {/* Transfer Banner */}
                    {queueStats?.isTransferred && (
                      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <ArrowRightLeft className="size-4 text-amber-700" />
                          <span>Doctor Queue Reassignment Notice</span>
                        </div>
                        <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                          Your assigned Doctor was redirected to <strong>{queueStats.entry.doctorName}</strong> ({queueStats.entry.specialization})
                          {' '}while Dr. {queueStats.entry.transferredFromDoctorName} is attending to an emergency.
                          {' '}Your position in queue is verified and preserved.
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/30 p-6 shadow-md text-center space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-800">Your OPD Token Number</div>
                      <div className="font-mono text-5xl font-black text-amber-900">
                        {myQueueEntry.queueNumber}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                            myQueueEntry.status === 'CALLED'
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : myQueueEntry.status === 'IN_CONSULTATION'
                              ? 'bg-blue-600 text-white'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          STATUS: {myQueueEntry.status.replace('_', ' ')}
                        </span>
                      </div>

                      {myQueueEntry.status === 'CALLED' && (
                        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-950 animate-pulse">
                          🔔 You are being called for consultation! Please proceed to the doctor&apos;s room now.
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-amber-200 text-xs text-left">
                        <div>
                          <span className="text-amber-800">Assigned Doctor:</span>
                          <p className="font-bold text-amber-950">{myQueueEntry.doctorName}</p>
                        </div>
                        <div>
                          <span className="text-amber-800">Specialization:</span>
                          <p className="font-bold text-amber-950">{myQueueEntry.specialization}</p>
                        </div>
                        <div>
                          <span className="text-amber-800">Current Position:</span>
                          <p className="font-bold text-amber-950">#{queueStats?.position || 1} ({queueStats?.patientsAhead || 0} Ahead)</p>
                        </div>
                        <div>
                          <span className="text-amber-800">Est. Wait Time:</span>
                          <p className="font-bold text-amber-950">~{queueStats?.estimatedMinutes || 10} minutes</p>
                        </div>
                      </div>

                      {queueStats?.doctorLocation && (
                        <div className="pt-2 flex justify-center">
                          <button
                            onClick={() => handleLaunchNavigationToLocation(queueStats.doctorLocation!)}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-800"
                          >
                            <Compass className="size-4" />
                            Navigate to Room {queueStats.doctorLocation.roomNumber} ({queueStats.doctorLocation.floor})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[var(--care-muted)]">
                    <Clock className="mx-auto size-8 text-[var(--care-muted)] opacity-50 mb-2" />
                    <p className="font-semibold text-sm">You are not currently in a consultation queue.</p>
                    <p className="mt-1">When you check in at the Reception Desk or arrive for your appointment, your token will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOSPITAL NAVIGATION & INTERACTIVE MAP */}
          {/* ========================================================================= */}
          {activeTab === 'navigation' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">Hospital Navigation & Floor Finder</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Find rooms, doctors, emergency triage, pharmacy, and diagnostic laboratories
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-800 border border-cyan-200">
                    <MapPin className="size-4" />
                    <span>Start: Main Admissions & Reception Desk (Ground Floor)</span>
                  </div>
                </div>

                {/* Search & Floor Filter */}
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                    <input
                      type="text"
                      value={navSearchQuery}
                      onChange={(e) => setNavSearchQuery(e.target.value)}
                      placeholder="Search doctor name, room number, cardiology, pharmacy, lab..."
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] pl-9 pr-3 text-xs outline-none focus:border-cyan-600"
                    />
                    {navSearchQuery && (
                      <button
                        onClick={() => setNavSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={navCategoryFilter}
                    onChange={(e) => setNavCategoryFilter(e.target.value)}
                    className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-semibold outline-none focus:border-cyan-600"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Clinical">Doctor OPD Rooms</option>
                    <option value="Diagnostics">Labs & Imaging</option>
                    <option value="Pharmacy">Pharmacy & Dispensary</option>
                    <option value="Billing">Billing & Cashier</option>
                    <option value="Emergency">Emergency Trauma</option>
                    <option value="Wards">Inpatient Wards</option>
                    <option value="Amenities">Cafeteria & Lounge</option>
                  </select>
                </div>

                {/* Floor Tabs */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-2">
                  {['ALL', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', 'Basement'].map((fl) => (
                    <button
                      key={fl}
                      onClick={() => setSelectedFloorTab(fl as any)}
                      className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        selectedFloorTab === fl
                          ? 'bg-cyan-700 text-white shadow-sm'
                          : 'border border-[var(--care-border)] text-[var(--care-muted)] hover:bg-[var(--care-highlight)]'
                      }`}
                    >
                      {fl}
                    </button>
                  ))}
                </div>

                {/* Selected Destination Turn-by-Turn Route Box */}
                {selectedDestination && (
                  <div className="mt-4 rounded-2xl border-2 border-cyan-400 bg-cyan-50/50 p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                          Active Navigation Route
                        </div>
                        <h4 className="text-base font-black text-cyan-950">{selectedDestination.name}</h4>
                        <div className="text-xs font-bold text-cyan-800">
                          {selectedDestination.building} · {selectedDestination.floor} · Room {selectedDestination.roomNumber}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDestination(null)}
                        className="rounded-lg p-1 text-cyan-700 hover:bg-cyan-100"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <p className="text-xs text-cyan-900 leading-relaxed">
                      <strong>Landmark:</strong> {selectedDestination.landmarks}
                    </p>

                    {/* Step-by-step path */}
                    <div className="rounded-xl border border-cyan-200 bg-white p-3 space-y-2">
                      <div className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                        <Route className="size-4 text-cyan-600" />
                        <span>Step-by-Step Directions:</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-[var(--care-ink)] pl-2">
                        {selectedDestination.routeSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-800">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hospital Locations Grid */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className="rounded-2xl border border-[var(--care-border)] p-4 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-50/20 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-extrabold text-cyan-800">
                            {loc.floor}
                          </span>
                          <span className="font-mono text-xs font-bold text-[var(--care-muted)]">
                            Room {loc.roomNumber}
                          </span>
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-[var(--care-ink)]">{loc.name}</h4>
                        <div className="text-[11px] text-cyan-700 font-semibold">{loc.department}</div>
                        <p className="mt-2 text-[11px] text-[var(--care-muted)] leading-relaxed">
                          {loc.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--care-border)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--care-muted)]">{loc.building}</span>
                        <button
                          onClick={() => setSelectedDestination(loc)}
                          className="inline-flex items-center gap-1 rounded-lg bg-cyan-700 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-800"
                        >
                          <Compass className="size-3.5" />
                          Navigate Route
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOSPITAL SERVICES */}
          {/* ========================================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">CareLink Hospital Services Directory</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Explore our clinical departments, emergency care, operating hours, and specialists
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('book')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                  >
                    <PlusCircle className="size-4" />
                    Book Consultation
                  </button>
                </div>

                {/* Search & Filter */}
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      placeholder="Search specialty, cardiology, pediatrician, lab, MRI..."
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] pl-9 pr-3 text-xs outline-none focus:border-teal-600"
                    />
                    {serviceSearchQuery && (
                      <button
                        onClick={() => setServiceSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={serviceDeptFilter}
                    onChange={(e) => setServiceDeptFilter(e.target.value)}
                    className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-semibold outline-none focus:border-teal-600"
                  >
                    <option value="ALL">All Departments</option>
                    {HOSPITAL_SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="Diagnostics">Diagnostics & Imaging</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Billing">Billing & Claims</option>
                  </select>
                </div>

                {/* Services Grid */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((srv) => (
                    <div
                      key={srv.id}
                      className="rounded-2xl border border-[var(--care-border)] p-5 shadow-sm transition hover:border-teal-400 hover:bg-teal-50/20 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-800">
                            {srv.category}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--care-muted)]">{srv.operatingHours}</span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-[var(--care-ink)]">{srv.name}</h4>
                        <div className="text-xs text-teal-700 font-semibold">{srv.department}</div>
                        <p className="mt-2 text-xs text-[var(--care-muted)] leading-relaxed">
                          {srv.description}
                        </p>

                        <div className="mt-3 text-[11px] text-[var(--care-ink)] space-y-1">
                          <div>📍 <strong>Location:</strong> {srv.locationName} ({srv.floor})</div>
                          {srv.availableDoctors.length > 0 && (
                            <div>👨‍⚕️ <strong>Doctors:</strong> {srv.availableDoctors.join(', ')}</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--care-border)] flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            const matchLoc = locations.find((l) => l.department.toLowerCase() === srv.department.toLowerCase() || l.name.toLowerCase().includes(srv.department.toLowerCase()))
                            if (matchLoc) handleLaunchNavigationToLocation(matchLoc)
                            else setActiveTab('navigation')
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900 hover:bg-cyan-100"
                        >
                          <Compass className="size-3.5" />
                          Navigate
                        </button>

                        {srv.supportsAppointment && (
                          <button
                            onClick={() => {
                              setBookingSpec(srv.department)
                              const matchingDoc = doctors.find((d) => d.specialization.toLowerCase() === srv.department.toLowerCase())
                              if (matchingDoc) setBookingDoctorId(matchingDoc.id)
                              setActiveTab('book')
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
                          >
                            Book Appointment →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PROFILE */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-purple-600 text-white font-extrabold text-xl shadow-lg shadow-purple-600/30">
                    {currentUser?.avatarInitials || 'AO'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">{patientName}</h3>
                    <p className="text-xs text-[var(--care-muted)]">Registered CareLink Hospital Patient</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        {patientMrn}
                      </span>
                      <span className="text-[11px] text-[var(--care-muted)]">
                        {currentUser?.email || 'patient@carelink.health'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-6 border-t border-[var(--care-border)] text-xs">
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Age & Gender:</span>
                    <p className="font-bold text-[var(--care-ink)]">34 yrs · Female</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Blood Group:</span>
                    <p className="font-bold text-purple-800">O+ (Positive)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Known Allergies:</span>
                    <p className="font-bold text-rose-700">None known</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Emergency Contact:</span>
                    <p className="font-bold text-[var(--care-ink)]">Chidi Okafor (+91 99887 76655)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Primary Attending Physician:</span>
                    <p className="font-bold text-teal-700">Dr. Alexander Wright, MD (Cardiology)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Insurance Coverage:</span>
                    <p className="font-bold text-emerald-700">BlueCross Comprehensive (100% Cashless)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: APPOINTMENT CONFIRMATION */}
      {/* ========================================================================= */}
      {showBookingConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-[var(--care-ink)]">
                <CalendarCheck className="size-5 text-purple-600" />
                <span>Appointment Confirmation</span>
              </div>
              <button
                onClick={() => setShowBookingConfirmModal(false)}
                className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--care-muted)]">Doctor:</span>
                <span className="font-bold text-[var(--care-ink)]">
                  {doctors.find((d) => d.id === bookingDoctorId)?.name || 'Dr. Alexander Wright'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--care-muted)]">Specialization:</span>
                <span className="font-bold text-purple-700">{bookingSpec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--care-muted)]">Date:</span>
                <span className="font-bold text-[var(--care-ink)]">{bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--care-muted)]">Time Slot:</span>
                <span className="font-bold text-emerald-700">{bookingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--care-muted)]">Visit Type:</span>
                <span className="font-bold text-[var(--care-ink)]">{bookingVisitType}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--care-border)]">
              <button
                type="button"
                onClick={() => setShowBookingConfirmModal(false)}
                className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAppointmentSubmission}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700"
              >
                <Check className="size-4" />
                Confirm & Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL APPOINTMENT CONFIRMATION */}
      {/* ========================================================================= */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-rose-900">
              <AlertTriangle className="size-5 text-rose-600" />
              <span>Cancel Appointment?</span>
            </div>

            <p className="text-xs text-[var(--care-ink)] leading-relaxed">
              Are you sure you want to cancel your appointment with <strong>{cancellingAppt.doctorName}</strong> on{' '}
              <strong>{cancellingAppt.requestedDate}</strong> at <strong>{cancellingAppt.requestedTime}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--care-border)]">
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelAppointment}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                Yes, Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BILL DETAILS */}
      {/* ========================================================================= */}
      {selectedBillForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--care-border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--care-ink)]">
                  Invoice {selectedBillForDetail.billNumber}
                </h3>
                <div className="text-xs text-[var(--care-muted)]">
                  Date: {selectedBillForDetail.createdAt || 'Today'} · Patient: {patientName} ({patientMrn})
                </div>
              </div>
              <button
                onClick={() => setSelectedBillForDetail(null)}
                className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Medicines Table */}
              <div className="overflow-x-auto rounded-xl border border-[var(--care-border)]">
                <table className="w-full text-left">
                  <thead className="border-b border-[var(--care-border)] bg-[var(--care-highlight)]/50 text-[10px] font-bold uppercase text-[var(--care-muted)]">
                    <tr>
                      <th className="p-2.5">Medicine</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--care-border)]">
                    {selectedBillForDetail.medicines?.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-[var(--care-ink)]">{m.name}</td>
                        <td className="p-2.5 text-center">{m.quantity}</td>
                        <td className="p-2.5 text-right">₹{m.unitPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold">₹{m.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-highlight)]/30 p-3 space-y-1 text-xs">
                <div className="flex justify-between text-[var(--care-muted)]">
                  <span>Subtotal:</span>
                  <span>₹{selectedBillForDetail.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--care-muted)]">
                  <span>Discount:</span>
                  <span>₹{selectedBillForDetail.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--care-muted)]">
                  <span>Tax:</span>
                  <span>₹{selectedBillForDetail.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[var(--care-ink)] pt-1 border-t border-[var(--care-border)]">
                  <span>Final Total Amount:</span>
                  <span>₹{selectedBillForDetail.finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-emerald-700 pt-1">
                  <span>Payment Status:</span>
                  <span>{selectedBillForDetail.paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--care-border)]">
              <button
                onClick={() => setSelectedBillForDetail(null)}
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={currentUser}
      />
    </div>
  )
}
