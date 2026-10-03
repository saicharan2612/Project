'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  EMPTY_ACCOUNT,
  DemoAccount,
  ROLE_DEFINITIONS,
  PatientRecord,
  LeaveRequest,
  StaffShiftAssignment,
  BillingRecord,
  MedicineInventory,
  getStoredAccounts,
  saveNewStaffAccount,
  deleteStaffAccount,
  getAllAccounts,
  getStoredPatients,
  savePatients,
  getStoredLeaveRequests,
  saveLeaveRequests,
  getStoredShiftRoster,
  saveShiftRoster,
  getStoredBillings,
  saveBillings,
  getStoredMedicines,
  saveMedicines,
  BACKUP_STAFF_REPLACEMENTS,
  getEligibleReplacementsForStaff
} from '@/lib/demo-accounts'
import { signUpWithEmail, upsertStaffProfile, demoAccountToStaffProfile, supabase } from '@/lib/supabase'
import { SettingsModal } from '@/components/settings-modal'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Box,
  Building2,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  CreditCard,
  DollarSign,
  DoorOpen,
  Eye,
  EyeOff,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  FlaskConical,
  HeartPulse,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  MinusCircle,
  PackageCheck,
  Pill,
  Plus,
  PlusCircle,
  Receipt,
  RefreshCw,
  Search,
  Server,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Wallet,
  X,
  Zap
} from 'lucide-react'

type AdminTab =
  | 'overview'
  | 'patient-analysis'
  | 'billing-overview'
  | 'medicines-overview'
  | 'account-creation'
  | 'roster-replacement'
  | 'leave-approvals'
  | 'directory'
  | 'audit'
  | 'settings'

const DOCTOR_SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Oncology',
  'Dermatology',
  'Radiology',
  'Emergency Medicine',
  'General Surgery',
  'Psychiatry',
  'Internal Medicine',
  'Obstetrics & Gynecology',
  'Anesthesiology',
  'Pathology'
]

const SHIFT_SLOTS = [
  'Morning (08:00 - 16:00)',
  'Evening (16:00 - 00:00)',
  'Night (00:00 - 08:00)',
  'Full Day (All Shifts)'
] as const

interface AuditLogEntry {
  id: string
  action: string
  details: string
  timestamp: string
  user: string
  tone: 'success' | 'warning' | 'info'
}

function getTomorrowIsoString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayAfterTomorrowIsoString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateDaysBetween(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 1
  try {
    const s = new Date(startStr)
    const e = new Date(endStr)
    const diffTime = e.getTime() - s.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? diffDays : 1
  } catch {
    return 1
  }
}

export function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>('patient-analysis')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<DemoAccount | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('doctor')
  const [staffAccounts, setStaffAccounts] = useState<DemoAccount[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Patient Analysis State
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [patientStatusFilter, setPatientStatusFilter] = useState<string>('all')
  const [patientSearch, setPatientSearch] = useState<string>('')
  const [showAddPatientModal, setShowAddPatientModal] = useState(false)
  const [newPtName, setNewPtName] = useState('')
  const [newPtAge, setNewPtAge] = useState('35')
  const [newPtGender, setNewPtGender] = useState<'Female' | 'Male' | 'Other'>('Female')
  const [newPtDept, setNewPtDept] = useState('General Medicine')
  const [newPtDoctor, setNewPtDoctor] = useState('Dr. Alexander Wright')
  const [newPtSymptoms, setNewPtSymptoms] = useState('')
  const [newPtPriority, setNewPtPriority] = useState<'Normal' | 'Urgent' | 'STAT'>('Normal')

  // Billing Overview State
  const [billings, setBillings] = useState<BillingRecord[]>([])
  const [billingSearch, setBillingSearch] = useState<string>('')
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('all')
  const [showAddBillingModal, setShowAddBillingModal] = useState(false)
  const [newBillPatient, setNewBillPatient] = useState('')
  const [newBillCategory, setNewBillCategory] = useState<BillingRecord['serviceCategory']>('Cardiology Consultation')
  const [newBillAmount, setNewBillAmount] = useState('450')
  const [newBillPaid, setNewBillPaid] = useState('450')
  const [newBillMethod, setNewBillMethod] = useState<BillingRecord['paymentMethod']>('Insurance (BlueCross)')

  // Medicines Overview State
  const [medicines, setMedicines] = useState<MedicineInventory[]>([])
  const [medicineSearch, setMedicineSearch] = useState<string>('')
  const [medicineCategoryFilter, setMedicineCategoryFilter] = useState<string>('all')
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [newMedGeneric, setNewMedGeneric] = useState('')
  const [newMedCategory, setNewMedCategory] = useState<MedicineInventory['category']>('Antibiotics')
  const [newMedStock, setNewMedStock] = useState('500')
  const [newMedSold, setNewMedSold] = useState('20')
  const [newMedThreshold, setNewMedThreshold] = useState('100')
  const [newMedPrice, setNewMedPrice] = useState('15.00')
  const [newMedType, setNewMedType] = useState<MedicineInventory['unitType']>('Tablets')

  // Leave Approval State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>('all')
  const [showApproveModal, setShowApproveModal] = useState<LeaveRequest | null>(null)
  const [selectedReplacementStaffId, setSelectedReplacementStaffId] = useState<string>('')
  const [approvalNote, setApprovalNote] = useState<string>('')
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false)
  const [newLeaveStaffId, setNewLeaveStaffId] = useState('')
  const [newLeaveType, setNewLeaveType] = useState<LeaveRequest['leaveType']>('Sick Leave')
  const [newLeaveStart, setNewLeaveStart] = useState(getTomorrowIsoString)
  const [newLeaveEnd, setNewLeaveEnd] = useState(getDayAfterTomorrowIsoString)
  const [newLeaveShift, setNewLeaveShift] = useState<LeaveRequest['shiftSlot']>('Morning (08:00 - 16:00)')
  const [newLeaveReason, setNewLeaveReason] = useState('')

  const newLeaveStartRef = React.useRef<HTMLInputElement>(null)
  const newLeaveEndRef = React.useRef<HTMLInputElement>(null)

  // Shift & Absence Replacement State
  const [shiftRoster, setShiftRoster] = useState<StaffShiftAssignment[]>([])
  const [showReplaceStaffModal, setShowReplaceStaffModal] = useState<StaffShiftAssignment | null>(null)
  const [rosterReplacementStaffId, setRosterReplacementStaffId] = useState<string>('')
  const [rosterCoverageNote, setRosterCoverageNote] = useState<string>('')

  // Account Creation Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [specialization, setSpecialization] = useState('Cardiology')
  const [customSpecialization, setCustomSpecialization] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Feedback states
  const [formError, setFormError] = useState('')
  const [createdAccount, setCreatedAccount] = useState<DemoAccount | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [bannerNotice, setBannerNotice] = useState<string | null>(null)

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      action: 'Staff Account Created',
      details: 'Dr. Alexander Wright provisioned for Cardiology',
      timestamp: '15 mins ago',
      user: 'Dulla Sai Sri Charan (Admin)',
      tone: 'success'
    },
    {
      id: 'log-2',
      action: 'Leave Approved & Replacement Assigned',
      details: 'Marcus Vance leave approved; Rachel Green assigned as replacement',
      timestamp: '45 mins ago',
      user: 'Dulla Sai Sri Charan (Admin)',
      tone: 'success'
    },
    {
      id: 'log-3',
      action: 'Pharmacy Stock Reconciled',
      details: 'Automated batch dispensed and inventory counters updated',
      timestamp: '2 hours ago',
      user: 'System Pharmacist Bot',
      tone: 'info'
    }
  ])

  // Load all initial state on mount and subscribe to live changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('carelink_user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as DemoAccount
          if (parsed && parsed.name) {
            setCurrentUser(parsed)
          }
        } catch {}
      }
    }
    refreshAllData()

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'carelink_leave_requests' ||
        e.key === 'carelink_patients' ||
        e.key === 'carelink_billings' ||
        e.key === 'carelink_medicines' ||
        e.key === 'carelink_custom_accounts' ||
        e.key === 'carelink_shift_roster' ||
        e.key === 'carelink_user'
      ) {
        refreshAllData()
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('carelink_user')
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as DemoAccount
              if (parsed && parsed.name) setCurrentUser(parsed)
            } catch {}
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const adminName = currentUser?.name || 'Dulla Sai Sri Charan'
  const adminEmail = currentUser?.email || 'dullasaisricharan2612@gmail.com'
  const adminTitle = currentUser?.title || 'Super Administrator'
  const adminDepartment = currentUser?.department || 'Hospital IT & Security Governance'
  const adminInitials = currentUser?.avatarInitials || (adminName ? adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'DS')

  const refreshAllData = async () => {
    // Fetch live staff profiles directly from Supabase database table
    try {
      const { data: supaProfiles } = await supabase.from('carelink_staff_profiles').select('*')
      if (supaProfiles && supaProfiles.length > 0) {
        const fetchedAccs = supaProfiles.map(p => staffProfileToDemoAccount(p as any))
        setStaffAccounts(fetchedAccs)
        if (typeof window !== 'undefined') {
          localStorage.setItem('carelink_custom_accounts', JSON.stringify(fetchedAccs))
        }
      } else {
        const accs = getAllAccounts()
        setStaffAccounts(accs)
      }
    } catch {
      const accs = getAllAccounts()
      setStaffAccounts(accs)
    }

    setPatients(getStoredPatients())
    setLeaveRequests(getStoredLeaveRequests())
    setShiftRoster(getStoredShiftRoster())
    setBillings(getStoredBillings())
    setMedicines(getStoredMedicines())
  }

  const showNotification = (msg: string) => {
    setBannerNotice(msg)
    setTimeout(() => setBannerNotice(null), 4000)
  }

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleInstantLogin = (account: DemoAccount) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carelink_user', JSON.stringify(account))
    }
    router.push(`/${account.roleSlug}`)
  }

  // --- PATIENT ANALYSIS ACTIONS ---
  const handleUpdatePatientStatus = (patientId: string, nextStatus: PatientRecord['status']) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const updated = patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          status: nextStatus,
          completedTime: nextStatus === 'completed' ? nowTime : p.completedTime
        }
      }
      return p
    })
    setPatients(updated)
    savePatients(updated)
    const pt = patients.find(p => p.id === patientId)
    showNotification(`Patient ${pt?.name} status moved to "${nextStatus.toUpperCase()}"`)
  }

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPtName.trim()) return
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newPt: PatientRecord = {
      id: `pt-${Date.now()}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      name: newPtName.trim(),
      age: parseInt(newPtAge) || 30,
      gender: newPtGender,
      registeredTime: nowTime,
      status: 'registered',
      department: newPtDept,
      assignedDoctor: newPtDoctor,
      symptoms: newPtSymptoms.trim() || 'General health consultation',
      triagePriority: newPtPriority
    }
    const updated = [newPt, ...patients]
    setPatients(updated)
    savePatients(updated)
    setShowAddPatientModal(false)
    setNewPtName('')
    setNewPtSymptoms('')
    showNotification(`Registered new patient ${newPt.name} (${newPt.mrn}) successfully!`)
  }

  // Patient calculations
  const totalRegisteredToday = patients.length
  const totalDiagnosing = patients.filter(p => p.status === 'diagnosing').length
  const totalWaiting = patients.filter(p => p.status === 'waiting' || p.status === 'registered').length
  const totalCompleted = patients.filter(p => p.status === 'completed').length

  const filteredPatients = patients.filter(p => {
    if (patientStatusFilter !== 'all' && p.status !== patientStatusFilter) return false
    if (!patientSearch.trim()) return true
    const q = patientSearch.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.assignedDoctor.toLowerCase().includes(q) ||
      p.symptoms.toLowerCase().includes(q)
    )
  })

  // --- BILLING OVERVIEW ACTIONS & CALCULATIONS ---
  const totalBilledAmount = billings.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalRevenueCollected = billings.reduce((sum, b) => sum + b.paidAmount, 0)
  const totalOutstandingBalance = billings.reduce((sum, b) => sum + b.balanceDue, 0)
  const totalPaidInvoices = billings.filter(b => b.paymentStatus === 'Paid').length
  const collectionRate = totalBilledAmount > 0 ? ((totalRevenueCollected / totalBilledAmount) * 100).toFixed(1) : '100'

  const handleMarkInvoicePaid = (billId: string) => {
    const updated = billings.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          paidAmount: b.totalAmount,
          balanceDue: 0,
          paymentStatus: 'Paid' as const
        }
      }
      return b
    })
    setBillings(updated)
    saveBillings(updated)
    showNotification(`Invoice marked as fully paid!`)
  }

  const handleAddBillingRecord = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBillPatient.trim()) return
    const tot = parseFloat(newBillAmount) || 0
    const pd = parseFloat(newBillPaid) || 0
    const bal = Math.max(0, tot - pd)
    const status: BillingRecord['paymentStatus'] = bal === 0 ? 'Paid' : pd > 0 ? 'Partial' : 'Pending Insurance'

    const newBill: BillingRecord = {
      id: `bill-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: newBillPatient.trim(),
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      serviceCategory: newBillCategory,
      totalAmount: tot,
      paidAmount: pd,
      balanceDue: bal,
      paymentStatus: status,
      paymentMethod: newBillMethod,
      date: 'Today',
      invoiceTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [newBill, ...billings]
    setBillings(updated)
    saveBillings(updated)
    setShowAddBillingModal(false)
    setNewBillPatient('')
    showNotification(`Invoice ${newBill.invoiceNumber} recorded successfully!`)
  }

  const filteredBillings = billings.filter(b => {
    if (billingStatusFilter !== 'all' && b.paymentStatus !== billingStatusFilter) return false
    if (!billingSearch.trim()) return true
    const q = billingSearch.toLowerCase()
    return (
      b.patientName.toLowerCase().includes(q) ||
      b.invoiceNumber.toLowerCase().includes(q) ||
      b.serviceCategory.toLowerCase().includes(q) ||
      b.paymentMethod.toLowerCase().includes(q)
    )
  })

  // --- MEDICINES OVERVIEW ACTIONS & CALCULATIONS ---
  const totalMedicinesSold = medicines.reduce((sum, m) => sum + m.unitsSoldToday, 0)
  const totalRemainingStock = medicines.reduce((sum, m) => sum + m.currentStock, 0)
  const totalLowStockMedicines = medicines.filter(m => m.stockStatus === 'Low Stock' || m.stockStatus === 'Critical').length
  const totalPharmacySales = medicines.reduce((sum, m) => sum + m.unitsSoldToday * m.unitPrice, 0)

  const handleDispenseMedicine = (medId: string, amount = 10) => {
    const updated = medicines.map(m => {
      if (m.id === medId) {
        const newStock = Math.max(0, m.currentStock - amount)
        const newSold = m.unitsSoldToday + amount
        let newStatus: MedicineInventory['stockStatus'] = 'Optimal'
        if (newStock <= m.reorderThreshold * 0.3) newStatus = 'Critical'
        else if (newStock <= m.reorderThreshold) newStatus = 'Low Stock'
        else if (newStock <= m.reorderThreshold * 1.5) newStatus = 'Moderate'
        return {
          ...m,
          currentStock: newStock,
          unitsSoldToday: newSold,
          stockStatus: newStatus
        }
      }
      return m
    })
    setMedicines(updated)
    saveMedicines(updated)
    const med = medicines.find(m => m.id === medId)
    showNotification(`Dispensed ${amount} units of ${med?.name}. Stock updated!`)
  }

  const handleRestockMedicine = (medId: string, amount = 200) => {
    const updated = medicines.map(m => {
      if (m.id === medId) {
        const newStock = m.currentStock + amount
        let newStatus: MedicineInventory['stockStatus'] = 'Optimal'
        if (newStock <= m.reorderThreshold * 0.3) newStatus = 'Critical'
        else if (newStock <= m.reorderThreshold) newStatus = 'Low Stock'
        else if (newStock <= m.reorderThreshold * 1.5) newStatus = 'Moderate'
        return {
          ...m,
          currentStock: newStock,
          stockStatus: newStatus
        }
      }
      return m
    })
    setMedicines(updated)
    saveMedicines(updated)
    const med = medicines.find(m => m.id === medId)
    showNotification(`Added +${amount} units to ${med?.name} inventory.`)
  }

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedName.trim()) return
    const stk = parseInt(newMedStock) || 0
    const sold = parseInt(newMedSold) || 0
    const reorder = parseInt(newMedThreshold) || 100
    let status: MedicineInventory['stockStatus'] = 'Optimal'
    if (stk <= reorder * 0.3) status = 'Critical'
    else if (stk <= reorder) status = 'Low Stock'
    else if (stk <= reorder * 1.5) status = 'Moderate'

    const newMed: MedicineInventory = {
      id: `med-${Date.now()}`,
      sku: `MED-${newMedName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      name: newMedName.trim(),
      genericName: newMedGeneric.trim() || newMedName.trim(),
      category: newMedCategory,
      unitsSoldToday: sold,
      currentStock: stk,
      reorderThreshold: reorder,
      unitPrice: parseFloat(newMedPrice) || 10,
      unitType: newMedType,
      stockStatus: status,
      expiryDate: '12/2028',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}-A`
    }

    const updated = [newMed, ...medicines]
    setMedicines(updated)
    saveMedicines(updated)
    setShowAddMedicineModal(false)
    setNewMedName('')
    setNewMedGeneric('')
    showNotification(`New medicine "${newMed.name}" added to hospital pharmacy inventory!`)
  }

  const filteredMedicines = medicines.filter(m => {
    if (medicineCategoryFilter !== 'all' && m.category !== medicineCategoryFilter) return false
    if (!medicineSearch.trim()) return true
    const q = medicineSearch.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    )
  })

  // --- LEAVE APPROVAL ACTIONS ---
  const handleApproveLeave = (leaveId: string) => {
    const leave = leaveRequests.find(l => l.id === leaveId)
    if (!leave) return
    const allCandidates = [...staffAccounts, ...BACKUP_STAFF_REPLACEMENTS]
    const repStaff = allCandidates.find(s => s.id === selectedReplacementStaffId)

    const updated = leaveRequests.map(l => {
      if (l.id === leaveId) {
        return {
          ...l,
          status: 'approved' as const,
          replacementStaffId: repStaff?.id,
          replacementStaffName: repStaff ? `${repStaff.name} (${repStaff.roleLabel})` : 'Assigned from backup pool',
          adminNotes: approvalNote.trim() || 'Leave approved by Administrator'
        }
      }
      return l
    })
    setLeaveRequests(updated)
    saveLeaveRequests(updated)

    // Sync shift roster if staff exists
    const rosterUpdated = shiftRoster.map(s => {
      if (s.staffId === leave.staffId || s.staffName === leave.staffName) {
        return {
          ...s,
          dutyStatus: 'On Leave' as const,
          replacementStaffId: repStaff?.id,
          replacementStaffName: repStaff ? `${repStaff.name}` : 'Coverage Assigned',
          coverageNotes: `Covering leave slot: ${leave.shiftSlot}`
        }
      }
      return s
    })
    setShiftRoster(rosterUpdated)
    saveShiftRoster(rosterUpdated)

    setShowApproveModal(null)
    setApprovalNote('')
    setSelectedReplacementStaffId('')

    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: 'Leave Request Approved',
        details: `${leave.staffName} granted leave. Replacement: ${repStaff?.name || 'Assigned'}`,
        timestamp: 'Just now',
        user: 'Sarah Jenkins (Admin)',
        tone: 'success'
      },
      ...prev
    ])
    showNotification(`Leave request for ${leave.staffName} approved with replacement coverage!`)
  }

  const handleRejectLeave = (leaveId: string) => {
    const leave = leaveRequests.find(l => l.id === leaveId)
    if (!leave) return
    const updated = leaveRequests.map(l => {
      if (l.id === leaveId) {
        return {
          ...l,
          status: 'rejected' as const,
          adminNotes: 'Rejected due to critical staffing requirements'
        }
      }
      return l
    })
    setLeaveRequests(updated)
    saveLeaveRequests(updated)
    showNotification(`Leave request for ${leave.staffName} was rejected.`)
  }

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault()
    const staff = staffAccounts.find(s => s.id === newLeaveStaffId)
    if (!staff) return

    const tomorrowStr = getTomorrowIsoString()
    if (newLeaveStart < tomorrowStr) {
      showNotification('Leave can only be requested from tomorrow onwards. Today and past dates are not permitted.')
      return
    }

    if (newLeaveEnd < newLeaveStart) {
      showNotification('End date cannot be earlier than start date.')
      return
    }

    const finalDays = Math.max(1, calculateDaysBetween(newLeaveStart, newLeaveEnd))

    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.roleLabel,
      department: staff.department,
      leaveType: newLeaveType,
      startDate: newLeaveStart,
      endDate: newLeaveEnd,
      shiftSlot: newLeaveShift,
      reason: `${newLeaveReason.trim() || 'Personal / Medical Leave'} (${finalDays} day${finalDays > 1 ? 's' : ''})`,
      status: 'pending',
      submittedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    const updated = [newReq, ...leaveRequests]
    setLeaveRequests(updated)
    saveLeaveRequests(updated)
    setShowAddLeaveModal(false)
    setNewLeaveReason('')
    showNotification(`Submitted leave request for ${staff.name} (${finalDays} day(s))!`)
  }

  // --- SHIFT & ABSENCE REPLACEMENT ACTIONS ---
  const handleToggleStaffDuty = (assignmentId: string, newDuty: StaffShiftAssignment['dutyStatus']) => {
    const updated = shiftRoster.map(s => {
      if (s.id === assignmentId) {
        return {
          ...s,
          dutyStatus: newDuty,
          replacementStaffId: newDuty === 'On Duty' ? undefined : s.replacementStaffId,
          replacementStaffName: newDuty === 'On Duty' ? undefined : s.replacementStaffName,
          coverageNotes: newDuty === 'On Duty' ? undefined : s.coverageNotes
        }
      }
      return s
    })
    setShiftRoster(updated)
    saveShiftRoster(updated)
    const member = shiftRoster.find(s => s.id === assignmentId)
    showNotification(`Updated ${member?.staffName} status to "${newDuty}"`)
  }

  const handleAssignRosterReplacement = (assignmentId: string) => {
    const allCandidates = [...staffAccounts, ...BACKUP_STAFF_REPLACEMENTS]
    const repStaff = allCandidates.find(s => s.id === rosterReplacementStaffId)
    if (!repStaff) return
    const updated = shiftRoster.map(s => {
      if (s.id === assignmentId) {
        return {
          ...s,
          replacementStaffId: repStaff.id,
          replacementStaffName: `${repStaff.name} (${repStaff.roleLabel})`,
          coverageNotes: rosterCoverageNote.trim() || `Covering ${s.shiftSlot} shift slot`
        }
      }
      return s
    })
    setShiftRoster(updated)
    saveShiftRoster(updated)
    setShowReplaceStaffModal(null)
    setRosterCoverageNote('')
    setRosterReplacementStaffId('')
    showNotification(`Assigned ${repStaff.name} as replacement coverage!`)
  }

  // --- ACCOUNT CREATION ACTIONS ---
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) return setFormError('Please enter the full name.')
    if (!email.trim()) return setFormError('Please enter a valid email address.')
    if (!password) return setFormError('Please enter a password.')
    if (password.length < 8) return setFormError('Password must be at least 8 characters long.')
    if (password !== confirmPassword) return setFormError('Password and Confirm Password do not match.')

    const effectiveSpecialization =
      specialization === 'Other'
        ? customSpecialization.trim() || 'General Medicine'
        : specialization

    if (selectedRole === 'doctor' && !effectiveSpecialization) {
      return setFormError('Please select or specify a doctor specialization.')
    }

    const all = getAllAccounts()
    if (all.some(a => a.email.toLowerCase() === email.trim().toLowerCase())) {
      return setFormError(`An account with email "${email.trim()}" already exists. Please use a unique email.`)
    }

    let roleLabel = 'Doctor'
    let title = `Dr. ${name.trim()}, MD`
    let department = `${effectiveSpecialization} Department`
    let badge = `Clinical Provider · ${effectiveSpecialization}`
    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200'
    let permissions = [
      'Electronic Health Record (EHR) chart read & write',
      'Prescription & e-Rx pharmacy routing',
      'Diagnostic lab and imaging order dispatch',
      'Care plan sign-off and clinical discharge approval'
    ]
    let stats = [
      { label: "Today's Consultations", value: '8 Patients', change: 'Slots open', tone: 'positive' as const },
      { label: 'Urgent Diagnostic Reviews', value: '1 Pending', change: 'Lab ready', tone: 'warning' as const },
      { label: 'Active Inpatients', value: '4 Patients', change: 'Assigned wing', tone: 'neutral' as const },
      { label: 'Prescription Refills', value: '2 Pending', change: 'Awaiting signature', tone: 'warning' as const }
    ]

    if (selectedRole === 'nurse') {
      roleLabel = 'Nurse'
      title = `${name.trim()}, RN`
      department = 'Inpatient Medical/Surgical Ward'
      badge = 'Bedside Care & Vitals'
      badgeColor = 'bg-teal-100 text-teal-800 border-teal-200'
      permissions = [
        'Medication administration logging (eMAR)',
        'Real-time vitals recording & smart monitor syncing',
        'Shift handoff reporting & nursing notes',
        'Rapid response & bedside nurse call coordination'
      ]
      stats = [
        { label: 'Assigned Beds', value: '6 Beds', change: 'Active ward assignment', tone: 'neutral' as const },
        { label: 'Medications Due (<1 hr)', value: '2 Doses', change: 'eMAR synced', tone: 'warning' as const },
        { label: 'Vitals Checked Today', value: '18 / 18', change: '100% on time', tone: 'positive' as const },
        { label: 'Shift Duration', value: '8 hrs', change: 'On duty', tone: 'neutral' as const }
      ]
    } else if (selectedRole === 'medical-staff') {
      roleLabel = 'Medicine Staff'
      title = `${name.trim()}, MLS`
      department = 'Central Medicine & Pathology Diagnostics'
      badge = 'Medicine & Diagnostics'
      badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200'
      permissions = [
        'Laboratory Information System (LIS) processing',
        'Specimen barcoding & bio-repository tracking',
        'Diagnostic report upload & doctor notification',
        'Critical lab value escalation & panic alerts'
      ]
      stats = [
        { label: 'Specimens in Queue', value: '14 Orders', change: 'Turnaround 25m', tone: 'positive' as const },
        { label: 'STAT Lab Requests', value: '1 Urgent', change: 'In analyzer', tone: 'warning' as const },
        { label: 'Completed Tests Today', value: '72', change: 'Target on track', tone: 'positive' as const },
        { label: 'QC Verification', value: '100% Passed', change: 'All analyzers calibrated', tone: 'positive' as const }
      ]
    } else if (selectedRole === 'billing') {
      roleLabel = 'Billing Staff'
      title = `${name.trim()}, CPC`
      department = 'Patient Financial Services & Claims'
      badge = 'Revenue Cycle & Claims'
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      permissions = [
        'Insurance claim submission (EDI 837) & ERA processing',
        'Prior-authorization submission & denial appeals',
        'Itemized patient bill generation & financial counseling',
        'Payment gateway reconciliation & refund processing'
      ]
      stats = [
        { label: 'Claims Processed (Week)', value: '₹92,400', change: '99.1% clean claim rate', tone: 'positive' as const },
        { label: 'Pending Prior-Auths', value: '4 In Review', change: 'Avg response 18h', tone: 'warning' as const },
        { label: 'Reconciled Invoices', value: '230 Bills', change: 'Zero errors', tone: 'positive' as const },
        { label: 'Denied Claims Queue', value: '1 Claim', change: 'Under appeal', tone: 'neutral' as const }
      ]
    } else if (selectedRole === 'receptionist') {
      roleLabel = 'Receptionist'
      title = `${name.trim()}, Admissions Specialist`
      department = 'Central Patient Admissions'
      badge = 'Admissions & Front Desk'
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'
      permissions = [
        'Master patient index (MPI) lookup & registration',
        'Appointment calendar scheduling & SMS reminders',
        'Visitor badge issuance & waiting room queue management',
        'Direct provider messaging for arrival notifications'
      ]
      stats = [
        { label: 'Checked In Today', value: '28 Patients', change: 'Avg wait: 5 mins', tone: 'positive' as const },
        { label: 'In Waiting Area', value: '2 Patients', change: 'Room ready', tone: 'neutral' as const },
        { label: 'Upcoming Today', value: '12 Appointments', change: 'Next 2 hours', tone: 'neutral' as const },
        { label: 'No-Show Rate', value: '1.4%', change: 'Optimal', tone: 'positive' as const }
      ]
    }

    const initials = name
      .trim()
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST'

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = selectedRole === 'doctor' && !name.toLowerCase().startsWith('dr.') ? `Dr. ${name.trim()}` : name.trim()

    // 1. Generate clean UUID for the staff profile
    const assignedUserId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `staff-${Date.now()}`

    // Attempt Supabase Auth registration
    let authUserId = assignedUserId
    try {
      const { data: authData } = await signUpWithEmail(cleanEmail, password, {
        name: cleanName,
        role_slug: selectedRole,
        role_label: roleLabel
      })
      if (authData?.user?.id) {
        authUserId = authData.user.id
      }
    } catch {
      // Continue writing profile row to database table
    }

    const newAccount: DemoAccount = {
      id: assignedUserId,
      roleSlug: selectedRole,
      roleLabel,
      name: cleanName,
      title,
      department,
      specialization: selectedRole === 'doctor' ? effectiveSpecialization : undefined,
      email: cleanEmail,
      password,
      badge,
      badgeColor,
      avatarInitials: initials,
      summary: `Verified ${roleLabel} account provisioned by Administrator Sarah Jenkins for CareLink Healthcare Operations.`,
      permissions,
      stats,
      recentActivities: [
        {
          title: 'Account Provisioned',
          subtitle: `Verified by Admin Sarah Jenkins`,
          time: 'Just now',
          status: 'Active',
          statusColor: 'bg-emerald-100 text-emerald-800'
        }
      ],
      quickActions: [
        { label: 'Access Department Workflow', description: `Launch verified tools for ${roleLabel}` },
        { label: 'Update Profile Settings', description: 'Modify contact preferences and notification channels' }
      ],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
      isCustom: true
    }

    // 2. Persist profile row into Supabase PostgreSQL carelink_staff_profiles table
    const staffProfile = demoAccountToStaffProfile(newAccount, assignedUserId)
    await upsertStaffProfile(staffProfile)

    // 3. Update local cache & state
    saveNewStaffAccount(newAccount)
    refreshAllData()
    setCreatedAccount(newAccount)

    const newShift: StaffShiftAssignment = {
      id: `shift-${Date.now()}`,
      staffId: newAccount.id,
      staffName: newAccount.name,
      roleLabel: newAccount.roleLabel,
      department: newAccount.department,
      shiftSlot: 'Morning (08:00 - 16:00)',
      dutyStatus: 'On Duty'
    }
    const updatedRoster = [...shiftRoster, newShift]
    setShiftRoster(updatedRoster)
    saveShiftRoster(updatedRoster)

    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: 'Staff Account Created in Supabase',
        details: `${newAccount.name} provisioned as ${roleLabel}${selectedRole === 'doctor' ? ` (${effectiveSpecialization})` : ''}`,
        timestamp: 'Just now',
        user: 'Sarah Jenkins (Admin)',
        tone: 'success'
      },
      ...prev
    ])

    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setCustomSpecialization('')
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to de-provision account for ${name}?`)) {
      // Remove from Supabase table
      await supabase.from('carelink_staff_profiles').delete().eq('id', id)
      // Remove from local storage
      deleteStaffAccount(id)
      refreshAllData()
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          action: 'Staff Account De-provisioned',
          details: `Account for ${name} was revoked by Administrator`,
          timestamp: 'Just now',
          user: 'Sarah Jenkins (Admin)',
          tone: 'warning'
        },
        ...prev
      ])
    }
  }

  const filteredStaff = staffAccounts.filter(acc => {
    if (acc.roleSlug === 'patient') return false
    if (roleFilter !== 'all' && acc.roleSlug !== roleFilter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.roleLabel.toLowerCase().includes(q) ||
      acc.department.toLowerCase().includes(q) ||
      (acc.specialization && acc.specialization.toLowerCase().includes(q))
    )
  })

  const activeHospitalStaff = staffAccounts.filter(s => s.roleSlug !== 'patient' && s.roleSlug !== 'admin')

  return (
    <div className="flex min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sticky top-0 z-40 flex h-screen w-72 flex-col border-r border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--care-border)] px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--care-primary)] text-white shadow-sm">
              <Activity className="size-5" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
              <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold text-red-800">
                ADMIN
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
            Administration & Operations
          </div>

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

          {/* Patient Analysis & Flow Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('patient-analysis')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'patient-analysis'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="size-4" />
              <span>Patient Analysis & Flow</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'patient-analysis' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {totalRegisteredToday}
            </span>
          </button>

          {/* Billing Overview Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('billing-overview')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'billing-overview'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Receipt className="size-4" />
              <span>Billing overview</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'billing-overview' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              â‚¹{(totalRevenueCollected / 1000).toFixed(1)}k
            </span>
          </button>

          {/* Medicines Overview Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('medicines-overview')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'medicines-overview'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Pill className="size-4" />
              <span>Medicines overview</span>
            </div>
            {totalLowStockMedicines > 0 && (
              <span className="rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                {totalLowStockMedicines} Low
              </span>
            )}
          </button>

          {/* Explicitly named Account creation */}
          <button
            type="button"
            onClick={() => setActiveTab('account-creation')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'account-creation'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus className="size-4" />
              <span>Account creation</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'account-creation' ? 'bg-white/20 text-white' : 'bg-[var(--care-highlight)] text-[var(--care-primary-dark)]'
            }`}>
              5 Roles
            </span>
          </button>

          {/* Shift & Replacement Roster */}
          <button
            type="button"
            onClick={() => setActiveTab('roster-replacement')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'roster-replacement'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="size-4" />
              <span>Staff & Shift Replacement</span>
            </div>
            {shiftRoster.some(s => s.dutyStatus === 'Absent' || s.dutyStatus === 'On Leave') && (
              <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Leave Approvals */}
          <button
            type="button"
            onClick={() => setActiveTab('leave-approvals')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'leave-approvals'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="size-4" />
              <span>Leave Approvals</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'leave-approvals' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {leaveRequests.filter(l => l.status === 'pending').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'directory'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="size-4" />
              <span>Staff Directory</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-[var(--care-highlight)] text-[var(--care-ink)]'
            }`}>
              {staffAccounts.filter(a => a.roleSlug !== 'patient').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>Audit & Access Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <Building2 className="size-4" />
            <span>Hospital Configuration</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[var(--care-border)] p-4">
          <div className="flex items-center justify-between rounded-xl bg-[var(--care-bg)] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-red-600 font-bold text-white text-xs" suppressHydrationWarning>
                {adminInitials}
              </span>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--care-ink)] leading-none" suppressHydrationWarning>{adminName}</div>
                <div className="text-[10px] text-[var(--care-muted)] leading-none mt-1" suppressHydrationWarning>{adminTitle}</div>
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
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition"
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
          id: 'admin-1',
          roleSlug: 'admin',
          roleLabel: 'Admin',
          name: adminName,
          title: adminTitle,
          department: adminDepartment,
          email: adminEmail,
          password: '',
          badge: 'Super Admin Access',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          avatarInitials: adminInitials,
          summary: 'Super Administrator profile',
          permissions: [],
          stats: [],
          recentActivities: [],
          quickActions: []
        }}
      />

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--care-border)] bg-[var(--care-surface)]/95 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--care-ink)]">
              {activeTab === 'billing-overview' && 'Billing System Overview & Revenue Intelligence'}
              {activeTab === 'medicines-overview' && 'Pharmacy & Medicine Inventory Overview'}
              {activeTab === 'patient-analysis' && 'Patient Flow & Real-Time Intake Analysis'}
              {activeTab === 'account-creation' && 'Account Creation & User Provisioning'}
              {activeTab === 'roster-replacement' && 'Staff Absence & Shift Slot Replacement Manager'}
              {activeTab === 'leave-approvals' && 'Staff Leave Requests & Coverage Approval'}
              {activeTab === 'overview' && 'System Health & Operations Overview'}
              {activeTab === 'directory' && 'Hospital Staff Directory'}
              {activeTab === 'audit' && 'Security & RBAC Audit Logs'}
              {activeTab === 'settings' && 'Hospital Node Settings'}
            </h1>
            <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 sm:inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'billing-overview' && (
              <button
                type="button"
                onClick={() => setShowAddBillingModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
              >
                <PlusCircle className="size-4" />
                <span>Record New Invoice</span>
              </button>
            )}

            {activeTab === 'medicines-overview' && (
              <button
                type="button"
                onClick={() => setShowAddMedicineModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition"
              >
                <PlusCircle className="size-4" />
                <span>Add Medicine Stock</span>
              </button>
            )}


            {activeTab === 'leave-approvals' && (
              <button
                type="button"
                onClick={() => setShowAddLeaveModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--care-primary-dark)] transition"
              >
                <PlusCircle className="size-4" />
                <span>Submit Leave Request</span>
              </button>
            )}

            {activeTab !== 'account-creation' && (
              <button
                type="button"
                onClick={() => setActiveTab('account-creation')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--care-primary-dark)]"
              >
                <PlusCircle className="size-4" />
                <span>Create Staff Account</span>
              </button>
            )}

            <Link
              href="/"
              className="rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
            >
              Back to Home
            </Link>
          </div>
        </header>

        {/* Global Notification Banner */}
        {bannerNotice && (
          <div className="flex items-center justify-between border-b border-emerald-300 bg-emerald-50 px-6 py-2.5 text-xs font-semibold text-emerald-900 shadow-inner animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button type="button" onClick={() => setBannerNotice(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* TAB 1: BILLING OVERVIEW */}
          {activeTab === 'billing-overview' && (
            <div className="mx-auto max-w-6xl space-y-8">
              {/* Billing High Level KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Billing Happened */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-900">Total Billed Amount</p>
                    <span className="rounded-md bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      All Invoices
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-blue-950">
                    â‚¹{totalBilledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-blue-700 font-semibold">
                    {billings.length} Invoices generated today
                  </p>
                </div>

                {/* Money Collected / Come In */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-900">Revenue Collected (Money In)</p>
                    <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {collectionRate}% Realized
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-950">
                    â‚¹{totalRevenueCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="size-3.5" /> Successfully deposited & cleared
                  </p>
                </div>

                {/* Outstanding Balance */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-900">Pending / Outstanding</p>
                    <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Receivables
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-amber-950">
                    â‚¹{totalOutstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-amber-700 font-semibold">
                    Insurance claims in adjudication
                  </p>
                </div>

                {/* Clean Claim Rate */}
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-purple-900">Settled Invoices</p>
                    <span className="rounded-md bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                      100% Verified
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-purple-950">
                    {totalPaidInvoices} / {billings.length}
                  </p>
                  <p className="mt-1 text-xs text-purple-700 font-semibold">
                    Fully cleared payments
                  </p>
                </div>
              </div>

              {/* Revenue Channels Breakdown Bar */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--care-ink)]">
                      Hospital Department Revenue Distribution
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Financial breakdown across inpatient, outpatient, diagnostic labs, and pharmacy
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBillingModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--care-primary)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--care-primary-dark)]"
                  >
                    <Plus className="size-3.5" /> New Charge
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                  <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3">
                    <span className="text-[var(--care-muted)] font-medium">Inpatient Care</span>
                    <p className="text-base font-bold text-[var(--care-ink)] mt-1">â‚¹4,200.00</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">37.7% of total</span>
                  </div>
                  <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3">
                    <span className="text-[var(--care-muted)] font-medium">Cardiology</span>
                    <p className="text-base font-bold text-[var(--care-ink)] mt-1">â‚¹2,530.00</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">22.7% of total</span>
                  </div>
                  <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3">
                    <span className="text-[var(--care-muted)] font-medium">Emergency Care</span>
                    <p className="text-base font-bold text-[var(--care-ink)] mt-1">â‚¹2,650.00</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">23.8% of total</span>
                  </div>
                  <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3">
                    <span className="text-[var(--care-muted)] font-medium">Diagnostic Pathology</span>
                    <p className="text-base font-bold text-[var(--care-ink)] mt-1">â‚¹1,430.00</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">12.8% of total</span>
                  </div>
                  <div className="rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-3">
                    <span className="text-[var(--care-muted)] font-medium">Pharmacy & Meds</span>
                    <p className="text-base font-bold text-[var(--care-ink)] mt-1">â‚¹340.00</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">3.0% of total</span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">
                      Patient Invoices & Payment Ledger
                    </h3>
                    <p className="text-xs text-[var(--care-muted)] mt-0.5">
                      Itemized list of all charges, payments received, and outstanding balances
                    </p>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--care-muted)]" />
                      <input
                        type="text"
                        value={billingSearch}
                        onChange={(e) => setBillingSearch(e.target.value)}
                        placeholder="Search invoice, patient, payer..."
                        className="h-9 w-48 sm:w-60 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] pl-8 pr-3 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)]"
                      />
                    </div>

                    <select
                      value={billingStatusFilter}
                      onChange={(e) => setBillingStatusFilter(e.target.value)}
                      className="h-9 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold text-[var(--care-ink)] outline-none"
                    >
                      <option value="all">All Invoices ({billings.length})</option>
                      <option value="Paid">Paid ({billings.filter(b => b.paymentStatus === 'Paid').length})</option>
                      <option value="Partial">Partial ({billings.filter(b => b.paymentStatus === 'Partial').length})</option>
                      <option value="Pending Insurance">Pending Insurance ({billings.filter(b => b.paymentStatus === 'Pending Insurance').length})</option>
                      <option value="Overdue">Overdue ({billings.filter(b => b.paymentStatus === 'Overdue').length})</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-bg)] font-bold text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3">Invoice & Patient</th>
                        <th className="px-3 py-3">Service Category</th>
                        <th className="px-3 py-3">Billed Amount</th>
                        <th className="px-3 py-3">Money In (Paid)</th>
                        <th className="px-3 py-3">Balance Due</th>
                        <th className="px-3 py-3">Payment Method</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)] bg-[var(--care-surface)]">
                      {filteredBillings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-xs text-[var(--care-muted)]">
                            No billing records found matching the criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBillings.map((bill) => (
                          <tr key={bill.id} className="hover:bg-[var(--care-highlight)]/30 transition">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[var(--care-ink)]">{bill.patientName}</div>
                              <div className="text-[10px] font-mono text-[var(--care-muted)] mt-0.5">
                                {bill.invoiceNumber} Â· {bill.mrn}
                              </div>
                            </td>

                            <td className="px-3 py-3.5 font-semibold text-[var(--care-ink)]">
                              {bill.serviceCategory}
                            </td>

                            <td className="px-3 py-3.5 font-mono font-bold text-[var(--care-ink)]">
                              â‚¹{bill.totalAmount.toFixed(2)}
                            </td>

                            <td className="px-3 py-3.5 font-mono font-bold text-emerald-700">
                              â‚¹{bill.paidAmount.toFixed(2)}
                            </td>

                            <td className="px-3 py-3.5 font-mono font-bold text-amber-700">
                              â‚¹{bill.balanceDue.toFixed(2)}
                            </td>

                            <td className="px-3 py-3.5 text-[var(--care-muted)]">
                              {bill.paymentMethod}
                            </td>

                            <td className="px-3 py-3.5">
                              {bill.paymentStatus === 'Paid' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <Check className="size-3" /> Paid
                                </span>
                              )}
                              {bill.paymentStatus === 'Partial' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Clock className="size-3" /> Partial
                                </span>
                              )}
                              {bill.paymentStatus === 'Pending Insurance' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                  Insurance In Review
                                </span>
                              )}
                              {bill.paymentStatus === 'Overdue' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                  Overdue
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              {bill.balanceDue > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleMarkInvoicePaid(bill.id)}
                                  className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition"
                                >
                                  Collect Balance
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-700">Settled âœ“</span>
                              )}
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

          {/* TAB 2: MEDICINES OVERVIEW */}
          {activeTab === 'medicines-overview' && (
            <div className="mx-auto max-w-6xl space-y-8">
              {/* Medicines High-Level KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Medicines Sold */}
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-900">Medicines Sold Today</p>
                    <span className="rounded-md bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                      Dispensed
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-indigo-950">
                    {totalMedicinesSold.toLocaleString()} <span className="text-sm font-semibold text-indigo-700">units</span>
                  </p>
                  <p className="mt-1 text-xs text-indigo-700 font-semibold">
                    Across inpatient & outpatient prescriptions
                  </p>
                </div>

                {/* Total Remaining Stock */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-900">Current Stock Available</p>
                    <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      In Pharmacy
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-950">
                    {totalRemainingStock.toLocaleString()} <span className="text-sm font-semibold text-emerald-700">units</span>
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 font-semibold">
                    {medicines.length} Pharmaceutical items tracked
                  </p>
                </div>

                {/* Low Stock Alerts */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-900">Low Stock / Reorder Alerts</p>
                    <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Attention
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-amber-950">
                    {totalLowStockMedicines} <span className="text-sm font-semibold text-amber-700">medicines</span>
                  </p>
                  <p className="mt-1 text-xs text-amber-700 font-semibold">
                    Near or below safety threshold
                  </p>
                </div>

                {/* Pharmacy Revenue */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-900">Pharmacy Sales Revenue</p>
                    <span className="rounded-md bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      Today
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-blue-950">
                    â‚¹{totalPharmacySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-blue-700 font-semibold">
                    Direct medicine dispense receipts
                  </p>
                </div>
              </div>

              {/* Medicines Inventory & Sales Register Table */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">
                      Medicine Inventory, Dispense Logs & Stock Management
                    </h3>
                    <p className="text-xs text-[var(--care-muted)] mt-0.5">
                      Real-time inventory levels, units sold today, unit price, and restock actions
                    </p>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--care-muted)]" />
                      <input
                        type="text"
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                        placeholder="Search medicine, SKU, category..."
                        className="h-9 w-48 sm:w-60 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] pl-8 pr-3 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)]"
                      />
                    </div>

                    <select
                      value={medicineCategoryFilter}
                      onChange={(e) => setMedicineCategoryFilter(e.target.value)}
                      className="h-9 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold text-[var(--care-ink)] outline-none"
                    >
                      <option value="all">All Categories ({medicines.length})</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Diabetes & Endocrine">Diabetes & Endocrine</option>
                      <option value="Pain Relief & Analgesics">Pain Relief & Analgesics</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Inpatient Injectables">Inpatient Injectables</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-bg)] font-bold text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3">Medicine & Formula</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Sold Today</th>
                        <th className="px-3 py-3">In Stock Level</th>
                        <th className="px-3 py-3">Unit Price</th>
                        <th className="px-3 py-3">Stock Status</th>
                        <th className="px-4 py-3 text-right">Quick Stock Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)] bg-[var(--care-surface)]">
                      {filteredMedicines.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--care-muted)]">
                            No medicines match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredMedicines.map((med) => {
                          const stockPercent = Math.min(100, Math.round((med.currentStock / (med.reorderThreshold * 2.5)) * 100))
                          return (
                            <tr key={med.id} className="hover:bg-[var(--care-highlight)]/30 transition">
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-[var(--care-ink)] flex items-center gap-1.5">
                                  {med.name}
                                </div>
                                <div className="text-[10px] text-[var(--care-muted)] mt-0.5">
                                  {med.genericName} Â· <span className="font-mono">{med.sku}</span>
                                </div>
                              </td>

                              <td className="px-3 py-3.5">
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                                  {med.category}
                                </span>
                              </td>

                              <td className="px-3 py-3.5 font-bold text-indigo-900 font-mono">
                                {med.unitsSoldToday} {med.unitType.toLowerCase()}
                              </td>

                              <td className="px-3 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-mono text-[var(--care-ink)]">{med.currentStock}</span>
                                  <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        med.stockStatus === 'Critical'
                                          ? 'bg-red-500'
                                          : med.stockStatus === 'Low Stock'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${stockPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] text-[var(--care-muted)] mt-0.5">
                                  Reorder below: {med.reorderThreshold}
                                </div>
                              </td>

                              <td className="px-3 py-3.5 font-mono font-semibold text-[var(--care-ink)]">
                                â‚¹{med.unitPrice.toFixed(2)}
                              </td>

                              <td className="px-3 py-3.5">
                                {med.stockStatus === 'Optimal' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <Check className="size-3" /> Optimal Stock
                                  </span>
                                )}
                                {med.stockStatus === 'Moderate' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                    Moderate
                                  </span>
                                )}
                                {med.stockStatus === 'Low Stock' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <AlertTriangle className="size-3" /> Low Stock
                                  </span>
                                )}
                                {med.stockStatus === 'Critical' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800 animate-pulse">
                                    <AlertTriangle className="size-3" /> Critical Reorder
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDispenseMedicine(med.id, 10)}
                                    className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 transition"
                                    title="Simulate dispensing 10 units"
                                  >
                                    -10 Dispense
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRestockMedicine(med.id, 200)}
                                    className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition"
                                    title="Add 200 units to stock"
                                  >
                                    +200 Restock
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PATIENT ANALYSIS & FLOW */}
          {activeTab === 'patient-analysis' && (
            <div className="mx-auto max-w-6xl space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-900">Registered Today</p>
                    <span className="rounded-md bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      Upto Now
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-blue-950">{totalRegisteredToday}</p>
                  <p className="mt-1 text-xs text-blue-700 font-semibold">100% Intake logged today</p>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-900">Diagnosed / In Consult</p>
                    <span className="rounded-md bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                      Active
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-indigo-950">{totalDiagnosing}</p>
                  <p className="mt-1 text-xs text-indigo-700 font-semibold">Seen by Doctor / Medicine staff</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-900">Waiting in Queue</p>
                    <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Avg wait: 8m
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-amber-950">{totalWaiting}</p>
                  <p className="mt-1 text-xs text-amber-700 font-semibold">Triage & waiting rooms</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-900">Completed & Left</p>
                    <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Discharged
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-950">{totalCompleted}</p>
                  <p className="mt-1 text-xs text-emerald-700 font-semibold">Finished visits & departed</p>
                </div>
              </div>

              {/* Read-Only Telemetry Notice */}
              <div className="flex items-center gap-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 p-4 text-xs text-blue-900 shadow-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  <Eye className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-950">Observational Flow Telemetry (Read-Only)</h4>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Live patient intake throughput, waiting queue load, active physician consults, and departures. Queue movements and diagnosis stages are controlled strictly by Reception, Triage Nurses, and Attending Doctors.
                  </p>
                </div>
              </div>

              {/* Patient Intake Flow Funnel Progress */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--care-ink)]">
                      Patient Journey & Pipeline Stage Funnel
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Distribution of patients across all care delivery phases
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--care-primary-dark)]">
                    {totalRegisteredToday} Total Tracked Today
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-blue-100/70 p-3 border border-blue-200">
                    <div className="font-bold text-blue-900">1. Registered</div>
                    <div className="text-lg font-black text-blue-950 mt-1">{patients.filter(p => p.status === 'registered').length}</div>
                    <div className="text-[10px] text-blue-700 mt-0.5">Initial check-in</div>
                  </div>

                  <div className="rounded-xl bg-amber-100/70 p-3 border border-amber-200">
                    <div className="font-bold text-amber-900">2. Waiting</div>
                    <div className="text-lg font-black text-amber-950 mt-1">{patients.filter(p => p.status === 'waiting').length}</div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Ready for doctor</div>
                  </div>

                  <div className="rounded-xl bg-indigo-100/70 p-3 border border-indigo-200">
                    <div className="font-bold text-indigo-900">3. In Diagnosis</div>
                    <div className="text-lg font-black text-indigo-950 mt-1">{patients.filter(p => p.status === 'diagnosing').length}</div>
                    <div className="text-[10px] text-indigo-700 mt-0.5">Consultation & Tests</div>
                  </div>

                  <div className="rounded-xl bg-emerald-100/70 p-3 border border-emerald-200">
                    <div className="font-bold text-emerald-900">4. Completed & Left</div>
                    <div className="text-lg font-black text-emerald-950 mt-1">{patients.filter(p => p.status === 'completed').length}</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Discharged</div>
                  </div>
                </div>
              </div>

              {/* Real-time Patient Register Table */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">
                      Live Hospital Patient Flow Board
                    </h3>
                    <p className="text-xs text-[var(--care-muted)] mt-0.5">
                      Real-time register of registered, waiting, diagnosed, and discharged patients
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--care-muted)]" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="Search patient, MRN, doctor..."
                        className="h-9 w-48 sm:w-60 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] pl-8 pr-3 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)]"
                      />
                    </div>

                    <select
                      value={patientStatusFilter}
                      onChange={(e) => setPatientStatusFilter(e.target.value)}
                      className="h-9 rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold text-[var(--care-ink)] outline-none"
                    >
                      <option value="all">All Stages ({patients.length})</option>
                      <option value="registered">Registered ({patients.filter(p => p.status === 'registered').length})</option>
                      <option value="waiting">Waiting ({patients.filter(p => p.status === 'waiting').length})</option>
                      <option value="diagnosing">In Diagnosis ({patients.filter(p => p.status === 'diagnosing').length})</option>
                      <option value="completed">Completed & Left ({patients.filter(p => p.status === 'completed').length})</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-bg)] font-bold text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3">Patient & MRN</th>
                        <th className="px-3 py-3">Reg. Time</th>
                        <th className="px-3 py-3">Status Stage</th>
                        <th className="px-3 py-3">Department & Doctor</th>
                        <th className="px-3 py-3">Symptoms / Notes</th>
                        <th className="px-4 py-3 text-right">Triage Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)] bg-[var(--care-surface)]">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-xs text-[var(--care-muted)]">
                            No patient records match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((pt) => (
                          <tr key={pt.id} className="hover:bg-[var(--care-highlight)]/30 transition">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[var(--care-ink)] flex items-center gap-1.5">
                                {pt.name}
                                <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-mono text-slate-600">
                                  {pt.gender[0]}, {pt.age}y
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-[var(--care-muted)] mt-0.5">
                                {pt.mrn}
                              </div>
                            </td>

                            <td className="px-3 py-3.5 font-mono text-[var(--care-muted)]">
                              {pt.registeredTime}
                            </td>

                            <td className="px-3 py-3.5">
                              {pt.status === 'registered' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                  Registered
                                </span>
                              )}
                              {pt.status === 'waiting' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Clock className="size-3" /> Waiting in Triage
                                </span>
                              )}
                              {pt.status === 'diagnosing' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                  <Stethoscope className="size-3" /> Diagnosed / In Consult
                                </span>
                              )}
                              {pt.status === 'completed' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <Check className="size-3" /> Completed & Left ({pt.completedTime || 'Discharged'})
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-3.5">
                              <div className="font-semibold text-[var(--care-ink)]">{pt.department}</div>
                              <div className="text-[10px] text-[var(--care-muted)] mt-0.5">{pt.assignedDoctor}</div>
                            </td>

                            <td className="px-3 py-3.5 text-[var(--care-muted)] max-w-xs truncate">
                              {pt.symptoms}
                              {pt.notes && <span className="block text-[10px] text-emerald-700 italic mt-0.5">{pt.notes}</span>}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                pt.triagePriority === 'Urgent' || pt.triagePriority === 'Critical'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {pt.triagePriority || 'Normal'} Priority
                              </span>
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

          {/* TAB 4: STAFF ABSENCE & SHIFT REPLACEMENT ROSTER */}
          {activeTab === 'roster-replacement' && (
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--care-ink)]">
                    Staff Absence & Shift Slot Replacement Manager
                  </h2>
                  <p className="text-xs text-[var(--care-muted)] mt-0.5">
                    Monitor active duty shifts, flag absent staff members, and assign qualified replacements for their time slots.
                  </p>
                </div>
              </div>

              {/* Shift Board */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-[var(--care-primary)]" />
                    <h3 className="text-sm font-bold text-[var(--care-ink)]">
                      Current Shift Duty Board & Coverage Status
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[var(--care-muted)]">
                    Active Roster: {shiftRoster.length} Assigned Staff
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-bg)] font-bold text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3">Staff Member</th>
                        <th className="px-3 py-3">Role & Department</th>
                        <th className="px-3 py-3">Assigned Time Slot</th>
                        <th className="px-3 py-3">Duty Status</th>
                        <th className="px-4 py-3">Slot Replacement Coverage</th>
                        <th className="px-4 py-3 text-right">Admin Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)] bg-[var(--care-surface)]">
                      {shiftRoster.map((item) => {
                        const isAbsent = item.dutyStatus === 'Absent' || item.dutyStatus === 'On Leave'
                        return (
                          <tr key={item.id} className="hover:bg-[var(--care-highlight)]/30 transition">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[var(--care-ink)]">{item.staffName}</div>
                            </td>

                            <td className="px-3 py-3.5">
                              <div className="font-semibold text-[var(--care-ink)]">{item.roleLabel}</div>
                              <div className="text-[10px] text-[var(--care-muted)] mt-0.5">{item.department}</div>
                            </td>

                            <td className="px-3 py-3.5 font-mono text-[var(--care-ink)] font-semibold">
                              {item.shiftSlot}
                            </td>

                            <td className="px-3 py-3.5">
                              <select
                                value={item.dutyStatus}
                                onChange={(e) => handleToggleStaffDuty(item.id, e.target.value as StaffShiftAssignment['dutyStatus'])}
                                className={`h-8 rounded-lg border px-2.5 text-xs font-bold outline-none ${
                                  item.dutyStatus === 'On Duty'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : item.dutyStatus === 'Absent'
                                    ? 'border-red-300 bg-red-50 text-red-800'
                                    : item.dutyStatus === 'On Leave'
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-slate-300 bg-slate-50 text-slate-800'
                                }`}
                              >
                                <option value="On Duty">â— On Duty</option>
                                <option value="Absent">âš ï¸ Absent</option>
                                <option value="On Leave">ðŸ–ï¸ On Leave</option>
                                <option value="Standby">Standby</option>
                              </select>
                            </td>

                            <td className="px-4 py-3.5">
                              {isAbsent ? (
                                item.replacementStaffName ? (
                                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                      <UserCheck className="size-3.5 text-emerald-700" />
                                      {item.replacementStaffName}
                                    </div>
                                    {item.coverageNotes && (
                                      <div className="text-[10px] text-emerald-700 mt-0.5">{item.coverageNotes}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800 flex items-center gap-1">
                                      <AlertTriangle className="size-3" /> Slot Uncovered
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setShowReplaceStaffModal(item)}
                                      className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 shadow-sm"
                                    >
                                      Assign Replacement
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="text-[11px] text-[var(--care-muted)]">
                                  Regular Shift Coverage
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              {isAbsent && (
                                <button
                                  type="button"
                                  onClick={() => setShowReplaceStaffModal(item)}
                                  className="text-xs font-bold text-[var(--care-primary)] hover:underline"
                                >
                                  {item.replacementStaffName ? 'Change Replacement' : 'Add Coverage'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEAVE APPROVALS */}
          {activeTab === 'leave-approvals' && (
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--care-ink)]">Staff Leave Requests & Approval System</h2>
                  <p className="text-xs text-[var(--care-muted)] mt-0.5">
                    Review and authorize leave applications submitted by doctors, nurses, medicine staff, billing, and receptionists.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)] transition self-start sm:self-auto"
                >
                  <PlusCircle className="size-4" /> Submit Leave Request
                </button>
              </div>

              {/* Leave Requests Table */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--care-ink)]">
                    All Staff Leave Applications
                  </h3>

                  <select
                    value={leaveStatusFilter}
                    onChange={(e) => setLeaveStatusFilter(e.target.value)}
                    className="h-8 rounded-lg border border-[var(--care-border)] bg-[var(--care-bg)] px-2.5 text-xs font-semibold text-[var(--care-ink)] outline-none"
                  >
                    <option value="all">All Statuses ({leaveRequests.length})</option>
                    <option value="pending">Pending Review ({leaveRequests.filter(l => l.status === 'pending').length})</option>
                    <option value="approved">Approved ({leaveRequests.filter(l => l.status === 'approved').length})</option>
                    <option value="rejected">Rejected ({leaveRequests.filter(l => l.status === 'rejected').length})</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-bg)] font-bold text-[var(--care-muted)]">
                      <tr>
                        <th className="px-4 py-3">Staff Member</th>
                        <th className="px-3 py-3">Role & Dept</th>
                        <th className="px-3 py-3">Leave Type</th>
                        <th className="px-3 py-3">Duration & Time Slot</th>
                        <th className="px-3 py-3">Reason / Details</th>
                        <th className="px-3 py-3">Status & Coverage</th>
                        <th className="px-4 py-3 text-right">Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)] bg-[var(--care-surface)]">
                      {leaveRequests
                        .filter(l => leaveStatusFilter === 'all' || l.status === leaveStatusFilter)
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-[var(--care-highlight)]/30 transition">
                            <td className="px-4 py-3.5 font-bold text-[var(--care-ink)]">
                              {req.staffName}
                              <div className="text-[10px] text-[var(--care-muted)] font-normal mt-0.5">{req.submittedAt}</div>
                            </td>

                            <td className="px-3 py-3.5">
                              <span className="font-semibold text-[var(--care-ink)]">{req.staffRole}</span>
                              <div className="text-[10px] text-[var(--care-muted)] mt-0.5">{req.department}</div>
                            </td>

                            <td className="px-3 py-3.5">
                              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                {req.leaveType}
                              </span>
                            </td>

                            <td className="px-3 py-3.5">
                              <div className="font-semibold text-[var(--care-ink)]">{req.startDate} â†’ {req.endDate}</div>
                              <div className="text-[10px] font-mono text-[var(--care-muted)] mt-0.5">{req.shiftSlot}</div>
                            </td>

                            <td className="px-3 py-3.5 text-[var(--care-muted)] max-w-xs">
                              {req.reason}
                            </td>

                            <td className="px-3 py-3.5">
                              {req.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Clock className="size-3" /> Pending Review
                                </span>
                              )}
                              {req.status === 'approved' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <Check className="size-3" /> Approved
                                  </span>
                                  {req.replacementStaffName && (
                                    <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                                      Covered by: {req.replacementStaffName}
                                    </div>
                                  )}
                                </div>
                              )}
                              {req.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                  <X className="size-3" /> Rejected
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              {req.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setShowApproveModal(req)}
                                    className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 shadow-sm"
                                  >
                                    Approve & Assign Coverage
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectLeave(req.id)}
                                    className="rounded-lg bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowApproveModal(req)}
                                  className="text-[11px] font-bold text-[var(--care-primary)] hover:underline"
                                >
                                  Modify Coverage
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT CREATION */}
          {activeTab === 'account-creation' && (
            <div className="mx-auto max-w-5xl space-y-8">
              {/* Header Card */}
              <div className="relative overflow-hidden rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="absolute -right-8 -top-8 size-40 rounded-full bg-[var(--care-highlight)]/60 blur-3xl" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--care-highlight)] px-3 py-1 text-xs font-bold text-[var(--care-primary-dark)] mb-2">
                      <Sparkles className="size-3.5" /> Staff Provisioning Hub
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--care-ink)] sm:text-3xl">
                      Create a Staff Account
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--care-muted)] max-w-2xl">
                      Provision authentic credentials and role-specific permissions for doctors, nurses, medicine staff, billing personnel, and receptionists.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-4 text-xs shrink-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <ShieldCheck className="size-4" /> HIPAA Compliance Ready
                    </div>
                    <div className="text-[var(--care-muted)] text-[11px]">Instant credential generation & routing</div>
                  </div>
                </div>
              </div>

              {/* SUCCESS MODAL / BANNER AFTER CREATION */}
              {createdAccount && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
                        <Check className="size-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-emerald-900">
                            Account Created Successfully!
                          </h3>
                          <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${createdAccount.badgeColor}`}>
                            {createdAccount.roleLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-emerald-800">
                          {createdAccount.name} has been provisioned and is ready for immediate login.
                        </p>

                        {/* Credentials Card */}
                        <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-white p-4 sm:grid-cols-2 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium">Login Email:</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-slate-800">{createdAccount.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(createdAccount.email, 'created-email')}
                                className="rounded p-1 hover:bg-slate-100 text-slate-500"
                                title="Copy email"
                              >
                                {copiedField === 'created-email' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-500 font-medium">Password:</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-slate-800">{createdAccount.password}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(createdAccount.password, 'created-pass')}
                                className="rounded p-1 hover:bg-slate-100 text-slate-500"
                                title="Copy password"
                              >
                                {copiedField === 'created-pass' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                              </button>
                            </div>
                          </div>

                          {createdAccount.specialization && (
                            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                              <span className="text-slate-500 font-medium">Specialization:</span>
                              <span className="ml-2 font-bold text-blue-700">{createdAccount.specialization}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick action buttons */}
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleInstantLogin(createdAccount)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
                          >
                            <UserCheck className="size-4" />
                            Test 1-Click Login as {createdAccount.roleLabel}
                            <ArrowRight className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab('directory')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition"
                          >
                            <Users className="size-4" />
                            View in Staff Directory
                          </button>

                          <button
                            type="button"
                            onClick={() => setCreatedAccount(null)}
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCreatedAccount(null)}
                      className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-200 transition"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Role Selection Tabs */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-[var(--care-ink)]">
                    1. Select Staff Role to Provision
                  </h3>
                  <p className="text-xs text-[var(--care-muted)] mt-0.5">
                    Choose the clinical or administrative role you want to create an account for.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('doctor')
                      setFormError('')
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition border-2 ${
                      selectedRole === 'doctor'
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-[var(--care-border)] bg-[var(--care-bg)] hover:bg-[var(--care-highlight)]/50'
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-2">
                      <Stethoscope className="size-6" />
                    </span>
                    <span className="text-xs font-bold text-[var(--care-ink)]">Doctor</span>
                    <span className="text-[10px] text-blue-700 font-semibold mt-0.5">+ Specialization</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('nurse')
                      setFormError('')
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition border-2 ${
                      selectedRole === 'nurse'
                        ? 'border-teal-600 bg-teal-50/60 shadow-sm'
                        : 'border-[var(--care-border)] bg-[var(--care-bg)] hover:bg-[var(--care-highlight)]/50'
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm mb-2">
                      <HeartPulse className="size-6" />
                    </span>
                    <span className="text-xs font-bold text-[var(--care-ink)]">Nurse</span>
                    <span className="text-[10px] text-teal-700 font-semibold mt-0.5">Inpatient Care</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('medical-staff')
                      setFormError('')
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition border-2 ${
                      selectedRole === 'medical-staff'
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                        : 'border-[var(--care-border)] bg-[var(--care-bg)] hover:bg-[var(--care-highlight)]/50'
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm mb-2">
                      <FlaskConical className="size-6" />
                    </span>
                    <span className="text-xs font-bold text-[var(--care-ink)]">Medicine Staff</span>
                    <span className="text-[10px] text-indigo-700 font-semibold mt-0.5">Labs & Medicine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('billing')
                      setFormError('')
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition border-2 ${
                      selectedRole === 'billing'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                        : 'border-[var(--care-border)] bg-[var(--care-bg)] hover:bg-[var(--care-highlight)]/50'
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm mb-2">
                      <Receipt className="size-6" />
                    </span>
                    <span className="text-xs font-bold text-[var(--care-ink)]">Billing Staff</span>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">Claims & Finance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('receptionist')
                      setFormError('')
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition border-2 ${
                      selectedRole === 'receptionist'
                        ? 'border-amber-600 bg-amber-50/60 shadow-sm'
                        : 'border-[var(--care-border)] bg-[var(--care-bg)] hover:bg-[var(--care-highlight)]/50'
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm mb-2">
                      <CalendarCheck className="size-6" />
                    </span>
                    <span className="text-xs font-bold text-[var(--care-ink)]">Receptionist</span>
                    <span className="text-[10px] text-amber-700 font-semibold mt-0.5">Front Desk</span>
                  </button>
                </div>
              </div>

              {/* Account Provisioning Form */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm sm:p-8">
                <div className="border-b border-[var(--care-border)] pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="size-5 text-[var(--care-primary)]" />
                      <h3 className="text-lg font-bold text-[var(--care-ink)]">
                        2. Enter {selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'nurse' ? 'Nurse' : selectedRole === 'medical-staff' ? 'Medicine Staff' : selectedRole === 'billing' ? 'Billing Staff' : 'Receptionist'} Credentials
                      </h3>
                    </div>
                    <span className="rounded-md bg-[var(--care-highlight)] px-2.5 py-1 text-xs font-bold text-[var(--care-primary-dark)]">
                      Required Fields
                    </span>
                  </div>
                  <p className="text-xs text-[var(--care-muted)] mt-1">
                    {selectedRole === 'doctor' && 'Enter name, email, password, confirm password, and medical specialization for this doctor.'}
                    {selectedRole === 'nurse' && 'Enter name, email, password, and confirm password for this nurse.'}
                    {selectedRole === 'medical-staff' && 'Enter name, email, password, and confirm password for this medicine staff member.'}
                    {selectedRole === 'billing' && 'Enter name, email, password, and confirm password for this billing specialist.'}
                    {selectedRole === 'receptionist' && 'Enter name, email, password, and confirm password for this front desk receptionist.'}
                  </p>
                </div>

                {formError && (
                  <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                    <ShieldAlert className="size-4 shrink-0 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[var(--care-ink)] mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Full Name"
                        className="h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3.5 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--care-ink)] mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. staff@carelink.health"
                        className="h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3.5 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)]"
                        required
                      />
                    </div>
                  </div>

                  {selectedRole === 'doctor' && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                      <label className="block text-xs font-bold text-blue-900 mb-1.5">
                        Medical Specialization <span className="text-red-500">*</span>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="h-11 rounded-xl border border-blue-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none"
                        >
                          {DOCTOR_SPECIALIZATIONS.map((spec) => (
                            <option key={spec} value={spec}>
                              {spec}
                            </option>
                          ))}
                          <option value="Other">Other / Custom Specialization...</option>
                        </select>

                        {specialization === 'Other' && (
                          <input
                            type="text"
                            value={customSpecialization}
                            onChange={(e) => setCustomSpecialization(e.target.value)}
                            placeholder="Type custom specialization"
                            className="h-11 rounded-xl border border-blue-200 bg-white px-3 text-xs text-slate-800 outline-none"
                            required
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--care-ink)]">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-[var(--care-muted)]">Min. 8 chars</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter strong password"
                          className="h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3.5 pr-10 text-xs text-[var(--care-ink)] outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-[var(--care-muted)] hover:text-[var(--care-ink)]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--care-ink)]">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        {password && confirmPassword && (
                          <span className={`text-[10px] font-bold ${password === confirmPassword ? 'text-emerald-600' : 'text-red-600'}`}>
                            {password === confirmPassword ? '✓ Passwords match' : 'Passwords do not match'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="h-11 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3.5 pr-10 text-xs text-[var(--care-ink)] outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-[var(--care-muted)] hover:text-[var(--care-ink)]"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--care-primary)] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--care-primary-dark)]"
                    >
                      <UserPlus className="size-4" />
                      Create {selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'nurse' ? 'Nurse' : selectedRole === 'medical-staff' ? 'Medicine Staff' : selectedRole === 'billing' ? 'Billing Staff' : 'Receptionist'} Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="mx-auto max-w-6xl space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm">
                  <p className="text-xs font-semibold text-[var(--care-muted)]">Total Staff Users</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--care-ink)]">
                    {staffAccounts.filter(a => a.roleSlug !== 'patient').length}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">Active in Directory</p>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm">
                  <p className="text-xs font-semibold text-[var(--care-muted)]">Patients Today</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--care-ink)]">{totalRegisteredToday}</p>
                  <p className="mt-1 text-xs text-blue-600 font-semibold">{totalCompleted} Completed & Left</p>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm">
                  <p className="text-xs font-semibold text-[var(--care-muted)]">Total Revenue (Money In)</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--care-ink)]">
                    â‚¹{(totalRevenueCollected / 1000).toFixed(1)}k
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">â‚¹{totalBilledAmount.toFixed(0)} total billed</p>
                </div>

                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm">
                  <p className="text-xs font-semibold text-[var(--care-muted)]">Meds Sold Today</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--care-ink)]">{totalMedicinesSold}</p>
                  <p className="mt-1 text-xs text-indigo-600 font-semibold">{totalRemainingStock} units in stock</p>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('billing-overview')}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-left transition hover:bg-emerald-100/60 shadow-sm"
                >
                  <Receipt className="size-6 text-emerald-700 mb-2" />
                  <h4 className="font-bold text-emerald-950 text-sm">Billing Overview</h4>
                  <p className="text-xs text-emerald-700 mt-1">â‚¹{totalRevenueCollected.toFixed(0)} revenue collected today.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('medicines-overview')}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 text-left transition hover:bg-indigo-100/60 shadow-sm"
                >
                  <Pill className="size-6 text-indigo-700 mb-2" />
                  <h4 className="font-bold text-indigo-950 text-sm">Medicines Overview</h4>
                  <p className="text-xs text-indigo-700 mt-1">{totalMedicinesSold} sold, {totalRemainingStock} in stock.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('patient-analysis')}
                  className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 text-left transition hover:bg-blue-100/60 shadow-sm"
                >
                  <TrendingUp className="size-6 text-blue-700 mb-2" />
                  <h4 className="font-bold text-blue-950 text-sm">Patient Flow Analysis</h4>
                  <p className="text-xs text-blue-700 mt-1">{totalRegisteredToday} registered, {totalWaiting} waiting.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('roster-replacement')}
                  className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-left transition hover:bg-amber-100/60 shadow-sm"
                >
                  <RefreshCw className="size-6 text-amber-700 mb-2" />
                  <h4 className="font-bold text-amber-950 text-sm">Shift Replacements</h4>
                  <p className="text-xs text-amber-700 mt-1">Manage duty statuses and replacement staff.</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: STAFF DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--care-ink)]">Hospital Staff Directory</h2>
                  <p className="text-xs text-[var(--care-muted)] mt-0.5">
                    View and manage all active doctor, nurse, medicine staff, billing, and receptionist accounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('account-creation')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--care-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--care-primary-dark)] transition self-start sm:self-auto"
                >
                  <PlusCircle className="size-4" /> Provision New Staff
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--care-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, role, or department..."
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] pl-10 pr-4 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-[var(--care-muted)]" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-10 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 text-xs font-medium text-[var(--care-ink)] outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="doctor">Doctors</option>
                    <option value="nurse">Nurses</option>
                    <option value="medical-staff">Medicine Staff</option>
                    <option value="billing">Billing Staff</option>
                    <option value="receptionist">Receptionists</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--care-border)] bg-[var(--care-bg)] font-bold text-[var(--care-muted)]">
                      <tr>
                        <th className="px-5 py-3.5">Staff Member</th>
                        <th className="px-4 py-3.5">Role & Specialization</th>
                        <th className="px-4 py-3.5">Department</th>
                        <th className="px-4 py-3.5">Login Email</th>
                        <th className="px-4 py-3.5">Password</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-xs text-[var(--care-muted)]">
                            No staff accounts found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((acc) => (
                          <tr key={acc.id} className="hover:bg-[var(--care-highlight)]/30 transition">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--care-primary)] text-xs font-bold text-white shadow-sm">
                                  {acc.avatarInitials}
                                </span>
                                <div>
                                  <div className="font-bold text-[var(--care-ink)] flex items-center gap-1.5">
                                    {acc.name}
                                    {acc.isCustom && (
                                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[var(--care-muted)]">{acc.title}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${acc.badgeColor}`}>
                                {acc.roleLabel}
                              </span>
                              {acc.specialization && (
                                <div className="text-[10px] font-semibold text-blue-700 mt-0.5">
                                  ðŸ©º {acc.specialization}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 text-[var(--care-muted)] font-medium">
                              {acc.department}
                            </td>

                            <td className="px-4 py-4 font-mono text-[var(--care-ink)]">
                              {acc.email}
                            </td>

                            <td className="px-4 py-4 font-mono text-[var(--care-muted)]">
                              {acc.password}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleInstantLogin(acc)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--care-primary)] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[var(--care-primary-dark)]"
                                >
                                  Login <ArrowRight className="size-3" />
                                </button>

                                {acc.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStaff(acc.id, acc.name)}
                                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition"
                                    title="De-provision account"
                                  >
                                    <Trash2 className="size-3.5" />
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

          {/* TAB 9: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--care-ink)]">Security & Audit Logs</h2>
                <p className="text-xs text-[var(--care-muted)] mt-0.5">
                  Immutable event log tracking staff provisioning, leave approvals, and shift replacement overrides.
                </p>
              </div>

              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                        log.tone === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.tone === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <Shield className="size-3.5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--care-ink)]">{log.action}</span>
                          <span className="text-[10px] text-[var(--care-muted)] font-mono">by {log.user}</span>
                        </div>
                        <p className="text-xs text-[var(--care-muted)] mt-0.5">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--care-muted)] font-mono shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--care-ink)]">Hospital System Configuration</h2>
                <p className="text-xs text-[var(--care-muted)] mt-0.5">
                  CareLink Gateway and Clinical Department settings.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4 text-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-[var(--care-muted)] font-medium">Hospital Node:</span>
                    <p className="font-bold text-[var(--care-ink)] mt-0.5">CareLink Central Medical Center (Node #104)</p>
                  </div>
                  <div>
                    <span className="text-[var(--care-muted)] font-medium">Encryption Standard:</span>
                    <p className="font-bold text-[var(--care-ink)] mt-0.5">AES-256 GCM / TLS 1.3 End-to-End</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: RECORD NEW BILLING INVOICE */}
      {showAddBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">Record New Billing Invoice</h3>
              </div>
              <button type="button" onClick={() => setShowAddBillingModal(false)} className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddBillingRecord} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={newBillPatient}
                  onChange={(e) => setNewBillPatient(e.target.value)}
                  placeholder="e.g. Amara Okafor"
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none focus:border-[var(--care-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">Clinical Service Category</label>
                <select
                  value={newBillCategory}
                  onChange={(e) => setNewBillCategory(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                >
                  <option value="Cardiology Consultation">Cardiology Consultation</option>
                  <option value="Inpatient Ward">Inpatient Ward</option>
                  <option value="Diagnostic Labs & Pathology">Diagnostic Labs & Pathology</option>
                  <option value="Emergency Care">Emergency Care</option>
                  <option value="Pharmacy & Medicines">Pharmacy & Medicines</option>
                  <option value="Surgical Procedure">Surgical Procedure</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Total Billed (â‚¹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Amount Paid / Money In (â‚¹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBillPaid}
                    onChange={(e) => setNewBillPaid(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">Payment / Insurance Method</label>
                <select
                  value={newBillMethod}
                  onChange={(e) => setNewBillMethod(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                >
                  <option value="Insurance (BlueCross)">Insurance (BlueCross)</option>
                  <option value="Insurance (Aetna)">Insurance (Aetna)</option>
                  <option value="Insurance (Medicare)">Insurance (Medicare)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash / POS">Cash / POS</option>
                  <option value="Bank Transfer (ACH)">Bank Transfer (ACH)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition"
                >
                  Record Billing & Collect
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBillingModal(false)}
                  className="rounded-xl border border-[var(--care-border)] px-4 font-semibold text-[var(--care-ink)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MEDICINE TO INVENTORY */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Pill className="size-5 text-indigo-700" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">Add Medicine / Restock Inventory</h3>
              </div>
              <button type="button" onClick={() => setShowAddMedicineModal(false)} className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="e.g. Ciprofloxacin 500mg"
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Generic Formula</label>
                  <input
                    type="text"
                    value={newMedGeneric}
                    onChange={(e) => setNewMedGeneric(e.target.value)}
                    placeholder="e.g. Ciprofloxacin HCl"
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Therapeutic Category</label>
                  <select
                    value={newMedCategory}
                    onChange={(e) => setNewMedCategory(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Diabetes & Endocrine">Diabetes & Endocrine</option>
                    <option value="Pain Relief & Analgesics">Pain Relief & Analgesics</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Inpatient Injectables">Inpatient Injectables</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Dosage Form</label>
                  <select
                    value={newMedType}
                    onChange={(e) => setNewMedType(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Vials">Vials / Injectables</option>
                    <option value="Inhalers">Inhalers</option>
                    <option value="Bottles">Bottles / Syrup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newMedStock}
                    onChange={(e) => setNewMedStock(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Reorder Limit</label>
                  <input
                    type="number"
                    value={newMedThreshold}
                    onChange={(e) => setNewMedThreshold(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--care-ink)] mb-1">Unit Price (â‚¹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMedPrice}
                    onChange={(e) => setNewMedPrice(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-indigo-700 text-white font-bold hover:bg-indigo-800 transition"
                >
                  Save Medicine & Update Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="rounded-xl border border-[var(--care-border)] px-4 font-semibold text-[var(--care-ink)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: APPROVE LEAVE & ASSIGN REPLACEMENT */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-emerald-700" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">
                  Approve Leave for {showApproveModal.staffName}
                </h3>
              </div>
              <button type="button" onClick={() => setShowApproveModal(null)} className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-[var(--care-bg)] p-3 border border-[var(--care-border)] space-y-1">
                <div className="font-semibold text-[var(--care-ink)]">Leave Type: <span className="font-bold text-blue-700">{showApproveModal.leaveType}</span></div>
                <div>Slot / Shift: <strong className="font-mono text-slate-800">{showApproveModal.shiftSlot}</strong> ({showApproveModal.startDate} - {showApproveModal.endDate})</div>
                <div className="text-[var(--care-muted)]">Reason: {showApproveModal.reason}</div>
              </div>

              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">
                  Assign Replacement Staff Member for this Time Slot:
                </label>
                <select
                  value={selectedReplacementStaffId}
                  onChange={(e) => setSelectedReplacementStaffId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold text-[var(--care-ink)] outline-none"
                >
                  <option value="">-- Select Qualified Replacement Member --</option>
                  {getEligibleReplacementsForStaff(showApproveModal, staffAccounts)
                    .filter(s => s.id !== showApproveModal.staffId)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} â€” {s.roleLabel} ({s.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">Admin Approval Note / Shift Coverage Instructions</label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="e.g. Assigned to morning ward triage coverage"
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveLeave(showApproveModal.id)}
                  className="flex-1 h-10 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition"
                >
                  Authorize Leave & Lock In Replacement
                </button>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(null)}
                  className="rounded-xl border border-[var(--care-border)] px-4 font-semibold text-[var(--care-ink)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ASSIGN REPLACEMENT FOR ABSENT MEMBER */}
      {showReplaceStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-5 text-blue-700" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">
                  Assign Slot Replacement for {showReplaceStaffModal.staffName}
                </h3>
              </div>
              <button type="button" onClick={() => setShowReplaceStaffModal(null)} className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-[var(--care-bg)] p-3 border border-[var(--care-border)]">
                <div className="font-semibold text-[var(--care-ink)]">
                  Time Slot to Cover: <span className="font-bold text-blue-700">{showReplaceStaffModal.shiftSlot}</span>
                </div>
                <div className="text-[var(--care-muted)] mt-0.5">
                  Role: {showReplaceStaffModal.roleLabel} Â· Department: {showReplaceStaffModal.department}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">
                  Select Replacement Staff Member *
                </label>
                <select
                  value={rosterReplacementStaffId}
                  onChange={(e) => setRosterReplacementStaffId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs font-semibold text-[var(--care-ink)] outline-none"
                  required
                >
                  <option value="">-- Choose Qualified Replacement Member --</option>
                  {getEligibleReplacementsForStaff(showReplaceStaffModal, staffAccounts)
                    .filter(s => s.id !== showReplaceStaffModal.staffId)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} â€” {s.roleLabel} ({s.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--care-ink)] mb-1">Coverage Notes</label>
                <input
                  type="text"
                  value={rosterCoverageNote}
                  onChange={(e) => setRosterCoverageNote(e.target.value)}
                  placeholder="e.g. Taking over morning ICU and vitals monitoring duties"
                  className="h-10 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAssignRosterReplacement(showReplaceStaffModal.id)}
                  disabled={!rosterReplacementStaffId}
                  className="flex-1 h-10 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  Confirm Slot Replacement
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplaceStaffModal(null)}
                  className="rounded-xl border border-[var(--care-border)] px-4 font-semibold text-[var(--care-ink)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: SUBMIT NEW LEAVE REQUEST */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-[var(--care-primary)]" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">Submit Staff Leave Request</h3>
              </div>
              <button type="button" onClick={() => setShowAddLeaveModal(false)} className="rounded-lg p-1 text-[var(--care-muted)] hover:bg-[var(--care-highlight)]">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Staff Member *</label>
                <select
                  value={newLeaveStaffId}
                  onChange={(e) => setNewLeaveStaffId(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  required
                >
                  {activeHospitalStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} â€” {s.roleLabel} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Leave Type</label>
                  <select
                    value={newLeaveType}
                    onChange={(e) => setNewLeaveType(e.target.value as any)}
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Medical Conference">Medical Conference</option>
                    <option value="Maternity / Paternity">Maternity / Paternity</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Shift / Slot</label>
                  <select
                    value={newLeaveShift}
                    onChange={(e) => setNewLeaveShift(e.target.value as any)}
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  >
                    {SHIFT_SLOTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-start">
                <div>
                  <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 truncate">
                    Start Date <span className="ml-1 text-[10px] font-normal text-cyan-700">(From Tomorrow)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={newLeaveStartRef}
                      type="date"
                      min={getTomorrowIsoString()}
                      value={newLeaveStart}
                      onChange={(e) => {
                        setNewLeaveStart(e.target.value)
                        if (e.target.value > newLeaveEnd) {
                          setNewLeaveEnd(e.target.value)
                        }
                      }}
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-3 pr-9 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 cursor-pointer"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          newLeaveStartRef.current?.showPicker()
                        } catch {
                          newLeaveStartRef.current?.focus()
                        }
                      }}
                      className="absolute right-2 flex size-7 items-center justify-center rounded-lg text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 transition"
                      title="Click calendar to pick start date"
                    >
                      <Calendar className="size-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 truncate">
                    End Date <span className="ml-1 text-[10px] font-normal text-cyan-700">(To Date)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={newLeaveEndRef}
                      type="date"
                      min={newLeaveStart || getTomorrowIsoString()}
                      value={newLeaveEnd}
                      onChange={(e) => setNewLeaveEnd(e.target.value)}
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-3 pr-9 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 cursor-pointer"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          newLeaveEndRef.current?.showPicker()
                        } catch {
                          newLeaveEndRef.current?.focus()
                        }
                      }}
                      className="absolute right-2 flex size-7 items-center justify-center rounded-lg text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 transition"
                      title="Click calendar to pick end date"
                    >
                      <Calendar className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Reason for Leave *</label>
                <textarea
                  value={newLeaveReason}
                  onChange={(e) => setNewLeaveReason(e.target.value)}
                  placeholder="Explain details and reason for requested time off..."
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 shadow-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-cyan-700 text-white font-black hover:bg-cyan-800 transition shadow-md"
                >
                  Submit for Approval
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(false)}
                  className="rounded-xl border-2 border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
