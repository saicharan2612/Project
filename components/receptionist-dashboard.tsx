'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DemoAccount,
  HospitalDoctor,
  HospitalNurse,
  HospitalNotification,
  LeaveRequest,
  PatientRecord,
  QueueEntry,
  QueuePriorityType,
  QueueStatusType,
  QueueTransferRecord,
  HOSPITAL_SPECIALIZATIONS,
  addHospitalNotification,
  deleteStaffAccount,
  findDemoAccount,
  generateDoctorQueueNumber,
  generateQueueTransferId,
  generateUniquePatientId,
  getAllAccounts,
  getDemoAccountByRole,
  getEligibleReplacementsForStaff,
  getStoredHospitalDoctors,
  getStoredHospitalNurses,
  getStoredLeaveRequests,
  getStoredNotifications,
  getStoredPatients,
  getStoredQueueEntries,
  getStoredQueueTransfers,
  saveHospitalDoctors,
  saveHospitalNurses,
  saveLeaveRequests,
  saveNotifications,
  savePatients,
  saveQueueEntries,
  saveQueueTransfers,
  validateQueueTransfer
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
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  History,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Pencil,
  Phone,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react'

type ReceptionistTab =
  | 'overview'
  | 'register'
  | 'emergency'
  | 'patients'
  | 'queue'
  | 'transfers'
  | 'leave'
  | 'profile'

export function ReceptionistDashboard() {
  const router = useRouter()

  // State: Core entities
  const [currentUser, setCurrentUser] = useState<DemoAccount | null>(null)
  const [activeTab, setActiveTab] = useState<ReceptionistTab>('overview')
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([])
  const [nurses, setNurses] = useState<HospitalNurse[]>([])
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [queueTransfers, setQueueTransfers] = useState<QueueTransferRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [notifications, setNotifications] = useState<HospitalNotification[]>([])
  const [allStaffAccounts, setAllStaffAccounts] = useState<DemoAccount[]>([])

  // Notifications popup
  const [showNotifications, setShowNotifications] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

  // Filters & Search
  const [queueDoctorFilter, setQueueDoctorFilter] = useState<string>('ALL')
  const [queueSpecFilter, setQueueSpecFilter] = useState<string>('ALL')
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL')
  const [queueSearchQuery, setQueueSearchQuery] = useState<string>('')

  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('')
  const [patientTypeFilter, setPatientTypeFilter] = useState<string>('ALL')

  const [transferSearchQuery, setTransferSearchQuery] = useState<string>('')

  // Modals
  const [selectedPatientForView, setSelectedPatientForView] = useState<PatientRecord | null>(null)
  const [assignModalPatient, setAssignModalPatient] = useState<PatientRecord | null>(null)
  const [assignSelectedDoctorId, setAssignSelectedDoctorId] = useState<string>('')
  const [assignSelectedNurseId, setAssignSelectedNurseId] = useState<string>('')
  const [assignPriority, setAssignPriority] = useState<QueuePriorityType>('NORMAL')
  const [assignNotes, setAssignNotes] = useState<string>('')

  // Emergency Queue Redirection Modal
  const [showRedirectModal, setShowRedirectModal] = useState<boolean>(false)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [redirectSourceDoctor, setRedirectSourceDoctor] = useState<HospitalDoctor | null>(null)
  const [redirectTargetDoctorId, setRedirectTargetDoctorId] = useState<string>('')
  const [redirectMode, setRedirectMode] = useState<'ALL' | 'SELECTED'>('ALL')
  const [redirectSelectedQueueIds, setRedirectSelectedQueueIds] = useState<string[]>([])
  const [redirectReason, setRedirectReason] = useState<string>('Attending emergency cardiac patient in ER')
  const [redirectCustomReason, setRedirectCustomReason] = useState<string>('')
  const [redirectValidationError, setRedirectValidationError] = useState<string | null>(null)
  const [showConfirmRedirectPrompt, setShowConfirmRedirectPrompt] = useState<boolean>(false)

  // Duplicate Check in Registration
  const [dupSearchQuery, setDupSearchQuery] = useState<string>('')
  const [matchedExistingPatient, setMatchedExistingPatient] = useState<PatientRecord | null>(null)

  // Normal Patient Registration Form
  const [regForm, setRegForm] = useState({
    fullName: '',
    dob: '1992-05-14',
    age: '34',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '+91 ',
    email: '',
    address: 'City Heights, Sector 4, New Delhi',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: 'O+' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    allergies: 'None known',
    requiredSpecialization: 'Cardiology',
    assignDoctorDirectly: true,
    doctorId: 'demo-doctor',
    nurseId: 'demo-nurse',
    notes: 'Routine outpatient consultation registration.'
  })

  // Emergency Patient Registration Form
  const [emergencyForm, setEmergencyForm] = useState({
    fullName: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: 'Unknown',
    allergies: 'Unknown / Under Triage',
    requiredSpecialization: 'Cardiology',
    doctorId: 'demo-doctor',
    nurseId: 'demo-nurse',
    emergencyReason: 'Severe chest tightness radiating to left arm & acute dyspnea',
    notes: 'STAT triage registration. Urgent vital stabilization required.'
  })

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual Leave' as 'Casual Leave' | 'Sick Leave' | 'Annual Vacation' | 'Emergency Medical Leave',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    shift: 'Morning (08:00 - 16:00)',
    reason: 'Family emergency / urgent personal commitment.',
    replacementStaffId: 'rep-rec-1'
  })

  // Auto-dismiss toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }

  // Initial Data Load
  useEffect(() => {
    const sessionEmail = typeof window !== 'undefined' ? localStorage.getItem('carelink_session_email') : null
    let account = sessionEmail ? findDemoAccount(sessionEmail) : null
    if (!account) {
      account = getDemoAccountByRole('receptionist') || null
    }
    setCurrentUser(account)

    setPatients(getStoredPatients())
    setDoctors(getStoredHospitalDoctors())
    setNurses(getStoredHospitalNurses())
    setQueueEntries(getStoredQueueEntries())
    setQueueTransfers(getStoredQueueTransfers())
    setLeaveRequests(getStoredLeaveRequests())
    setNotifications(getStoredNotifications())
    setAllStaffAccounts(getAllAccounts())
  }, [])

  // Sync state helpers
  const updatePatients = (updated: PatientRecord[]) => {
    setPatients(updated)
    savePatients(updated)
  }

  const updateDoctors = (updated: HospitalDoctor[]) => {
    setDoctors(updated)
    saveHospitalDoctors(updated)
  }

  const updateNurses = (updated: HospitalNurse[]) => {
    setNurses(updated)
    saveHospitalNurses(updated)
  }

  const updateQueueEntries = (updated: QueueEntry[]) => {
    setQueueEntries(updated)
    saveQueueEntries(updated)
  }

  const updateQueueTransfers = (updated: QueueTransferRecord[]) => {
    setQueueTransfers(updated)
    saveQueueTransfers(updated)
  }

  const updateLeaveRequests = (updated: LeaveRequest[]) => {
    setLeaveRequests(updated)
    saveLeaveRequests(updated)
  }

  const updateNotifications = (updated: HospitalNotification[]) => {
    setNotifications(updated)
    saveNotifications(updated)
  }

  // Real-time Metrics Calculation
  const metrics = useMemo(() => {
    const todayPatients = patients.filter((p) => p.registrationDate === 'Today' || p.registeredAt?.includes('Today') || p.id).length
    const waitingPatients = queueEntries.filter((q) => q.status === 'WAITING' || q.status === 'CALLED').length
    const inConsultationPatients = queueEntries.filter((q) => q.status === 'IN_CONSULTATION').length
    const assignedPatients = queueEntries.filter((q) => q.doctorId && q.status !== 'CANCELLED').length
    const emergencyPatients = queueEntries.filter((q) => q.priority === 'EMERGENCY' && q.status !== 'COMPLETED' && q.status !== 'CANCELLED').length
    const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length
    const busyDoctors = doctors.filter((d) => d.status === 'BUSY' || d.status === 'IN_EMERGENCY').length

    return {
      todayPatients,
      waitingPatients,
      inConsultationPatients,
      assignedPatients,
      emergencyPatients,
      availableDoctors,
      busyDoctors,
      totalDoctors: doctors.length
    }
  }, [patients, queueEntries, doctors])

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queueEntries.filter((item) => {
      const matchDoc = queueDoctorFilter === 'ALL' || item.doctorId === queueDoctorFilter
      const matchSpec = queueSpecFilter === 'ALL' || item.specialization?.toLowerCase() === queueSpecFilter.toLowerCase()
      const matchStatus = queueStatusFilter === 'ALL' || item.status === queueStatusFilter
      const matchQuery =
        !queueSearchQuery ||
        item.patientName.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        item.patientMrn.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        item.queueNumber.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        item.doctorName.toLowerCase().includes(queueSearchQuery.toLowerCase())

      return matchDoc && matchSpec && matchStatus && matchQuery
    })
  }, [queueEntries, queueDoctorFilter, queueSpecFilter, queueStatusFilter, queueSearchQuery])

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchType = patientTypeFilter === 'ALL' || (p.registrationType || 'NORMAL') === patientTypeFilter
      const matchSearch =
        !patientSearchQuery ||
        p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.mrn.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        (p.phone && p.phone.toLowerCase().includes(patientSearchQuery.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(patientSearchQuery.toLowerCase())) ||
        (p.primaryPhysician && p.primaryPhysician.toLowerCase().includes(patientSearchQuery.toLowerCase()))

      return matchType && matchSearch
    })
  }, [patients, patientTypeFilter, patientSearchQuery])

  // Filtered Transfers List
  const filteredTransfers = useMemo(() => {
    return queueTransfers.filter((t) => {
      if (!transferSearchQuery) return true
      const q = transferSearchQuery.toLowerCase()
      return (
        t.patientName.toLowerCase().includes(q) ||
        t.patientMrn.toLowerCase().includes(q) ||
        t.originalDoctorName.toLowerCase().includes(q) ||
        t.newDoctorName.toLowerCase().includes(q) ||
        t.originalSpecialization.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    })
  }, [queueTransfers, transferSearchQuery])

  const getDoctorsForSpecialization = (specialization: string) => {
    if (!specialization) return doctors
    return doctors.filter((d) => d.specialization?.toLowerCase() === specialization.toLowerCase())
  }

  // Duplicate Check Handler
  const handleDuplicateSearch = (query: string) => {
    setDupSearchQuery(query)
    const clean = query.trim().toLowerCase()
    if (!clean || clean.length < 3) {
      setMatchedExistingPatient(null)
      return
    }

    const match = patients.find((p) => {
      const phoneMatch = p.phone && p.phone.replace(/[^0-9]/g, '').includes(clean.replace(/[^0-9]/g, ''))
      const emailMatch = p.email && p.email.toLowerCase().includes(clean)
      const mrnMatch = p.mrn.toLowerCase().includes(clean)
      const nameMatch = p.name.toLowerCase().includes(clean)
      return (phoneMatch && clean.replace(/[^0-9]/g, '').length >= 4) || emailMatch || mrnMatch || (nameMatch && clean.length >= 4)
    })

    setMatchedExistingPatient(match || null)
  }

  const useExistingPatientForNewVisit = (patient: PatientRecord) => {
    setRegForm((prev) => ({
      ...prev,
      fullName: patient.name,
      dob: patient.dob || '1990-01-01',
      age: String(patient.age || '35'),
      gender: patient.gender === 'Female' ? 'Female' : 'Male',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      bloodGroup: (patient.bloodGroup as any) || 'O+',
      allergies: patient.allergies || 'None known'
    }))
    showToast(`Loaded details for ${patient.name} (${patient.mrn}). You can assign a doctor and add to queue without duplicating records!`, 'info')
  }

  // Normal Patient Registration Submit
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault()

    if (!regForm.fullName.trim()) {
      showToast('Please enter the patient full name.', 'error')
      return
    }

    let patientId = ''
    let patientMrn = ''
    let isNewRecord = true

    if (matchedExistingPatient) {
      patientId = matchedExistingPatient.id
      patientMrn = matchedExistingPatient.mrn
      isNewRecord = false
    } else {
      patientId = `pt-${Date.now().toString().slice(-4)}`
      patientMrn = generateUniquePatientId(patients)
    }

    const assignedDoc = doctors.find((d) => d.id === regForm.doctorId)
    const assignedNur = nurses.find((n) => n.id === regForm.nurseId)

    const newPatient: PatientRecord = {
      id: patientId,
      name: regForm.fullName.trim(),
      mrn: patientMrn,
      age: parseInt(regForm.age, 10) || 30,
      gender: regForm.gender,
      dob: regForm.dob,
      phone: regForm.phone.trim(),
      email: regForm.email.trim() || `${regForm.fullName.toLowerCase().replace(/\s+/g, '.')}@patient.carelink.health`,
      address: regForm.address.trim(),
      emergencyContactName: regForm.emergencyContactName.trim(),
      emergencyContactPhone: regForm.emergencyContactPhone.trim(),
      bloodGroup: regForm.bloodGroup,
      allergies: regForm.allergies.trim(),
      registrationType: 'NORMAL',
      registrationDate: 'Today',
      requiredSpecialization: regForm.requiredSpecialization,
      assignedDoctorId: assignedDoc?.id,
      assignedDoctorName: assignedDoc?.name,
      assignedNurseId: assignedNur?.id,
      assignedNurseName: assignedNur?.name,
      room: assignedDoc?.roomNumber || 'OPD Waiting Lounge',
      condition: 'Stable',
      priority: 'Routine',
      admittedDate: 'Today',
      primaryPhysician: assignedDoc?.name || 'Dr. Alexander Wright, MD',
      nurseInCharge: assignedNur?.name || 'Elena Rostova, RN',
      billingStatus: 'Up to date'
    }

    let updatedPatients: PatientRecord[] = []
    if (isNewRecord) {
      updatedPatients = [newPatient, ...patients]
    } else {
      updatedPatients = patients.map((p) => (p.id === patientId ? { ...p, ...newPatient } : p))
    }
    updatePatients(updatedPatients)

    if (regForm.assignDoctorDirectly && assignedDoc) {
      const qNum = generateDoctorQueueNumber(regForm.requiredSpecialization, 'NORMAL', queueEntries)
      const newQueueEntry: QueueEntry = {
        id: `q-${Date.now()}`,
        queueNumber: qNum,
        patientId: patientId,
        patientName: newPatient.name,
        patientMrn: patientMrn,
        doctorId: assignedDoc.id,
        doctorName: assignedDoc.name,
        specialization: assignedDoc.specialization || regForm.requiredSpecialization,
        nurseId: assignedNur?.id,
        nurseName: assignedNur?.name,
        priority: 'NORMAL',
        status: 'WAITING',
        registeredAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        assignedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        waitingTimeMinutes: 0,
        notes: regForm.notes
      }

      updateQueueEntries([newQueueEntry, ...queueEntries])

      const updatedDocs = doctors.map((d) => (d.id === assignedDoc.id ? { ...d, currentQueueCount: (d.currentQueueCount || 0) + 1 } : d))
      updateDoctors(updatedDocs)

      addHospitalNotification({
        toRole: 'doctor',
        toUserId: assignedDoc.id,
        title: 'New Patient in Queue',
        message: `Patient ${newPatient.name} (${patientMrn}) added to queue with Token #${qNum}.`,
        type: 'info'
      })

      showToast(`Patient ${newPatient.name} registered with ID ${patientMrn} and assigned Token #${qNum}!`, 'success')
    } else {
      showToast(`Patient ${newPatient.name} successfully registered with ID ${patientMrn}!`, 'success')
    }

    setRegForm({
      fullName: '',
      dob: '1992-05-14',
      age: '34',
      gender: 'Male',
      phone: '+91 ',
      email: '',
      address: 'City Heights, Sector 4, New Delhi',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bloodGroup: 'O+',
      allergies: 'None known',
      requiredSpecialization: 'Cardiology',
      assignDoctorDirectly: true,
      doctorId: 'demo-doctor',
      nurseId: 'demo-nurse',
      notes: 'Routine outpatient consultation registration.'
    })
    setDupSearchQuery('')
    setMatchedExistingPatient(null)
    setActiveTab('queue')
  }

  // Emergency Patient Registration Submit
  const handleRegisterEmergency = (e: React.FormEvent) => {
    e.preventDefault()

    if (!emergencyForm.fullName.trim()) {
      showToast('Please enter the emergency patient name.', 'error')
      return
    }

    const assignedDoc = doctors.find((d) => d.id === emergencyForm.doctorId)
    const assignedNur = nurses.find((n) => n.id === emergencyForm.nurseId)

    if (!assignedDoc) {
      showToast('Please allocate a doctor for this emergency case.', 'error')
      return
    }

    const patientId = `pt-emg-${Date.now().toString().slice(-4)}`
    const patientMrn = generateUniquePatientId(patients)

    const newPatient: PatientRecord = {
      id: patientId,
      name: emergencyForm.fullName.trim(),
      mrn: patientMrn,
      age: parseInt(emergencyForm.age, 10) || 45,
      gender: emergencyForm.gender,
      dob: '1980-01-01',
      phone: emergencyForm.phone.trim() || 'N/A (ER)',
      email: `${emergencyForm.fullName.toLowerCase().replace(/\s+/g, '.')}@emergency.carelink.health`,
      address: 'Emergency Admissions / Triage Bay',
      emergencyContactName: emergencyForm.emergencyContactName.trim() || 'Family on route',
      emergencyContactPhone: emergencyForm.emergencyContactPhone.trim() || 'Pending',
      bloodGroup: emergencyForm.bloodGroup,
      allergies: emergencyForm.allergies.trim(),
      registrationType: 'EMERGENCY',
      registrationDate: 'Today',
      requiredSpecialization: emergencyForm.requiredSpecialization,
      assignedDoctorId: assignedDoc.id,
      assignedDoctorName: assignedDoc.name,
      assignedNurseId: assignedNur?.id,
      assignedNurseName: assignedNur?.name,
      room: 'Emergency Trauma / Resuscitation Bay 1',
      condition: 'Critical',
      priority: 'Stat Emergency',
      emergencyReason: emergencyForm.emergencyReason,
      admittedDate: 'Today',
      primaryPhysician: assignedDoc.name,
      nurseInCharge: assignedNur?.name || 'Kevin Brooks, BSN',
      billingStatus: 'Emergency Admission'
    }

    updatePatients([newPatient, ...patients])

    const qNum = generateDoctorQueueNumber(emergencyForm.requiredSpecialization, 'EMERGENCY', queueEntries)
    const newQueueEntry: QueueEntry = {
      id: `q-emg-${Date.now()}`,
      queueNumber: qNum,
      patientId: patientId,
      patientName: newPatient.name,
      patientMrn: patientMrn,
      doctorId: assignedDoc.id,
      doctorName: assignedDoc.name,
      specialization: assignedDoc.specialization || emergencyForm.requiredSpecialization,
      nurseId: assignedNur?.id,
      nurseName: assignedNur?.name,
      priority: 'EMERGENCY',
      status: 'CALLED',
      registeredAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      assignedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      calledAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      waitingTimeMinutes: 0,
      emergencyReason: emergencyForm.emergencyReason,
      notes: emergencyForm.notes
    }

    updateQueueEntries([newQueueEntry, ...queueEntries])

    const updatedDocs = doctors.map((d) => (d.id === assignedDoc.id ? { ...d, status: 'IN_EMERGENCY' as const, currentQueueCount: (d.currentQueueCount || 0) + 1 } : d))
    updateDoctors(updatedDocs)

    addHospitalNotification({
      toRole: 'doctor',
      toUserId: assignedDoc.id,
      title: 'CRITICAL EMERGENCY PATIENT ALLOCATED',
      message: `Emergency Patient ${newPatient.name} (${patientMrn}) allocated to you STAT. Reason: ${emergencyForm.emergencyReason}.`,
      type: 'urgent'
    })

    if (assignedNur) {
      addHospitalNotification({
        toRole: 'nurse',
        toUserId: assignedNur.id,
        title: 'Emergency Triage Nurse Alert',
        message: `Emergency Patient ${newPatient.name} assigned to Trauma Bay. Assist ${assignedDoc.name} immediately.`,
        type: 'urgent'
      })
    }

    showToast(`Emergency patient ${newPatient.name} registered & assigned to ${assignedDoc.name} (Token #${qNum})!`, 'success')

    const doctorWaitingCount = queueEntries.filter((q) => q.doctorId === assignedDoc.id && q.status === 'WAITING' && q.id !== newQueueEntry.id).length

    if (doctorWaitingCount > 0) {
      setRedirectSourceDoctor(assignedDoc)
      setRedirectReason(`Emergency Doctor Allocation — ${assignedDoc.name} attending STAT acute case (${newPatient.name})`)
      setRedirectSelectedQueueIds(queueEntries.filter((q) => q.doctorId === assignedDoc.id && q.status === 'WAITING').map((q) => q.id))
      setShowRedirectModal(true)
    } else {
      setActiveTab('queue')
    }

    setEmergencyForm({
      fullName: '',
      age: '',
      gender: 'Male',
      phone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bloodGroup: 'Unknown',
      allergies: 'Unknown / Under Triage',
      requiredSpecialization: 'Cardiology',
      doctorId: 'demo-doctor',
      nurseId: 'demo-nurse',
      emergencyReason: 'Severe chest tightness radiating to left arm & acute dyspnea',
      notes: 'STAT triage registration. Urgent vital stabilization required.'
    })
  }

  // Queue Item Actions
  const handleQueueStatusChange = (queueId: string, newStatus: QueueStatusType) => {
    const target = queueEntries.find((q) => q.id === queueId)
    if (!target) return

    const nowStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    const updated = queueEntries.map((q) => {
      if (q.id === queueId) {
        return {
          ...q,
          status: newStatus,
          calledAt: newStatus === 'CALLED' ? nowStr : q.calledAt,
          inConsultationAt: newStatus === 'IN_CONSULTATION' ? nowStr : q.inConsultationAt,
          completedAt: newStatus === 'COMPLETED' ? nowStr : q.completedAt
        }
      }
      return q
    })

    updateQueueEntries(updated)

    if (newStatus === 'CALLED') {
      showToast(`Called Token #${target.queueNumber} (${target.patientName}) for consultation with ${target.doctorName}.`, 'info')
    } else if (newStatus === 'IN_CONSULTATION') {
      showToast(`Consultation started for Token #${target.queueNumber} (${target.patientName}).`, 'success')
    } else if (newStatus === 'COMPLETED') {
      showToast(`Token #${target.queueNumber} marked as Completed.`, 'success')
    } else if (newStatus === 'CANCELLED') {
      showToast(`Token #${target.queueNumber} cancelled.`, 'warning')
    }
  }

  // Open Assign Doctor / Nurse Modal for Patient
  const handleOpenAssignModal = (patient: PatientRecord) => {
    setAssignModalPatient(patient)
    setAssignSelectedDoctorId(patient.assignedDoctorId || 'demo-doctor')
    setAssignSelectedNurseId(patient.assignedNurseId || 'demo-nurse')
    setAssignPriority(patient.registrationType === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL')
    setAssignNotes(`Assigned via Receptionist Desk on ${new Date().toLocaleDateString()}`)
  }

  // Submit Doctor & Nurse Assignment Modal
  const handleSavePatientAssignment = () => {
    if (!assignModalPatient) return

    const assignedDoc = doctors.find((d) => d.id === assignSelectedDoctorId)
    const assignedNur = nurses.find((n) => n.id === assignSelectedNurseId)

    if (!assignedDoc) {
      showToast('Please select a doctor to assign.', 'error')
      return
    }

    const updatedPatients = patients.map((p) => {
      if (p.id === assignModalPatient.id) {
        return {
          ...p,
          assignedDoctorId: assignedDoc.id,
          assignedDoctorName: assignedDoc.name,
          assignedNurseId: assignedNur?.id,
          assignedNurseName: assignedNur?.name,
          primaryPhysician: assignedDoc.name,
          nurseInCharge: assignedNur?.name,
          requiredSpecialization: assignedDoc.specialization || p.requiredSpecialization
        }
      }
      return p
    })
    updatePatients(updatedPatients)

    const existingQueueIndex = queueEntries.findIndex((q) => q.patientId === assignModalPatient.id && q.status !== 'COMPLETED' && q.status !== 'CANCELLED')

    if (existingQueueIndex >= 0) {
      const updatedQueue = [...queueEntries]
      const oldItem = updatedQueue[existingQueueIndex]
      updatedQueue[existingQueueIndex] = {
        ...oldItem,
        doctorId: assignedDoc.id,
        doctorName: assignedDoc.name,
        specialization: assignedDoc.specialization || oldItem.specialization,
        nurseId: assignedNur?.id,
        nurseName: assignedNur?.name,
        priority: assignPriority,
        notes: assignNotes
      }
      updateQueueEntries(updatedQueue)
    } else {
      const qNum = generateDoctorQueueNumber(assignedDoc.specialization || 'General', assignPriority, queueEntries)
      const newQueueEntry: QueueEntry = {
        id: `q-${Date.now()}`,
        queueNumber: qNum,
        patientId: assignModalPatient.id,
        patientName: assignModalPatient.name,
        patientMrn: assignModalPatient.mrn,
        doctorId: assignedDoc.id,
        doctorName: assignedDoc.name,
        specialization: assignedDoc.specialization,
        nurseId: assignedNur?.id,
        nurseName: assignedNur?.name,
        priority: assignPriority,
        status: 'WAITING',
        registeredAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        assignedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        waitingTimeMinutes: 0,
        notes: assignNotes
      }
      updateQueueEntries([newQueueEntry, ...queueEntries])
    }

    addHospitalNotification({
      toRole: 'doctor',
      toUserId: assignedDoc.id,
      title: 'Patient Assigned to Your Queue',
      message: `Receptionist assigned patient ${assignModalPatient.name} (${assignModalPatient.mrn}) to your queue.`,
      type: 'info'
    })

    showToast(`Patient ${assignModalPatient.name} successfully assigned to ${assignedDoc.name}!`, 'success')
    setAssignModalPatient(null)
  }

  // Open Queue Redirection Modal for a Doctor
  const handleOpenRedirectModal = (doctor: HospitalDoctor) => {
    setRedirectSourceDoctor(doctor)
    setRedirectTargetDoctorId('')
    setRedirectMode('ALL')
    setRedirectReason(`Emergency Doctor Allocation — ${doctor.name} attending STAT emergency case`)
    setRedirectCustomReason('')
    setRedirectValidationError(null)
    setShowConfirmRedirectPrompt(false)

    const waitingIds = queueEntries.filter((q) => q.doctorId === doctor.id && (q.status === 'WAITING' || q.status === 'CALLED')).map((q) => q.id)
    setRedirectSelectedQueueIds(waitingIds)
    setShowRedirectModal(true)
  }

  // Execute Queue Redirection (with strict Same-Specialization Rule)
  const handleExecuteQueueRedirect = () => {
    if (!redirectSourceDoctor) {
      setRedirectValidationError('No source doctor selected.')
      return
    }

    const targetDoc = doctors.find((d) => d.id === redirectTargetDoctorId)
    if (!targetDoc) {
      setRedirectValidationError('Please select a target doctor to receive the redirected queue.')
      return
    }

    if (targetDoc.id === redirectSourceDoctor.id) {
      setRedirectValidationError('Target doctor cannot be the same as the source doctor.')
      return
    }

    // STRICT SAME SPECIALIZATION VALIDATION
    const valResult = validateQueueTransfer(redirectSourceDoctor.specialization, targetDoc.specialization)
    if (!valResult.isValid) {
      setRedirectValidationError(valResult.error || 'Specialization mismatch!')
      return
    }

    const candidateEntries = queueEntries.filter((q) => {
      const matchDoc = q.doctorId === redirectSourceDoctor.id
      const isWaiting = q.status === 'WAITING' || q.status === 'CALLED'
      if (!matchDoc || !isWaiting) return false
      if (redirectMode === 'SELECTED') {
        return redirectSelectedQueueIds.includes(q.id)
      }
      return true
    })

    if (candidateEntries.length === 0) {
      setRedirectValidationError('No waiting patients found to redirect for this doctor.')
      return
    }

    const finalReason = redirectCustomReason.trim() ? redirectCustomReason.trim() : redirectReason
    const nowTimeStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    const newTransferRecords: QueueTransferRecord[] = []
    const updatedQueueEntries = [...queueEntries]

    candidateEntries.forEach((entry) => {
      const transferId = generateQueueTransferId([...queueTransfers, ...newTransferRecords])
      const newQNum = generateDoctorQueueNumber(targetDoc.specialization, entry.priority, updatedQueueEntries)

      const rec: QueueTransferRecord = {
        id: transferId,
        patientId: entry.patientId,
        patientName: entry.patientName,
        patientMrn: entry.patientMrn,
        originalDoctorId: redirectSourceDoctor.id,
        originalDoctorName: redirectSourceDoctor.name,
        originalSpecialization: redirectSourceDoctor.specialization,
        newDoctorId: targetDoc.id,
        newDoctorName: targetDoc.name,
        newSpecialization: targetDoc.specialization,
        originalQueueNumber: entry.queueNumber,
        newQueueNumber: newQNum,
        reason: finalReason,
        transferType: redirectSourceDoctor.status === 'IN_EMERGENCY' ? 'EMERGENCY_REALLOCATION' : 'DOCTOR_BUSY_REDIRECT',
        transferredBy: currentUser?.name || 'David Chen (Receptionist)',
        transferredAt: nowTimeStr,
        notes: `Queue redirected from ${redirectSourceDoctor.name} to ${targetDoc.name} (${targetDoc.specialization}). Same specialization verified.`
      }
      newTransferRecords.push(rec)

      const idx = updatedQueueEntries.findIndex((q) => q.id === entry.id)
      if (idx >= 0) {
        updatedQueueEntries[idx] = {
          ...entry,
          doctorId: targetDoc.id,
          doctorName: targetDoc.name,
          specialization: targetDoc.specialization,
          queueNumber: newQNum,
          status: 'WAITING',
          transferredFromDoctorId: redirectSourceDoctor.id,
          transferredFromDoctorName: redirectSourceDoctor.name,
          transferredAt: nowTimeStr,
          transferReason: finalReason,
          notes: `${entry.notes ? entry.notes + ' | ' : ''}Transferred from ${redirectSourceDoctor.name} (Token #${entry.queueNumber} -> #${newQNum}) on ${nowTimeStr}. Reason: ${finalReason}`
        }
      }
    })

    updateQueueEntries(updatedQueueEntries)
    updateQueueTransfers([...newTransferRecords, ...queueTransfers])

    const updatedDocs = doctors.map((d) => {
      if (d.id === redirectSourceDoctor.id) {
        return {
          ...d,
          currentQueueCount: Math.max(0, (d.currentQueueCount || 0) - candidateEntries.length),
          status: (d.status === 'AVAILABLE' ? 'IN_EMERGENCY' : d.status) as any
        }
      }
      if (d.id === targetDoc.id) {
        return {
          ...d,
          currentQueueCount: (d.currentQueueCount || 0) + candidateEntries.length
        }
      }
      return d
    })
    updateDoctors(updatedDocs)

    addHospitalNotification({
      toRole: 'doctor',
      toUserId: targetDoc.id,
      title: 'Queue Transferred to You',
      message: `${candidateEntries.length} patient(s) redirected from ${redirectSourceDoctor.name} to your queue (${targetDoc.specialization}). Reason: ${finalReason}.`,
      type: 'urgent'
    })

    addHospitalNotification({
      toRole: 'doctor',
      toUserId: redirectSourceDoctor.id,
      title: 'Waiting Queue Redirected',
      message: `Your waiting queue of ${candidateEntries.length} patient(s) was redirected to ${targetDoc.name} while you attend to urgent cases.`,
      type: 'info'
    })

    showToast(
      `Successfully redirected ${candidateEntries.length} patient(s) from ${redirectSourceDoctor.name} to ${targetDoc.name} (${targetDoc.specialization})!`,
      'success'
    )

    setShowConfirmRedirectPrompt(false)
    setShowRedirectModal(false)
    setRedirectSourceDoctor(null)
    setActiveTab('queue')
  }

  // Handle Leave Submission
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const repStaff = allStaffAccounts.find((a) => a.id === leaveForm.replacementStaffId) || {
      id: leaveForm.replacementStaffId,
      name: 'Chloe Simmons (Receptionist)'
    }

    const newReq: LeaveRequest = {
      id: `LEAVE-${Date.now().toString().slice(-6)}`,
      staffId: currentUser?.id || 'demo-receptionist',
      staffName: currentUser?.name || 'David Chen',
      staffRole: 'Receptionist',
      department: 'Central Admissions & Front Desk',
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      durationDays: 3,
      shift: leaveForm.shift,
      reason: leaveForm.reason,
      status: 'pending',
      requestedAt: 'Today',
      replacementStaffId: repStaff.id,
      replacementStaffName: repStaff.name
    }

    updateLeaveRequests([newReq, ...leaveRequests])

    addHospitalNotification({
      toRole: 'admin',
      title: 'New Receptionist Leave Request',
      message: `${newReq.staffName} (${newReq.staffRole}) submitted a ${newReq.leaveType} request for ${newReq.startDate} to ${newReq.endDate}. Replacement: ${newReq.replacementStaffName}.`,
      type: 'info'
    })

    showToast('Leave request submitted successfully. Awaiting Admin authorization.', 'success')
  }

  const eligibleReplacements = useMemo(() => {
    return getEligibleReplacementsForStaff(
      {
        id: currentUser?.id || 'demo-receptionist',
        roleSlug: 'receptionist',
        roleLabel: 'Receptionist',
        name: currentUser?.name || 'David Chen'
      },
      allStaffAccounts
    )
  }, [currentUser, allStaffAccounts])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && (n.toRole === 'receptionist' || !n.toRole || n.toRole === 'admin')).length
  }, [notifications])

  return (
    <div className="flex min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* Toast Banner */}
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
      {/* 1. RECEPTIONIST SIDEBAR (SAME DESIGN AS ADMIN SIDEBAR) */}
      {/* ========================================================================= */}
      <aside className="sticky top-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--care-border)] px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--care-primary)] text-white shadow-sm">
              <Activity className="size-5" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
              <span className="ml-1.5 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-extrabold text-teal-800">
                RECEPTIONIST
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
            Front Desk & Patient Intake
          </div>

          {/* Overview */}
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
            <span>Dashboard Overview</span>
          </button>

          {/* Register Patient */}
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'register'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus className="size-4" />
              <span>Register Patient</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'register' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
              }`}
            >
              New
            </span>
          </button>

          {/* STAT Emergency Intake */}
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'emergency'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-rose-50 hover:text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className={`size-4 ${activeTab === 'emergency' ? 'text-white' : 'text-rose-600'}`} />
              <span>Emergency Intake</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'emergency'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 text-rose-800 font-extrabold'
              }`}
            >
              {metrics.emergencyPatients > 0 ? `${metrics.emergencyPatients} STAT` : 'STAT'}
            </span>
          </button>

          {/* Patient Directory */}
          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'patients'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="size-4" />
              <span>Patient Directory</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'patients' ? 'bg-white/20 text-white' : 'bg-[var(--care-highlight)] text-[var(--care-ink)]'
              }`}
            >
              {patients.length}
            </span>
          </button>

          {/* Doctor OPD Queue */}
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
              <span>Doctor OPD Queue</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {metrics.waitingPatients} Waiting
            </span>
          </button>

          {/* Queue Redirection Audit */}
          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'transfers'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="size-4" />
              <span>Queue Transfer Audit</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'transfers' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {queueTransfers.length}
            </span>
          </button>

          {/* Leave Requests */}
          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'leave'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="size-4" />
              <span>Leave Request</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'leave' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {leaveRequests.filter((l) => l.staffRole?.toLowerCase().includes('reception')).length}
            </span>
          </button>

          {/* Desk Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <User className="size-4" />
            <span>My Desk & Shift</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[var(--care-border)] p-4">
          <div className="flex items-center justify-between rounded-xl bg-[var(--care-bg)] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-teal-600 font-bold text-white text-xs">
                {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'DC'}
              </span>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--care-ink)] leading-none">
                  {currentUser?.name || 'David Chen'}
                </div>
                <div className="text-[10px] text-[var(--care-muted)] leading-none mt-1">Receptionist Desk</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="rounded-lg p-1.5 text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)] transition"
                title="Settings & Password"
              >
                <Settings className="size-4" />
              </button>
              <Link
                href="/sign-in"
                onClick={() => {
                  if (typeof window !== 'undefined') localStorage.removeItem('carelink_user')
                }}
                className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50 transition"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={currentUser || {
          id: 'rec-1',
          roleSlug: 'receptionist',
          roleLabel: 'Receptionist',
          name: 'David Chen',
          title: 'Admissions Specialist',
          department: 'Front Desk',
          email: 'david.chen.fd@carelinkhosp.com',
          password: '',
          badge: 'Front Desk & Triage',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          avatarInitials: 'DC',
          summary: 'Receptionist profile',
          permissions: [],
          stats: [],
          recentActivities: [],
          quickActions: []
        }}
      />

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE (MATCHING ADMIN WORKSPACE DESIGN) */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--care-border)] bg-[var(--care-surface)]/95 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--care-ink)]">
              {activeTab === 'overview' && 'Receptionist Dashboard & Hospital Operations'}
              {activeTab === 'register' && 'Patient Registration & Queue Allocation'}
              {activeTab === 'emergency' && 'STAT Emergency Intake & Rapid Doctor Allocation'}
              {activeTab === 'patients' && 'Hospital Patients Directory & Admissions'}
              {activeTab === 'queue' && 'Doctor OPD Queues & Redirection Hub'}
              {activeTab === 'transfers' && 'Emergency Queue Redirection History & Audit Log'}
              {activeTab === 'leave' && 'Receptionist Leave Management & Shift Coverage'}
              {activeTab === 'profile' && 'Receptionist Desk Profile & Station Schedule'}
            </h1>
            <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 sm:inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Front Desk Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'emergency' && (
              <button
                type="button"
                onClick={() => setActiveTab('emergency')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition animate-pulse"
              >
                <Flame className="size-4" />
                <span>STAT Emergency Intake</span>
              </button>
            )}

            {activeTab !== 'register' && (
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--care-primary-dark)] transition"
              >
                <PlusCircle className="size-4" />
                <span>Register Patient</span>
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
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <Megaphone className="size-4 text-teal-600" />
                      <span>Hospital Notifications</span>
                    </div>
                    <button
                      onClick={() => {
                        const marked = notifications.map((n) => ({ ...n, read: true }))
                        updateNotifications(marked)
                      }}
                      className="text-xs font-medium text-teal-600 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[var(--care-muted)]">No active notifications</p>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          className={`rounded-xl border p-3 text-xs transition ${
                            notif.read
                              ? 'border-transparent bg-[var(--care-highlight)]/50 opacity-70'
                              : 'border-teal-200 bg-teal-50/50 text-[var(--care-ink)] font-medium'
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

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Emergency Alert Banner */}
              {metrics.emergencyPatients > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-rose-600 text-white animate-pulse">
                      <Flame className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">
                        {metrics.emergencyPatients} Active Emergency Case(s) in Hospital Triage
                      </h4>
                      <p className="text-xs text-rose-700">
                        Emergency patients are prioritized at the top of the Doctor consultation queues.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setQueueStatusFilter('ALL')
                      setQueueSpecFilter('ALL')
                      setActiveTab('queue')
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700"
                  >
                    Manage Emergency Queues <ArrowRight className="size-3.5" />
                  </button>
                </div>
              )}

              {/* 6 Key Summary Metric Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                    <span>Today&apos;s Patients</span>
                    <Users className="size-4 text-teal-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-[var(--care-ink)]">{metrics.todayPatients}</div>
                  <div className="mt-1 text-[11px] text-teal-600 font-medium">Registered today</div>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                    <span>Waiting Patients</span>
                    <Clock className="size-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-amber-600">{metrics.waitingPatients}</div>
                  <div className="mt-1 text-[11px] text-[var(--care-muted)] font-medium">In waiting area</div>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                    <span>Assigned Patients</span>
                    <UserCheck className="size-4 text-cyan-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-cyan-600">{metrics.assignedPatients}</div>
                  <div className="mt-1 text-[11px] text-[var(--care-muted)] font-medium">To Doctor / Nurse</div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-rose-700">
                    <span>Emergency Cases</span>
                    <Flame className="size-4 text-rose-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-rose-600">{metrics.emergencyPatients}</div>
                  <div className="mt-1 text-[11px] text-rose-700 font-medium">STAT priority</div>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                    <span>Available Doctors</span>
                    <Stethoscope className="size-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-emerald-600">{metrics.availableDoctors}</div>
                  <div className="mt-1 text-[11px] text-[var(--care-muted)] font-medium">Ready for intake</div>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--care-muted)]">
                    <span>Doctors Busy / ER</span>
                    <AlertOctagon className="size-4 text-purple-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-purple-600">{metrics.busyDoctors}</div>
                  <div className="mt-1 text-[11px] text-[var(--care-muted)] font-medium">Handling patients</div>
                </div>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  onClick={() => setActiveTab('register')}
                  className="flex items-center gap-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-100/60"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                    <UserPlus className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-950">Register New Patient</h4>
                    <p className="text-xs text-teal-800">
                      Search existing records, auto-generate Patient ID & assign OPD queue.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('emergency')}
                  className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-left shadow-sm transition hover:border-rose-300 hover:bg-rose-100/60"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                    <Flame className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">Emergency Registration</h4>
                    <p className="text-xs text-rose-800">
                      Fast triage intake with immediate Doctor allocation & queue trigger.
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
                    <h4 className="text-sm font-bold text-amber-950">Live Queue & Redirection</h4>
                    <p className="text-xs text-amber-800">
                      Monitor doctor queues, call tokens & redirect queues for busy doctors.
                    </p>
                  </div>
                </button>
              </div>

              {/* Today's Live Patient Queue Table */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--care-border)] p-4 sm:px-6">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">Today&apos;s Live Patient Queue</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Real-time queue tracking across all hospital OPD departments
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('queue')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--care-border)] px-3 py-1.5 text-xs font-semibold text-[var(--care-ink)] transition hover:bg-[var(--care-highlight)]"
                  >
                    View All Queue Controls <ArrowRight className="size-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-highlight)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3 sm:px-6">Queue #</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Doctor & Specialization</th>
                        <th className="px-4 py-3">Nurse</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Wait Time</th>
                        <th className="px-4 py-3 text-right sm:pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {queueEntries.slice(0, 7).map((entry) => (
                        <tr key={entry.id} className="transition hover:bg-[var(--care-highlight)]/30">
                          <td className="px-4 py-3.5 sm:px-6 font-mono font-bold">
                            <span
                              className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                                entry.priority === 'EMERGENCY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : entry.priority === 'URGENT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {entry.queueNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-[var(--care-ink)]">{entry.patientName}</div>
                            <div className="text-[10px] text-[var(--care-muted)]">{entry.patientMrn}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-[var(--care-ink)]">{entry.doctorName}</div>
                            <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              {entry.specialization}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-xs text-[var(--care-ink)]">{entry.nurseName || 'Triage Assigned'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                entry.priority === 'EMERGENCY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : entry.priority === 'URGENT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {entry.priority === 'EMERGENCY' && <Flame className="size-2.5" />}
                              {entry.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                entry.status === 'WAITING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : entry.status === 'CALLED'
                                  ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                                  : entry.status === 'IN_CONSULTATION'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.status === 'COMPLETED'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {entry.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-[var(--care-muted)]">
                            {entry.waitingTimeMinutes !== undefined ? `${entry.waitingTimeMinutes} mins` : '5 mins'}
                          </td>
                          <td className="px-4 py-3.5 text-right sm:pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              {entry.status === 'WAITING' && (
                                <button
                                  onClick={() => handleQueueStatusChange(entry.id, 'CALLED')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-teal-700"
                                >
                                  Call Patient
                                </button>
                              )}
                              {entry.status === 'CALLED' && (
                                <button
                                  onClick={() => handleQueueStatusChange(entry.id, 'IN_CONSULTATION')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                                >
                                  Start Consult
                                </button>
                              )}
                              {entry.status === 'IN_CONSULTATION' && (
                                <button
                                  onClick={() => handleQueueStatusChange(entry.id, 'COMPLETED')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-slate-800"
                                >
                                  Complete
                                </button>
                              )}
                              {entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => {
                                    const doc = doctors.find((d) => d.id === entry.doctorId)
                                    if (doc) handleOpenRedirectModal(doc)
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                                  title="Redirect Queue"
                                >
                                  <ArrowRightLeft className="size-3" />
                                  Redirect
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctors Availability & Workload Grid */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">Doctor Specialization & Workload Roster</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Live room allocations and waiting queue loads across departments
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="text-xs font-bold text-teal-600 hover:underline"
                  >
                    Manage Live Queues →
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {doctors.map((doc) => {
                    const docWaiting = queueEntries.filter((q) => q.doctorId === doc.id && q.status === 'WAITING').length

                    return (
                      <div
                        key={doc.id}
                        className={`rounded-2xl border p-4 transition ${
                          doc.status === 'IN_EMERGENCY'
                            ? 'border-rose-300 bg-rose-50/40'
                            : doc.status === 'BUSY'
                            ? 'border-purple-200 bg-purple-50/30'
                            : 'border-[var(--care-border)] bg-[var(--care-surface)] hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-100 font-bold text-teal-800">
                              {doc.avatarInitials || doc.name.slice(3, 5).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[var(--care-ink)]">{doc.name}</h4>
                              <span className="inline-block rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                                {doc.specialization}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                              doc.status === 'IN_EMERGENCY'
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : doc.status === 'BUSY'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--care-muted)]">
                          <span>Room: {doc.roomNumber?.split('(')[0] || 'OPD'}</span>
                          <span className="font-semibold text-teal-800">{docWaiting} waiting</span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[var(--care-border)]">
                          <button
                            onClick={() => handleOpenRedirectModal(doc)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100"
                          >
                            <ArrowRightLeft className="size-3 text-amber-600" />
                            Redirect Queue
                          </button>
                          <button
                            onClick={() => {
                              setQueueDoctorFilter(doc.id)
                              setActiveTab('queue')
                            }}
                            className="inline-flex items-center justify-center rounded-xl border border-[var(--care-border)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: REGISTER PATIENT (NORMAL) */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">Normal Patient Registration</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Register new outpatients, check for duplicates, and auto-assign doctor queue
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-200">
                    <Shield className="size-3.5" />
                    Auto-ID: PAT-2026-XXXX Generator Active
                  </div>
                </div>

                {/* Duplicate Search */}
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                    <Search className="size-4 text-amber-600" />
                    <span>Check Existing Patient (Duplicate Prevention)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800">
                    Search by Phone Number, MRN, Name, or Email to check if this patient already has a hospital record before creating a duplicate.
                  </p>

                  <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        value={dupSearchQuery}
                        onChange={(e) => handleDuplicateSearch(e.target.value)}
                        placeholder="Type phone (+91 9988...), MRN (MRN-84920 or PAT-2026-0001), or patient name..."
                        className="h-10 w-full rounded-xl border border-amber-300 bg-white px-3 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      />
                      {dupSearchQuery && (
                        <button
                          onClick={() => {
                            setDupSearchQuery('')
                            setMatchedExistingPatient(null)
                          }}
                          className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {matchedExistingPatient && (
                    <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-teal-300 bg-teal-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
                          {matchedExistingPatient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-teal-950">
                            Existing Patient Found: {matchedExistingPatient.name} ({matchedExistingPatient.mrn})
                          </div>
                          <div className="text-[11px] text-teal-800">
                            Phone: {matchedExistingPatient.phone || 'N/A'} · Age: {matchedExistingPatient.age} · Blood: {matchedExistingPatient.bloodGroup || 'O+'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => useExistingPatientForNewVisit(matchedExistingPatient)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                        >
                          <Check className="size-3.5" />
                          Use This Patient Info
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(matchedExistingPatient)}
                          className="inline-flex items-center gap-1 rounded-lg border border-teal-400 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
                        >
                          Quick Assign Queue
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form */}
                <form onSubmit={handleRegisterPatient} className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700">1. Personal Information</h4>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={regForm.fullName}
                          onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                          placeholder="e.g. Ramesh Chandra Sharma"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Date of Birth</label>
                        <input
                          type="date"
                          value={regForm.dob}
                          onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-[var(--care-ink)]">Age *</label>
                          <input
                            type="number"
                            required
                            value={regForm.age}
                            onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                            className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[var(--care-ink)]">Gender</label>
                          <select
                            value={regForm.gender}
                            onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                            className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-2 text-xs outline-none focus:border-teal-600"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Email Address</label>
                        <input
                          type="email"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                          placeholder="patient@example.com"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Residential Address</label>
                        <input
                          type="text"
                          value={regForm.address}
                          onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                          placeholder="House No, Street, City"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--care-border)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700">2. Emergency Contact & Health Info</h4>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Emergency Contact Name</label>
                        <input
                          type="text"
                          value={regForm.emergencyContactName}
                          onChange={(e) => setRegForm({ ...regForm, emergencyContactName: e.target.value })}
                          placeholder="e.g. Priya Sharma (Spouse)"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Emergency Contact Phone</label>
                        <input
                          type="text"
                          value={regForm.emergencyContactPhone}
                          onChange={(e) => setRegForm({ ...regForm, emergencyContactPhone: e.target.value })}
                          placeholder="+91 99887 76655"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Blood Group</label>
                        <select
                          value={regForm.bloodGroup}
                          onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value as any })}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-2 text-xs outline-none focus:border-teal-600"
                        >
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Known Allergies</label>
                        <input
                          type="text"
                          value={regForm.allergies}
                          onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
                          placeholder="e.g. Penicillin, Sulfa, Dust"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--care-border)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700">3. OPD Specialization & Queue Allocation</h4>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Required Specialization *</label>
                        <select
                          value={regForm.requiredSpecialization}
                          onChange={(e) => {
                            const spec = e.target.value
                            const matchingDocs = getDoctorsForSpecialization(spec)
                            setRegForm({
                              ...regForm,
                              requiredSpecialization: spec,
                              doctorId: matchingDocs.length > 0 ? matchingDocs[0].id : regForm.doctorId
                            })
                          }}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium outline-none focus:border-teal-600"
                        >
                          {HOSPITAL_SPECIALIZATIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Assign Doctor *</label>
                        <select
                          value={regForm.doctorId}
                          onChange={(e) => setRegForm({ ...regForm, doctorId: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium outline-none focus:border-teal-600"
                        >
                          {getDoctorsForSpecialization(regForm.requiredSpecialization).map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.specialization} · {doc.currentQueueCount || 0} in queue)
                            </option>
                          ))}
                          {getDoctorsForSpecialization(regForm.requiredSpecialization).length === 0 && (
                            <option value="demo-doctor">Dr. Alexander Wright, MD (Cardiology)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Assign Nurse *</label>
                        <select
                          value={regForm.nurseId}
                          onChange={(e) => setRegForm({ ...regForm, nurseId: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium outline-none focus:border-teal-600"
                        >
                          {nurses.map((nurse) => (
                            <option key={nurse.id} value={nurse.id}>
                              {nurse.name} ({nurse.ward || 'OPD'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--care-ink)]">
                        <input
                          type="checkbox"
                          checked={regForm.assignDoctorDirectly}
                          onChange={(e) => setRegForm({ ...regForm, assignDoctorDirectly: e.target.checked })}
                          className="size-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>Generate Live OPD Token & Add to Doctor&apos;s Queue Immediately</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--care-border)] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="rounded-xl border border-[var(--care-border)] px-4 py-2.5 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
                    >
                      <UserPlus className="size-4" />
                      Complete Registration & Allocate Token
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: EMERGENCY REGISTRATION (STAT) */}
          {/* ========================================================================= */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-rose-300 bg-rose-50/40 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20 animate-pulse">
                      <Flame className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-rose-950">STAT Emergency Patient Intake</h3>
                      <p className="text-xs text-rose-800">
                        Rapid triage registration with immediate Doctor allocation & queue precedence
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black text-white shadow">
                    <AlertOctagon className="size-4" />
                    Priority: STAT EMERGENCY (E-Tokens)
                  </div>
                </div>

                <form onSubmit={handleRegisterEmergency} className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">1. Rapid Patient Triage Information</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-bold text-rose-950">Patient Full Name / Unknown ID *</label>
                        <input
                          type="text"
                          required
                          value={emergencyForm.fullName}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, fullName: e.target.value })}
                          placeholder="e.g. Rahul Sharma or Trauma Unknown #1"
                          className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-3 text-xs outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-200 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-rose-950">Age (Est.)</label>
                          <input
                            type="number"
                            value={emergencyForm.age}
                            onChange={(e) => setEmergencyForm({ ...emergencyForm, age: e.target.value })}
                            placeholder="e.g. 45"
                            className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-3 text-xs outline-none focus:border-rose-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-rose-950">Gender</label>
                          <select
                            value={emergencyForm.gender}
                            onChange={(e) => setEmergencyForm({ ...emergencyForm, gender: e.target.value as any })}
                            className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-2 text-xs outline-none focus:border-rose-600"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-rose-950">Attendant Phone / Contact</label>
                        <input
                          type="text"
                          value={emergencyForm.phone}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                          placeholder="+91 99887 76655"
                          className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-3 text-xs outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-rose-950">Emergency Reason / Chief Complaints *</label>
                      <textarea
                        rows={2}
                        required
                        value={emergencyForm.emergencyReason}
                        onChange={(e) => setEmergencyForm({ ...emergencyForm, emergencyReason: e.target.value })}
                        placeholder="e.g. Acute myocardial infarction symptoms, severe chest pain radiating to left jaw, sudden collapse..."
                        className="mt-1 w-full rounded-xl border border-rose-300 bg-rose-50/20 p-3 text-xs outline-none focus:border-rose-600 font-medium leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">2. Doctor & Trauma Nurse Allocation</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-bold text-rose-950">Specialization Required *</label>
                        <select
                          value={emergencyForm.requiredSpecialization}
                          onChange={(e) => {
                            const spec = e.target.value
                            const matchingDocs = getDoctorsForSpecialization(spec)
                            setEmergencyForm({
                              ...emergencyForm,
                              requiredSpecialization: spec,
                              doctorId: matchingDocs.length > 0 ? matchingDocs[0].id : emergencyForm.doctorId
                            })
                          }}
                          className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-3 text-xs font-medium outline-none focus:border-rose-600"
                        >
                          {HOSPITAL_SPECIALIZATIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-rose-950">Allocate Doctor *</label>
                        <select
                          value={emergencyForm.doctorId}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, doctorId: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-3 text-xs font-medium outline-none focus:border-rose-600"
                        >
                          {getDoctorsForSpecialization(emergencyForm.requiredSpecialization).map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.specialization} · Status: {doc.status})
                            </option>
                          ))}
                          {getDoctorsForSpecialization(emergencyForm.requiredSpecialization).length === 0 && (
                            <option value="demo-doctor">Dr. Alexander Wright, MD (Cardiology)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-rose-950">Emergency Triage Nurse *</label>
                        <select
                          value={emergencyForm.nurseId}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, nurseId: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-rose-300 bg-rose-50/20 px-3 text-xs font-medium outline-none focus:border-rose-600"
                        >
                          {nurses.map((nurse) => (
                            <option key={nurse.id} value={nurse.id}>
                              {nurse.name} ({nurse.department || 'Emergency'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-rose-800 font-semibold flex items-center gap-1.5">
                      <Info className="size-4" />
                      Allocating doctor to an emergency will prompt you to redirect their waiting queue if patients are waiting.
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 animate-pulse"
                    >
                      <Flame className="size-4" />
                      Allocate STAT Emergency Doctor & Generate E-Token
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PATIENT DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'patients' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">Registered Hospital Patients Directory</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Search and manage all admitted and registered patients across departments
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('register')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                  >
                    <UserPlus className="size-3.5" />
                    Register New Patient
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                    <input
                      type="text"
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      placeholder="Search by patient name, MRN, phone, doctor..."
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] pl-9 pr-3 text-xs outline-none focus:border-teal-600"
                    />
                    {patientSearchQuery && (
                      <button
                        onClick={() => setPatientSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={patientTypeFilter}
                      onChange={(e) => setPatientTypeFilter(e.target.value)}
                      className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-semibold text-[var(--care-ink)] outline-none focus:border-teal-600"
                    >
                      <option value="ALL">All Patient Types</option>
                      <option value="NORMAL">Normal Registrations</option>
                      <option value="EMERGENCY">Emergency Registrations</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-highlight)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3 sm:px-6">Patient ID / MRN</th>
                        <th className="px-4 py-3">Patient Details</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Assigned Doctor & Specialization</th>
                        <th className="px-4 py-3">Nurse</th>
                        <th className="px-4 py-3 text-right sm:pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-[var(--care-muted)]">
                            No patients matched your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((patient) => (
                          <tr key={patient.id} className="transition hover:bg-[var(--care-highlight)]/30">
                            <td className="px-4 py-3.5 sm:px-6 font-mono font-bold text-teal-800">
                              {patient.mrn}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[var(--care-ink)]">{patient.name}</div>
                              <div className="text-[10px] text-[var(--care-muted)]">
                                {patient.age} yrs · {patient.gender} · Blood: {patient.bloodGroup || 'O+'}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-xs text-[var(--care-ink)]">{patient.phone || 'N/A'}</div>
                              <div className="text-[10px] text-[var(--care-muted)]">{patient.email || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                  patient.registrationType === 'EMERGENCY'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {patient.registrationType === 'EMERGENCY' && <Flame className="size-2.5" />}
                                {patient.registrationType || 'NORMAL'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-[var(--care-ink)]">
                                {patient.assignedDoctorName || patient.primaryPhysician || 'Unassigned'}
                              </div>
                              <span className="inline-block rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                                {patient.requiredSpecialization || 'General'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-xs text-[var(--care-ink)]">
                                {patient.assignedNurseName || patient.nurseInCharge || 'Unassigned'}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right sm:pr-6">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedPatientForView(patient)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--care-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                                >
                                  <Eye className="size-3" />
                                  Profile
                                </button>
                                <button
                                  onClick={() => handleOpenAssignModal(patient)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-teal-700"
                                >
                                  Assign / Queue
                                </button>
                              </div>
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
          {/* TAB: DOCTOR QUEUE & EMERGENCY REDIRECTION */}
          {/* ========================================================================= */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">Doctor OPD Queues & Redirection Hub</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Manage patient queue statuses or redirect queues to matching specialists during emergencies
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const busy = doctors.find((d) => d.status === 'IN_EMERGENCY' || d.status === 'BUSY')
                      if (busy) {
                        handleOpenRedirectModal(busy)
                      } else if (doctors.length > 0) {
                        handleOpenRedirectModal(doctors[0])
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700"
                  >
                    <ArrowRightLeft className="size-3.5" />
                    Redirect Doctor Queue
                  </button>
                </div>

                {/* Filters */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                    <input
                      type="text"
                      value={queueSearchQuery}
                      onChange={(e) => setQueueSearchQuery(e.target.value)}
                      placeholder="Search patient, token, MRN..."
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] pl-9 pr-3 text-xs outline-none focus:border-teal-600"
                    />
                    {queueSearchQuery && (
                      <button
                        onClick={() => setQueueSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <select
                      value={queueDoctorFilter}
                      onChange={(e) => setQueueDoctorFilter(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium text-[var(--care-ink)] outline-none focus:border-teal-600"
                    >
                      <option value="ALL">All Doctors</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={queueSpecFilter}
                      onChange={(e) => setQueueSpecFilter(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium text-[var(--care-ink)] outline-none focus:border-teal-600"
                    >
                      <option value="ALL">All Specializations</option>
                      {HOSPITAL_SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={queueStatusFilter}
                      onChange={(e) => setQueueStatusFilter(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium text-[var(--care-ink)] outline-none focus:border-teal-600"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="WAITING">Waiting in Queue</option>
                      <option value="CALLED">Called for Consultation</option>
                      <option value="IN_CONSULTATION">In Consultation</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="TRANSFERRED">Transferred</option>
                    </select>
                  </div>
                </div>

                {/* Queue Table */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-highlight)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3 sm:px-6">Token</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Doctor</th>
                        <th className="px-4 py-3">Specialization</th>
                        <th className="px-4 py-3">Nurse</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Registered</th>
                        <th className="px-4 py-3 text-right sm:pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {filteredQueue.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-xs text-[var(--care-muted)]">
                            No patient queue entries matched your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredQueue.map((item) => (
                          <tr key={item.id} className="transition hover:bg-[var(--care-highlight)]/30">
                            <td className="px-4 py-3.5 sm:px-6 font-mono font-bold">
                              <span
                                className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                                  item.priority === 'EMERGENCY'
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.priority === 'URGENT'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {item.queueNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[var(--care-ink)]">{item.patientName}</div>
                              <div className="text-[10px] text-[var(--care-muted)]">{item.patientMrn}</div>
                              {item.transferredFromDoctorName && (
                                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                  ↳ Transferred from {item.transferredFromDoctorName}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-[var(--care-ink)]">{item.doctorName}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                {item.specialization}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-xs text-[var(--care-ink)]">{item.nurseName || 'Assigned'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  item.priority === 'EMERGENCY'
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.priority === 'URGENT'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.priority === 'EMERGENCY' && <Flame className="size-2.5" />}
                                {item.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  item.status === 'WAITING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.status === 'CALLED'
                                    ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                                    : item.status === 'IN_CONSULTATION'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'COMPLETED'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {item.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-[var(--care-muted)]">
                              {item.registeredAt}
                            </td>
                            <td className="px-4 py-3.5 text-right sm:pr-6">
                              <div className="flex items-center justify-end gap-1.5">
                                {item.status === 'WAITING' && (
                                  <button
                                    onClick={() => handleQueueStatusChange(item.id, 'CALLED')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-teal-700"
                                  >
                                    Call
                                  </button>
                                )}
                                {item.status === 'CALLED' && (
                                  <button
                                    onClick={() => handleQueueStatusChange(item.id, 'IN_CONSULTATION')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                                  >
                                    Start Consult
                                  </button>
                                )}
                                {item.status === 'IN_CONSULTATION' && (
                                  <button
                                    onClick={() => handleQueueStatusChange(item.id, 'COMPLETED')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-slate-800"
                                  >
                                    Complete
                                  </button>
                                )}
                                {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => {
                                      const doc = doctors.find((d) => d.id === item.doctorId)
                                      if (doc) handleOpenRedirectModal(doc)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                                    title="Redirect Queue"
                                  >
                                    <ArrowRightLeft className="size-3" />
                                    Redirect
                                  </button>
                                )}
                              </div>
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
          {/* TAB: QUEUE REDIRECTION AUDIT TRAIL */}
          {/* ========================================================================= */}
          {activeTab === 'transfers' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">Queue Redirection History & Audit Log</h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Complete audit trail of all doctor queue transfers with same-specialization verification traces
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <BadgeCheck className="size-4" />
                    Same-Specialization Enforcement Active
                  </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                    <input
                      type="text"
                      value={transferSearchQuery}
                      onChange={(e) => setTransferSearchQuery(e.target.value)}
                      placeholder="Search audit records by Patient, Doctor, Specialization, Transfer ID..."
                      className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] pl-9 pr-3 text-xs outline-none focus:border-teal-600"
                    />
                    {transferSearchQuery && (
                      <button
                        onClick={() => setTransferSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-highlight)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3 sm:px-6">Transfer ID</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Source Doctor</th>
                        <th className="px-4 py-3">Target Doctor</th>
                        <th className="px-4 py-3">Specialization Check</th>
                        <th className="px-4 py-3">Queue Tokens</th>
                        <th className="px-4 py-3">Reason / Trigger</th>
                        <th className="px-4 py-3 text-right sm:pr-6">Transferred By & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {filteredTransfers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-xs text-[var(--care-muted)]">
                            No queue transfer records found.
                          </td>
                        </tr>
                      ) : (
                        filteredTransfers.map((rec) => (
                          <tr key={rec.id} className="transition hover:bg-[var(--care-highlight)]/30">
                            <td className="px-4 py-3.5 sm:px-6 font-mono font-bold text-teal-800">
                              {rec.id}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[var(--care-ink)]">{rec.patientName}</div>
                              <div className="text-[10px] text-[var(--care-muted)]">{rec.patientMrn}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-rose-900">{rec.originalDoctorName}</div>
                              <span className="text-[10px] text-[var(--care-muted)]">
                                {rec.originalSpecialization}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-emerald-900">{rec.newDoctorName}</div>
                              <span className="text-[10px] text-[var(--care-muted)]">
                                {rec.newSpecialization}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="size-3" />
                                {rec.originalSpecialization} → {rec.newSpecialization} (Match Verified)
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono">
                              <div className="text-xs font-bold text-[var(--care-ink)]">
                                <span className="text-slate-500 line-through mr-1">{rec.originalQueueNumber}</span>
                                <span className="text-teal-700">→ {rec.newQueueNumber}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 max-w-xs">
                              <div className="text-xs text-[var(--care-ink)] font-medium leading-relaxed">
                                {rec.reason}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right sm:pr-6">
                              <div className="font-semibold text-[var(--care-ink)]">{rec.transferredBy}</div>
                              <div className="text-[10px] text-[var(--care-muted)]">{rec.transferredAt}</div>
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
          {/* TAB: LEAVE REQUEST (STRICTLY RECEPTIONIST CANDIDATES) */}
          {/* ========================================================================= */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Form Card */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--care-ink)]">Apply for Receptionist Leave</h3>
                      <p className="text-xs text-[var(--care-muted)]">
                        Submit shift leave request with verified Receptionist replacement staff
                      </p>
                    </div>
                    <CalendarClock className="size-5 text-teal-600" />
                  </div>

                  <form onSubmit={handleLeaveSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)]">Leave Type *</label>
                      <select
                        value={leaveForm.leaveType}
                        onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                      >
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Annual Vacation">Annual Vacation</option>
                        <option value="Emergency Medical Leave">Emergency Medical Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">Start Date *</label>
                        <input
                          type="date"
                          required
                          value={leaveForm.startDate}
                          onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[var(--care-ink)]">End Date *</label>
                        <input
                          type="date"
                          required
                          value={leaveForm.endDate}
                          onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)]">Shift Affected *</label>
                      <select
                        value={leaveForm.shift}
                        onChange={(e) => setLeaveForm({ ...leaveForm, shift: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                      >
                        <option value="Morning (08:00 - 16:00)">Morning Shift (08:00 - 16:00)</option>
                        <option value="Evening (16:00 - 00:00)">Evening Shift (16:00 - 00:00)</option>
                        <option value="Night (00:00 - 08:00)">Night Shift (00:00 - 08:00)</option>
                      </select>
                    </div>

                    {/* Replacement Staff */}
                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5">
                      <label className="flex items-center justify-between text-xs font-bold text-teal-950">
                        <span>Replacement Front Desk Staff *</span>
                        <span className="text-[10px] font-semibold text-teal-700">Strictly Receptionist Staff</span>
                      </label>
                      <select
                        value={leaveForm.replacementStaffId}
                        onChange={(e) => setLeaveForm({ ...leaveForm, replacementStaffId: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-xl border border-teal-300 bg-white px-3 text-xs font-medium outline-none focus:border-teal-600"
                      >
                        {eligibleReplacements.map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.name} ({cand.roleLabel || 'Receptionist'} · {cand.department})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] text-teal-800">
                        Doctor and nurse staff are strictly excluded from Receptionist replacements.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--care-ink)]">Reason for Leave *</label>
                      <textarea
                        rows={3}
                        required
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        placeholder="Briefly state reason for leave..."
                        className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-3 text-xs outline-none focus:border-teal-600 leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700"
                    >
                      <CalendarCheck className="size-4" />
                      Submit Leave Application to Administration
                    </button>
                  </form>
                </div>

                {/* Status / History Card */}
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
                    <h3 className="text-base font-bold text-[var(--care-ink)]">Leave History & Approval Status</h3>
                    <History className="size-5 text-teal-600" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {leaveRequests
                      .filter((r) => r.staffRole?.toLowerCase().includes('reception') || r.staffId === currentUser?.id)
                      .map((req) => (
                        <div
                          key={req.id}
                          className="rounded-xl border border-[var(--care-border)] p-4 text-xs transition hover:bg-[var(--care-highlight)]/30"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-[var(--care-ink)]">{req.leaveType}</span>
                              <div className="text-[11px] text-[var(--care-muted)]">
                                {req.startDate} to {req.endDate} ({req.shift || 'Morning Shift'})
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                req.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status?.toUpperCase() || 'PENDING'}
                            </span>
                          </div>

                          <p className="mt-2 text-[11px] text-[var(--care-muted)] italic">
                            &quot;{req.reason}&quot;
                          </p>

                          <div className="mt-3 flex items-center justify-between border-t border-[var(--care-border)] pt-2 text-[10px] text-[var(--care-muted)]">
                            <span>Replacement: {req.replacementStaffName || 'Chloe Simmons'}</span>
                            <span>ID: {req.id}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PROFILE & DESK */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl space-y-6">
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-600 text-white font-extrabold text-xl shadow-lg shadow-teal-600/30">
                    {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'DC'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--care-ink)]">
                      {currentUser?.name || 'David Chen'}
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Senior Receptionist & Patient Intake Supervisor
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        Front Desk Staff
                      </span>
                      <span className="text-[11px] text-[var(--care-muted)]">
                        {currentUser?.email || 'receptionist@carelink.health'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-6 border-t border-[var(--care-border)] text-xs">
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Current Shift:</span>
                    <p className="font-bold text-[var(--care-ink)]">Morning Shift (08:00 - 16:00)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Assigned Station:</span>
                    <p className="font-bold text-[var(--care-ink)]">Main Entrance Counter #1 (OPD Triage)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">Emergency Transfer Rights:</span>
                    <p className="font-bold text-emerald-700">Authorized (Same-Specialization Protocol)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[var(--care-muted)]">System Authorization Role:</span>
                    <p className="font-bold text-teal-700">Receptionist (Restricted RBAC)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REDIRECT DOCTOR QUEUE (CRITICAL WORKFLOW) */}
      {/* ========================================================================= */}
      {showRedirectModal && redirectSourceDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--care-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                  <ArrowRightLeft className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--care-ink)]">
                    Redirect Doctor Patient Queue
                  </h3>
                  <p className="text-xs text-[var(--care-muted)]">
                    Transfer waiting OPD patients from {redirectSourceDoctor.name} to another available doctor
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowRedirectModal(false)
                  setShowConfirmRedirectPrompt(false)
                }}
                className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Validation Error Alert */}
            {redirectValidationError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-900">
                <AlertOctagon className="size-4 shrink-0 text-rose-600" />
                <span>{redirectValidationError}</span>
              </div>
            )}

            {/* Source Doctor Summary Card */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Source Doctor</div>
                  <div className="text-sm font-bold text-rose-950">{redirectSourceDoctor.name}</div>
                  <div className="text-xs font-semibold text-rose-800">
                    Specialization: <span className="underline">{redirectSourceDoctor.specialization}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-rose-700">
                    {queueEntries.filter((q) => q.doctorId === redirectSourceDoctor.id && (q.status === 'WAITING' || q.status === 'CALLED')).length} Patients Waiting
                  </div>
                  <span className="rounded bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                    {redirectSourceDoctor.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1: Select Target Doctor (Strictly same specialization) */}
            <div>
              <label className="text-xs font-bold text-[var(--care-ink)] flex items-center justify-between">
                <span>Select Target Doctor (Must have SAME Specialization: {redirectSourceDoctor.specialization}) *</span>
                <span className="text-[10px] font-bold text-teal-700">Same-Specialization Enforced</span>
              </label>

              <select
                value={redirectTargetDoctorId}
                onChange={(e) => {
                  setRedirectTargetDoctorId(e.target.value)
                  setRedirectValidationError(null)
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-teal-300 bg-teal-50/20 px-3 text-xs font-bold text-[var(--care-ink)] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">-- Choose Doctor with same specialization ({redirectSourceDoctor.specialization}) --</option>
                {doctors
                  .filter((d) => d.id !== redirectSourceDoctor.id && d.specialization.toLowerCase() === redirectSourceDoctor.specialization.toLowerCase())
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization} · Room: {d.roomNumber || 'OPD'} · {d.currentQueueCount || 0} waiting)
                    </option>
                  ))}
              </select>

              {doctors.filter((d) => d.id !== redirectSourceDoctor.id && d.specialization.toLowerCase() === redirectSourceDoctor.specialization.toLowerCase()).length === 0 && (
                <p className="mt-1 text-[11px] text-rose-700 font-semibold">
                  Warning: No other doctor found with specialization &quot;{redirectSourceDoctor.specialization}&quot;.
                </p>
              )}
            </div>

            {/* Step 2: Redirection Scope */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--care-ink)]">Select Redirection Scope</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRedirectMode('ALL')}
                  className={`rounded-xl border p-3 text-left transition ${
                    redirectMode === 'ALL'
                      ? 'border-teal-600 bg-teal-50 text-teal-950 font-bold shadow-sm'
                      : 'border-[var(--care-border)] bg-[var(--care-surface)] text-[var(--care-muted)]'
                  }`}
                >
                  <div className="text-xs">Option 1: Full Queue Redirect</div>
                  <div className="text-[10px] font-normal opacity-80">
                    Redirect all waiting patients of {redirectSourceDoctor.name}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRedirectMode('SELECTED')}
                  className={`rounded-xl border p-3 text-left transition ${
                    redirectMode === 'SELECTED'
                      ? 'border-teal-600 bg-teal-50 text-teal-950 font-bold shadow-sm'
                      : 'border-[var(--care-border)] bg-[var(--care-surface)] text-[var(--care-muted)]'
                  }`}
                >
                  <div className="text-xs">Option 2: Selected Patients</div>
                  <div className="text-[10px] font-normal opacity-80">
                    Choose specific patients to transfer
                  </div>
                </button>
              </div>

              {redirectMode === 'SELECTED' && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--care-border)] p-2 space-y-1.5 text-xs">
                  {queueEntries
                    .filter((q) => q.doctorId === redirectSourceDoctor.id && (q.status === 'WAITING' || q.status === 'CALLED'))
                    .map((q) => (
                      <label
                        key={q.id}
                        className="flex items-center justify-between rounded-lg p-2 hover:bg-[var(--care-highlight)] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={redirectSelectedQueueIds.includes(q.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRedirectSelectedQueueIds([...redirectSelectedQueueIds, q.id])
                              } else {
                                setRedirectSelectedQueueIds(redirectSelectedQueueIds.filter((id) => id !== q.id))
                              }
                            }}
                            className="size-4 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="font-bold">{q.queueNumber} - {q.patientName}</span>
                        </div>
                        <span className="text-[10px] text-[var(--care-muted)]">{q.patientMrn}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>

            {/* Step 3: Reason */}
            <div>
              <label className="text-xs font-bold text-[var(--care-ink)]">Reason for Redirection</label>
              <select
                value={redirectReason}
                onChange={(e) => setRedirectReason(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
              >
                <option value="Attending emergency cardiac patient in ER">Attending emergency cardiac patient in ER</option>
                <option value="Doctor called to Emergency Trauma / Resuscitation Bay">Doctor called to Emergency Trauma / Resuscitation Bay</option>
                <option value="Doctor unavailable due to sudden illness / emergency leave">Doctor unavailable due to sudden illness / emergency leave</option>
                <option value="High queue load balancing across department">High queue load balancing across department</option>
                <option value="Other Custom Reason">Other Custom Reason</option>
              </select>

              {redirectReason === 'Other Custom Reason' && (
                <input
                  type="text"
                  value={redirectCustomReason}
                  onChange={(e) => setRedirectCustomReason(e.target.value)}
                  placeholder="Enter detailed reason for transfer..."
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                />
              )}
            </div>

            {/* Confirmation Dialog */}
            {showConfirmRedirectPrompt ? (
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <span>Confirm Queue Redirection</span>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>{redirectSourceDoctor.name}</strong> is currently handling an emergency / unavailable.
                  {' '}<strong>
                    {redirectMode === 'ALL'
                      ? queueEntries.filter((q) => q.doctorId === redirectSourceDoctor.id && (q.status === 'WAITING' || q.status === 'CALLED')).length
                      : redirectSelectedQueueIds.length}
                  </strong> patient(s) will be transferred to{' '}
                  <strong>{doctors.find((d) => d.id === redirectTargetDoctorId)?.name}</strong> ({redirectSourceDoctor.specialization}).
                </p>

                <p className="text-xs font-bold text-amber-950">
                  Are you sure you want to redirect the queue?
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmRedirectPrompt(false)}
                    className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    Go Back & Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteQueueRedirect}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700"
                  >
                    <Check className="size-4" />
                    Yes, Confirm & Redirect Queue Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--care-border)]">
                <button
                  type="button"
                  onClick={() => setShowRedirectModal(false)}
                  className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!redirectTargetDoctorId) {
                      setRedirectValidationError('Please select a target doctor.')
                      return
                    }
                    const targetDoc = doctors.find((d) => d.id === redirectTargetDoctorId)
                    if (targetDoc) {
                      const val = validateQueueTransfer(redirectSourceDoctor.specialization, targetDoc.specialization)
                      if (!val.isValid) {
                        setRedirectValidationError(val.error || 'Specialization mismatch!')
                        return
                      }
                    }
                    setShowConfirmRedirectPrompt(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700"
                >
                  <ArrowRightLeft className="size-4" />
                  Proceed to Confirm Redirection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN DOCTOR & NURSE */}
      {/* ========================================================================= */}
      {assignModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--care-ink)]">
                  Assign Doctor & Queue: {assignModalPatient.name}
                </h3>
                <p className="text-xs text-[var(--care-muted)]">MRN: {assignModalPatient.mrn}</p>
              </div>
              <button
                onClick={() => setAssignModalPatient(null)}
                className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--care-ink)]">Select Doctor *</label>
                <select
                  value={assignSelectedDoctorId}
                  onChange={(e) => setAssignSelectedDoctorId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization} · Status: {doc.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--care-ink)]">Select Nurse *</label>
                <select
                  value={assignSelectedNurseId}
                  onChange={(e) => setAssignSelectedNurseId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                >
                  {nurses.map((nurse) => (
                    <option key={nurse.id} value={nurse.id}>
                      {nurse.name} ({nurse.department || 'Ward 4B'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--care-ink)]">Queue Priority</label>
                <select
                  value={assignPriority}
                  onChange={(e) => setAssignPriority(e.target.value as any)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs outline-none focus:border-teal-600"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent Care</option>
                  <option value="EMERGENCY">STAT Emergency</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--care-ink)]">Notes</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] p-2.5 text-xs outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--care-border)]">
              <button
                type="button"
                onClick={() => setAssignModalPatient(null)}
                className="rounded-xl border border-[var(--care-border)] px-4 py-2 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePatientAssignment}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                <Check className="size-4" />
                Confirm Assignment & Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PATIENT PROFILE VIEW */}
      {/* ========================================================================= */}
      {selectedPatientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--care-border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--care-ink)]">
                  {selectedPatientForView.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--care-muted)]">
                  <span>MRN: {selectedPatientForView.mrn}</span>
                  <span>·</span>
                  <span className="font-bold text-teal-700">{selectedPatientForView.registrationType || 'NORMAL'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[var(--care-muted)]">Age & Gender:</span>
                <p className="font-bold text-[var(--care-ink)]">
                  {selectedPatientForView.age} yrs · {selectedPatientForView.gender}
                </p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Date of Birth:</span>
                <p className="font-bold text-[var(--care-ink)]">{selectedPatientForView.dob || '1992-05-14'}</p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Phone Number:</span>
                <p className="font-bold text-[var(--care-ink)]">{selectedPatientForView.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Email:</span>
                <p className="font-bold text-[var(--care-ink)]">{selectedPatientForView.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Blood Group:</span>
                <p className="font-bold text-[var(--care-ink)]">{selectedPatientForView.bloodGroup || 'O+'}</p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Allergies:</span>
                <p className="font-bold text-rose-700">{selectedPatientForView.allergies || 'None known'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[var(--care-muted)]">Address:</span>
                <p className="font-bold text-[var(--care-ink)]">{selectedPatientForView.address || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Emergency Contact:</span>
                <p className="font-bold text-[var(--care-ink)]">
                  {selectedPatientForView.emergencyContactName || 'N/A'} ({selectedPatientForView.emergencyContactPhone || 'N/A'})
                </p>
              </div>
              <div>
                <span className="text-[var(--care-muted)]">Assigned Physician:</span>
                <p className="font-bold text-teal-700">
                  {selectedPatientForView.assignedDoctorName || selectedPatientForView.primaryPhysician || 'None'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--care-border)]">
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
