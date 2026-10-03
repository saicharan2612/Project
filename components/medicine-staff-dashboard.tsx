'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BillingRecord,
  EMPTY_ACCOUNT,
  DemoAccount,
  getAllAccounts,
  getDemoAccountByRole,
  getStoredBillings,
  getStoredLeaveRequests,
  getStoredMedicines,
  getStoredPatients,
  getStoredPrescriptions,
  INITIAL_MEDICINES,
  INITIAL_PRESCRIPTIONS,
  LeaveRequest,
  MedicineInventory,
  PatientRecord,
  PrescriptionRecord,
  saveBillings,
  saveLeaveRequests,
  saveMedicines,
  savePrescriptions,
  dispenseMedicationsSync
} from '@/lib/demo-accounts'
import { SettingsModal } from '@/components/settings-modal'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  DoorOpen,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  FlaskConical,
  HeartPulse,
  History,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Pill,
  Plus,
  PlusCircle,
  Radio,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Tag,
  Thermometer,
  Timer,
  Trash2,
  Truck,
  User,
  UserCheck,
  Users,
  Warehouse,
  X,
  Zap
} from 'lucide-react'

type MedicineStaffTab =
  | 'fulfillment-queue'
  | 'ready-billing'
  | 'inventory'
  | 'leave-requests'
  | 'dispensed-history'

const PHARMACY_COUNTERS = [
  'Counter #1 (Main OPD Pharmacy)',
  'Counter #2 (Express Dispensing)',
  'Counter #3 (Emergency & Inpatient Discharge)',
  'Counter #4 (Pediatric & Specialized Care)'
]

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

export function MedicineStaffDashboard() {
  const router = useRouter()
  const defaultAccount = getDemoAccountByRole('medical-staff') || EMPTY_ACCOUNT
  const [currentUser, setCurrentUser] = useState<DemoAccount>(defaultAccount)
  const [activeTab, setActiveTab] = useState<MedicineStaffTab>('fulfillment-queue')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [allRoleAccounts, setAllRoleAccounts] = useState<DemoAccount[]>([])
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // Core Data Stores
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [billings, setBillings] = useState<BillingRecord[]>([])
  const [medicines, setMedicines] = useState<MedicineInventory[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  // Filters & Searches
  const [rxSearchQuery, setRxSearchQuery] = useState('')
  const [rxStatusFilter, setRxStatusFilter] = useState<'all' | 'pending_prep' | 'ready_for_billing' | 'paid_ready' | 'dispensed'>('all')
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all')

  // Dispense Modal State
  const [dispenseModalRx, setDispenseModalRx] = useState<PrescriptionRecord | null>(null)
  const [selectedCounter, setSelectedCounter] = useState(PHARMACY_COUNTERS[1])
  const [pharmacistDispenseNote, setPharmacistDispenseNote] = useState('Medicines verified against clinical prescription. Patient intake counseling provided.')

  // Share Details Modal State
  const [sharingModalRx, setSharingModalRx] = useState<PrescriptionRecord | null>(null)

  // New Medicine Modal State
  const [showAddMedModal, setShowAddMedModal] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [newMedGeneric, setNewMedGeneric] = useState('')
  const [newMedCategory, setNewMedCategory] = useState<MedicineInventory['category']>('Cardiovascular')
  const [newMedStock, setNewMedStock] = useState(250)
  const [newMedPrice, setNewMedPrice] = useState(15.0)
  const [newMedUnitType, setNewMedUnitType] = useState('Tablets')
  const [newMedBatch, setNewMedBatch] = useState('BATCH-2026-X')

  // Leave Request Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Sick Leave')
  const [leaveStartDate, setLeaveStartDate] = useState(getTomorrowIsoString)
  const [leaveEndDate, setLeaveEndDate] = useState(getDayAfterTomorrowIsoString)
  const [leaveDaysCount, setLeaveDaysCount] = useState(2)
  const [leaveShiftSlot, setLeaveShiftSlot] = useState<LeaveRequest['shiftSlot']>('Morning (08:00 - 16:00)')
  const [leaveReason, setLeaveReason] = useState('')

  const leaveStartRef = React.useRef<HTMLInputElement>(null)
  const leaveEndRef = React.useRef<HTMLInputElement>(null)

  const handleStartDateChange = (val: string) => {
    setLeaveStartDate(val)
    if (val > leaveEndDate) {
      setLeaveEndDate(val)
      setLeaveDaysCount(1)
    } else {
      setLeaveDaysCount(calculateDaysBetween(val, leaveEndDate))
    }
  }

  const handleEndDateChange = (val: string) => {
    setLeaveEndDate(val)
    setLeaveDaysCount(calculateDaysBetween(leaveStartDate, val))
  }

  // Load from LocalStorage
  const loadData = () => {
    if (typeof window !== 'undefined') {
      const allAccs = getAllAccounts()
      setAllRoleAccounts(allAccs)
      setPrescriptions(getStoredPrescriptions())
      setBillings(getStoredBillings())
      setMedicines(getStoredMedicines())
      setPatients(getStoredPatients())
      setLeaveRequests(getStoredLeaveRequests())

      const stored = localStorage.getItem('carelink_user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as DemoAccount
          if (parsed && parsed.roleSlug === 'medical-staff') {
            setCurrentUser(parsed)
            return
          }
        } catch {
          // ignore
        }
      }
      const matched = getDemoAccountByRole('medical-staff')
      if (matched) {
        setCurrentUser(matched)
        localStorage.setItem('carelink_user', JSON.stringify(matched))
      }
    }
  }

  useEffect(() => {
    loadData()

    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key.startsWith('carelink_')
      ) {
        loadData()
      }
    }

    const handleSync = () => {
      loadData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('carelink_sync', handleSync)
    window.addEventListener('focus', handleSync)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('carelink_sync', handleSync)
      window.removeEventListener('focus', handleSync)
    }
  }, [])

  const triggerAction = (msg: string) => {
    setActionFeedback(msg)
    setTimeout(() => {
      setActionFeedback(null)
    }, 4500)
  }

  // Cross-role Helpers
  const updatePrescriptionsState = (updated: PrescriptionRecord[]) => {
    setPrescriptions(updated)
    savePrescriptions(updated)
  }

  const updateBillingsState = (updated: BillingRecord[]) => {
    setBillings(updated)
    saveBillings(updated)
  }

  const updateMedicinesState = (updated: MedicineInventory[]) => {
    setMedicines(updated)
    saveMedicines(updated)
  }

  const updateLeaveRequestsState = (updated: LeaveRequest[]) => {
    setLeaveRequests(updated)
    saveLeaveRequests(updated)
  }

  // Action 1: Medicine Staff marks medicines Ready & Packed
  const handleMarkMedicinesReady = (rx: PrescriptionRecord) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const updated = prescriptions.map((p) => {
      if (p.id === rx.id) {
        return {
          ...p,
          isReady: true,
          readyAt: `Today at ${timeString}`,
          fulfillmentStatus: 'ready_for_billing' as const
        }
      }
      return p
    })
    updatePrescriptionsState(updated)
    triggerAction(`Prescription ${rx.id} for ${rx.patientName} marked READY & PACKED. Synchronized with Billing Staff!`)
  }

  // Action 2: Share Medicine Details & Timetable with Patient
  const handleShareMedicineDetailsWithPatient = (rx: PrescriptionRecord) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const updated = prescriptions.map((p) => {
      if (p.id === rx.id) {
        return {
          ...p,
          sharedWithPatient: true
        }
      }
      return p
    })
    updatePrescriptionsState(updated)
    setSharingModalRx(null)
    triggerAction(`ðŸ“¢ Full medicine schedule & intake instructions shared with Patient (${rx.patientName}) at ${timeString}!`)
  }

  // Action 3: Simulate or Settle Bill for this prescription (Cross-sync with Billing)
  const handleSettleBillAndNotifyPharmacy = (rx: PrescriptionRecord) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Update Billing Record
    const updatedBillings = billings.map((b) => {
      if (b.patientName === rx.patientName || b.id.includes(rx.id) || b.mrn === rx.mrn) {
        return {
          ...b,
          status: 'paid' as const,
          paidAmount: b.totalAmount,
          balanceDue: 0,
          paymentStatus: 'Paid' as const,
          paidAt: timeString
        }
      }
      return b
    })
    updateBillingsState(updatedBillings)

    // Update Prescription Record
    const updatedRx = prescriptions.map((p) => {
      if (p.id === rx.id) {
        return {
          ...p,
          billingStatus: 'paid' as const,
          billPaidAt: `Today at ${timeString}`
        }
      }
      return p
    })
    updatePrescriptionsState(updatedRx)

    triggerAction(`Payment cleared for ${rx.patientName} ($${(rx.medications.length * 45 + (rx.isNurseDirectCare ? 60 : 120)).toFixed(2)}). Medicine Staff notified: READY TO DISPENSE!`)
  }

  // Action 4: Open Dispense Modal
  const handleOpenDispenseModal = (rx: PrescriptionRecord) => {
    setDispenseModalRx(rx)
  }

  // Action 5: Confirm Dispense & Notify Patient to collect
  const handleConfirmDispenseAndNotifyPatient = () => {
    if (!dispenseModalRx) return

    const result = dispenseMedicationsSync({
      prescriptionId: dispenseModalRx.id,
      patientName: dispenseModalRx.patientName,
      patientMrn: dispenseModalRx.mrn,
      medicines: dispenseModalRx.medications.map((m) => ({ name: m.name, quantity: 1, dosage: m.dosage })),
      dispensedBy: currentUser.name,
      dispenserRole: 'Medicine Staff',
      counter: selectedCounter,
      notes: pharmacistDispenseNote.trim() || undefined
    })

    if (result) {
      setPrescriptions(result.prescriptions)
      setBillings(result.billings)
      setMedicines(result.medicines)
    }

    triggerAction(
      `ðŸŽ‰ Medicines DISPENSED! Synchronized with Billing Staff & Inventory. Notification sent to ${dispenseModalRx.patientName}: Collect at ${selectedCounter}!`
    )
    setDispenseModalRx(null)
  }

  // Submit Leave Request
  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveReason.trim()) {
      triggerAction('Please provide a reason for the leave request.')
      return
    }

    const tomorrowStr = getTomorrowIsoString()
    if (leaveStartDate < tomorrowStr) {
      triggerAction('Leave can only be requested from tomorrow onwards. Today and past dates are not permitted.')
      return
    }

    if (leaveEndDate < leaveStartDate) {
      triggerAction('End date cannot be earlier than start date.')
      return
    }

    const finalDays = Math.max(1, calculateDaysBetween(leaveStartDate, leaveEndDate))

    const newLeave: LeaveRequest = {
      id: `leave-med-${Date.now()}`,
      staffId: currentUser.id,
      staffName: currentUser.name,
      staffRole: 'Medicine Staff',
      department: 'Central Medicine & Pathology Diagnostics',
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      shiftSlot: leaveShiftSlot,
      reason: `${leaveReason.trim()} (${finalDays} day${finalDays > 1 ? 's' : ''})`,
      status: 'pending',
      submittedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    const updated = [newLeave, ...leaveRequests]
    updateLeaveRequestsState(updated)
    setLeaveReason('')
    triggerAction(`ðŸ–ï¸ Leave request for ${finalDays} day(s) (${leaveStartDate} to ${leaveEndDate}) submitted to Admin for approval!`)
  }

  // Inventory Quick Restock
  const handleRestockMedicine = (medId: string, qty: number = 100) => {
    const updated = medicines.map((m) => {
      if (m.id === medId) {
        const nextStock = m.currentStock + qty
        return {
          ...m,
          currentStock: nextStock,
          stockStatus: (nextStock <= m.reorderThreshold ? 'Low Stock' : 'Optimal') as MedicineInventory['stockStatus']
        }
      }
      return m
    })
    updateMedicinesState(updated)
    triggerAction(`Restocked +${qty} units successfully!`)
  }

  // Add new medicine item
  const handleAddNewMedicine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedName.trim()) return

    const newMed: MedicineInventory = {
      id: `med-custom-${Date.now()}`,
      sku: `MED-${newMedName.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      name: newMedName.trim(),
      genericName: newMedGeneric.trim() || newMedName.trim(),
      category: newMedCategory,
      unitsSoldToday: 0,
      currentStock: Number(newMedStock),
      reorderThreshold: 50,
      unitPrice: Number(newMedPrice),
      unitType: newMedUnitType,
      stockStatus: Number(newMedStock) <= 50 ? 'Low Stock' : 'Optimal',
      expiryDate: '12/2028',
      batchNumber: newMedBatch || 'BATCH-2026-N'
    }

    const updated = [newMed, ...medicines]
    updateMedicinesState(updated)
    setShowAddMedModal(false)
    setNewMedName('')
    setNewMedGeneric('')
    triggerAction(`New medication "${newMed.name}" added to pharmacy inventory!`)
  }

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions
      .filter((rx) => rx.sharedWithPharmacy)
      .filter((rx) => {
        if (!rxSearchQuery.trim()) return true
        const query = rxSearchQuery.toLowerCase()
        return (
          rx.patientName.toLowerCase().includes(query) ||
          rx.mrn.toLowerCase().includes(query) ||
          rx.diagnosis.toLowerCase().includes(query) ||
          rx.medications.some((m) => m.name.toLowerCase().includes(query))
        )
      })
      .filter((rx) => {
        if (rxStatusFilter === 'all') return true
        if (rxStatusFilter === 'pending_prep') return !rx.isReady && rx.status !== 'dispensed'
        if (rxStatusFilter === 'ready_for_billing') return rx.isReady && rx.billingStatus !== 'paid' && rx.status !== 'dispensed'
        if (rxStatusFilter === 'paid_ready') return rx.isReady && rx.billingStatus === 'paid' && rx.status !== 'dispensed'
        if (rxStatusFilter === 'dispensed') return rx.status === 'dispensed'
        return true
      })
  }, [prescriptions, rxSearchQuery, rxStatusFilter])

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return medicines
      .filter((m) => {
        if (inventoryCategoryFilter === 'all') return true
        return m.category === inventoryCategoryFilter
      })
      .filter((m) => {
        if (!inventorySearch.trim()) return true
        const q = inventorySearch.toLowerCase()
        return (
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.batchNumber.toLowerCase().includes(q)
        )
      })
  }, [medicines, inventoryCategoryFilter, inventorySearch])

  // My Leave Applications
  const myLeaveRequests = useMemo(() => {
    return leaveRequests.filter(
      (l) => l.staffRole === 'Medicine Staff' || l.staffId === currentUser.id || l.staffName === currentUser.name
    )
  }, [leaveRequests, currentUser])

  // Summary Metrics
  const metrics = useMemo(() => {
    const pharmacyOrders = prescriptions.filter((p) => p.sharedWithPharmacy)
    const pendingPrep = pharmacyOrders.filter((p) => !p.isReady && p.status !== 'dispensed').length
    const readyForBilling = pharmacyOrders.filter((p) => p.isReady && p.billingStatus !== 'paid' && p.status !== 'dispensed').length
    const paidReadyToDispense = pharmacyOrders.filter((p) => p.isReady && p.billingStatus === 'paid' && p.status !== 'dispensed').length
    const dispensedToday = pharmacyOrders.filter((p) => p.status === 'dispensed').length
    const lowStockCount = medicines.filter((m) => m.stockStatus !== 'Optimal').length
    const pendingLeaves = myLeaveRequests.filter((l) => l.status === 'pending').length

    return {
      pendingPrep,
      readyForBilling,
      paidReadyToDispense,
      dispensedToday,
      lowStockCount,
      pendingLeaves,
      totalOrders: pharmacyOrders.length
    }
  }, [prescriptions, medicines, myLeaveRequests])

  const categories = Array.from(new Set(medicines.map((m) => m.category)))

  return (
    <div className="flex min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="fixed top-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-300 bg-indigo-950 px-4 py-3 text-white shadow-2xl">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Check className="size-4" />
            </span>
            <p className="text-xs font-bold leading-relaxed">{actionFeedback}</p>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="ml-auto text-indigo-300 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MEDICINE STAFF SIDEBAR (EXACT SAME DESIGN AS ADMIN / BILLING / RECEPTIONIST) */}
      {/* ========================================================================= */}
      <aside className="sticky top-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--care-border)] px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <FlaskConical className="size-5" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
              <span className="ml-1.5 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-900">
                PHARMACY DESK
              </span>
            </div>
          </Link>
        </div>

        {/* User Identity Banner */}
        <div className="border-b border-[var(--care-border)] bg-[var(--care-bg)]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-700 text-sm font-bold text-white shadow-sm">
                {currentUser.avatarInitials || 'MS'}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[var(--care-surface)] bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[var(--care-ink)]">{currentUser.name}</p>
              <p className="truncate text-[11px] font-medium text-[var(--care-muted)]">Medicine & Pharmacy Technologist</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
            PHARMACY & DISPENSING
          </div>

          {/* Fulfillment Queue */}
          <button
            type="button"
            onClick={() => setActiveTab('fulfillment-queue')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === 'fulfillment-queue'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <PackageCheck className="size-4" />
              <span>Fulfillment Queue</span>
            </div>
            {metrics.pendingPrep + metrics.paidReadyToDispense > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'fulfillment-queue'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {metrics.pendingPrep + metrics.paidReadyToDispense}
              </span>
            )}
          </button>

          {/* Stock & Inventory */}
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === 'inventory'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Pill className="size-4" />
              <span>Stock & Inventory</span>
            </div>
            {metrics.lowStockCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'inventory'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {metrics.lowStockCount} Low
              </span>
            )}
          </button>

          {/* Request Leave */}
          <button
            type="button"
            onClick={() => setActiveTab('leave-requests')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === 'leave-requests'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4" />
              <span>Request Leave / Off</span>
            </div>
            {metrics.pendingLeaves > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'leave-requests'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {metrics.pendingLeaves} Pending
              </span>
            )}
          </button>

          {/* Dispense Log */}
          <button
            type="button"
            onClick={() => setActiveTab('dispensed-history')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === 'dispensed-history'
                ? 'bg-[var(--care-primary)] text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <History className="size-4" />
              <span>Dispense Log</span>
            </div>
            <span className="font-mono text-[10px] opacity-70">{metrics.dispensedToday}</span>
          </button>
        </nav>

        {/* Live Synchronizer Metrics Box */}
        <div className="m-3 rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)]/80 p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-[var(--care-muted)] uppercase tracking-wider">Live Synchronizer</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--care-ink)] font-medium">Pending Prep</span>
            <span className="font-bold text-amber-600">{metrics.pendingPrep}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--care-ink)] font-medium">Bill Paid & Ready</span>
            <span className="font-bold text-emerald-600">{metrics.paidReadyToDispense}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--care-ink)] font-medium">Dispensed Today</span>
            <span className="font-bold text-[var(--care-ink)]">{metrics.dispensedToday}</span>
          </div>
        </div>

        {/* Sidebar Footer — Logged In User */}
        <div className="border-t border-[var(--care-border)] p-3 space-y-2">
          <div className="flex items-center gap-2.5 overflow-hidden rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-2 text-xs">
            <span className="size-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
            <div className="truncate">
              <p className="font-semibold text-[var(--care-ink)] truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[var(--care-muted)] truncate">{currentUser.roleLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-2 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
              title="Settings & Password"
            >
              <Settings className="size-3.5" />
              <span>Settings</span>
            </button>

            <Link
              href="/sign-in"
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem('carelink_user')
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <LogOut className="size-3.5" />
              <span>Log Out</span>
            </Link>
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
      <main className="flex-1 min-w-0 bg-slate-50/50 p-6 sm:p-8 space-y-6 overflow-y-auto">
        {/* Top Header inside Workspace */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--care-border)] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--care-ink)]">Medicine Staff & Pharmacy Hub</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-900 border border-indigo-200">
                <Sparkles className="size-3 text-indigo-600" /> Live Synchronized
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--care-muted)]">
              Real-time prescription fulfillment, inventory stock control, billing clearance sync, and leave management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {metrics.paidReadyToDispense > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-900 border border-emerald-300 animate-pulse">
                <DollarSign className="size-3.5" />
                {metrics.paidReadyToDispense} Bill(s) Paid Â· Ready to Dispense
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowAddMedModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--care-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition"
            >
              <Plus className="size-4" />
              <span>Add Medicine</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leave-requests')}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3.5 py-2 text-xs font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
            >
              <CalendarClock className="size-4 text-[var(--care-primary)]" />
              <span>Request Leave</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--care-muted)]">Pending Preparation</span>
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Timer className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[var(--care-ink)]">{metrics.pendingPrep}</p>
            <p className="mt-1 text-[11px] text-amber-700 font-medium">Awaiting lab / pharmacy prep</p>
          </div>

          <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--care-muted)]">Formulary Medicines</span>
              <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
                <Pill className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[var(--care-ink)]">{medicines.length}</p>
            <p className="mt-1 text-[11px] text-indigo-700 font-medium">Active items in stock catalog</p>
          </div>

          <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--care-muted)]">Bill Paid & Ready</span>
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <DollarSign className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-emerald-700">{metrics.paidReadyToDispense}</p>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Cleared for medication handover</p>
          </div>

          <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--care-muted)]">Low Stock Items</span>
              <span className="flex size-8 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                <AlertTriangle className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[var(--care-ink)]">{metrics.lowStockCount}</p>
            <p className="mt-1 text-[11px] text-rose-600 font-medium">Below reorder threshold</p>
          </div>
        </div>

        {/* TAB 1: Prescription Fulfillment Queue */}
        {activeTab === 'fulfillment-queue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="rounded-3xl border border-indigo-200 bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-700/60 px-3 py-1 text-xs font-bold text-indigo-100 border border-indigo-500/50">
                    <Sparkles className="size-3.5" />
                    Cross-Role Synchronized Pharmacy
                  </span>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
                    Prescription Preparation & Dispensing Stream
                  </h1>
                  <p className="mt-1 text-xs text-indigo-200 max-w-xl">
                    Pack medicines prescribed by Nurses & Doctors. Share full timetables with patients, verify payment clearance from Billing Staff, and dispense with instant collection alerts.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('paid_ready')}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                      rxStatusFilter === 'paid_ready'
                        ? 'bg-emerald-400 text-emerald-950 shadow-md'
                        : 'bg-indigo-700/80 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    <DollarSign className="size-3.5" />
                    Paid & Ready ({metrics.paidReadyToDispense})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('all')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition"
                  >
                    <RefreshCw className="size-3.5" />
                    All Orders ({metrics.totalOrders})
                  </button>
                </div>
              </div>
            </div>

            {/* Filters & Search Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={rxSearchQuery}
                  onChange={(e) => setRxSearchQuery(e.target.value)}
                  placeholder="Search patient, MRN, medicine..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--care-border)] bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition"
                />
                {rxSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRxSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setRxStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    rxStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({prescriptions.filter((p) => p.sharedWithPharmacy).length})
                </button>
                <button
                  type="button"
                  onClick={() => setRxStatusFilter('pending_prep')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    rxStatusFilter === 'pending_prep'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  â³ Pending Prep ({metrics.pendingPrep})
                </button>
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('ready_for_billing')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      rxStatusFilter === 'ready_for_billing'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    ðŸ“¦ Ready for Billing ({metrics.readyForBilling})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('paid_ready')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      rxStatusFilter === 'paid_ready'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    ðŸ’° Bill Paid ({metrics.paidReadyToDispense})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('dispensed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      rxStatusFilter === 'dispensed'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    âœ… Dispensed ({metrics.dispensedToday})
                  </button>
                </div>
              </div>

              {/* Prescription Cards List */}
              {filteredPrescriptions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <PackageSearch className="size-12 text-slate-400 mx-auto" />
                  <h3 className="mt-3 text-base font-bold text-slate-800">No prescriptions found</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {rxSearchQuery
                      ? 'No active orders match your search criteria.'
                      : 'Prescriptions dispatched by Nurses will appear here automatically.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {filteredPrescriptions.map((rx) => {
                    const isPaid = rx.billingStatus === 'paid'
                    const isReady = rx.isReady
                    const isDispensed = rx.status === 'dispensed'

                    return (
                      <div
                        key={rx.id}
                        className={`rounded-3xl border p-6 transition flex flex-col justify-between ${
                          isDispensed
                            ? 'border-slate-200 bg-slate-50/70 opacity-90'
                            : isPaid
                            ? 'border-emerald-300 bg-linear-to-b from-emerald-50/50 via-white to-white shadow-md ring-2 ring-emerald-400/30'
                            : isReady
                            ? 'border-indigo-200 bg-linear-to-b from-indigo-50/40 via-white to-white shadow-xs'
                            : 'border-amber-200 bg-white shadow-xs'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[var(--care-ink)]">{rx.patientName}</h3>
                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                                  {rx.mrn}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-indigo-900 mt-1">Diagnosis: {rx.diagnosis}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Ordered by <strong>{rx.nurseName}</strong> Â· Ref Dr: {rx.doctorName}
                              </p>
                            </div>

                            {/* Status Indicator */}
                            <div className="flex flex-col items-end gap-1">
                              {isDispensed ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-extrabold text-slate-800">
                                  <Check className="size-3" />
                                  Dispensed
                                </span>
                              ) : isPaid ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-900 border border-emerald-300 animate-pulse">
                                  <DollarSign className="size-3" />
                                  Bill Paid Â· Ready to Dispense
                                </span>
                              ) : isReady ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-900 border border-indigo-200">
                                  <PackageCheck className="size-3" />
                                  Packed & Ready for Billing
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900 border border-amber-200">
                                  <Timer className="size-3" />
                                  Awaiting Prep
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-400">{rx.id}</span>
                            </div>
                          </div>

                          {/* Workflow Step Tracker */}
                          <div className="mt-4 grid grid-cols-4 gap-1.5 py-2 border-b border-slate-100 text-center text-[10px] font-bold">
                            <div className="rounded-lg bg-emerald-100 text-emerald-900 p-1.5 border border-emerald-200">
                              âœ“ 1. Nurse Rx
                            </div>
                            <div
                              className={`rounded-lg p-1.5 border ${
                                isReady
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                  : 'bg-amber-100 text-amber-900 border-amber-200 font-extrabold'
                              }`}
                            >
                              {isReady ? 'âœ“ 2. Packed' : '2. Prep Pack'}
                            </div>
                            <div
                              className={`rounded-lg p-1.5 border ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                  : isReady
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {isPaid ? 'âœ“ 3. Bill Paid' : '3. Settle Bill'}
                            </div>
                            <div
                              className={`rounded-lg p-1.5 border ${
                                isDispensed
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                  : isPaid
                                  ? 'bg-emerald-200 text-emerald-950 border-emerald-400 font-extrabold'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {isDispensed ? 'âœ“ 4. Handover' : '4. Dispense'}
                            </div>
                          </div>

                          {/* Prescribed Items & Exact Timing Schedule */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Pill className="size-3.5 text-indigo-600" />
                                Medications to Prepare ({rx.medications.length} items):
                              </p>
                              {/* Direct Share with Patient Action */}
                              <button
                                type="button"
                                onClick={() => handleShareMedicineDetailsWithPatient(rx)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg hover:bg-indigo-100 transition"
                              >
                                <Share2 className="size-3" />
                                <span>Share with Patient</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {rx.medications.map((med) => (
                                <div
                                  key={med.id}
                                  className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                                >
                                  <div className="flex items-center justify-between font-bold text-slate-900">
                                    <span>
                                      {med.name} ({med.dosage} - {med.form})
                                    </span>
                                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-900 font-mono font-bold">
                                      {med.durationDays} Days Supply
                                    </span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                                      ðŸ•’ {med.scheduleTimes.join(', ')}
                                    </span>
                                    <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-900 border border-amber-200">
                                      ðŸ½ï¸ {med.timingInstructions}
                                    </span>
                                    <span className="text-slate-500">({med.frequency})</span>
                                  </div>
                                  {med.instructions && (
                                    <p className="mt-1.5 text-[11px] text-slate-600 italic">
                                      "{med.instructions}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Nurse Clinical Notes */}
                          {rx.nurseNotes && (
                            <div className="mt-3 rounded-xl bg-teal-50 p-2.5 text-[11px] text-teal-950 border border-teal-200">
                              <strong>Nurse Note:</strong> {rx.nurseNotes}
                            </div>
                          )}

                          {/* Dispense Timestamp & Counter if completed */}
                          {isDispensed && (
                            <div className="mt-3 rounded-xl bg-slate-100 p-2.5 text-[11px] text-slate-700 border border-slate-200">
                              <p className="font-bold">
                                âœ… Dispensed: {rx.dispensedAt} at {rx.pickupCounter || 'Counter #2'}
                              </p>
                              <p className="text-[10px] text-slate-500">Verified by: {rx.dispensedBy || currentUser.name}</p>
                            </div>
                          )}
                        </div>

                        {/* Interactive Workflow Actions */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                          {/* Step A: If not ready, show Mark Ready button */}
                          {!isReady && !isDispensed && (
                            <button
                              type="button"
                              onClick={() => handleMarkMedicinesReady(rx)}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
                            >
                              <PackageCheck className="size-4" />
                              <span>Mark Medicines Ready & Packed (Notify Billing)</span>
                            </button>
                          )}

                          {/* Step B: If ready but bill unpaid, show Waiting badge & simulate pay button */}
                          {isReady && !isPaid && !isDispensed && (
                            <div className="space-y-2">
                              <div className="rounded-2xl bg-amber-50 p-3 border border-amber-200 text-center">
                                <p className="text-xs font-extrabold text-amber-900">
                                  â³ Medicines Packed Â· Waiting for Billing Staff Payment Clearance
                                </p>
                                <p className="text-[10px] text-amber-700 mt-0.5">
                                  Invoice amount: ${(rx.medications.length * 45 + (rx.isNurseDirectCare ? 60 : 120)).toFixed(2)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSettleBillAndNotifyPharmacy(rx)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900 transition"
                              >
                                <DollarSign className="size-3.5" />
                                <span>Simulate / Confirm Bill Paid from Billing Staff</span>
                              </button>
                            </div>
                          )}

                          {/* Step C: If ready AND bill is paid, show Dispense & Notify Patient button */}
                          {isReady && isPaid && !isDispensed && (
                            <div className="space-y-2">
                              <div className="rounded-2xl bg-emerald-50 p-2.5 border border-emerald-300 text-center">
                                <p className="text-xs font-black text-emerald-950 flex items-center justify-center gap-1.5">
                                  <DollarSign className="size-4 text-emerald-600" />
                                  Payment Cleared by Billing Staff ({rx.billPaidAt || 'Verified'})
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenDispenseModal(rx)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] animate-bounce-short"
                              >
                                <Send className="size-4" />
                                <span>Dispense Medicines & Notify Patient to Collect</span>
                              </button>
                            </div>
                          )}

                          {/* Step D: If already dispensed */}
                          {isDispensed && (
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Patient notified for collection</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = prescriptions.map((p) =>
                                    p.id === rx.id ? { ...p, status: 'active' as const, fulfillmentStatus: 'ready_for_billing' as const } : p
                                  )
                                  updatePrescriptionsState(updated)
                                  triggerAction(`Prescription ${rx.id} re-opened`)
                                }}
                                className="text-indigo-600 hover:underline font-semibold text-[11px]"
                              >
                                Re-open Order
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}



          {/* TAB 3: Pharmacy Stock & Inventory */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[var(--care-border)] bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Hospital Pharmacy Formulary & Inventory</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage real-time drug inventory, automatic unit deductions upon dispensing, and batch tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition"
                >
                  <PlusCircle className="size-4" />
                  <span>+ Add New Medicine</span>
                </button>
              </div>

              {/* Search & Category Tabs */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-[var(--care-border)] bg-white p-4 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search SKU, trade name, batch..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setInventoryCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      inventoryCategoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInventoryCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        inventoryCategoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory Table Grid */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Medicine & Generic</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Stock Level</th>
                        <th className="px-5 py-3.5">Unit Price</th>
                        <th className="px-5 py-3.5">Batch / Expiry</th>
                        <th className="px-5 py-3.5 text-right">Quick Restock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900">{med.name}</div>
                            <div className="text-[11px] text-slate-500">{med.genericName}</div>
                            <span className="font-mono text-[10px] text-indigo-700 font-semibold">{med.sku}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {med.category}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900">{med.currentStock}</span>
                              <span className="text-slate-400 text-[11px]">{med.unitType}</span>
                            </div>
                            <span
                              className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                med.stockStatus === 'Optimal'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : med.stockStatus === 'Low Stock'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800 animate-pulse'
                              }`}
                            >
                              {med.stockStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-800 text-sm">
                            ${med.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-[11px] text-slate-600">
                            <div>Batch: <strong className="font-mono">{med.batchNumber}</strong></div>
                            <div>Exp: {med.expiryDate}</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRestockMedicine(med.id, 100)}
                              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-800 transition"
                            >
                              <Plus className="size-3.5" />
                              <span>+100 Units</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Leave Requests & Time-off */}
          {activeTab === 'leave-requests' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border border-indigo-200 bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 p-6 text-white shadow-lg">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="size-5 text-indigo-300" />
                  Medicine Staff Leave & Time-Off Portal
                </h2>
                <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                  Submit formal leave applications directly to the Hospital Admin. Live status updates (Pending, Approved, Rejected) sync automatically with administrative decisions.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Leave Application Form */}
                <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <PlusCircle className="size-4 text-indigo-600" />
                    New Leave Application
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Request days off with reason and shift details.</p>

                  <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Leave Category</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leaveType'])}
                        className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Annual Leave">Annual Leave (Vacation)</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Medical Conference">Medical Conference / Training</option>
                        <option value="Maternity / Paternity">Maternity / Paternity</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-start">
                      <div>
                        <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 truncate">
                          Start Date <span className="ml-1 text-[10px] font-normal text-indigo-700">(From Tomorrow)</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            ref={leaveStartRef}
                            type="date"
                            min={getTomorrowIsoString()}
                            value={leaveStartDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-3 pr-9 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                leaveStartRef.current?.showPicker()
                              } catch {
                                leaveStartRef.current?.focus()
                              }
                            }}
                            className="absolute right-2 flex size-7 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 transition"
                            title="Click calendar to pick start date"
                          >
                            <Calendar className="size-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 truncate">
                          End Date <span className="ml-1 text-[10px] font-normal text-indigo-700">(To Date)</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            ref={leaveEndRef}
                            type="date"
                            min={leaveStartDate || getTomorrowIsoString()}
                            value={leaveEndDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-3 pr-9 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                leaveEndRef.current?.showPicker()
                              } catch {
                                leaveEndRef.current?.focus()
                              }
                            }}
                            className="absolute right-2 flex size-7 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 transition"
                            title="Click calendar to pick end date"
                          >
                            <Calendar className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-start">
                      <div>
                        <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 truncate">
                          Total Days (Calculated)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={leaveDaysCount}
                          onChange={(e) => setLeaveDaysCount(Math.max(1, Number(e.target.value)))}
                          className="h-11 w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 text-xs font-black text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex h-5 items-center font-bold text-slate-800 mb-1.5 truncate">
                          Shift Slot
                        </label>
                        <select
                          value={leaveShiftSlot}
                          onChange={(e) => setLeaveShiftSlot(e.target.value as LeaveRequest['shiftSlot'])}
                          className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        >
                          <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                          <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                          <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                          <option value="Full Day (All Shifts)">Full Day (All Shifts)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Reason / Notes for Admin *</label>
                      <textarea
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="Provide details about why you are requesting leave..."
                        rows={3}
                        className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-xs font-black text-white shadow-md transition active:scale-[0.98]"
                    >
                      <Send className="size-4" />
                      <span>Submit Request to Admin</span>
                    </button>
                  </form>
                </div>

                {/* My Leave Applications Log */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">My Leave Applications & Review Status</h3>
                        <p className="text-xs text-slate-500">Synchronized live with Hospital Admin decisions</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-bold text-slate-700">
                        {myLeaveRequests.length} Total
                      </span>
                    </div>

                    {myLeaveRequests.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        <Calendar className="size-8 text-slate-300 mx-auto mb-2" />
                        No leave applications filed yet. Use the form on the left to request time off.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myLeaveRequests.map((req) => (
                          <div
                            key={req.id}
                            className={`rounded-2xl border p-4 transition ${
                              req.status === 'approved'
                                ? 'border-emerald-200 bg-emerald-50/40'
                                : req.status === 'rejected'
                                ? 'border-red-200 bg-red-50/40'
                                : 'border-amber-200 bg-amber-50/30'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{req.leaveType}</span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {req.startDate} â†’ {req.endDate}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">
                                  <strong>Reason:</strong> {req.reason}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Shift: {req.shiftSlot} Â· Submitted: {req.submittedAt}
                                </p>
                              </div>

                              <div>
                                {req.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-900 border border-amber-300 animate-pulse">
                                    <Timer className="size-3" />
                                    Pending Admin Review
                                  </span>
                                )}
                                {req.status === 'approved' && (
                                  <div className="text-right">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-900 border border-emerald-300">
                                      <Check className="size-3" />
                                      Approved by Admin
                                    </span>
                                    {req.replacementStaffName && (
                                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                                        Covered by: {req.replacementStaffName}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {req.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold text-red-900 border border-red-300">
                                    <X className="size-3" />
                                    Rejected by Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Dispensed Audit & History */}
          {activeTab === 'dispensed-history' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border border-[var(--care-border)] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Dispensed Prescriptions & Patient Collection Audit</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete timestamped audit log of handed-over medications with patient collection status.
                </p>
              </div>

              <div className="space-y-3">
                {prescriptions
                  .filter((p) => p.status === 'dispensed')
                  .map((rx) => (
                    <div
                      key={rx.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{rx.patientName}</h3>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                            {rx.mrn}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900">
                            Collected
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Diagnosis: <strong>{rx.diagnosis}</strong> ({rx.medications.length} items dispensed)
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Counter: <strong>{rx.pickupCounter || 'Counter #2'}</strong> Â· Dispensed by: {rx.dispensedBy || currentUser.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                          ðŸ•’ {rx.dispensedAt || 'Completed'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>

      {/* DISPENSE CONFIRMATION & PATIENT NOTIFICATION MODAL */}
      {dispenseModalRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-300 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                  <Send className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Dispense & Notify Patient</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{dispenseModalRx.patientName}</strong> ({dispenseModalRx.mrn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispenseModalRx(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Payment Verification Banner */}
              <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Bill Verified & Cleared by Billing Staff
                </span>
                <span className="font-mono font-black text-emerald-800">
                  ${(dispenseModalRx.medications.length * 45 + (dispenseModalRx.isNurseDirectCare ? 60 : 120)).toFixed(2)}
                </span>
              </div>

              {/* Counter Selection */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Designated Pharmacy Pickup Counter:
                </label>
                <select
                  value={selectedCounter}
                  onChange={(e) => setSelectedCounter(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {PHARMACY_COUNTERS.map((counter) => (
                    <option key={counter} value={counter}>
                      {counter}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prescribed Medications Summary */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <p className="text-xs font-bold text-slate-700 mb-2">Medications Being Dispensed ({dispenseModalRx.medications.length}):</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {dispenseModalRx.medications.map((m) => (
                    <div key={m.id} className="text-xs flex items-center justify-between">
                      <span className="text-slate-800 font-semibold">{m.name} ({m.dosage})</span>
                      <span className="text-[11px] text-slate-500 font-mono">{m.frequency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pharmacist Counseling Note */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Pharmacist Dispensing & Counseling Note:
                </label>
                <textarea
                  value={pharmacistDispenseNote}
                  onChange={(e) => setPharmacistDispenseNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 shadow-xs outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 placeholder:text-slate-400"
                />
              </div>

              {/* Live Patient Alert Preview */}
              <div className="rounded-2xl bg-indigo-50/80 p-3 border border-indigo-200 text-xs text-indigo-950">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-indigo-600" />
                  Instant Patient Notification Trigger:
                </p>
                <p className="text-[11px] text-indigo-800 mt-1">
                  Upon clicking confirm, {dispenseModalRx.patientName}'s dashboard will update in real-time with: <em>"Your medicines are packed and ready to collect at {selectedCounter}!"</em>
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispenseModalRx(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispenseAndNotifyPatient}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition"
              >
                <Check className="size-4" />
                <span>Confirm Dispense & Broadcast Notification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MEDICINE MODAL */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-indigo-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Medication to Formulary</h3>
              <button type="button" onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMedicine} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Trade / Brand Name</label>
                <input
                  type="text"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Ciprofloxacin 500mg"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Generic Name</label>
                <input
                  type="text"
                  value={newMedGeneric}
                  onChange={(e) => setNewMedGeneric(e.target.value)}
                  placeholder="e.g. Ciprofloxacin Hydrochloride"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category</label>
                  <select
                    value={newMedCategory}
                    onChange={(e) => setNewMedCategory(e.target.value as MedicineInventory['category'])}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Diabetes & Endocrine">Diabetes</option>
                    <option value="Inpatient Injectables">Inpatient Injectables</option>
                    <option value="Analgesics & Antipyretics">Analgesics</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newMedStock}
                    onChange={(e) => setNewMedStock(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMedPrice}
                    onChange={(e) => setNewMedPrice(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Unit Form</label>
                  <input
                    type="text"
                    value={newMedUnitType}
                    onChange={(e) => setNewMedUnitType(e.target.value)}
                    placeholder="e.g. Tablets / Vials"
                    className="w-full rounded-xl border-2 border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-xs outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
