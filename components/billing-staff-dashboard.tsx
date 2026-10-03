'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BillingRequest,
  BillingRequestStatus,
  BillRecord,
  EMPTY_ACCOUNT,
  DemoAccount,
  getAllAccounts,
  getDemoAccountByRole,
  getEligibleReplacementsForStaff,
  getStoredBillingRequests,
  getStoredBills,
  getStoredLeaveRequests,
  getStoredMedicines,
  getStoredNotifications,
  getStoredPatients,
  getStoredPayments,
  getStoredPrescriptions,
  HospitalNotification,
  INITIAL_BILLING_REQUESTS,
  INITIAL_BILLS,
  INITIAL_PAYMENTS,
  LeaveRequest,
  MedicineInventory,
  PatientRecord,
  PaymentMethodType,
  PaymentRecord,
  PaymentStatusType,
  PrescriptionRecord,
  saveBillingRequests,
  saveBills,
  saveLeaveRequests,
  saveNotifications,
  savePayments,
  savePrescriptions,
  addHospitalNotification,
  generateUniqueBillNumber,
  calculateBillTotals,
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
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  HandCoins,
  History,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  PackageCheck,
  Pencil,
  Pill,
  Plus,
  PlusCircle,
  Printer,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap
} from 'lucide-react'

type BillingTab = 'overview' | 'requests' | 'dispense' | 'bills' | 'payments' | 'leave'

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

export function BillingStaffDashboard() {
  const router = useRouter()
  const defaultAccount = getDemoAccountByRole('billing') || EMPTY_ACCOUNT
  const [currentUser, setCurrentUser] = useState<DemoAccount>(defaultAccount)
  const [allRoleAccounts, setAllRoleAccounts] = useState<DemoAccount[]>([])
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<BillingTab>('overview')
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Datasets
  const [billingRequests, setBillingRequests] = useState<BillingRequest[]>([])
  const [bills, setBills] = useState<BillRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [medicines, setMedicines] = useState<MedicineInventory[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [notifications, setNotifications] = useState<HospitalNotification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Filters & Searches
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('ALL')
  const [billStatusFilter, setBillStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [bannerNotice, setBannerNotice] = useState<{ message: string; type?: 'success' | 'info' | 'warning' } | null>(null)

  // Modal States
  const [createBillModalRequest, setCreateBillModalRequest] = useState<BillingRequest | null>(null)
  const [editableMedicines, setEditableMedicines] = useState<Array<{ name: string; dosage?: string; quantity: number; unitPrice: number; total: number }>>([])
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxPercent, setTaxPercent] = useState<number>(0)
  const [shareImmediately, setShareImmediately] = useState<boolean>(true)
  const [billNotes, setBillNotes] = useState<string>('')

  const [confirmPaymentModalBill, setConfirmPaymentModalBill] = useState<BillRecord | null>(null)
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethodType>('UPI')
  const [transactionRefInput, setTransactionRefInput] = useState<string>('')
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('')

  const [dispenseModalItem, setDispenseModalItem] = useState<{
    id: string
    prescriptionId?: string
    billNumber?: string
    patientName: string
    patientMrn?: string
    nurseName?: string
    finalAmount?: number
    medicines: Array<{ name: string; quantity: number; dosage?: string }>
  } | null>(null)
  const [dispenseCounter, setDispenseCounter] = useState<string>('Billing & Dispensary Desk #1 (Main OPD)')
  const [dispenseStaffNotes, setDispenseStaffNotes] = useState<string>('')

  const [viewBillModal, setViewBillModal] = useState<BillRecord | null>(null)
  const [viewRequestModal, setViewRequestModal] = useState<BillingRequest | null>(null)
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState<PrescriptionRecord | null>(null)
  const [viewPatientModal, setViewPatientModal] = useState<PatientRecord | null>(null)

  // Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Annual Leave')
  const [leaveStartDate, setLeaveStartDate] = useState(getTomorrowIsoString)
  const [leaveEndDate, setLeaveEndDate] = useState(getDayAfterTomorrowIsoString)
  const [leaveDaysCount, setLeaveDaysCount] = useState(2)
  const [leaveShiftSlot, setLeaveShiftSlot] = useState<LeaveRequest['shiftSlot']>('Morning (08:00 - 16:00)')
  const [leaveReason, setLeaveReason] = useState('')
  const [selectedReplacementStaffId, setSelectedReplacementStaffId] = useState<string>('')

  const showNotice = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setBannerNotice({ message, type })
    setTimeout(() => setBannerNotice(null), 5000)
  }

  // Load datasets and sync with storage
  const loadData = () => {
    if (typeof window !== 'undefined') {
      const allAccs = getAllAccounts()
      setAllRoleAccounts(allAccs)

      const storedUser = localStorage.getItem('carelink_user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as DemoAccount
          if (parsed && parsed.roleSlug === 'billing') {
            setCurrentUser(parsed)
          }
        } catch {
          // ignore
        }
      }

      setBillingRequests(getStoredBillingRequests())
      setBills(getStoredBills())
      setPayments(getStoredPayments())
      setPatients(getStoredPatients())
      setPrescriptions(getStoredPrescriptions())
      setMedicines(getStoredMedicines())
      setLeaveRequests(getStoredLeaveRequests())
      setNotifications(getStoredNotifications())
    }
  }

  useEffect(() => {
    loadData()

    const handleStorage = (e: StorageEvent) => {
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

    window.addEventListener('storage', handleStorage)
    window.addEventListener('carelink_sync', handleSync)
    window.addEventListener('focus', handleSync)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('carelink_sync', handleSync)
      window.removeEventListener('focus', handleSync)
    }
  }, [])

  // Auto-recalculate leave days
  useEffect(() => {
    const days = calculateDaysBetween(leaveStartDate, leaveEndDate)
    setLeaveDaysCount(days)
  }, [leaveStartDate, leaveEndDate])

  // Helper persistence wrappers
  const persistBillingRequests = (updated: BillingRequest[]) => {
    setBillingRequests(updated)
    saveBillingRequests(updated)
  }

  const persistBills = (updated: BillRecord[]) => {
    setBills(updated)
    saveBills(updated)
  }

  const persistPayments = (updated: PaymentRecord[]) => {
    setPayments(updated)
    savePayments(updated)
  }

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

  // =========================================================================
  // METRICS CALCULATIONS
  // =========================================================================
  const metrics = useMemo(() => {
    const todayBillsCount = bills.filter((b) => b.createdAt.toLowerCase().includes('today')).length
    const pendingRequestsCount = billingRequests.filter((r) => r.status === 'PENDING').length
    const pendingPaymentsCount = bills.filter((b) => b.paymentStatus === 'PENDING' || b.status === 'PAYMENT_PENDING').length
    const paidBillsCount = bills.filter((b) => b.paymentStatus === 'PAID').length

    const amountReceivedToday = payments
      .filter((p) => p.paymentDateTime.toLowerCase().includes('today') || p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const awaitingDispensingCount = billingRequests.filter(
      (r) => r.status === 'PAID' || r.status === 'READY_FOR_DISPENSING'
    ).length

    return {
      todayBillsCount,
      pendingRequestsCount,
      pendingPaymentsCount,
      paidBillsCount,
      amountReceivedToday,
      awaitingDispensingCount
    }
  }, [bills, billingRequests, payments])

  // =========================================================================
  // CREATE BILL HANDLER
  // =========================================================================
  const handleOpenCreateBillModal = (req: BillingRequest) => {
    setCreateBillModalRequest(req)
    // Prepopulate medicines with quantities and unit prices
    const medItems = req.medicines.map((m) => {
      // Find default unit price from medicines inventory if available
      const matchedInventory = medicines.find(
        (inv) => inv.name.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(inv.name.toLowerCase())
      )
      const unitPrice = m.unitPrice || (matchedInventory ? matchedInventory.unitPrice : 15.0)
      const qty = m.quantity || 1
      return {
        name: m.name,
        dosage: m.dosage,
        quantity: qty,
        unitPrice: unitPrice,
        total: Number((qty * unitPrice).toFixed(2))
      }
    })
    setEditableMedicines(medItems)
    setDiscountAmount(0)
    setTaxPercent(0)
    setShareImmediately(true)
    setBillNotes(req.notes || '')
  }

  const handleUpdateMedicinePriceOrQty = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    const updated = [...editableMedicines]
    const item = { ...updated[index] }
    if (field === 'quantity') {
      item.quantity = Math.max(1, Number(val) || 1)
    } else {
      item.unitPrice = Math.max(0, Number(val) || 0)
    }
    item.total = Number((item.quantity * item.unitPrice).toFixed(2))
    updated[index] = item
    setEditableMedicines(updated)
  }

  const calculatedBillTotals = useMemo(() => {
    return calculateBillTotals(editableMedicines, discountAmount, taxPercent)
  }, [editableMedicines, discountAmount, taxPercent])

  const handleConfirmCreateBill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createBillModalRequest) return

    const generatedBillNo = generateUniqueBillNumber(bills)
    const newBillId = `bill-${Date.now()}`
    const totals = calculatedBillTotals

    const newBill: BillRecord = {
      id: newBillId,
      billNumber: generatedBillNo,
      requestId: createBillModalRequest.id,
      prescriptionId: createBillModalRequest.prescriptionId,
      patientId: createBillModalRequest.patientId,
      patientName: createBillModalRequest.patientName,
      patientMrn: createBillModalRequest.patientMrn,
      patientContact: createBillModalRequest.patientContact,
      nurseId: createBillModalRequest.nurseId,
      nurseName: createBillModalRequest.nurseName,
      medicines: editableMedicines.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        total: m.total
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      finalAmount: totals.finalAmount,
      status: 'PAYMENT_PENDING',
      paymentStatus: 'PENDING',
      sharedWithPatient: shareImmediately,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      notes: billNotes.trim() || undefined
    }

    // Update Billing Request Status
    const updatedRequests = billingRequests.map((r) =>
      r.id === createBillModalRequest.id
        ? {
            ...r,
            status: 'BILL_CREATED' as BillingRequestStatus,
            billId: newBillId,
            billNumber: generatedBillNo,
            finalAmount: totals.finalAmount
          }
        : r
    )
    persistBillingRequests(updatedRequests)

    // Save Bill
    const updatedBills = [newBill, ...bills]
    persistBills(updatedBills)

    // Cross-sync Prescription record billing status
    const updatedPrescriptions = prescriptions.map((p) =>
      p.id === createBillModalRequest.prescriptionId || p.mrn === createBillModalRequest.patientMrn
        ? {
            ...p,
            billingStatus: 'pending' as const
          }
        : p
    )
    setPrescriptions(updatedPrescriptions)
    savePrescriptions(updatedPrescriptions)

    // Notify Patient if shared
    if (shareImmediately) {
      addHospitalNotification({
        toRole: 'patient',
        toUserId: createBillModalRequest.patientId,
        title: 'New Bill Generated for Prescription',
        message: `A new bill has been generated for your prescription. Bill ID: ${generatedBillNo}. Amount payable: â‚¹${totals.finalAmount.toFixed(2)}.`,
        type: 'payment'
      })
    }

    // Notify Nurse
    addHospitalNotification({
      toRole: 'nurse',
      toUserId: createBillModalRequest.nurseId,
      title: 'Bill Created for Request',
      message: `Bill ${generatedBillNo} generated for ${createBillModalRequest.patientName} (â‚¹${totals.finalAmount.toFixed(2)}). Awaiting patient payment.`,
      type: 'info'
    })

    setCreateBillModalRequest(null)
    showNotice(
      `Bill ${generatedBillNo} generated successfully (Total: â‚¹${totals.finalAmount.toFixed(2)})${
        shareImmediately ? ' and shared with Patient.' : '.'
      }`,
      'success'
    )
    setActiveTab('bills')
  }

  // =========================================================================
  // SHARE BILL WITH PATIENT
  // =========================================================================
  const handleShareBillWithPatient = (bill: BillRecord) => {
    const updated = bills.map((b) => (b.id === bill.id ? { ...b, sharedWithPatient: true } : b))
    persistBills(updated)

    addHospitalNotification({
      toRole: 'patient',
      toUserId: bill.patientId,
      title: 'Prescription Bill Shared with You',
      message: `A new bill has been generated for your prescription. Bill ID: ${bill.billNumber}. Amount payable: â‚¹${bill.finalAmount.toFixed(2)}.`,
      type: 'payment'
    })

    showNotice(
      `Bill ${bill.billNumber} successfully shared with Patient ${bill.patientName}. Notification dispatched!`,
      'success'
    )
  }

  // =========================================================================
  // CONFIRM PAYMENT WORKFLOW
  // =========================================================================
  const handleOpenConfirmPaymentModal = (bill: BillRecord) => {
    setConfirmPaymentModalBill(bill)
    setPaymentMethodInput('UPI')
    setTransactionRefInput(`TXN-${Date.now().toString().slice(-6)}`)
    setPaymentNotesInput('')
  }

  const handleProcessConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmPaymentModalBill) return

    const bill = confirmPaymentModalBill
    const timeString = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    const paymentId = `PAY-${Date.now()}`

    // 1. Create Payment Record
    const newPayment: PaymentRecord = {
      id: paymentId,
      billId: bill.id,
      billNumber: bill.billNumber,
      patientId: bill.patientId,
      patientName: bill.patientName,
      patientMrn: bill.patientMrn,
      amount: bill.finalAmount,
      paymentMethod: paymentMethodInput,
      transactionId: transactionRefInput.trim() || `TXN-${Date.now()}`,
      paymentDateTime: timeString,
      paymentStatus: 'PAID',
      confirmedBy: currentUser.name,
      notes: paymentNotesInput.trim() || undefined
    }
    const updatedPayments = [newPayment, ...payments]
    persistPayments(updatedPayments)

    // 2. Update Bill Record to PAID
    const updatedBills = bills.map((b) =>
      b.id === bill.id
        ? {
            ...b,
            status: 'PAID' as BillingRequestStatus,
            paymentStatus: 'PAID' as PaymentStatusType,
            paymentMethod: paymentMethodInput,
            transactionId: newPayment.transactionId,
            paymentDate: timeString,
            paymentConfirmedBy: currentUser.name,
            paidAt: timeString
          }
        : b
    )
    persistBills(updatedBills)

    // 3. Update Billing Request status to READY_FOR_DISPENSING
    const updatedRequests = billingRequests.map((r) =>
      r.billId === bill.id || r.id === bill.requestId || r.prescriptionId === bill.prescriptionId
        ? {
            ...r,
            status: 'READY_FOR_DISPENSING' as BillingRequestStatus,
            finalAmount: bill.finalAmount
          }
        : r
    )
    persistBillingRequests(updatedRequests)

    // 4. Update Prescription Record
    const updatedPrescriptions = prescriptions.map((p) =>
      p.id === bill.prescriptionId || p.mrn === bill.patientMrn
        ? {
            ...p,
            billingStatus: 'paid' as const,
            billPaidAt: timeString,
            isReady: true,
            fulfillmentStatus: 'ready_to_collect' as const
          }
        : p
    )
    setPrescriptions(updatedPrescriptions)
    savePrescriptions(updatedPrescriptions)

    // 5. Notify Nurse: Payment confirmed, clear for dispensing!
    addHospitalNotification({
      toRole: 'nurse',
      toUserId: bill.nurseId,
      title: 'Payment Confirmed â€” Ready for Dispensing',
      message: `Payment confirmed (â‚¹${bill.finalAmount.toFixed(2)}) for patient ${bill.patientName} (Rx: ${bill.prescriptionId}). Prescriptions cleared for Billing Staff dispensing.`,
      type: 'dispense'
    })

    // 6. Notify Patient: Payment received receipt
    addHospitalNotification({
      toRole: 'patient',
      toUserId: bill.patientId,
      title: 'Payment Confirmation Receipt',
      message: `Your payment of â‚¹${bill.finalAmount.toFixed(2)} for Bill ${bill.billNumber} has been received and verified. Medicines are now ready for dispensing at the Billing & Dispensary desk.`,
      type: 'payment'
    })

    setConfirmPaymentModalBill(null)
    showNotice(
      `Payment of â‚¹${bill.finalAmount.toFixed(2)} confirmed for ${bill.patientName} (Bill ${bill.billNumber})! Order is now cleared for medication dispensing.`,
      'success'
    )
  }

  // =========================================================================
  // MEDICINE DISPENSING HANDLER (MANAGED BY BILLING STAFF)
  // =========================================================================
  const handleConfirmDispenseMedicines = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dispenseModalItem) return

    const result = dispenseMedicationsSync({
      billingRequestId: dispenseModalItem.id,
      prescriptionId: dispenseModalItem.prescriptionId,
      billNumber: dispenseModalItem.billNumber,
      patientName: dispenseModalItem.patientName,
      patientMrn: dispenseModalItem.patientMrn,
      medicines: dispenseModalItem.medicines,
      dispensedBy: currentUser.name,
      dispenserRole: 'Billing Staff',
      counter: dispenseCounter,
      notes: dispenseStaffNotes.trim() || undefined
    })

    if (result) {
      setBillingRequests(result.billingRequests)
      setBills(result.bills)
      setPrescriptions(result.prescriptions)
      setMedicines(result.medicines)
    }

    const ptName = dispenseModalItem.patientName
    setDispenseModalItem(null)
    setDispenseStaffNotes('')
    showNotice(
      `Medicines successfully dispensed for ${ptName} by Billing Staff! Synchronized with Medicine Staff & Pharmacy.`,
      'success'
    )
  }

  // =========================================================================
  // LEAVE APPLICATION HANDLER
  // =========================================================================
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveReason.trim()) {
      showNotice('Please enter a valid reason for your leave request.', 'warning')
      return
    }

    const replacementCandidates = getEligibleReplacementsForStaff(currentUser, allRoleAccounts)
    const matchedRep = replacementCandidates.find((r) => r.id === selectedReplacementStaffId)

    const newLeave: LeaveRequest = {
      id: `leave-bill-${Date.now()}`,
      staffId: currentUser.id,
      staffName: currentUser.name,
      staffRole: 'Billing Staff',
      department: currentUser.department || 'Patient Financial Services',
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      shiftSlot: leaveShiftSlot,
      reason: leaveReason.trim(),
      status: 'pending',
      replacementStaffId: matchedRep?.id,
      replacementStaffName: matchedRep ? `${matchedRep.name} (${matchedRep.roleLabel})` : undefined,
      submittedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    const updated = [newLeave, ...leaveRequests]
    setLeaveRequests(updated)
    saveLeaveRequests(updated)

    setLeaveReason('')
    showNotice(`Leave application submitted successfully (${leaveDaysCount} days). Awaiting Admin approval.`, 'success')
  }

  // Filtered requests and bills
  const filteredRequests = useMemo(() => {
    return billingRequests.filter((r) => {
      const matchesStatus = requestStatusFilter === 'ALL' || r.status === requestStatusFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.patientMrn.toLowerCase().includes(q) ||
        r.nurseName.toLowerCase().includes(q) ||
        r.prescriptionId.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [billingRequests, requestStatusFilter, searchQuery])

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesStatus = billStatusFilter === 'ALL' || b.paymentStatus === billStatusFilter || b.status === billStatusFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        b.billNumber.toLowerCase().includes(q) ||
        b.patientName.toLowerCase().includes(q) ||
        b.patientMrn.toLowerCase().includes(q) ||
        b.nurseName.toLowerCase().includes(q) ||
        b.prescriptionId.toLowerCase().includes(q) ||
        (b.transactionId && b.transactionId.toLowerCase().includes(q))
      return matchesStatus && matchesSearch
    })
  }, [bills, billStatusFilter, searchQuery])

  const eligibleReplacements = useMemo(() => {
    return getEligibleReplacementsForStaff(currentUser, allRoleAccounts)
  }, [currentUser, allRoleAccounts])

  const displayedSwitchers = allRoleAccounts

  return (
    <div className="flex min-h-screen bg-[var(--care-bg)] text-[var(--care-ink)]">
      {/* ========================================================================= */}
      {/* 1. BILLING WORKSPACE SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="sticky top-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-[var(--care-border)] bg-[var(--care-surface)] shadow-sm">
        {/* Brand & Badge */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--care-border)] px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Receipt className="size-5" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--care-ink)]">CareLink</span>
              <span className="ml-1.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                BILLING DESK
              </span>
            </div>
          </Link>
        </div>

        {/* User Identity */}
        <div className="border-b border-[var(--care-border)] bg-[var(--care-bg)]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-bold text-white shadow-sm">
                {currentUser.avatarInitials}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-[var(--care-ink)]">{currentUser.name}</p>
                <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-800">CPC</span>
              </div>
              <p className="truncate text-[11px] text-[var(--care-muted)]">{currentUser.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px]">
                <span className="font-semibold text-emerald-700">â— On Duty</span>
                <span className="text-[var(--care-muted)]">Shift: Morning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
              activeTab === 'overview'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="size-4" />
              <span>Billing Dashboard</span>
            </div>
            {metrics.pendingRequestsCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {metrics.pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
              activeTab === 'requests'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ClipboardListIcon className="size-4" />
              <span>Nurse Billing Requests</span>
            </div>
            {metrics.pendingRequestsCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'requests' ? 'bg-amber-400 text-slate-950 font-black animate-pulse' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {metrics.pendingRequestsCount} New
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
              activeTab === 'bills'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="size-4" />
              <span>Generated Bills & Invoices</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'bills' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {bills.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispense')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
              activeTab === 'dispense'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PackageCheck className="size-4" />
              <span>Medicine Dispensing</span>
            </div>
            {metrics.awaitingDispensingCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'dispense' ? 'bg-amber-300 text-slate-950 font-black' : 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold animate-pulse'
                }`}
              >
                {metrics.awaitingDispensingCount} Ready
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
              activeTab === 'payments'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Wallet className="size-4" />
              <span>Payments & Collections</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'payments' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {payments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
              activeTab === 'leave'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-[var(--care-ink)] hover:bg-[var(--care-highlight)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4" />
              <span>Leave Requests & Shifts</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer — Logged In User */}
        <div className="border-t border-[var(--care-border)] p-3 space-y-2 bg-[var(--care-bg)]/40">
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

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
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
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--care-border)] bg-[var(--care-surface)]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-bold text-[var(--care-ink)] flex items-center gap-2">
                {activeTab === 'overview' && 'Billing Staff Overview & Daily Revenue'}
                {activeTab === 'requests' && 'Nurse Billing Requests Queue'}
                {activeTab === 'bills' && 'Patient Invoices & Bill Management'}
                {activeTab === 'payments' && 'Payment Transactions & Settlements'}
                {activeTab === 'leave' && 'Billing Staff Leave Portal'}
              </h1>
              <p className="text-[11px] text-[var(--care-muted)]">
                CareLink Patient Financial Services Â· Authorized Billing & Payment Gate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex size-9 items-center justify-center rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
                title="Notifications"
              >
                <MessageSquare className="size-4 text-emerald-700" />
                {notifications.filter((n) => !n.read && (n.toRole === 'billing' || !n.toRole)).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white animate-pulse">
                    {notifications.filter((n) => !n.read && (n.toRole === 'billing' || !n.toRole)).length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-2 mb-2">
                    <span className="text-xs font-bold text-[var(--care-ink)]">Billing Notifications</span>
                    <button
                      type="button"
                      onClick={() => {
                        const marked = notifications.map((n) => ({ ...n, read: true }))
                        setNotifications(marked)
                        saveNotifications(marked)
                      }}
                      className="text-[10px] text-emerald-700 font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="text-center text-xs text-[var(--care-muted)] py-4">No notifications.</p>
                    )}
                    {notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-xl p-2.5 text-xs transition border ${
                          n.read ? 'bg-[var(--care-bg)] border-[var(--care-border)]' : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[var(--care-ink)]">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-[var(--care-muted)] font-normal">{n.createdAt}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--care-muted)]">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-emerald-900">
                Today's Collection: <strong>â‚¹{metrics.amountReceivedToday.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </header>

        {/* Global Notice Banner */}
        {bannerNotice && (
          <div
            className={`mx-6 mt-4 flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold shadow-xs animate-in slide-in-from-top duration-200 ${
              bannerNotice.type === 'success'
                ? 'border border-emerald-200 bg-emerald-100 text-emerald-900'
                : bannerNotice.type === 'warning'
                ? 'border border-amber-200 bg-amber-100 text-amber-900'
                : 'border border-blue-200 bg-blue-100 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 shrink-0" />
              <span>{bannerNotice.message}</span>
            </div>
            <button type="button" onClick={() => setBannerNotice(null)} className="p-1 hover:opacity-75">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Content Tabs */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards Grid */}
              <section>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {/* Card 1: Today's Bills */}
                  <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between text-emerald-700 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--care-muted)]">
                        Today's Bills
                      </span>
                      <Receipt className="size-4" />
                    </div>
                    <div className="text-2xl font-black text-[var(--care-ink)]">{metrics.todayBillsCount}</div>
                    <p className="mt-1 text-[10px] text-[var(--care-muted)]">Invoices created today</p>
                  </div>

                  {/* Card 2: Pending Requests */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between text-amber-800 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        Pending Requests
                      </span>
                      <ClipboardListIcon className="size-4 text-amber-700" />
                    </div>
                    <div className="text-2xl font-black text-amber-950">{metrics.pendingRequestsCount}</div>
                    <p className="mt-1 text-[10px] text-amber-800">From Nurse Station</p>
                  </div>

                  {/* Card 3: Pending Payments */}
                  <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between text-orange-800 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-900">
                        Pending Payments
                      </span>
                      <Clock className="size-4 text-orange-700" />
                    </div>
                    <div className="text-2xl font-black text-orange-950">{metrics.pendingPaymentsCount}</div>
                    <p className="mt-1 text-[10px] text-orange-800">Awaiting patient payment</p>
                  </div>

                  {/* Card 4: Paid Bills */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between text-emerald-800 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                        Paid Bills
                      </span>
                      <BadgeCheck className="size-4 text-emerald-700" />
                    </div>
                    <div className="text-2xl font-black text-emerald-950">{metrics.paidBillsCount}</div>
                    <p className="mt-1 text-[10px] text-emerald-800">Settled & verified</p>
                  </div>

                  {/* Card 5: Amount Received Today */}
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between text-teal-800 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
                        Amount Received
                      </span>
                      <TrendingUp className="size-4 text-teal-700" />
                    </div>
                    <div className="text-xl font-black text-teal-950">â‚¹{metrics.amountReceivedToday.toFixed(0)}</div>
                    <p className="mt-1 text-[10px] text-teal-800">Collected today</p>
                  </div>

                  {/* Card 6: Awaiting Dispensing */}
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between text-indigo-800 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                        Awaiting Dispensing
                      </span>
                      <PackageCheck className="size-4 text-indigo-700" />
                    </div>
                    <div className="text-2xl font-black text-indigo-950">{metrics.awaitingDispensingCount}</div>
                    <p className="mt-1 text-[10px] text-indigo-800">Nurse action ready</p>
                  </div>
                </div>
              </section>

              {/* Workflow Diagram Banner */}
              <section className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Active Clinical Revenue Cycle
                    </span>
                    <h2 className="mt-2 text-lg font-bold">
                      Nurse â†’ Billing Staff â†’ Patient â†’ Payment Confirmation â†’ Dispensing
                    </h2>
                    <p className="mt-1 text-xs text-emerald-200 max-w-2xl">
                      Review medicine requests sent by Nurses, calculate accurate itemized bills, share with Patients for payment, confirm received transactions, and unlock immediate medication dispensing.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('requests')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm"
                    >
                      <Plus className="size-3.5" />
                      <span>Review Nurse Requests ({metrics.pendingRequestsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bills')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                    >
                      <Receipt className="size-3.5" />
                      <span>View All Bills</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Recent Billing Requests Stream */}
              <section className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--care-border)] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)] flex items-center gap-2">
                      <Clock className="size-4 text-emerald-700" />
                      Recent Billing Requests from Nurse
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Incoming prescriptions waiting for bill generation or payment confirmation
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    View All Requests <ChevronRight className="size-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--care-border)] text-[var(--care-muted)] font-bold">
                        <th className="p-3">Request ID</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Nurse</th>
                        <th className="p-3">Medicines Prescribed</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {billingRequests.slice(0, 5).map((req) => (
                        <tr key={req.id} className="hover:bg-[var(--care-highlight)]/40 transition">
                          <td className="p-3 font-mono font-bold text-emerald-800">{req.id}</td>
                          <td className="p-3">
                            <div className="font-bold text-[var(--care-ink)]">{req.patientName}</div>
                            <div className="font-mono text-[10px] text-[var(--care-muted)]">{req.patientMrn}</div>
                          </td>
                          <td className="p-3 text-[var(--care-ink)]">{req.nurseName}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {req.medicines.map((m, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-800"
                                >
                                  {m.name} Ã— {m.quantity}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-[var(--care-ink)]">
                            {req.finalAmount ? `â‚¹${req.finalAmount.toFixed(2)}` : 'Pending Calc'}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="p-3 text-[var(--care-muted)]">{req.requestDateTime}</td>
                          <td className="p-3 text-right">
                            {req.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenCreateBillModal(req)}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                              >
                                <Plus className="size-3" />
                                <span>Create Bill</span>
                              </button>
                            ) : req.status === 'READY_FOR_DISPENSING' || req.status === 'PAID' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setDispenseModalItem({
                                    id: req.id,
                                    prescriptionId: req.prescriptionId,
                                    billNumber: req.billNumber,
                                    patientName: req.patientName,
                                    patientMrn: req.patientMrn,
                                    nurseName: req.nurseName,
                                    finalAmount: req.finalAmount,
                                    medicines: req.medicines
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition animate-pulse"
                              >
                                <PackageCheck className="size-3.5" />
                                <span>Dispense Medicines</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewRequestModal(req)}
                                className="inline-flex items-center gap-1 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
                              >
                                <Eye className="size-3 text-[var(--care-muted)]" />
                                <span>View</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BILLING REQUESTS PAGE */}
          {/* ========================================================================= */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--care-muted)] mr-1">Filter:</span>
                  {[
                    { id: 'ALL', label: 'All Requests' },
                    { id: 'PENDING', label: 'Pending Billing' },
                    { id: 'BILL_CREATED', label: 'Bill Created' },
                    { id: 'PAYMENT_PENDING', label: 'Payment Pending' },
                    { id: 'PAID', label: 'Paid' },
                    { id: 'READY_FOR_DISPENSING', label: 'Ready for Dispensing' },
                    { id: 'DISPENSED', label: 'Dispensed' },
                    { id: 'COMPLETED', label: 'Completed' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRequestStatusFilter(f.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        requestStatusFilter === f.id
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-[var(--care-bg)] text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                  <input
                    type="text"
                    placeholder="Search patient, MRN, nurse, Rx..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] pl-9 pr-4 py-2 text-xs text-[var(--care-ink)] outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[var(--care-muted)] hover:text-[var(--care-ink)]"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Requests Table */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">
                      Received Billing Requests ({filteredRequests.length})
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Requests generated by Nurses after patient consultation
                    </p>
                  </div>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--care-muted)]">
                    <Receipt className="mx-auto size-10 text-slate-300 mb-2" />
                    <p className="font-bold">No billing requests match the selected filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--care-border)] text-[var(--care-muted)] font-bold">
                          <th className="p-3">Request ID</th>
                          <th className="p-3">Patient Name & ID</th>
                          <th className="p-3">Prescribing Nurse</th>
                          <th className="p-3">Medicines & Quantities</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Request Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--care-border)]">
                        {filteredRequests.map((req) => {
                          const linkedBill = bills.find((b) => b.requestId === req.id || b.id === req.billId || b.billNumber === req.billNumber)

                          return (
                            <tr key={req.id} className="hover:bg-[var(--care-highlight)]/40 transition">
                              <td className="p-3 font-mono font-bold text-emerald-800">{req.id}</td>
                              <td className="p-3">
                                <div className="font-bold text-[var(--care-ink)]">{req.patientName}</div>
                                <div className="font-mono text-[10px] text-[var(--care-muted)]">{req.patientMrn}</div>
                                {req.patientContact && (
                                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{req.patientContact}</div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-[var(--care-ink)]">{req.nurseName}</div>
                                <div className="text-[10px] text-[var(--care-muted)]">Rx: {req.prescriptionId}</div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1 max-w-xs">
                                  {req.medicines.map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium text-slate-700">{m.name}</span>
                                      <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        Qty: {m.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-[var(--care-ink)]">
                                {req.finalAmount ? `â‚¹${req.finalAmount.toFixed(2)}` : 'Pending Calc'}
                              </td>
                              <td className="p-3">
                                <StatusBadge status={req.status} />
                              </td>
                              <td className="p-3 text-[var(--care-muted)]">{req.requestDateTime}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {req.status === 'PENDING' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCreateBillModal(req)}
                                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                    >
                                      <Plus className="size-3" />
                                      <span>Create Bill</span>
                                    </button>
                                  ) : req.status === 'READY_FOR_DISPENSING' || req.status === 'PAID' ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDispenseModalItem({
                                          id: req.id,
                                          prescriptionId: req.prescriptionId,
                                          billNumber: req.billNumber,
                                          patientName: req.patientName,
                                          patientMrn: req.patientMrn,
                                          nurseName: req.nurseName,
                                          finalAmount: req.finalAmount,
                                          medicines: req.medicines
                                        })
                                      }
                                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition animate-pulse"
                                    >
                                      <PackageCheck className="size-3.5" />
                                      <span>Dispense</span>
                                    </button>
                                  ) : linkedBill ? (
                                    <button
                                      type="button"
                                      onClick={() => setViewBillModal(linkedBill)}
                                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition"
                                    >
                                      <Receipt className="size-3 text-emerald-700" />
                                      <span>View Bill</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setViewRequestModal(req)}
                                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
                                    >
                                      <Eye className="size-3 text-[var(--care-muted)]" />
                                      <span>Details</span>
                                    </button>
                                  )}

                                  {/* View Patient Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const p = patients.find((pt) => pt.id === req.patientId || pt.name === req.patientName || pt.mrn === req.patientMrn)
                                      if (p) setViewPatientModal(p)
                                      else {
                                        showNotice(`Patient details for ${req.patientName} loaded from request.`, 'info')
                                      }
                                    }}
                                    title="View Patient"
                                    className="p-1 rounded-lg border border-[var(--care-border)] hover:bg-[var(--care-highlight)] text-[var(--care-muted)] hover:text-[var(--care-ink)]"
                                  >
                                    <User className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GENERATED BILLS & INVOICES */}
          {/* ========================================================================= */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--care-muted)] mr-1">Status:</span>
                  {[
                    { id: 'ALL', label: 'All Bills' },
                    { id: 'PENDING', label: 'Payment Pending' },
                    { id: 'PAID', label: 'Paid' },
                    { id: 'READY_FOR_DISPENSING', label: 'Ready for Dispense' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBillStatusFilter(f.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        billStatusFilter === f.id
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-[var(--care-bg)] text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 size-4 text-[var(--care-muted)]" />
                  <input
                    type="text"
                    placeholder="Search bill #, patient, transaction..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] pl-9 pr-4 py-2 text-xs text-[var(--care-ink)] outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[var(--care-muted)] hover:text-[var(--care-ink)]"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bills Cards Grid */}
              <div className="grid gap-5 md:grid-cols-2">
                {filteredBills.map((bill) => {
                  const isPaid = bill.paymentStatus === 'PAID' || bill.status === 'PAID'

                  return (
                    <div
                      key={bill.id}
                      className={`rounded-3xl border p-5 shadow-xs transition flex flex-col justify-between ${
                        isPaid
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-amber-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Header with Bill Number and Status */}
                        <div className="flex items-start justify-between border-b border-[var(--care-border)] pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {bill.billNumber}
                            </span>
                            <h3 className="mt-1.5 text-base font-bold text-[var(--care-ink)]">{bill.patientName}</h3>
                            <p className="text-xs text-[var(--care-muted)]">
                              MRN: <span className="font-mono">{bill.patientMrn}</span> Â· Prescribed by {bill.nurseName}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-[var(--care-muted)]">Final Amount</div>
                            <div className="text-2xl font-black text-emerald-700 font-mono">
                              â‚¹{bill.finalAmount.toFixed(2)}
                            </div>
                            <span
                              className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              }`}
                            >
                              {isPaid ? 'PAID' : 'PAYMENT PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Medicine Line Items */}
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Itemized Medicines ({bill.medicines.length}):
                          </p>
                          <div className="space-y-1.5">
                            {bill.medicines.map((m, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-slate-700">
                                  {m.name} Ã— <strong>{m.quantity}</strong> (@ â‚¹{m.unitPrice.toFixed(2)})
                                </span>
                                <span className="font-mono font-bold text-slate-900">â‚¹{m.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] flex justify-between text-slate-600 font-semibold">
                            <span>Subtotal: â‚¹{bill.subtotal.toFixed(2)}</span>
                            {bill.discount > 0 && <span className="text-emerald-700">Discount: -â‚¹{bill.discount.toFixed(2)}</span>}
                            {bill.tax > 0 && <span>Tax: +â‚¹{bill.tax.toFixed(2)}</span>}
                          </div>
                        </div>

                        {/* Payment / Verification Details */}
                        <div className="mt-3 text-[11px] text-[var(--care-muted)] flex flex-wrap items-center justify-between gap-2">
                          <span>Issued: {bill.createdAt}</span>
                          {isPaid && (
                            <span className="font-bold text-emerald-800">
                              âœ“ Verified via {bill.paymentMethod || 'UPI'} ({bill.paidAt || 'Paid'})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-[var(--care-border)] flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewBillModal(bill)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--care-ink)] hover:bg-[var(--care-highlight)] transition"
                          >
                            <Printer className="size-3.5 text-emerald-700" />
                            <span>View / Print</span>
                          </button>

                          {!bill.sharedWithPatient && (
                            <button
                              type="button"
                              onClick={() => handleShareBillWithPatient(bill)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
                            >
                              <Share2 className="size-3.5" />
                              <span>Share with Patient</span>
                            </button>
                          )}
                          {bill.sharedWithPatient && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                              <Check className="size-3" /> Shared with Patient
                            </span>
                          )}
                        </div>

                        <div>
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleOpenConfirmPaymentModal(bill)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition animate-pulse"
                            >
                              <HandCoins className="size-4" />
                              <span>Confirm Payment</span>
                            </button>
                          ) : bill.status === 'DISPENSED' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700">
                              <BadgeCheck className="size-4 text-emerald-600" />
                              <span>âœ“ Dispensed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setDispenseModalItem({
                                  id: bill.id,
                                  prescriptionId: bill.prescriptionId,
                                  billNumber: bill.billNumber,
                                  patientName: bill.patientName,
                                  patientMrn: bill.patientMrn,
                                  nurseName: bill.nurseName,
                                  finalAmount: bill.finalAmount,
                                  medicines: bill.medicines
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition animate-pulse"
                            >
                              <PackageCheck className="size-4" />
                              <span>Dispense Medicines</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3.5: MEDICINE DISPENSING STATION (MANAGED BY BILLING STAFF) */}
          {/* ========================================================================= */}
          {activeTab === 'dispense' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Dispensary & Medication Handover Desk
                    </span>
                    <h2 className="mt-2 text-lg font-bold">
                      Billing Staff Medicine Dispensing Station
                    </h2>
                    <p className="mt-1 text-xs text-emerald-200 max-w-2xl">
                      Verify payment confirmation, pack prescribed medicine orders, and hand over medicines directly to patients at the Billing & Dispensary counter.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-3 text-center border border-white/20">
                    <p className="text-[10px] font-bold text-emerald-200 uppercase">Awaiting Handover</p>
                    <p className="text-2xl font-black text-white">{metrics.awaitingDispensingCount}</p>
                    <p className="text-[10px] text-emerald-300">Paid & Cleared Orders</p>
                  </div>
                </div>
              </div>

              {/* Ready to Dispense Orders List */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">
                      Orders Cleared for Dispensing ({billingRequests.filter((r) => r.status === 'PAID' || r.status === 'READY_FOR_DISPENSING').length})
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Patient payment verified. Click "Dispense Medicines" to finalize medication handover.
                    </p>
                  </div>
                </div>

                {billingRequests.filter((r) => r.status === 'PAID' || r.status === 'READY_FOR_DISPENSING').length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--care-muted)]">
                    <PackageCheck className="mx-auto size-12 text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-[var(--care-ink)]">No orders currently awaiting dispensing.</p>
                    <p className="mt-1 text-xs text-[var(--care-muted)]">
                      When a patient completes payment, their prescription will automatically appear here for medication handover.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {billingRequests
                      .filter((r) => r.status === 'PAID' || r.status === 'READY_FOR_DISPENSING')
                      .map((req) => (
                        <div
                          key={req.id}
                          className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-5 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between border-b border-emerald-200 pb-3">
                              <div>
                                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  {req.billNumber || req.id}
                                </span>
                                <h4 className="mt-1 text-base font-bold text-[var(--care-ink)]">{req.patientName}</h4>
                                <p className="text-xs text-[var(--care-muted)]">
                                  MRN: <span className="font-mono">{req.patientMrn}</span> Â· Nurse: {req.nurseName}
                                </p>
                              </div>
                              <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 text-[10px] font-black flex items-center gap-1">
                                <Check className="size-3" /> Payment Verified
                              </span>
                            </div>

                            {/* Medicines to Hand Over */}
                            <div className="mt-3 space-y-1.5">
                              <p className="text-xs font-bold text-[var(--care-ink)] flex items-center gap-1">
                                <Pill className="size-3.5 text-emerald-700" />
                                Prescribed Medicines ({req.medicines.length}):
                              </p>
                              <div className="rounded-xl bg-white border border-emerald-200 p-2.5 space-y-1">
                                {req.medicines.map((m, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-900">{m.name}</span>
                                    <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      Qty: {m.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-emerald-800">
                              Amount Settled: â‚¹{(req.finalAmount || 0).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDispenseModalItem({
                                  id: req.id,
                                  prescriptionId: req.prescriptionId,
                                  billNumber: req.billNumber,
                                  patientName: req.patientName,
                                  patientMrn: req.patientMrn,
                                  nurseName: req.nurseName,
                                  finalAmount: req.finalAmount,
                                  medicines: req.medicines
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                            >
                              <PackageCheck className="size-4" />
                              <span>Dispense Medicines</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Completed Dispensing Audit Log */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">
                      Recent Dispensed Orders History
                    </h3>
                    <p className="text-xs text-[var(--care-muted)]">
                      Medication orders successfully handed over by Billing Staff
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--care-border)] text-[var(--care-muted)] font-bold">
                        <th className="p-3">Order / Bill ID</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Nurse Reference</th>
                        <th className="p-3">Medicines Handed Over</th>
                        <th className="p-3">Dispensed At</th>
                        <th className="p-3">Dispensed By</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {billingRequests
                        .filter((r) => r.status === 'DISPENSED' || r.status === 'COMPLETED')
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-[var(--care-highlight)]/40 transition">
                            <td className="p-3 font-mono font-bold text-emerald-800">{req.billNumber || req.id}</td>
                            <td className="p-3">
                              <div className="font-bold text-[var(--care-ink)]">{req.patientName}</div>
                              <div className="font-mono text-[10px] text-[var(--care-muted)]">{req.patientMrn}</div>
                            </td>
                            <td className="p-3 text-[var(--care-muted)]">{req.nurseName}</td>
                            <td className="p-3">
                              <div className="space-y-0.5 max-w-xs">
                                {req.medicines.map((m, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block mr-1 mb-1 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-800"
                                  >
                                    {m.name} Ã— {m.quantity}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-[var(--care-muted)]">{req.dispensedAt || 'Today'}</td>
                            <td className="p-3 font-semibold text-emerald-900">{req.dispensedBy || currentUser.name}</td>
                            <td className="p-3 text-right">
                              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                                âœ“ DISPENSED
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PAYMENTS & COLLECTIONS RECONCILIATION */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment Method Breakdown Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-4 shadow-sm">
                  <p className="text-[11px] font-bold text-[var(--care-muted)] uppercase">Total Collections</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    â‚¹{payments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--care-muted)]">{payments.length} transactions recorded</p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold text-blue-900 uppercase">UPI / QR Scan</p>
                  <p className="mt-1 text-2xl font-black text-blue-950">
                    â‚¹
                    {payments
                      .filter((p) => p.paymentMethod === 'UPI')
                      .reduce((s, p) => s + (Number(p.amount) || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="mt-1 text-[10px] text-blue-800">
                    {payments.filter((p) => p.paymentMethod === 'UPI').length} UPI payments
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold text-indigo-900 uppercase">Credit / Debit Card</p>
                  <p className="mt-1 text-2xl font-black text-indigo-950">
                    â‚¹
                    {payments
                      .filter((p) => p.paymentMethod === 'Card')
                      .reduce((s, p) => s + (Number(p.amount) || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="mt-1 text-[10px] text-indigo-800">
                    {payments.filter((p) => p.paymentMethod === 'Card').length} Card transactions
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold text-amber-900 uppercase">Cash at Counter</p>
                  <p className="mt-1 text-2xl font-black text-amber-950">
                    â‚¹
                    {payments
                      .filter((p) => p.paymentMethod === 'Cash')
                      .reduce((s, p) => s + (Number(p.amount) || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="mt-1 text-[10px] text-amber-800">
                    {payments.filter((p) => p.paymentMethod === 'Cash').length} Cash receipts
                  </p>
                </div>
              </div>

              {/* Payments History Table */}
              <div className="rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--care-ink)]">Payment History & Audit Trail</h3>
                    <p className="text-xs text-[var(--care-muted)]">Verified transactions and payment gateway receipts</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--care-border)] text-[var(--care-muted)] font-bold">
                        <th className="p-3">Payment ID</th>
                        <th className="p-3">Bill Number</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Transaction Reference</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Confirmed By</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)]">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-[var(--care-highlight)]/40 transition">
                          <td className="p-3 font-mono font-bold text-emerald-800">{pay.id}</td>
                          <td className="p-3 font-mono font-semibold text-slate-700">{pay.billNumber}</td>
                          <td className="p-3 font-bold text-[var(--care-ink)]">{pay.patientName}</td>
                          <td className="p-3 font-mono font-black text-emerald-700 text-sm">â‚¹{pay.amount.toFixed(2)}</td>
                          <td className="p-3">
                            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold text-slate-800">
                              {pay.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">{pay.transactionId}</td>
                          <td className="p-3 text-[var(--care-muted)]">{pay.paymentDateTime}</td>
                          <td className="p-3 text-[var(--care-ink)]">{pay.confirmedBy}</td>
                          <td className="p-3 text-right">
                            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                              PAID
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LEAVE APPLICATION & SHIFTS */}
          {/* ========================================================================= */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-200 bg-linear-to-r from-emerald-900 via-teal-800 to-slate-900 p-6 text-white shadow-lg">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="size-5 text-emerald-300" />
                  Billing Staff Leave Portal & Replacement Coverage
                </h2>
                <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                  Submit time-off requests to Hospital Administration. Only qualified Billing Staff members are eligible to provide shift replacement coverage.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Form */}
                <div className="lg:col-span-1 rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[var(--care-ink)] mb-1 flex items-center gap-2">
                    <PlusCircle className="size-4 text-emerald-600" />
                    Apply for Leave
                  </h3>
                  <p className="text-xs text-[var(--care-muted)] mb-4">
                    Leave can be requested from tomorrow onwards.
                  </p>

                  <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold text-[var(--care-ink)]">Leave Type</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leaveType'])}
                        className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2.5 font-semibold text-[var(--care-ink)] outline-none"
                      >
                        <option value="Annual Leave">Annual Leave / Vacation</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Medical Conference">Medical / Finance Conference</option>
                        <option value="Maternity / Paternity">Maternity / Paternity</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-[var(--care-ink)]">Start Date</label>
                        <input
                          type="date"
                          value={leaveStartDate}
                          min={getTomorrowIsoString()}
                          onChange={(e) => setLeaveStartDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2 text-[var(--care-ink)] outline-none font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[var(--care-ink)]">End Date</label>
                        <input
                          type="date"
                          value={leaveEndDate}
                          min={leaveStartDate || getTomorrowIsoString()}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2 text-[var(--care-ink)] outline-none font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-900 font-bold flex justify-between">
                      <span>Total Duration:</span>
                      <span>{leaveDaysCount} Days</span>
                    </div>

                    <div>
                      <label className="font-bold text-[var(--care-ink)]">Shift Slot</label>
                      <select
                        value={leaveShiftSlot}
                        onChange={(e) => setLeaveShiftSlot(e.target.value as LeaveRequest['shiftSlot'])}
                        className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2.5 text-[var(--care-ink)] outline-none font-semibold"
                      >
                        <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                        <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                        <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                        <option value="Full Day (All Shifts)">Full Day (All Shifts)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[var(--care-ink)]">
                        Replacement Billing Staff Candidate
                      </label>
                      <select
                        value={selectedReplacementStaffId}
                        onChange={(e) => setSelectedReplacementStaffId(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2.5 text-[var(--care-ink)] outline-none font-semibold"
                      >
                        <option value="">-- Select Backup Billing Staff --</option>
                        {eligibleReplacements.map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.name} ({cand.roleLabel} - {cand.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[var(--care-ink)]">Reason for Leave</label>
                      <textarea
                        rows={2}
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="State purpose of leave request..."
                        className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2.5 text-[var(--care-ink)] outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      Submit Leave Request
                    </button>
                  </form>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-[var(--care-ink)] flex items-center gap-2">
                    <History className="size-4 text-emerald-600" />
                    Billing Staff Leave History
                  </h3>

                  <div className="space-y-3">
                    {leaveRequests
                      .filter((l) => l.staffRole === 'Billing Staff' || l.staffId === currentUser.id)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)]/60 p-4 text-xs space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-sm text-[var(--care-ink)]">{l.leaveType}</span>
                              <p className="text-[11px] text-[var(--care-muted)]">
                                {l.startDate} to {l.endDate} ({l.shiftSlot})
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                l.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : l.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {l.status}
                            </span>
                          </div>

                          <p className="text-[var(--care-muted)] italic">"{l.reason}"</p>

                          {l.replacementStaffName && (
                            <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                              Replacement: {l.replacementStaffName}
                            </div>
                          )}
                          {l.adminNotes && (
                            <div className="text-[11px] text-slate-700 bg-slate-100 p-2 rounded-xl">
                              Admin Notes: {l.adminNotes}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS AND DIALOGS */}
      {/* ========================================================================= */}

      {/* MODAL 1: CREATE BILL SCREEN */}
      {createBillModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
              <div>
                <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Create New Bill
                </span>
                <h3 className="mt-1 text-lg font-bold text-[var(--care-ink)]">
                  Generate Bill for {createBillModalRequest.patientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateBillModalRequest(null)}
                className="p-1 rounded-lg text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Patient & Nurse Information Card */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[var(--care-muted)] block text-[10px] font-bold uppercase">Patient Name</span>
                <span className="font-bold text-[var(--care-ink)]">{createBillModalRequest.patientName}</span>
              </div>
              <div>
                <span className="text-[var(--care-muted)] block text-[10px] font-bold uppercase">Patient ID / MRN</span>
                <span className="font-mono font-bold text-slate-700">{createBillModalRequest.patientMrn}</span>
              </div>
              <div>
                <span className="text-[var(--care-muted)] block text-[10px] font-bold uppercase">Prescribing Nurse</span>
                <span className="font-bold text-[var(--care-ink)]">{createBillModalRequest.nurseName}</span>
              </div>
              <div>
                <span className="text-[var(--care-muted)] block text-[10px] font-bold uppercase">Prescription ID</span>
                <span className="font-mono font-bold text-emerald-700">{createBillModalRequest.prescriptionId}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmCreateBill} className="space-y-4 text-xs">
              {/* Medicines Pricing Table */}
              <div>
                <label className="font-bold text-[var(--care-ink)] text-xs mb-2 block">
                  Medicine Details & Pricing Calculation:
                </label>
                <div className="overflow-hidden rounded-2xl border border-[var(--care-border)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[var(--care-muted)] font-bold border-b border-[var(--care-border)]">
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5 w-24">Quantity</th>
                        <th className="p-2.5 w-28">Unit Price (â‚¹)</th>
                        <th className="p-2.5 text-right w-24">Total (â‚¹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--care-border)] bg-white">
                      {editableMedicines.map((med, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-[var(--care-ink)]">{med.name}</td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="1"
                              value={med.quantity}
                              onChange={(e) => handleUpdateMedicinePriceOrQty(idx, 'quantity', parseInt(e.target.value, 10))}
                              className="w-full rounded-lg border border-[var(--care-border)] p-1 text-center font-bold"
                              required
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={med.unitPrice}
                              onChange={(e) => handleUpdateMedicinePriceOrQty(idx, 'unitPrice', parseFloat(e.target.value))}
                              className="w-full rounded-lg border border-[var(--care-border)] p-1 text-center font-bold"
                              required
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            â‚¹{med.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjustments: Discount, Tax & Totals */}
              <div className="rounded-2xl border border-[var(--care-border)] bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[var(--care-ink)]">Discount Amount (â‚¹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-white p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--care-ink)]">Tax Percent (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-[var(--care-border)] bg-white p-2 font-bold"
                    />
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">â‚¹{calculatedBillTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {calculatedBillTotals.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono">-â‚¹{calculatedBillTotals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {calculatedBillTotals.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({taxPercent}%):</span>
                      <span className="font-mono">+â‚¹{calculatedBillTotals.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-emerald-950 pt-2 border-t border-slate-300">
                    <span>Final Calculated Amount:</span>
                    <span className="font-mono text-xl text-emerald-700">
                      â‚¹{calculatedBillTotals.finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share immediately checkbox */}
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <input
                  type="checkbox"
                  id="shareCheck"
                  checked={shareImmediately}
                  onChange={(e) => setShareImmediately(e.target.checked)}
                  className="size-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="shareCheck" className="text-xs font-bold text-emerald-950 cursor-pointer">
                  Share Bill with Patient portal immediately upon generation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--care-border)]">
                <button
                  type="button"
                  onClick={() => setCreateBillModalRequest(null)}
                  className="rounded-xl border border-[var(--care-border)] px-4 py-2.5 font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Generate & Save Bill (â‚¹{calculatedBillTotals.finalAmount.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM PAYMENT DIALOG (EXACT WORKFLOW) */}
      {confirmPaymentModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <h3 className="text-base font-bold text-[var(--care-ink)] flex items-center gap-2">
                <HandCoins className="size-5 text-emerald-600" />
                Confirm Payment
              </h3>
              <button
                type="button"
                onClick={() => setConfirmPaymentModalBill(null)}
                className="p-1 rounded-lg text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Exact Confirmation Card Display */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-emerald-200/60 pb-2">
                <span className="text-[var(--care-muted)] font-semibold">Bill:</span>
                <span className="font-mono font-bold text-emerald-900">{confirmPaymentModalBill.billNumber}</span>
              </div>

              <div className="flex justify-between border-b border-emerald-200/60 pb-2">
                <span className="text-[var(--care-muted)] font-semibold">Patient:</span>
                <span className="font-bold text-[var(--care-ink)]">{confirmPaymentModalBill.patientName}</span>
              </div>

              <div className="flex justify-between border-b border-emerald-200/60 pb-2">
                <span className="text-[var(--care-muted)] font-semibold">Amount:</span>
                <span className="font-mono font-black text-lg text-emerald-700">
                  â‚¹{confirmPaymentModalBill.finalAmount.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-[var(--care-muted)] font-semibold block mb-1">Payment Method:</label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as PaymentMethodType)}
                  className="w-full rounded-xl border border-emerald-300 bg-white p-2 font-bold text-emerald-950 outline-none"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm / QR)</option>
                  <option value="Cash">Cash (Hospital Billing Counter)</option>
                  <option value="Card">Card (POS Terminal / Credit / Debit)</option>
                  <option value="Other">Other / Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--care-muted)] font-semibold block mb-1">Transaction / Reference ID:</label>
                <input
                  type="text"
                  value={transactionRefInput}
                  onChange={(e) => setTransactionRefInput(e.target.value)}
                  placeholder="e.g. UPI-99824012@okaxis or POS-TXN-884"
                  className="w-full rounded-xl border border-emerald-300 bg-white p-2 font-mono text-xs font-semibold"
                />
              </div>
            </div>

            <p className="text-xs text-center font-semibold text-slate-700">
              Are you sure you want to confirm this payment?
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--care-border)]">
              <button
                type="button"
                onClick={() => setConfirmPaymentModalBill(null)}
                className="flex-1 rounded-xl border border-[var(--care-border)] py-2.5 text-xs font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessConfirmPayment}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW / PRINT ITEMIZED INVOICE */}
      {viewBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header & Print Actions */}
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">Hospital Clinical Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--care-border)] px-3 py-1 text-xs font-bold text-[var(--care-ink)] hover:bg-[var(--care-highlight)]"
                >
                  <Printer className="size-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewBillModal(null)}
                  className="p-1 rounded-lg text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Invoice Document Body */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                      <Activity className="size-4" />
                    </span>
                    <span className="text-base font-black text-slate-900">CareLink Hospital</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Hospital Operations & Clinical Dispensary</p>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-sm text-emerald-800">{viewBillModal.billNumber}</div>
                  <div className="text-[11px] text-slate-500">{viewBillModal.createdAt}</div>
                </div>
              </div>

              {/* Patient & Provider details */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Billed To (Patient)</p>
                  <p className="font-bold text-slate-900 text-xs">{viewBillModal.patientName}</p>
                  <p className="font-mono text-slate-500">{viewBillModal.patientMrn}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Prescribing Nurse / Doctor</p>
                  <p className="font-bold text-slate-900 text-xs">{viewBillModal.nurseName}</p>
                  <p className="font-mono text-slate-500">Rx: {viewBillModal.prescriptionId}</p>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {viewBillModal.medicines.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-900">{m.name}</td>
                        <td className="p-2 text-center">{m.quantity}</td>
                        <td className="p-2 text-right font-mono">â‚¹{m.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono font-bold">â‚¹{m.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-right">
                <div className="text-slate-600">Subtotal: â‚¹{viewBillModal.subtotal.toFixed(2)}</div>
                {viewBillModal.discount > 0 && (
                  <div className="text-emerald-700">Discount: -â‚¹{viewBillModal.discount.toFixed(2)}</div>
                )}
                {viewBillModal.tax > 0 && <div className="text-slate-600">Tax: +â‚¹{viewBillModal.tax.toFixed(2)}</div>}
                <div className="text-base font-black text-slate-950 pt-1 border-t border-slate-200">
                  Total Payable: â‚¹{viewBillModal.finalAmount.toFixed(2)}
                </div>
              </div>

              {/* Payment Receipt Stamp */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Payment Status</span>
                  <p className="font-bold text-emerald-800">{viewBillModal.paymentStatus}</p>
                  {viewBillModal.paymentMethod && (
                    <p className="text-[11px] text-slate-500">Method: {viewBillModal.paymentMethod}</p>
                  )}
                </div>
                {viewBillModal.paymentStatus === 'PAID' && (
                  <div className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 font-bold text-emerald-900 text-xs">
                    âœ“ PAID & CLEARED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW REQUEST DETAILS */}
      {viewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <h3 className="text-base font-bold text-[var(--care-ink)]">
                Billing Request: {viewRequestModal.id}
              </h3>
              <button
                type="button"
                onClick={() => setViewRequestModal(null)}
                className="p-1 rounded-lg text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                <div>
                  <span className="text-[var(--care-muted)] font-bold">Patient:</span>
                  <p className="font-bold text-[var(--care-ink)]">{viewRequestModal.patientName}</p>
                  <p className="font-mono text-[11px] text-[var(--care-muted)]">{viewRequestModal.patientMrn}</p>
                </div>
                <div>
                  <span className="text-[var(--care-muted)] font-bold">Nurse:</span>
                  <p className="font-bold text-[var(--care-ink)]">{viewRequestModal.nurseName}</p>
                  <p className="text-[11px] text-[var(--care-muted)]">Rx: {viewRequestModal.prescriptionId}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-[var(--care-ink)] block mb-1">Medicines:</span>
                <div className="space-y-1 rounded-xl border border-[var(--care-border)] p-2.5">
                  {viewRequestModal.medicines.map((m, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      <span className="font-mono text-emerald-800 font-bold">Qty: {m.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {viewRequestModal.notes && (
                <div>
                  <span className="font-bold text-[var(--care-ink)]">Nurse Notes:</span>
                  <p className="mt-0.5 text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                    "{viewRequestModal.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[var(--care-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setViewRequestModal(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW PATIENT PROFILE */}
      {viewPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <div className="flex items-center gap-2">
                <User className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">Patient Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewPatientModal(null)}
                className="p-1 rounded-lg text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-200 space-y-1.5">
                <h4 className="text-base font-bold text-emerald-950">{viewPatientModal.name}</h4>
                <p className="font-mono text-emerald-800 font-bold">MRN: {viewPatientModal.mrn}</p>
                <div className="flex items-center gap-3 text-[11px] text-emerald-900 pt-1">
                  <span>Age: {viewPatientModal.age}</span>
                  <span>Gender: {viewPatientModal.gender}</span>
                  <span>Dept: {viewPatientModal.department}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[var(--care-muted)] uppercase text-[10px]">Registered Symptoms</span>
                <p className="mt-0.5 font-semibold text-slate-800">{viewPatientModal.symptoms}</p>
              </div>

              {viewPatientModal.notes && (
                <div>
                  <span className="font-bold text-[var(--care-muted)] uppercase text-[10px]">Clinical Notes</span>
                  <p className="mt-0.5 text-slate-600">{viewPatientModal.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[var(--care-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setViewPatientModal(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DISPENSE MEDICINES MODAL (BILLING STAFF) */}
      {dispenseModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-[var(--care-surface)] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[var(--care-ink)]">Medication Dispensing Handover</h3>
              </div>
              <button
                type="button"
                onClick={() => setDispenseModalItem(null)}
                className="p-1 rounded-lg text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispenseMedicines} className="space-y-4 text-xs">
              {/* Order Banner */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {dispenseModalItem.billNumber || dispenseModalItem.id}
                    </span>
                    <h4 className="mt-1 text-base font-bold text-emerald-950">{dispenseModalItem.patientName}</h4>
                    <p className="text-xs text-emerald-800">
                      MRN: <span className="font-mono">{dispenseModalItem.patientMrn}</span> Â· Rx: {dispenseModalItem.prescriptionId}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black">
                    PAID & CLEARED
                  </span>
                </div>
              </div>

              {/* Verified Medicine List */}
              <div>
                <label className="font-bold text-[var(--care-ink)] block mb-1.5">
                  Confirm Medicines & Quantities for Handover:
                </label>
                <div className="rounded-2xl border border-[var(--care-border)] overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-[var(--care-border)]">
                      <tr>
                        <th className="px-3 py-2">Medicine</th>
                        <th className="px-3 py-2 text-right">Quantity to Hand Over</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispenseModalItem.medicines.map((m, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-bold text-slate-900">
                            {m.name} {m.dosage ? `(${m.dosage})` : ''}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                            {m.quantity} Units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dispensing Counter */}
              <div>
                <label className="font-bold text-[var(--care-ink)] block mb-1">
                  Handover Counter / Location:
                </label>
                <select
                  value={dispenseCounter}
                  onChange={(e) => setDispenseCounter(e.target.value)}
                  className="w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2.5 font-semibold text-[var(--care-ink)] outline-none"
                >
                  <option value="Billing & Dispensary Desk #1 (Main OPD)">Billing & Dispensary Desk #1 (Main OPD)</option>
                  <option value="Billing & Dispensary Desk #2 (Emergency / IPD)">Billing & Dispensary Desk #2 (Emergency / IPD)</option>
                  <option value="Pharmacy Counter #1 (Main Block)">Pharmacy Counter #1 (Main Block)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--care-ink)] block mb-1">
                  Dispensing Staff Notes (Optional):
                </label>
                <input
                  type="text"
                  value={dispenseStaffNotes}
                  onChange={(e) => setDispenseStaffNotes(e.target.value)}
                  placeholder="e.g. Handed over directly to patient with dosage schedule slip"
                  className="w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] p-2.5 text-[var(--care-ink)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--care-border)]">
                <button
                  type="button"
                  onClick={() => setDispenseModalItem(null)}
                  className="rounded-xl border border-[var(--care-border)] px-4 py-2 font-bold text-[var(--care-muted)] hover:bg-[var(--care-highlight)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Confirm & Complete Dispense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: BillingRequestStatus }) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase animate-pulse">
          Pending Billing
        </span>
      )
    case 'BILL_CREATED':
      return (
        <span className="rounded-full bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
          Bill Created
        </span>
      )
    case 'PAYMENT_PENDING':
      return (
        <span className="rounded-full bg-orange-100 text-orange-900 border border-orange-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
          Payment Pending
        </span>
      )
    case 'PAID':
      return (
        <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
          Paid
        </span>
      )
    case 'READY_FOR_DISPENSING':
      return (
        <span className="rounded-full bg-teal-100 text-teal-900 border border-teal-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
          Ready for Dispense
        </span>
      )
    case 'DISPENSED':
    case 'COMPLETED':
      return (
        <span className="rounded-full bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
          {status}
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="rounded-full bg-red-100 text-red-900 border border-red-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
          Cancelled
        </span>
      )
    default:
      return (
        <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold">
          {status}
        </span>
      )
  }
}

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}
