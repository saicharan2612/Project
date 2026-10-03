export interface DemoAccount {
  id: string
  roleSlug: string
  roleLabel: string
  name: string
  title: string
  department: string
  specialization?: string
  email: string
  password: string
  badge: string
  badgeColor: string
  avatarInitials: string
  summary: string
  permissions: string[]
  stats: { label: string; value: string; change?: string; tone?: 'positive' | 'warning' | 'neutral' }[]
  recentActivities: { title: string; subtitle: string; time: string; status: string; statusColor: string }[]
  quickActions: { label: string; description: string }[]
  createdAt?: string
  isCustom?: boolean
}

export interface PatientRecord {
  id: string
  mrn: string
  name: string
  dob?: string
  age: number
  gender: 'Female' | 'Male' | 'Other'
  phone?: string
  email?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bloodGroup?: string
  allergies?: string
  registrationType?: 'NORMAL' | 'EMERGENCY'
  registrationDate?: string
  registeredTime: string
  status: 'registered' | 'waiting' | 'diagnosing' | 'completed' | 'transferred' | 'cancelled'
  department: string
  requiredSpecialization?: string
  assignedDoctor: string
  assignedDoctorId?: string
  assignedNurse?: string
  assignedNurseId?: string
  queueNumber?: string
  symptoms: string
  triagePriority: 'Normal' | 'Urgent' | 'STAT'
  emergencyReason?: string
  completedTime?: string
  notes?: string
}

export type QueuePriorityType = 'NORMAL' | 'URGENT' | 'EMERGENCY'
export type QueueStatusType = 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'TRANSFERRED' | 'CANCELLED'

export interface QueueEntry {
  id: string
  queueNumber: string
  patientId: string
  patientName: string
  patientMrn: string
  doctorId: string
  doctorName: string
  specialization: string
  nurseId?: string
  nurseName?: string
  priority: QueuePriorityType
  status: QueueStatusType
  registeredAt: string
  assignedAt: string
  waitingTimeMinutes?: number
  calledAt?: string
  completedAt?: string
  transferredToDoctorId?: string
  transferredToDoctorName?: string
  notes?: string
}

export interface QueueTransferRecord {
  id: string
  patientId: string
  patientName: string
  patientMrn: string
  originalDoctorId: string
  originalDoctorName: string
  originalSpecialization: string
  newDoctorId: string
  newDoctorName: string
  newSpecialization: string
  originalQueueNumber: string
  newQueueNumber: string
  reason: string
  transferType: 'FULL_QUEUE_REDIRECT' | 'SELECTED_PATIENT_REDIRECT' | 'EMERGENCY_REALLOCATION'
  transferredBy: string
  transferredAt: string
  notes?: string
}

export interface HospitalDoctor {
  id: string
  name: string
  title: string
  department: string
  specialization: string
  email: string
  phone: string
  roomNumber: string
  status: 'AVAILABLE' | 'BUSY' | 'IN_CONSULTATION' | 'EMERGENCY' | 'OFFLINE' | 'ON_LEAVE'
  currentQueueCount: number
  avatarInitials: string
}

export interface HospitalNurse {
  id: string
  name: string
  title: string
  department: string
  ward: string
  shift: string
  status: 'Available' | 'Assisting' | 'On Break' | 'Off Duty'
  currentAssignedCount: number
  avatarInitials: string
}

export const HOSPITAL_SPECIALIZATIONS = [
  'Cardiology',
  'Internal Medicine',
  'General Medicine',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'Dermatology',
  'Emergency Medicine',
  'ENT',
  'Gynecology'
] as const

export interface LeaveRequest {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  department: string
  leaveType: 'Sick Leave' | 'Annual Leave' | 'Emergency Leave' | 'Medical Conference' | 'Maternity / Paternity'
  startDate: string
  endDate: string
  shiftSlot: 'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)' | 'Full Day (All Shifts)'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  replacementStaffId?: string
  replacementStaffName?: string
  adminNotes?: string
  submittedAt: string
}

export interface StaffShiftAssignment {
  id: string
  staffId: string
  staffName: string
  roleLabel: string
  department: string
  shiftSlot: 'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)'
  dutyStatus: 'On Duty' | 'Absent' | 'On Leave' | 'Standby'
  replacementStaffId?: string
  replacementStaffName?: string
  coverageNotes?: string
}

export type BillingRequestStatus =
  | 'PENDING'
  | 'BILL_CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'READY_FOR_DISPENSING'
  | 'DISPENSED'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentMethodType = 'Cash' | 'UPI' | 'Card' | 'Other'
export type PaymentStatusType = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED'

export interface BillingRequestMedicine {
  name: string
  dosage?: string
  form?: string
  quantity: number
  unitPrice?: number
  total?: number
}

export interface BillingRequest {
  id: string
  patientId: string
  patientName: string
  patientMrn: string
  patientContact?: string
  nurseId: string
  nurseName: string
  prescriptionId: string
  visitId?: string
  medicines: BillingRequestMedicine[]
  notes?: string
  requestDateTime: string
  status: BillingRequestStatus
  billId?: string
  billNumber?: string
  finalAmount?: number
  dispensedAt?: string
  dispensedBy?: string
  dispenseNotes?: string
}

export interface BillMedicineDetail {
  name: string
  dosage?: string
  quantity: number
  unitPrice: number
  total: number
}

export interface BillRecord {
  id: string
  billNumber: string
  requestId?: string
  prescriptionId: string
  patientId: string
  patientName: string
  patientMrn: string
  patientContact?: string
  nurseId: string
  nurseName: string
  medicines: BillMedicineDetail[]
  subtotal: number
  discount: number
  tax: number
  finalAmount: number
  status: BillingRequestStatus
  paymentStatus: PaymentStatusType
  paymentMethod?: PaymentMethodType
  transactionId?: string
  paymentDate?: string
  paymentConfirmedBy?: string
  sharedWithPatient: boolean
  createdById: string
  createdByName: string
  createdAt: string
  paidAt?: string
  notes?: string
}

export interface PaymentRecord {
  id: string
  billId: string
  billNumber: string
  patientId: string
  patientName: string
  patientMrn?: string
  amount: number
  paymentMethod: PaymentMethodType
  transactionId: string
  paymentDateTime: string
  paymentStatus: PaymentStatusType
  confirmedBy: string
  notes?: string
}

export interface HospitalNotification {
  id: string
  toRole?: string
  toUserId?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'payment' | 'dispense'
  link?: string
  read: boolean
  createdAt: string
}

export interface BillingRecord {
  id: string
  invoiceNumber: string
  patientName: string
  mrn: string
  serviceCategory: 'Inpatient Ward' | 'Cardiology Consultation' | 'Diagnostic Labs & Pathology' | 'Emergency Care' | 'Pharmacy & Medicines' | 'Surgical Procedure'
  totalAmount: number
  paidAmount: number
  balanceDue: number
  paymentStatus: 'Paid' | 'Partial' | 'Pending Insurance' | 'Overdue'
  paymentMethod: 'Insurance (BlueCross)' | 'Insurance (Aetna)' | 'Insurance (Medicare)' | 'Credit Card' | 'Cash / POS' | 'Bank Transfer (ACH)'
  date: string
  invoiceTime: string
  providerName?: string
  providerRole?: string
  items?: { description: string; amount: number }[]
  status?: 'pending' | 'paid'
  createdAt?: string
  paidAt?: string
}

export interface AppointmentRequest {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  mrn?: string
  doctorId: string
  doctorName: string
  department: string
  requestedDate: string
  requestedTime: string
  visitType: 'Follow-up' | 'New Consultation' | 'Telehealth' | 'Post-op Review'
  reason: string
  status: 'pending' | 'approved' | 'rescheduled' | 'cancelled' | 'rejected'
  rescheduledDate?: string
  rescheduledTime?: string
  doctorNote?: string
  submittedAt: string
}

export const APPOINTMENT_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM'
] as const

export interface MedicineInventory {
  id: string
  sku: string
  name: string
  genericName: string
  category: 'Antibiotics' | 'Cardiovascular' | 'Diabetes & Endocrine' | 'Pain Relief & Analgesics' | 'Respiratory' | 'Inpatient Injectables' | 'Emergency Medicine'
  unitsSoldToday: number
  currentStock: number
  reorderThreshold: number
  unitPrice: number
  unitType: 'Capsules' | 'Tablets' | 'Vials' | 'Inhalers' | 'Bottles'
  stockStatus: 'Optimal' | 'Moderate' | 'Low Stock' | 'Critical'
  expiryDate: string
  batchNumber: string
}

// All accounts are now stored in Supabase (carelink_staff_profiles table).
// This array is intentionally empty Ã¢â‚¬â€ kept for type compatibility only.
export const DEMO_ACCOUNTS: DemoAccount[] = []


// Safe placeholder used as useState initial value in dashboards before localStorage loads
export const EMPTY_ACCOUNT: DemoAccount = {
  id: ``,
  roleSlug: ``,
  roleLabel: ``,
  name: ``,
  title: ``,
  department: ``,
  email: ``,
  password: ``,
  badge: ``,
  badgeColor: ``,
  avatarInitials: ``,
  summary: ``,
  permissions: [],
  stats: [],
  recentActivities: [],
  quickActions: [],
}
export const ROLE_DEFINITIONS = [
  { slug: 'doctor', label: 'Doctor', icon: 'stethoscope', badge: 'Clinical Provider', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { slug: 'nurse', label: 'Nurse', icon: 'heart-pulse', badge: 'Bedside Care & Vitals', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { slug: 'medical-staff', label: 'Medicine Staff', icon: 'flask-conical', badge: 'Medicine & Diagnostics', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { slug: 'billing', label: 'Billing Staff', icon: 'receipt', badge: 'Revenue Cycle & Claims', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { slug: 'receptionist', label: 'Receptionist', icon: 'calendar-check', badge: 'Admissions & Front Desk', color: 'bg-amber-100 text-amber-800 border-amber-200' },
]

export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'pt-101',
    mrn: 'MRN-84920',
    name: 'Amara Okafor',
    age: 34,
    gender: 'Female',
    registeredTime: '08:15 AM',
    status: 'diagnosing',
    department: 'Cardiology',
    assignedDoctor: 'Dr. Alexander Wright',
    symptoms: 'Palpitations & mild chest tightness',
    triagePriority: 'Urgent',
    notes: 'ECG in progress. Vitals stable.'
  },
  {
    id: 'pt-102',
    mrn: 'MRN-84921',
    name: 'Robert Miller',
    age: 58,
    gender: 'Male',
    registeredTime: '08:30 AM',
    status: 'waiting',
    department: 'Internal Medicine',
    assignedDoctor: 'Dr. Alexander Wright',
    symptoms: 'Routine diabetes check-up & fasting bloodwork',
    triagePriority: 'Normal'
  },
  {
    id: 'pt-103',
    mrn: 'MRN-84922',
    name: 'Sophia Patel',
    age: 27,
    gender: 'Female',
    registeredTime: '08:45 AM',
    status: 'diagnosing',
    department: 'Medicine Diagnostics',
    assignedDoctor: 'Dr. Alexander Wright',
    symptoms: 'Allergic reaction & skin rash',
    triagePriority: 'Normal',
    notes: 'Antihistamine administered.'
  },
  {
    id: 'pt-104',
    mrn: 'MRN-84923',
    name: 'David Gomez',
    age: 45,
    gender: 'Male',
    registeredTime: '07:30 AM',
    status: 'completed',
    department: 'Cardiology',
    assignedDoctor: 'Dr. Alexander Wright',
    symptoms: 'Post-operative follow up',
    triagePriority: 'Normal',
    completedTime: '09:15 AM',
    notes: 'Discharged with prescription refill.'
  },
  {
    id: 'pt-105',
    mrn: 'MRN-84924',
    name: 'Emma Watson-Lee',
    age: 62,
    gender: 'Female',
    registeredTime: '07:15 AM',
    status: 'completed',
    department: 'General Medicine',
    assignedDoctor: 'Dr. Alexander Wright',
    symptoms: 'Hypertension evaluation',
    triagePriority: 'Normal',
    completedTime: '08:50 AM',
    notes: 'Treatment plan adjusted.'
  },
  {
    id: 'pt-106',
    mrn: 'MRN-84925',
    name: 'Liam Zhang',
    age: 19,
    gender: 'Male',
    registeredTime: '09:10 AM',
    status: 'registered',
    department: 'Emergency & Triage',
    assignedDoctor: 'Awaiting Assignment',
    symptoms: 'Ankle sprain after soccer match',
    triagePriority: 'Normal'
  },
  {
    id: 'pt-107',
    mrn: 'MRN-84926',
    name: 'Clara Johansson',
    age: 41,
    gender: 'Female',
    registeredTime: '09:25 AM',
    status: 'waiting',
    department: 'Medicine Diagnostics',
    assignedDoctor: 'Marcus Vance, MLS',
    symptoms: 'Thyroid panel & hormone profile review',
    triagePriority: 'Normal'
  },
  {
    id: 'pt-108',
    mrn: 'MRN-84927',
    name: 'Julian Vance',
    age: 50,
    gender: 'Male',
    registeredTime: '06:50 AM',
    status: 'completed',
    department: 'Inpatient Ward 4B',
    assignedDoctor: 'Elena Rostova, RN',
    symptoms: 'Overnight vitals observation',
    triagePriority: 'Normal',
    completedTime: '08:10 AM',
    notes: 'Cleared for home discharge.'
  }
]

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    staffId: 'demo-nurse',
    staffName: 'Elena Rostova, RN',
    staffRole: 'Nurse',
    department: 'Inpatient Medical/Surgical Ward 4B',
    leaveType: 'Sick Leave',
    startDate: 'Tomorrow',
    endDate: 'Day After Tomorrow',
    shiftSlot: 'Morning (08:00 - 16:00)',
    reason: 'Acute respiratory flu; doctor advised 48hr isolation',
    status: 'pending',
    submittedAt: 'Today at 07:45 AM'
  },
  {
    id: 'leave-2',
    staffId: 'demo-medical-staff',
    staffName: 'Marcus Vance, MLS',
    staffRole: 'Medicine Staff',
    department: 'Central Medicine & Pathology',
    leaveType: 'Medical Conference',
    startDate: 'Next Monday',
    endDate: 'Next Wednesday',
    shiftSlot: 'Full Day (All Shifts)',
    reason: 'Presenting laboratory automation research at National Pathology Symposium',
    status: 'approved',
    replacementStaffId: 'staff-demo-backup-lab',
    replacementStaffName: 'Rachel Green, MLS (Backup Medicine Staff)',
    adminNotes: 'Coverage confirmed for automated analyzer queues.',
    submittedAt: 'Yesterday at 03:20 PM'
  },
  {
    id: 'leave-3',
    staffId: 'demo-billing',
    staffName: 'Patricia Hayes, CPC',
    staffRole: 'Billing Staff',
    department: 'Patient Financial Services',
    leaveType: 'Annual Leave',
    startDate: 'Oct 12',
    endDate: 'Oct 16',
    shiftSlot: 'Morning (08:00 - 16:00)',
    reason: 'Scheduled annual family vacation',
    status: 'pending',
    submittedAt: 'Yesterday at 11:00 AM'
  }
]

export const INITIAL_SHIFT_ROSTER: StaffShiftAssignment[] = [
  {
    id: 'shift-1',
    staffId: 'demo-doctor',
    staffName: 'Dr. Alexander Wright, MD',
    roleLabel: 'Doctor',
    department: 'Cardiology',
    shiftSlot: 'Morning (08:00 - 16:00)',
    dutyStatus: 'On Duty'
  },
  {
    id: 'shift-2',
    staffId: 'demo-nurse',
    staffName: 'Elena Rostova, RN',
    roleLabel: 'Nurse',
    department: 'Ward 4B',
    shiftSlot: 'Morning (08:00 - 16:00)',
    dutyStatus: 'Absent',
    replacementStaffId: 'rep-nurse-1',
    replacementStaffName: 'Nurse Samantha Cole, RN',
    coverageNotes: 'Covering Morning ICU & Inpatient Vitals slot'
  },
  {
    id: 'shift-3',
    staffId: 'demo-medical-staff',
    staffName: 'Marcus Vance, MLS',
    roleLabel: 'Medicine Staff',
    department: 'Central Medicine Diagnostics',
    shiftSlot: 'Morning (08:00 - 16:00)',
    dutyStatus: 'On Duty'
  },
  {
    id: 'shift-4',
    staffId: 'demo-billing',
    staffName: 'Patricia Hayes, CPC',
    roleLabel: 'Billing Staff',
    department: 'Revenue & Claims',
    shiftSlot: 'Morning (08:00 - 16:00)',
    dutyStatus: 'On Duty'
  },
  {
    id: 'shift-5',
    staffId: 'demo-receptionist',
    staffName: 'David Chen',
    roleLabel: 'Receptionist',
    department: 'Central Admissions',
    shiftSlot: 'Morning (08:00 - 16:00)',
    dutyStatus: 'On Duty'
  }
]

export const INITIAL_BILLINGS: BillingRecord[] = [
  {
    id: 'bill-1',
    invoiceNumber: 'INV-2026-9041',
    patientName: 'Amara Okafor',
    mrn: 'MRN-84920',
    serviceCategory: 'Cardiology Consultation',
    totalAmount: 1850.00,
    paidAmount: 1850.00,
    balanceDue: 0.00,
    paymentStatus: 'Paid',
    paymentMethod: 'Insurance (BlueCross)',
    date: 'Today',
    invoiceTime: '09:30 AM'
  },
  {
    id: 'bill-2',
    invoiceNumber: 'INV-2026-9042',
    patientName: 'David Gomez',
    mrn: 'MRN-84923',
    serviceCategory: 'Inpatient Ward',
    totalAmount: 4200.00,
    paidAmount: 3800.00,
    balanceDue: 400.00,
    paymentStatus: 'Partial',
    paymentMethod: 'Insurance (Aetna)',
    date: 'Today',
    invoiceTime: '08:45 AM'
  },
  {
    id: 'bill-3',
    invoiceNumber: 'INV-2026-9043',
    patientName: 'Robert Miller',
    mrn: 'MRN-84921',
    serviceCategory: 'Pharmacy & Medicines',
    totalAmount: 340.00,
    paidAmount: 340.00,
    balanceDue: 0.00,
    paymentStatus: 'Paid',
    paymentMethod: 'Credit Card',
    date: 'Today',
    invoiceTime: '08:55 AM'
  },
  {
    id: 'bill-4',
    invoiceNumber: 'INV-2026-9044',
    patientName: 'Sophia Patel',
    mrn: 'MRN-84922',
    serviceCategory: 'Diagnostic Labs & Pathology',
    totalAmount: 920.00,
    paidAmount: 0.00,
    balanceDue: 920.00,
    paymentStatus: 'Pending Insurance',
    paymentMethod: 'Insurance (Medicare)',
    date: 'Today',
    invoiceTime: '09:10 AM'
  },
  {
    id: 'bill-5',
    invoiceNumber: 'INV-2026-9045',
    patientName: 'Emma Watson-Lee',
    mrn: 'MRN-84924',
    serviceCategory: 'Cardiology Consultation',
    totalAmount: 680.00,
    paidAmount: 680.00,
    balanceDue: 0.00,
    paymentStatus: 'Paid',
    paymentMethod: 'Credit Card',
    date: 'Today',
    invoiceTime: '07:45 AM'
  },
  {
    id: 'bill-6',
    invoiceNumber: 'INV-2026-9046',
    patientName: 'Julian Vance',
    mrn: 'MRN-84927',
    serviceCategory: 'Emergency Care',
    totalAmount: 2650.00,
    paidAmount: 2650.00,
    balanceDue: 0.00,
    paymentStatus: 'Paid',
    paymentMethod: 'Insurance (BlueCross)',
    date: 'Today',
    invoiceTime: '07:20 AM'
  },
  {
    id: 'bill-7',
    invoiceNumber: 'INV-2026-9047',
    patientName: 'Clara Johansson',
    mrn: 'MRN-84926',
    serviceCategory: 'Diagnostic Labs & Pathology',
    totalAmount: 510.00,
    paidAmount: 255.00,
    balanceDue: 255.00,
    paymentStatus: 'Partial',
    paymentMethod: 'Cash / POS',
    date: 'Today',
    invoiceTime: '09:40 AM'
  }
]

export const INITIAL_BILLING_REQUESTS: BillingRequest[] = [
  {
    id: 'BREQ-2026-0001',
    patientId: 'demo-patient',
    patientName: 'Amara Okafor',
    patientMrn: 'MRN-84920',
    patientContact: 'patient@carelink.health | +91 98450 12345',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    prescriptionId: 'rx-101',
    visitId: 'VISIT-84920',
    medicines: [
      { name: 'Metoprolol Succinate 25mg', dosage: '25mg', form: 'Tablet', quantity: 14, unitPrice: 15.00, total: 210.00 },
      { name: 'Atorvastatin 20mg', dosage: '20mg', form: 'Tablet', quantity: 30, unitPrice: 22.00, total: 660.00 }
    ],
    notes: 'Prescribed post cardiology consult. Please create bill and notify patient for online UPI / card payment.',
    requestDateTime: 'Today at 09:20 AM',
    status: 'PENDING',
    finalAmount: 870.00
  },
  {
    id: 'BREQ-2026-0002',
    patientId: 'pt-104',
    patientName: 'David Gomez',
    patientMrn: 'MRN-84923',
    patientContact: '+91 98765 43210',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    prescriptionId: 'rx-102',
    visitId: 'VISIT-84923',
    medicines: [
      { name: 'Aspirin Cardio 81mg', dosage: '81mg', form: 'Tablet', quantity: 30, unitPrice: 10.00, total: 300.00 }
    ],
    notes: 'Post-op cardiac recovery prescription. Payment settled.',
    requestDateTime: 'Today at 08:50 AM',
    status: 'PAID',
    billId: 'bill-2026-0002',
    billNumber: 'BILL-2026-0002',
    finalAmount: 300.00
  },
  {
    id: 'BREQ-2026-0003',
    patientId: 'pt-102',
    patientName: 'Robert Miller',
    patientMrn: 'MRN-84921',
    patientContact: '+91 91234 56789',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    prescriptionId: 'rx-103',
    visitId: 'VISIT-84921',
    medicines: [
      { name: 'Metformin 850mg', dosage: '850mg', form: 'Tablet', quantity: 60, unitPrice: 14.20, total: 852.00 },
      { name: 'Paracetamol 650mg', dosage: '650mg', form: 'Tablet', quantity: 20, unitPrice: 6.50, total: 130.00 }
    ],
    notes: 'Diabetes maintenance supply. Bill created and shared with patient.',
    requestDateTime: 'Today at 09:40 AM',
    status: 'PAYMENT_PENDING',
    billId: 'bill-2026-0003',
    billNumber: 'BILL-2026-0003',
    finalAmount: 982.00
  },
  {
    id: 'BREQ-2026-0004',
    patientId: 'pt-103',
    patientName: 'Sophia Patel',
    patientMrn: 'MRN-84922',
    patientContact: '+91 99887 76655',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    prescriptionId: 'rx-104',
    visitId: 'VISIT-84922',
    medicines: [
      { name: 'Amoxicillin 500mg', dosage: '500mg', form: 'Capsules', quantity: 20, unitPrice: 12.50, total: 250.00 },
      { name: 'Salbutamol HFA Inhaler', dosage: '100mcg', form: 'Inhaler', quantity: 2, unitPrice: 32.00, total: 64.00 }
    ],
    notes: 'Payment confirmed via UPI. Ready for Nurse to dispense.',
    requestDateTime: 'Today at 07:55 AM',
    status: 'READY_FOR_DISPENSING',
    billId: 'bill-2026-0004',
    billNumber: 'BILL-2026-0004',
    finalAmount: 314.00
  }
]

export const INITIAL_BILLS: BillRecord[] = [
  {
    id: 'bill-2026-0001',
    billNumber: 'BILL-2026-0001',
    requestId: 'BREQ-2026-0000',
    prescriptionId: 'rx-100',
    patientId: 'pt-105',
    patientName: 'Emma Watson-Lee',
    patientMrn: 'MRN-84924',
    patientContact: '+91 98111 22334',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    medicines: [
      { name: 'Lisinopril 10mg', dosage: '10mg', quantity: 30, unitPrice: 18.00, total: 540.00 },
      { name: 'Paracetamol 650mg', dosage: '650mg', quantity: 10, unitPrice: 6.50, total: 65.00 }
    ],
    subtotal: 605.00,
    discount: 25.00,
    tax: 0.00,
    finalAmount: 580.00,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'Card',
    transactionId: 'TXN-CARD-904812',
    paymentDate: 'Today at 08:00 AM',
    paymentConfirmedBy: 'Patricia Hayes, CPC',
    sharedWithPatient: true,
    createdById: 'demo-billing',
    createdByName: 'Patricia Hayes, CPC',
    createdAt: 'Today at 07:45 AM',
    paidAt: 'Today at 08:00 AM',
    notes: 'Dispensing completed at Nurse Station Ward 4B.'
  },
  {
    id: 'bill-2026-0002',
    billNumber: 'BILL-2026-0002',
    requestId: 'BREQ-2026-0002',
    prescriptionId: 'rx-102',
    patientId: 'pt-104',
    patientName: 'David Gomez',
    patientMrn: 'MRN-84923',
    patientContact: '+91 98765 43210',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    medicines: [
      { name: 'Aspirin Cardio 81mg', dosage: '81mg', quantity: 30, unitPrice: 10.00, total: 300.00 }
    ],
    subtotal: 300.00,
    discount: 0.00,
    tax: 0.00,
    finalAmount: 300.00,
    status: 'PAID',
    paymentStatus: 'PAID',
    paymentMethod: 'Card',
    transactionId: 'CARD-TXN-88412',
    paymentDate: 'Today at 09:05 AM',
    paymentConfirmedBy: 'Patricia Hayes, CPC',
    sharedWithPatient: true,
    createdById: 'demo-billing',
    createdByName: 'Patricia Hayes, CPC',
    createdAt: 'Today at 08:55 AM',
    paidAt: 'Today at 09:05 AM',
    notes: 'Payment confirmed. Nurse notified for dispensing.'
  },
  {
    id: 'bill-2026-0003',
    billNumber: 'BILL-2026-0003',
    requestId: 'BREQ-2026-0003',
    prescriptionId: 'rx-103',
    patientId: 'pt-102',
    patientName: 'Robert Miller',
    patientMrn: 'MRN-84921',
    patientContact: '+91 91234 56789',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    medicines: [
      { name: 'Metformin 850mg', dosage: '850mg', quantity: 60, unitPrice: 14.20, total: 852.00 },
      { name: 'Paracetamol 650mg', dosage: '650mg', quantity: 20, unitPrice: 6.50, total: 130.00 }
    ],
    subtotal: 982.00,
    discount: 0.00,
    tax: 0.00,
    finalAmount: 982.00,
    status: 'PAYMENT_PENDING',
    paymentStatus: 'PENDING',
    sharedWithPatient: true,
    createdById: 'demo-billing',
    createdByName: 'Patricia Hayes, CPC',
    createdAt: 'Today at 09:45 AM',
    notes: 'Awaiting patient payment settlement via UPI/Card.'
  },
  {
    id: 'bill-2026-0004',
    billNumber: 'BILL-2026-0004',
    requestId: 'BREQ-2026-0004',
    prescriptionId: 'rx-104',
    patientId: 'pt-103',
    patientName: 'Sophia Patel',
    patientMrn: 'MRN-84922',
    patientContact: '+91 99887 76655',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    medicines: [
      { name: 'Amoxicillin 500mg', dosage: '500mg', quantity: 20, unitPrice: 12.50, total: 250.00 },
      { name: 'Salbutamol HFA Inhaler', dosage: '100mcg', quantity: 2, unitPrice: 32.00, total: 64.00 }
    ],
    subtotal: 314.00,
    discount: 0.00,
    tax: 0.00,
    finalAmount: 314.00,
    status: 'READY_FOR_DISPENSING',
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    transactionId: 'UPI-99824012@okaxis',
    paymentDate: 'Today at 08:15 AM',
    paymentConfirmedBy: 'Patricia Hayes, CPC',
    sharedWithPatient: true,
    createdById: 'demo-billing',
    createdByName: 'Patricia Hayes, CPC',
    createdAt: 'Today at 08:05 AM',
    paidAt: 'Today at 08:15 AM',
    notes: 'Payment confirmed via UPI. Nurse Elena notified to dispense.'
  }
]

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-2026-0001',
    billId: 'bill-2026-0001',
    billNumber: 'BILL-2026-0001',
    patientId: 'pt-105',
    patientName: 'Emma Watson-Lee',
    patientMrn: 'MRN-84924',
    amount: 580.00,
    paymentMethod: 'Card',
    transactionId: 'TXN-CARD-904812',
    paymentDateTime: 'Today at 08:00 AM',
    paymentStatus: 'PAID',
    confirmedBy: 'Patricia Hayes, CPC',
    notes: 'Card POS Swipe Terminal #1'
  },
  {
    id: 'PAY-2026-0002',
    billId: 'bill-2026-0002',
    billNumber: 'BILL-2026-0002',
    patientId: 'pt-104',
    patientName: 'David Gomez',
    patientMrn: 'MRN-84923',
    amount: 300.00,
    paymentMethod: 'Card',
    transactionId: 'CARD-TXN-88412',
    paymentDateTime: 'Today at 09:05 AM',
    paymentStatus: 'PAID',
    confirmedBy: 'Patricia Hayes, CPC',
    notes: 'Online Card Gateway Settlement'
  },
  {
    id: 'PAY-2026-0003',
    billId: 'bill-2026-0004',
    billNumber: 'BILL-2026-0004',
    patientId: 'pt-103',
    patientName: 'Sophia Patel',
    patientMrn: 'MRN-84922',
    amount: 314.00,
    paymentMethod: 'UPI',
    transactionId: 'UPI-99824012@okaxis',
    paymentDateTime: 'Today at 08:15 AM',
    paymentStatus: 'PAID',
    confirmedBy: 'Patricia Hayes, CPC',
    notes: 'Direct UPI App QR Scan'
  }
]

export const INITIAL_NOTIFICATIONS: HospitalNotification[] = [
  {
    id: 'notif-1',
    toRole: 'billing',
    title: 'New Billing Request',
    message: 'Nurse Elena Rostova sent a billing request for patient Amara Okafor (Rx: rx-101).',
    type: 'info',
    read: false,
    createdAt: 'Today at 09:20 AM'
  },
  {
    id: 'notif-2',
    toRole: 'patient',
    toUserId: 'demo-patient',
    title: 'New Bill Generated',
    message: 'A new bill has been generated for your prescription. Bill ID: BILL-2026-0003. Amount payable: Ã¢â€šÂ¹982.00.',
    type: 'payment',
    read: false,
    createdAt: 'Today at 09:45 AM'
  },
  {
    id: 'notif-3',
    toRole: 'nurse',
    title: 'Payment Cleared Ã¢â‚¬â€ Ready for Dispensing',
    message: 'Billing Staff confirmed payment (Ã¢â€šÂ¹314.00) for Sophia Patel (Rx: rx-104). Medicines ready for dispensing!',
    type: 'dispense',
    read: false,
    createdAt: 'Today at 08:15 AM'
  }
]

export const INITIAL_MEDICINES: MedicineInventory[] = [
  {
    id: 'med-1',
    sku: 'MED-AMX-500',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotics',
    unitsSoldToday: 184,
    currentStock: 1450,
    reorderThreshold: 300,
    unitPrice: 12.50,
    unitType: 'Capsules',
    stockStatus: 'Optimal',
    expiryDate: '12/2027',
    batchNumber: 'AMX-9482-A'
  },
  {
    id: 'med-2',
    sku: 'MED-LSN-010',
    name: 'Lisinopril 10mg',
    genericName: 'Lisinopril Dihydrate',
    category: 'Cardiovascular',
    unitsSoldToday: 215,
    currentStock: 920,
    reorderThreshold: 250,
    unitPrice: 18.00,
    unitType: 'Tablets',
    stockStatus: 'Optimal',
    expiryDate: '09/2028',
    batchNumber: 'LSN-4012-B'
  },
  {
    id: 'med-3',
    sku: 'MED-MET-850',
    name: 'Metformin 850mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Diabetes & Endocrine',
    unitsSoldToday: 160,
    currentStock: 80,
    reorderThreshold: 200,
    unitPrice: 14.20,
    unitType: 'Tablets',
    stockStatus: 'Low Stock',
    expiryDate: '05/2027',
    batchNumber: 'MET-8821-C'
  },
  {
    id: 'med-4',
    sku: 'MED-ATV-020',
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    category: 'Cardiovascular',
    unitsSoldToday: 140,
    currentStock: 1100,
    reorderThreshold: 250,
    unitPrice: 22.00,
    unitType: 'Tablets',
    stockStatus: 'Optimal',
    expiryDate: '11/2027',
    batchNumber: 'ATV-3310-A'
  },
  {
    id: 'med-5',
    sku: 'MED-CFT-001',
    name: 'Ceftriaxone 1g IV',
    genericName: 'Ceftriaxone Sodium',
    category: 'Inpatient Injectables',
    unitsSoldToday: 48,
    currentStock: 35,
    reorderThreshold: 100,
    unitPrice: 45.00,
    unitType: 'Vials',
    stockStatus: 'Critical',
    expiryDate: '03/2027',
    batchNumber: 'CFT-7721-D'
  },
  {
    id: 'med-6',
    sku: 'MED-PAR-650',
    name: 'Paracetamol 650mg',
    genericName: 'Acetaminophen',
    category: 'Pain Relief & Analgesics',
    unitsSoldToday: 320,
    currentStock: 3400,
    reorderThreshold: 500,
    unitPrice: 6.50,
    unitType: 'Tablets',
    stockStatus: 'Optimal',
    expiryDate: '10/2028',
    batchNumber: 'PAR-1192-A'
  },
  {
    id: 'med-7',
    sku: 'MED-SLB-100',
    name: 'Salbutamol HFA Inhaler',
    genericName: 'Albuterol Sulfate',
    category: 'Respiratory',
    unitsSoldToday: 62,
    currentStock: 140,
    reorderThreshold: 120,
    unitPrice: 32.00,
    unitType: 'Inhalers',
    stockStatus: 'Moderate',
    expiryDate: '08/2027',
    batchNumber: 'SLB-5541-C'
  },
  {
    id: 'med-8',
    sku: 'MED-INS-100',
    name: 'Insulin Glargine 100U/ml',
    genericName: 'Insulin Glargine',
    category: 'Diabetes & Endocrine',
    unitsSoldToday: 35,
    currentStock: 45,
    reorderThreshold: 80,
    unitPrice: 78.00,
    unitType: 'Vials',
    stockStatus: 'Low Stock',
    expiryDate: '01/2027',
    batchNumber: 'INS-9002-E'
  }
]

export const INITIAL_APPOINTMENTS: AppointmentRequest[] = [
  {
    id: 'appt-1',
    patientId: 'demo-patient',
    patientName: 'Amara Okafor',
    patientEmail: 'patient@carelink.health',
    mrn: 'MRN-84920',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    department: 'Cardiology',
    requestedDate: '2026-10-06',
    requestedTime: '10:30 AM',
    visitType: 'Follow-up',
    reason: 'Post-procedure review and blood pressure check after last cardiology consult.',
    status: 'pending',
    submittedAt: 'Today at 08:12 AM'
  },
  {
    id: 'appt-2',
    patientId: 'pt-102',
    patientName: 'Robert Miller',
    mrn: 'MRN-84921',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    department: 'Internal Medicine',
    requestedDate: '2026-10-07',
    requestedTime: '09:00 AM',
    visitType: 'New Consultation',
    reason: 'Diabetes follow-up with fasting bloodwork review.',
    status: 'pending',
    submittedAt: 'Yesterday at 04:40 PM'
  },
  {
    id: 'appt-3',
    patientId: 'pt-103',
    patientName: 'Sophia Patel',
    mrn: 'MRN-84922',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    department: 'Cardiology',
    requestedDate: '2026-10-08',
    requestedTime: '02:00 PM',
    visitType: 'Telehealth',
    reason: 'Discuss allergy symptoms and whether cardiology clearance is needed.',
    status: 'pending',
    submittedAt: 'Yesterday at 11:05 AM'
  },
  {
    id: 'appt-4',
    patientId: 'pt-104',
    patientName: 'David Gomez',
    mrn: 'MRN-84923',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    department: 'Cardiology',
    requestedDate: '2026-10-03',
    requestedTime: '11:00 AM',
    visitType: 'Post-op Review',
    reason: 'Surgical follow-up and prescription refill check.',
    status: 'approved',
    submittedAt: '2 days ago'
  },
  {
    id: 'appt-5',
    patientId: 'pt-105',
    patientName: 'Emma Watson-Lee',
    mrn: 'MRN-84924',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    department: 'Cardiology',
    requestedDate: '2026-10-04',
    requestedTime: '08:30 AM',
    visitType: 'Follow-up',
    reason: 'Hypertension medication adjustment review.',
    status: 'rescheduled',
    rescheduledDate: '2026-10-09',
    rescheduledTime: '01:30 PM',
    doctorNote: 'Morning clinic is fully booked. Please confirm the afternoon slot.',
    submittedAt: '3 days ago'
  }
]

export const INITIAL_HOSPITAL_DOCTORS: HospitalDoctor[] = [
  {
    id: 'demo-doctor',
    name: 'Dr. Alexander Wright, MD',
    title: 'Attending Physician & Cardiologist',
    department: 'Cardiology & Internal Medicine',
    specialization: 'Cardiology',
    email: 'doctor@carelink.health',
    phone: '+91 98450 11223',
    roomNumber: 'OPD Room 204 (Cardiology)',
    status: 'AVAILABLE',
    currentQueueCount: 4,
    avatarInitials: 'AW'
  },
  {
    id: 'doc-cardio-2',
    name: 'Dr. Olivia Bennett, MD',
    title: 'Senior Interventional Cardiologist',
    department: 'Cardiology & Catheterization Lab',
    specialization: 'Cardiology',
    email: 'olivia.bennett@carelink.health',
    phone: '+91 98450 11224',
    roomNumber: 'OPD Room 206 (Cardiology)',
    status: 'AVAILABLE',
    currentQueueCount: 2,
    avatarInitials: 'OB'
  },
  {
    id: 'doc-cardio-3',
    name: 'Dr. Sanjay Rao, MD',
    title: 'Consultant Clinical Cardiologist',
    department: 'Cardiology Clinic',
    specialization: 'Cardiology',
    email: 'sanjay.rao@carelink.health',
    phone: '+91 98450 11225',
    roomNumber: 'OPD Room 208 (Cardiology)',
    status: 'AVAILABLE',
    currentQueueCount: 3,
    avatarInitials: 'SR'
  },
  {
    id: 'doc-internal-1',
    name: 'Dr. Marcus Brody, MD',
    title: 'Consultant Physician (Internal Medicine)',
    department: 'Internal Medicine & OPD',
    specialization: 'Internal Medicine',
    email: 'marcus.brody@carelink.health',
    phone: '+91 98450 11226',
    roomNumber: 'OPD Room 102 (General OPD)',
    status: 'AVAILABLE',
    currentQueueCount: 3,
    avatarInitials: 'MB'
  },
  {
    id: 'doc-internal-2',
    name: 'Dr. Anita Sharma, MD',
    title: 'Senior Physician & Diabetologist',
    department: 'Internal Medicine & Endocrinology',
    specialization: 'Internal Medicine',
    email: 'anita.sharma@carelink.health',
    phone: '+91 98450 11227',
    roomNumber: 'OPD Room 104 (Internal Med)',
    status: 'AVAILABLE',
    currentQueueCount: 1,
    avatarInitials: 'AS'
  },
  {
    id: 'doc-ortho-1',
    name: 'Dr. Vikram Patel, MS',
    title: 'Consultant Orthopedic Surgeon',
    department: 'Orthopedics & Joint Replacement',
    specialization: 'Orthopedics',
    email: 'vikram.patel@carelink.health',
    phone: '+91 98450 11228',
    roomNumber: 'OPD Room 301 (Orthopedics)',
    status: 'AVAILABLE',
    currentQueueCount: 2,
    avatarInitials: 'VP'
  },
  {
    id: 'doc-ortho-2',
    name: 'Dr. David Miller, MS',
    title: 'Associate Orthopedic Surgeon',
    department: 'Orthopedics & Trauma',
    specialization: 'Orthopedics',
    email: 'david.miller@carelink.health',
    phone: '+91 98450 11229',
    roomNumber: 'OPD Room 303 (Orthopedics)',
    status: 'AVAILABLE',
    currentQueueCount: 4,
    avatarInitials: 'DM'
  },
  {
    id: 'doc-peds-1',
    name: 'Dr. Meera Nair, MD',
    title: 'Senior Pediatrician',
    department: 'Pediatrics & Neonatology',
    specialization: 'Pediatrics',
    email: 'meera.nair@carelink.health',
    phone: '+91 98450 11230',
    roomNumber: 'OPD Room 112 (Pediatrics)',
    status: 'AVAILABLE',
    currentQueueCount: 2,
    avatarInitials: 'MN'
  },
  {
    id: 'doc-peds-2',
    name: 'Dr. Ethan Cruz, MD',
    title: 'Pediatric Specialist',
    department: 'Pediatrics & Adolescent Medicine',
    specialization: 'Pediatrics',
    email: 'ethan.cruz@carelink.health',
    phone: '+91 98450 11231',
    roomNumber: 'OPD Room 114 (Pediatrics)',
    status: 'AVAILABLE',
    currentQueueCount: 3,
    avatarInitials: 'EC'
  },
  {
    id: 'doc-neuro-1',
    name: 'Dr. Rohan Verma, MD, DM',
    title: 'Consultant Neurologist',
    department: 'Neurology & Neuro-sciences',
    specialization: 'Neurology',
    email: 'rohan.verma@carelink.health',
    phone: '+91 98450 11232',
    roomNumber: 'OPD Room 210 (Neurology)',
    status: 'AVAILABLE',
    currentQueueCount: 1,
    avatarInitials: 'RV'
  },
  {
    id: 'doc-derm-1',
    name: 'Dr. Maya Sen, MD',
    title: 'Consultant Dermatologist',
    department: 'Dermatology & Skin Clinic',
    specialization: 'Dermatology',
    email: 'maya.sen@carelink.health',
    phone: '+91 98450 11233',
    roomNumber: 'OPD Room 118 (Dermatology)',
    status: 'AVAILABLE',
    currentQueueCount: 2,
    avatarInitials: 'MS'
  },
  {
    id: 'doc-ent-1',
    name: 'Dr. Rajesh Kothari, MS',
    title: 'ENT Specialist & Head-Neck Surgeon',
    department: 'ENT & Otorhinolaryngology',
    specialization: 'ENT',
    email: 'rajesh.kothari@carelink.health',
    phone: '+91 98450 11234',
    roomNumber: 'OPD Room 120 (ENT)',
    status: 'AVAILABLE',
    currentQueueCount: 1,
    avatarInitials: 'RK'
  }
]

export const INITIAL_HOSPITAL_NURSES: HospitalNurse[] = [
  {
    id: 'demo-nurse',
    name: 'Elena Rostova, RN, BSN',
    title: 'Charge Nurse & Clinical Care Specialist',
    department: 'Inpatient Medical/Surgical Ward 4B',
    ward: 'Ward 4B (Cardiology / Med-Surg)',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Available',
    currentAssignedCount: 3,
    avatarInitials: 'ER'
  },
  {
    id: 'nurse-rep-1',
    name: 'Samantha Cole, RN',
    title: 'Staff Nurse (Cardiology Clinic)',
    department: 'Outpatient Triage & Cardiology',
    ward: 'OPD Wing 2A',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Available',
    currentAssignedCount: 2,
    avatarInitials: 'SC'
  },
  {
    id: 'nurse-rep-2',
    name: 'Kevin Brooks, BSN',
    title: 'Emergency & Urgent Triage Nurse',
    department: 'Emergency Medicine & Triage',
    ward: 'Emergency Trauma Ward',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Available',
    currentAssignedCount: 4,
    avatarInitials: 'KB'
  },
  {
    id: 'nurse-rep-3',
    name: 'Clara Oswald, RN',
    title: 'Pediatrics & OPD Staff Nurse',
    department: 'General OPD & Pediatrics',
    ward: 'OPD Wing 1B',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Available',
    currentAssignedCount: 2,
    avatarInitials: 'CO'
  },
  {
    id: 'nurse-rep-4',
    name: 'Anjali Sharma, BSN',
    title: 'Staff Nurse (General Medicine)',
    department: 'Internal Medicine & Inpatient',
    ward: 'Ward 3A',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Available',
    currentAssignedCount: 1,
    avatarInitials: 'AS'
  }
]

export const INITIAL_QUEUE_ENTRIES: QueueEntry[] = [
  {
    id: 'q-101',
    queueNumber: 'C-001',
    patientId: 'pt-101',
    patientName: 'Amara Okafor',
    patientMrn: 'MRN-84920',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    specialization: 'Cardiology',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    priority: 'URGENT',
    status: 'IN_CONSULTATION',
    registeredAt: 'Today at 08:15 AM',
    assignedAt: 'Today at 08:20 AM',
    waitingTimeMinutes: 5,
    notes: 'ECG and cardiac vitals in progress.'
  },
  {
    id: 'q-102',
    queueNumber: 'C-002',
    patientId: 'pt-102',
    patientName: 'Robert Miller',
    patientMrn: 'MRN-84921',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    specialization: 'Cardiology',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    priority: 'NORMAL',
    status: 'WAITING',
    registeredAt: 'Today at 08:30 AM',
    assignedAt: 'Today at 08:32 AM',
    waitingTimeMinutes: 18,
    notes: 'Routine diabetes check-up & fasting bloodwork.'
  },
  {
    id: 'q-103',
    queueNumber: 'C-003',
    patientId: 'pt-103',
    patientName: 'Sophia Patel',
    patientMrn: 'MRN-84922',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    specialization: 'Cardiology',
    nurseId: 'nurse-rep-1',
    nurseName: 'Samantha Cole, RN',
    priority: 'NORMAL',
    status: 'WAITING',
    registeredAt: 'Today at 08:45 AM',
    assignedAt: 'Today at 08:47 AM',
    waitingTimeMinutes: 12,
    notes: 'Allergy review and blood pressure assessment.'
  },
  {
    id: 'q-104',
    queueNumber: 'C-004',
    patientId: 'pt-105',
    patientName: 'Emma Watson-Lee',
    patientMrn: 'MRN-84924',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    specialization: 'Cardiology',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    priority: 'NORMAL',
    status: 'WAITING',
    registeredAt: 'Today at 09:00 AM',
    assignedAt: 'Today at 09:02 AM',
    waitingTimeMinutes: 8,
    notes: 'Hypertension evaluation.'
  },
  {
    id: 'q-105',
    queueNumber: 'C-005',
    patientId: 'pt-104',
    patientName: 'David Gomez',
    patientMrn: 'MRN-84923',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    specialization: 'Cardiology',
    nurseId: 'nurse-rep-1',
    nurseName: 'Samantha Cole, RN',
    priority: 'NORMAL',
    status: 'COMPLETED',
    registeredAt: 'Today at 07:30 AM',
    assignedAt: 'Today at 07:35 AM',
    calledAt: 'Today at 08:45 AM',
    completedAt: 'Today at 09:15 AM',
    waitingTimeMinutes: 70,
    notes: 'Post-op cardiac recovery consultation completed.'
  },
  {
    id: 'q-106',
    queueNumber: 'G-001',
    patientId: 'pt-106',
    patientName: 'Liam Zhang',
    patientMrn: 'MRN-84925',
    doctorId: 'doc-internal-1',
    doctorName: 'Dr. Marcus Brody, MD',
    specialization: 'Internal Medicine',
    nurseId: 'nurse-rep-2',
    nurseName: 'Kevin Brooks, BSN',
    priority: 'NORMAL',
    status: 'WAITING',
    registeredAt: 'Today at 09:10 AM',
    assignedAt: 'Today at 09:12 AM',
    waitingTimeMinutes: 15,
    notes: 'Ankle pain and acute sprain evaluation.'
  },
  {
    id: 'q-107',
    queueNumber: 'G-002',
    patientId: 'pt-107',
    patientName: 'Clara Johansson',
    patientMrn: 'MRN-84926',
    doctorId: 'doc-internal-1',
    doctorName: 'Dr. Marcus Brody, MD',
    specialization: 'Internal Medicine',
    nurseId: 'nurse-rep-3',
    nurseName: 'Clara Oswald, RN',
    priority: 'NORMAL',
    status: 'WAITING',
    registeredAt: 'Today at 09:25 AM',
    assignedAt: 'Today at 09:28 AM',
    waitingTimeMinutes: 6,
    notes: 'Thyroid profile follow up.'
  },
  {
    id: 'q-108',
    queueNumber: 'E-001',
    patientId: 'pt-108',
    patientName: 'Julian Vance',
    patientMrn: 'MRN-84927',
    doctorId: 'doc-cardio-2',
    doctorName: 'Dr. Olivia Bennett, MD',
    specialization: 'Cardiology',
    nurseId: 'nurse-rep-2',
    nurseName: 'Kevin Brooks, BSN',
    priority: 'EMERGENCY',
    status: 'CALLED',
    registeredAt: 'Today at 09:15 AM',
    assignedAt: 'Today at 09:16 AM',
    waitingTimeMinutes: 1,
    notes: 'Acute chest tightness & shortness of breath.'
  }
]

export const INITIAL_QUEUE_TRANSFERS: QueueTransferRecord[] = [
  {
    id: 'TR-2026-0001',
    patientId: 'pt-099',
    patientName: 'Rahul Kumar',
    patientMrn: 'PAT-2026-0008',
    originalDoctorId: 'demo-doctor',
    originalDoctorName: 'Dr. Alexander Wright, MD',
    originalSpecialization: 'Cardiology',
    newDoctorId: 'doc-cardio-3',
    newDoctorName: 'Dr. Sanjay Rao, MD',
    newSpecialization: 'Cardiology',
    originalQueueNumber: 'C-006',
    newQueueNumber: 'C-010',
    reason: 'Emergency Doctor Allocation Ã¢â‚¬â€ Dr. Wright attending STAT acute cardiac case',
    transferType: 'EMERGENCY_REALLOCATION',
    transferredBy: 'David Chen (Receptionist)',
    transferredAt: 'Today at 08:30 AM',
    notes: 'Same-specialization transfer verified and confirmed by Reception.'
  }
]

// LocalStorage helpers for Hospital Doctors
export function getStoredHospitalDoctors(): HospitalDoctor[] {
  if (typeof window === 'undefined') return INITIAL_HOSPITAL_DOCTORS
  try {
    const raw = localStorage.getItem('carelink_hospital_doctors')
    return raw ? JSON.parse(raw) : INITIAL_HOSPITAL_DOCTORS
  } catch {
    return INITIAL_HOSPITAL_DOCTORS
  }
}

export function saveHospitalDoctors(doctors: HospitalDoctor[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_hospital_doctors', JSON.stringify(doctors))
  }
}

// LocalStorage helpers for Hospital Nurses
export function getStoredHospitalNurses(): HospitalNurse[] {
  if (typeof window === 'undefined') return INITIAL_HOSPITAL_NURSES
  try {
    const raw = localStorage.getItem('carelink_hospital_nurses')
    return raw ? JSON.parse(raw) : INITIAL_HOSPITAL_NURSES
  } catch {
    return INITIAL_HOSPITAL_NURSES
  }
}

export function saveHospitalNurses(nurses: HospitalNurse[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_hospital_nurses', JSON.stringify(nurses))
  }
}

// LocalStorage helpers for Queue Entries
export function getStoredQueueEntries(): QueueEntry[] {
  if (typeof window === 'undefined') return INITIAL_QUEUE_ENTRIES
  try {
    const raw = localStorage.getItem('carelink_queue_entries')
    return raw ? JSON.parse(raw) : INITIAL_QUEUE_ENTRIES
  } catch {
    return INITIAL_QUEUE_ENTRIES
  }
}

export function saveQueueEntries(entries: QueueEntry[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_queue_entries', JSON.stringify(entries))
  }
}

// LocalStorage helpers for Queue Transfers
export function getStoredQueueTransfers(): QueueTransferRecord[] {
  if (typeof window === 'undefined') return INITIAL_QUEUE_TRANSFERS
  try {
    const raw = localStorage.getItem('carelink_queue_transfers')
    return raw ? JSON.parse(raw) : INITIAL_QUEUE_TRANSFERS
  } catch {
    return INITIAL_QUEUE_TRANSFERS
  }
}

export function saveQueueTransfers(transfers: QueueTransferRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_queue_transfers', JSON.stringify(transfers))
  }
}

// Unique Patient ID / MRN Generator (PAT-2026-0001)
export function generateUniquePatientId(existingPatients?: PatientRecord[]): string {
  const pts = existingPatients || getStoredPatients()
  const year = new Date().getFullYear()
  let maxSeq = 0
  
  for (const p of pts) {
    const checkStr = `${p.id} ${p.mrn}`
    const match = checkStr.match(/PAT-\d{4}-(\d+)/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `PAT-${year}-${String(nextSeq).padStart(4, '0')}`
}

// Doctor Queue Number Generator (e.g. C-001, G-002, E-001)
export function generateDoctorQueueNumber(
  specialization: string,
  priority: QueuePriorityType = 'NORMAL',
  existingEntries?: QueueEntry[]
): string {
  const entries = existingEntries || getStoredQueueEntries()
  const prefix = priority === 'EMERGENCY'
    ? 'E'
    : (specialization || 'General').trim().charAt(0).toUpperCase()
  
  let maxSeq = 0
  for (const q of entries) {
    if (q.queueNumber && q.queueNumber.startsWith(`${prefix}-`)) {
      const num = parseInt(q.queueNumber.split('-')[1], 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `${prefix}-${String(nextSeq).padStart(3, '0')}`
}

// Queue Transfer ID Generator
export function generateQueueTransferId(existingTransfers?: QueueTransferRecord[]): string {
  const transfers = existingTransfers || getStoredQueueTransfers()
  const year = new Date().getFullYear()
  let maxSeq = 0
  
  for (const t of transfers) {
    const match = t.id.match(/TR-\d{4}-(\d+)/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `TR-${year}-${String(nextSeq).padStart(4, '0')}`
}

// Backend-style Same Specialization Validation Rule
export function validateQueueTransfer(
  originalDoctorSpec: string,
  targetDoctorSpec: string
): { isValid: boolean; error?: string } {
  if (!originalDoctorSpec || !targetDoctorSpec) {
    return { isValid: false, error: 'Both doctor specializations must be provided.' }
  }
  
  const origClean = originalDoctorSpec.trim().toLowerCase()
  const targetClean = targetDoctorSpec.trim().toLowerCase()
  
  if (origClean !== targetClean) {
    return {
      isValid: false,
      error: `Queue redirection blocked: Target doctor specialization (${targetDoctorSpec}) does NOT match the original doctor specialization (${originalDoctorSpec}). Receiving doctor must have the exact same specialization.`
    }
  }
  
  return { isValid: true }
}

// LocalStorage helpers for custom staff accounts
export function getStoredAccounts(): DemoAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('carelink_custom_accounts')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveNewStaffAccount(newAccount: DemoAccount): DemoAccount {
  if (typeof window !== 'undefined') {
    const existing = getStoredAccounts()
    const updated = [newAccount, ...existing.filter(a => a.id !== newAccount.id)]
    localStorage.setItem('carelink_custom_accounts', JSON.stringify(updated))
  }
  return newAccount
}

export function deleteStaffAccount(accountId: string): void {
  if (typeof window !== 'undefined') {
    const existing = getStoredAccounts()
    const updated = existing.filter(a => a.id !== accountId)
    localStorage.setItem('carelink_custom_accounts', JSON.stringify(updated))
  }
}

export function getAllAccounts(): DemoAccount[] {
  // Returns only accounts that have been loaded from Supabase into localStorage cache
  return getStoredAccounts()
}

export function findDemoAccount(email: string, password?: string): DemoAccount | undefined {
  // All authentication is now via Supabase â€” this function is kept for compatibility only
  // It checks the localStorage cache of Supabase-loaded accounts
  const normalizedEmail = email.trim().toLowerCase()
  const all = getAllAccounts()
  const account = all.find(acc => acc.email.toLowerCase() === normalizedEmail)
  if (!account) return undefined
  // Password is no longer stored client-side â€” return account regardless if found
  return account
}

export const DEFAULT_ROLE_ACCOUNTS: Record<string, DemoAccount> = {
  doctor: {
    id: 'demo-doctor',
    roleSlug: 'doctor',
    roleLabel: 'Doctor',
    name: 'Dr. Alexander Wright, MD',
    title: 'Attending Physician & Cardiologist',
    department: 'Cardiology & Internal Medicine',
    specialization: 'Cardiology',
    email: 'doctor@carelink.health',
    password: '',
    badge: 'Clinical Provider',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    avatarInitials: 'AW',
    summary: 'Attending Physician & Cardiologist',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  },
  nurse: {
    id: 'demo-nurse',
    roleSlug: 'nurse',
    roleLabel: 'Nurse',
    name: 'Elena Rostova, RN',
    title: 'Charge Nurse',
    department: 'Inpatient Ward 4B',
    email: 'nurse@carelink.health',
    password: '',
    badge: 'Bedside Care & Vitals',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    avatarInitials: 'ER',
    summary: 'Charge Nurse & Clinical Care Specialist',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  },
  'medical-staff': {
    id: 'demo-medical-staff',
    roleSlug: 'medical-staff',
    roleLabel: 'Medicine Staff',
    name: 'Marcus Vance, MLS',
    title: 'Lead Pharmacist & Diagnostics',
    department: 'Central Medicine Diagnostics',
    email: 'medstaff@carelink.health',
    password: '',
    badge: 'Medicine & Diagnostics',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    avatarInitials: 'MV',
    summary: 'Lead Pharmacist',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  },
  billing: {
    id: 'demo-billing',
    roleSlug: 'billing',
    roleLabel: 'Billing Staff',
    name: 'Patricia Hayes, CPC',
    title: 'Senior Revenue & Claims Manager',
    department: 'Patient Financial Services',
    email: 'billing@carelink.health',
    password: '',
    badge: 'Revenue Cycle & Claims',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    avatarInitials: 'PH',
    summary: 'Senior Revenue & Claims Manager',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  },
  receptionist: {
    id: 'demo-receptionist',
    roleSlug: 'receptionist',
    roleLabel: 'Receptionist',
    name: 'David Chen',
    title: 'Admissions & Front Desk Officer',
    department: 'Central Admissions',
    email: 'reception@carelink.health',
    password: '',
    badge: 'Admissions & Front Desk',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    avatarInitials: 'DC',
    summary: 'Admissions & Front Desk Officer',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  },
  admin: {
    id: 'admin-1',
    roleSlug: 'admin',
    roleLabel: 'Admin',
    name: 'Dulla Sai Sri Charan',
    title: 'Super Administrator',
    department: 'Hospital IT & Security Governance',
    email: 'dullasaisricharan2612@gmail.com',
    password: '',
    badge: 'Super Admin Access',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    avatarInitials: 'DS',
    summary: 'Super Administrator profile',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  },
  patient: {
    id: 'demo-patient',
    roleSlug: 'patient',
    roleLabel: 'Patient',
    name: 'Amara Okafor',
    title: 'Patient Portal Account',
    department: 'Personal Health Portal',
    email: 'patient@carelink.health',
    password: '',
    badge: 'Patient Portal',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    avatarInitials: 'AO',
    summary: 'Patient Profile',
    permissions: [],
    stats: [],
    recentActivities: [],
    quickActions: []
  }
}

export function getDemoAccountByRole(roleSlug: string): DemoAccount {
  const cleanSlug = roleSlug.replace(/^\//, '').trim().toLowerCase()
  const all = getAllAccounts()
  const found = all.find(acc => acc.roleSlug.toLowerCase() === cleanSlug)
  if (found) return found
  return DEFAULT_ROLE_ACCOUNTS[cleanSlug] || EMPTY_ACCOUNT
}

// LocalStorage helpers for Leave Requests
export function getStoredLeaveRequests(): LeaveRequest[] {
  if (typeof window === 'undefined') return INITIAL_LEAVE_REQUESTS
  try {
    const raw = localStorage.getItem('carelink_leave_requests')
    return raw ? JSON.parse(raw) : INITIAL_LEAVE_REQUESTS
  } catch {
    return INITIAL_LEAVE_REQUESTS
  }
}

export function saveLeaveRequests(requests: LeaveRequest[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_leave_requests', JSON.stringify(requests))
  }
}

// LocalStorage helpers for Shift Roster
export function getStoredShiftRoster(): StaffShiftAssignment[] {
  if (typeof window === 'undefined') return INITIAL_SHIFT_ROSTER
  try {
    const raw = localStorage.getItem('carelink_shift_roster')
    return raw ? JSON.parse(raw) : INITIAL_SHIFT_ROSTER
  } catch {
    return INITIAL_SHIFT_ROSTER
  }
}

export function saveShiftRoster(roster: StaffShiftAssignment[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_shift_roster', JSON.stringify(roster))
  }
}

// LocalStorage helpers for Patients
export function getStoredPatients(): PatientRecord[] {
  if (typeof window === 'undefined') return INITIAL_PATIENTS
  try {
    const raw = localStorage.getItem('carelink_patients')
    return raw ? JSON.parse(raw) : INITIAL_PATIENTS
  } catch {
    return INITIAL_PATIENTS
  }
}

export function savePatients(patients: PatientRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_patients', JSON.stringify(patients))
  }
}

// LocalStorage helpers for Billings
export function getStoredBillings(): BillingRecord[] {
  if (typeof window === 'undefined') return INITIAL_BILLINGS
  try {
    const raw = localStorage.getItem('carelink_billings')
    return raw ? JSON.parse(raw) : INITIAL_BILLINGS
  } catch {
    return INITIAL_BILLINGS
  }
}

export function saveBillings(billings: BillingRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_billings', JSON.stringify(billings))
  }
}

// LocalStorage helpers for Billing Requests (Nurse -> Billing Staff Workflow)
export function getStoredBillingRequests(): BillingRequest[] {
  if (typeof window === 'undefined') return INITIAL_BILLING_REQUESTS
  try {
    const raw = localStorage.getItem('carelink_billing_requests')
    return raw ? JSON.parse(raw) : INITIAL_BILLING_REQUESTS
  } catch {
    return INITIAL_BILLING_REQUESTS
  }
}

export function saveBillingRequests(requests: BillingRequest[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_billing_requests', JSON.stringify(requests))
  }
}

// LocalStorage helpers for Dedicated Bills
export function getStoredBills(): BillRecord[] {
  if (typeof window === 'undefined') return INITIAL_BILLS
  try {
    const raw = localStorage.getItem('carelink_bills')
    return raw ? JSON.parse(raw) : INITIAL_BILLS
  } catch {
    return INITIAL_BILLS
  }
}

export function saveBills(bills: BillRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_bills', JSON.stringify(bills))
  }
}

// LocalStorage helpers for Payment Records
export function getStoredPayments(): PaymentRecord[] {
  if (typeof window === 'undefined') return INITIAL_PAYMENTS
  try {
    const raw = localStorage.getItem('carelink_payments')
    return raw ? JSON.parse(raw) : INITIAL_PAYMENTS
  } catch {
    return INITIAL_PAYMENTS
  }
}

export function savePayments(payments: PaymentRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_payments', JSON.stringify(payments))
  }
}

// LocalStorage helpers for Notifications
export function getStoredNotifications(): HospitalNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS
  try {
    const raw = localStorage.getItem('carelink_notifications')
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS
  } catch {
    return INITIAL_NOTIFICATIONS
  }
}

export function saveNotifications(notifications: HospitalNotification[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_notifications', JSON.stringify(notifications))
  }
}

export function addHospitalNotification(
  notif: Omit<HospitalNotification, 'id' | 'createdAt' | 'read'> & { id?: string; createdAt?: string; read?: boolean }
): HospitalNotification {
  const all = getStoredNotifications()
  const newNotif: HospitalNotification = {
    id: notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    toRole: notif.toRole,
    toUserId: notif.toUserId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    link: notif.link,
    read: notif.read ?? false,
    createdAt: notif.createdAt || `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  const updated = [newNotif, ...all]
  saveNotifications(updated)
  return newNotif
}

// Unique Bill Number Generator ensuring unique non-duplicate IDs
export function generateUniqueBillNumber(existingBills?: BillRecord[]): string {
  const bills = existingBills || getStoredBills()
  const year = new Date().getFullYear()
  let maxSeq = 0
  
  for (const b of bills) {
    if (b.billNumber) {
      const match = b.billNumber.match(/BILL-\d{4}-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num
        }
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `BILL-${year}-${String(nextSeq).padStart(4, '0')}`
}

// Unique Billing Request ID Generator
export function generateUniqueBillingRequestId(existingRequests?: BillingRequest[]): string {
  const reqs = existingRequests || getStoredBillingRequests()
  const year = new Date().getFullYear()
  let maxSeq = 0
  
  for (const r of reqs) {
    if (r.id) {
      const match = r.id.match(/BREQ-\d{4}-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num
        }
      }
    }
  }
  
  const nextSeq = maxSeq + 1
  return `BREQ-${year}-${String(nextSeq).padStart(4, '0')}`
}

// Backend-style validated calculation for bill items
export function calculateBillTotals(
  medicines: { quantity: number; unitPrice: number }[],
  discountAmount: number = 0,
  taxPercent: number = 0
): { subtotal: number; discount: number; tax: number; finalAmount: number } {
  const subtotal = medicines.reduce((sum, item) => {
    const qty = Math.max(0, Number(item.quantity) || 0)
    const price = Math.max(0, Number(item.unitPrice) || 0)
    return sum + qty * price
  }, 0)

  const sanitizedDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0))
  const taxableAmount = Math.max(0, subtotal - sanitizedDiscount)
  const tax = Number(((taxableAmount * Math.max(0, Number(taxPercent) || 0)) / 100).toFixed(2))
  const finalAmount = Number(Math.max(0, taxableAmount + tax).toFixed(2))

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(sanitizedDiscount.toFixed(2)),
    tax,
    finalAmount
  }
}

// LocalStorage helpers for Medicines
export function getStoredMedicines(): MedicineInventory[] {
  if (typeof window === 'undefined') return INITIAL_MEDICINES
  try {
    const raw = localStorage.getItem('carelink_medicines')
    return raw ? JSON.parse(raw) : INITIAL_MEDICINES
  } catch {
    return INITIAL_MEDICINES
  }
}

export function saveMedicines(medicines: MedicineInventory[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_medicines', JSON.stringify(medicines))
  }
}

export function getStoredAppointments(): AppointmentRequest[] {
  if (typeof window === 'undefined') return INITIAL_APPOINTMENTS
  try {
    const raw = localStorage.getItem('carelink_appointments')
    return raw ? JSON.parse(raw) : INITIAL_APPOINTMENTS
  } catch {
    return INITIAL_APPOINTMENTS
  }
}

export function saveAppointments(appointments: AppointmentRequest[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_appointments', JSON.stringify(appointments))
  }
}

export interface DoctorAvailability {
  doctorId: string
  doctorName: string
  isAvailable: boolean
  availableDays: string[]
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  slotDurationMinutes: number
  maxDailyPatients: number
  statusNote?: string
  lastUpdated?: string
}

export const DEFAULT_DOCTOR_AVAILABILITY: DoctorAvailability = {
  doctorId: 'demo-doctor',
  doctorName: 'Dr. Alexander Wright, MD',
  isAvailable: true,
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  startTime: '09:00 AM',
  endTime: '05:00 PM',
  breakStartTime: '01:00 PM',
  breakEndTime: '02:00 PM',
  slotDurationMinutes: 30,
  maxDailyPatients: 16,
  statusNote: 'Consulting in OPD Clinic Room 204 (Cardiology)',
  lastUpdated: 'Today'
}

export function getStoredDoctorAvailabilities(): Record<string, DoctorAvailability> {
  if (typeof window === 'undefined') return { 'demo-doctor': DEFAULT_DOCTOR_AVAILABILITY }
  try {
    const raw = localStorage.getItem('carelink_doctor_availabilities')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!parsed['demo-doctor']) {
        parsed['demo-doctor'] = DEFAULT_DOCTOR_AVAILABILITY
      }
      return parsed
    }
    return { 'demo-doctor': DEFAULT_DOCTOR_AVAILABILITY }
  } catch {
    return { 'demo-doctor': DEFAULT_DOCTOR_AVAILABILITY }
  }
}

export function getDoctorAvailability(doctorId: string, doctorName?: string): DoctorAvailability {
  const all = getStoredDoctorAvailabilities()
  if (all[doctorId]) return all[doctorId]
  return {
    ...DEFAULT_DOCTOR_AVAILABILITY,
    doctorId,
    doctorName: doctorName || 'Attending Physician'
  }
}

export function saveDoctorAvailability(availability: DoctorAvailability): void {
  if (typeof window !== 'undefined') {
    const all = getStoredDoctorAvailabilities()
    all[availability.doctorId] = availability
    localStorage.setItem('carelink_doctor_availabilities', JSON.stringify(all))
  }
}

export interface MedicationItem {
  id: string
  name: string
  dosage: string
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Inhaler'
  frequency: string
  scheduleTimes: string[]
  timingInstructions: 'Before Food' | 'After Food' | 'With Food' | 'At Bedtime' | 'As Needed (SOS)'
  durationDays: number
  instructions?: string
}

export interface PrescriptionRecord {
  id: string
  patientId: string
  patientName: string
  mrn: string
  doctorId: string
  doctorName: string
  nurseId: string
  nurseName: string
  diagnosis: string
  vitals?: {
    bloodPressure?: string
    heartRate?: string
    spO2?: string
    temperature?: string
  }
  medications: MedicationItem[]
  nurseNotes?: string
  status: 'active' | 'dispensed' | 'completed'
  sharedWithPharmacy: boolean
  sharedWithPatient: boolean
  sharedWithBilling: boolean
  isNurseDirectCare?: boolean
  treatmentType?: 'Doctor Consult' | 'Nurse Direct Fever/General Protocol' | 'Emergency Triage'
  createdAt: string
  // Medicine Staff & Billing Staff Sync Fields:
  fulfillmentStatus?: 'pending_prep' | 'preparing' | 'ready_for_billing' | 'ready_to_collect' | 'dispensed'
  isReady?: boolean
  readyAt?: string
  billingStatus?: 'pending' | 'paid'
  billPaidAt?: string
  dispensedAt?: string
  dispensedBy?: string
  pickupCounter?: string
  pickupNotificationSent?: boolean
}

export const INITIAL_PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: 'rx-101',
    patientId: 'demo-patient',
    patientName: 'Amara Okafor',
    mrn: 'MRN-84920',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    diagnosis: 'Sinus Arrhythmia & Mild Hypertension',
    vitals: {
      bloodPressure: '128/84 mmHg',
      heartRate: '78 bpm',
      spO2: '98%',
      temperature: '98.6 Ã‚Â°F'
    },
    medications: [
      {
        id: 'med-item-1',
        name: 'Metoprolol Succinate',
        dosage: '25mg',
        form: 'Tablet',
        frequency: 'Once Daily (Morning)',
        scheduleTimes: ['08:30 AM'],
        timingInstructions: 'After Food',
        durationDays: 14,
        instructions: 'Take 30 minutes after breakfast with plenty of water.'
      },
      {
        id: 'med-item-2',
        name: 'Atorvastatin',
        dosage: '20mg',
        form: 'Tablet',
        frequency: 'Once Daily (Night)',
        scheduleTimes: ['09:00 PM'],
        timingInstructions: 'At Bedtime',
        durationDays: 30,
        instructions: 'Take right before going to sleep.'
      }
    ],
    nurseNotes: 'Patient advised on regular pulse checks and low-sodium hydration.',
    status: 'active',
    sharedWithPharmacy: true,
    sharedWithPatient: true,
    sharedWithBilling: true,
    treatmentType: 'Doctor Consult',
    createdAt: 'Today at 09:15 AM',
    fulfillmentStatus: 'pending_prep',
    billingStatus: 'pending'
  },
  {
    id: 'rx-102',
    patientId: 'pt-104',
    patientName: 'David Gomez',
    mrn: 'MRN-84923',
    doctorId: 'demo-doctor',
    doctorName: 'Dr. Alexander Wright, MD',
    nurseId: 'demo-nurse',
    nurseName: 'Elena Rostova, RN',
    diagnosis: 'Post-CABG Recovery Stage II',
    vitals: {
      bloodPressure: '120/76 mmHg',
      heartRate: '72 bpm',
      spO2: '99%',
      temperature: '98.4 Ã‚Â°F'
    },
    medications: [
      {
        id: 'med-item-3',
        name: 'Aspirin Cardio',
        dosage: '81mg',
        form: 'Tablet',
        frequency: 'Once Daily (Morning)',
        scheduleTimes: ['09:00 AM'],
        timingInstructions: 'After Food',
        durationDays: 30,
        instructions: 'Take after breakfast.'
      }
    ],
    nurseNotes: 'Wound healing well. Follow cardiac rehab walking schedule.',
    status: 'active',
    sharedWithPharmacy: true,
    sharedWithPatient: true,
    sharedWithBilling: true,
    treatmentType: 'Doctor Consult',
    createdAt: 'Today at 08:45 AM',
    fulfillmentStatus: 'ready_for_billing',
    isReady: true,
    readyAt: 'Today at 09:00 AM',
    billingStatus: 'paid',
    billPaidAt: 'Today at 09:20 AM'
  }
]

export function getStoredPrescriptions(): PrescriptionRecord[] {
  if (typeof window === 'undefined') return INITIAL_PRESCRIPTIONS
  try {
    const raw = localStorage.getItem('carelink_prescriptions')
    return raw ? JSON.parse(raw) : INITIAL_PRESCRIPTIONS
  } catch {
    return INITIAL_PRESCRIPTIONS
  }
}

export function savePrescriptions(prescriptions: PrescriptionRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_prescriptions', JSON.stringify(prescriptions))
  }
}

export function syncPrescriptionToBillingRecord(rx: PrescriptionRecord): BillingRecord {
  const medicineItems = rx.medications.map((m) => ({
    description: `${m.name} (${m.dosage}, ${m.frequency}) - ${m.durationDays}d`,
    amount: 45.0
  }))
  const consultItem = rx.isNurseDirectCare
    ? { description: 'Nurse Direct Care & Immediate Fever Protocol', amount: 60.0 }
    : { description: 'Attending Physician Clinical Consultation Fee', amount: 120.0 }

  const allItems = [...medicineItems, consultItem]
  const totalAmount = allItems.reduce((acc, it) => acc + it.amount, 0)

  return {
    id: `bill-rx-${rx.id}`,
    invoiceNumber: `INV-RX-${rx.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
    patientName: rx.patientName,
    mrn: rx.mrn,
    serviceCategory: 'Pharmacy & Medicines',
    totalAmount,
    paidAmount: 0,
    balanceDue: totalAmount,
    paymentStatus: 'Pending Insurance',
    paymentMethod: 'Insurance (BlueCross)',
    date: 'Today',
    invoiceTime: rx.createdAt.includes('at') ? rx.createdAt.split('at')[1].trim() : 'Just now',
    providerName: rx.isNurseDirectCare ? rx.nurseName : rx.doctorName,
    providerRole: rx.isNurseDirectCare ? 'Registered Nurse (Urgent Care)' : 'Attending Physician',
    items: allItems,
    status: 'pending',
    createdAt: rx.createdAt
  }
}

export interface UnifiedDispenseParams {
  prescriptionId?: string
  billingRequestId?: string
  billNumber?: string
  billId?: string
  patientId?: string
  patientName: string
  patientMrn?: string
  medicines?: Array<{ name: string; quantity?: number; dosage?: string }>
  dispensedBy: string
  dispenserRole: 'Billing Staff' | 'Medicine Staff' | 'Nurse' | string
  counter?: string
  notes?: string
}

export function dispenseMedicationsSync(params: UnifiedDispenseParams) {
  if (typeof window === 'undefined') return

  const timeString = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  const counterName =
    params.counter ||
    (params.dispenserRole.includes('Billing')
      ? 'Billing & Dispensary Desk #1 (Main OPD)'
      : 'Counter #2 (Express Dispensing)')
  const dispenserNameWithRole = `${params.dispensedBy} (${params.dispenserRole})`

  // 1. Update Prescriptions
  const currentRx = getStoredPrescriptions()
  const updatedRx = currentRx.map((p) => {
    const isMatch =
      (params.prescriptionId && p.id === params.prescriptionId) ||
      (params.patientMrn && p.mrn === params.patientMrn) ||
      (params.patientName && p.patientName.toLowerCase() === params.patientName.toLowerCase())

    if (isMatch) {
      return {
        ...p,
        status: 'dispensed' as const,
        fulfillmentStatus: 'ready_to_collect' as const,
        billingStatus: 'paid' as const,
        isReady: true,
        pickupCounter: counterName,
        dispensedAt: timeString,
        dispensedBy: dispenserNameWithRole,
        pickupNotificationSent: true,
        sharedWithPatient: true
      }
    }
    return p
  })
  savePrescriptions(updatedRx)

  // 2. Update Billing Requests
  const currentReqs = getStoredBillingRequests()
  const updatedReqs = currentReqs.map((r) => {
    const isMatch =
      (params.billingRequestId && r.id === params.billingRequestId) ||
      (params.prescriptionId && r.prescriptionId === params.prescriptionId) ||
      (params.billNumber && r.billNumber === params.billNumber) ||
      (params.patientMrn && r.patientMrn === params.patientMrn) ||
      (params.patientName && r.patientName.toLowerCase() === params.patientName.toLowerCase())

    if (isMatch) {
      return {
        ...r,
        status: 'DISPENSED' as BillingRequestStatus,
        dispensedAt: timeString,
        dispensedBy: dispenserNameWithRole,
        dispenseNotes: params.notes || r.dispenseNotes || `Medications dispensed at ${counterName}`
      }
    }
    return r
  })
  saveBillingRequests(updatedReqs)

  // 3. Update Bills
  const currentBills = getStoredBills()
  const updatedBills = currentBills.map((b) => {
    const isMatch =
      (params.billId && b.id === params.billId) ||
      (params.billNumber && b.billNumber === params.billNumber) ||
      (params.billingRequestId && b.requestId === params.billingRequestId) ||
      (params.prescriptionId && b.prescriptionId === params.prescriptionId) ||
      (params.patientMrn && b.patientMrn === params.patientMrn) ||
      (params.patientName && b.patientName.toLowerCase() === params.patientName.toLowerCase())

    if (isMatch) {
      return {
        ...b,
        status: 'DISPENSED' as BillingRequestStatus,
        paymentStatus: 'PAID' as PaymentStatusType,
        paidAt: b.paidAt || timeString
      }
    }
    return b
  })
  saveBills(updatedBills)

  // 4. Update Billings
  const currentBillings = getStoredBillings()
  const updatedBillings = currentBillings.map((b) => {
    const isMatch =
      (params.patientName && b.patientName.toLowerCase() === params.patientName.toLowerCase()) ||
      (params.patientMrn && b.mrn === params.patientMrn) ||
      (params.prescriptionId && b.id.includes(params.prescriptionId))

    if (isMatch) {
      return {
        ...b,
        status: 'paid' as const,
        paidAmount: b.totalAmount,
        balanceDue: 0,
        paymentStatus: 'Paid' as const,
        paidAt: b.paidAt || timeString
      }
    }
    return b
  })
  saveBillings(updatedBillings)

  // 5. Deduct Medicine Inventory
  const currentInventory = getStoredMedicines()
  const medsToDeduct = params.medicines || []
  let updatedInventory = currentInventory

  if (medsToDeduct.length > 0) {
    updatedInventory = currentInventory.map((med) => {
      const match = medsToDeduct.find(
        (m) =>
          m.name.toLowerCase().includes(med.name.toLowerCase()) ||
          med.name.toLowerCase().includes(m.name.toLowerCase()) ||
          (med.genericName && med.genericName.toLowerCase().includes(m.name.toLowerCase()))
      )
      if (match) {
        const qtyToDeduct = match.quantity || 1
        const newStock = Math.max(0, med.currentStock - qtyToDeduct)
        return {
          ...med,
          currentStock: newStock,
          unitsSoldToday: med.unitsSoldToday + qtyToDeduct,
          stockStatus: (newStock <= med.reorderThreshold
            ? newStock <= 20
              ? 'Critical'
              : 'Low Stock'
            : 'Optimal') as MedicineInventory['stockStatus']
        }
      }
      return med
    })
    saveMedicines(updatedInventory)
  }

  // 6. Notifications
  const isFromBilling = params.dispenserRole.toLowerCase().includes('billing')
  const isFromMedicine =
    params.dispenserRole.toLowerCase().includes('medicine') || params.dispenserRole.toLowerCase().includes('medical')

  addHospitalNotification({
    toRole: 'patient',
    toUserId: params.patientId,
    title: 'Medicines Handed Over / Ready to Collect',
    message: `Prescription medicines for ${params.patientName} have been dispensed by ${dispenserNameWithRole} at ${counterName}.`,
    type: 'dispense'
  })

  addHospitalNotification({
    toRole: 'nurse',
    title: `Medicines Dispensed (${params.dispenserRole})`,
    message: `Prescription medicines for ${params.patientName} (${params.patientMrn || 'Patient'}) have been dispensed by ${dispenserNameWithRole} at ${counterName}.`,
    type: 'dispense'
  })

  if (isFromBilling) {
    addHospitalNotification({
      toRole: 'medical-staff',
      title: 'Medicine Dispensed by Billing Staff',
      message: `Billing Staff ${params.dispensedBy} completed medication handover for ${params.patientName} at ${counterName}. Inventory and orders synchronized.`,
      type: 'dispense'
    })
  } else if (isFromMedicine) {
    addHospitalNotification({
      toRole: 'billing',
      title: 'Medicine Dispensed by Medicine Staff',
      message: `Medicine Staff ${params.dispensedBy} completed medication handover for ${params.patientName} at ${counterName}. Billing queue updated to Dispensed.`,
      type: 'dispense'
    })
  }

  // 7. Dispatch global sync events
  try {
    window.dispatchEvent(new CustomEvent('carelink_sync', { detail: { action: 'dispense', params } }))
    window.dispatchEvent(new Event('storage'))
  } catch {}

  return {
    prescriptions: updatedRx,
    billingRequests: updatedReqs,
    bills: updatedBills,
    billings: updatedBillings,
    medicines: updatedInventory
  }
}

export interface ReplacementStaffCandidate {
  id: string
  name: string
  roleSlug: string
  roleLabel: string
  department: string
  specialization?: string
}

export const BACKUP_STAFF_REPLACEMENTS: ReplacementStaffCandidate[] = [
  // Nurse Backups (for Nurse Replacement)
  {
    id: 'rep-nurse-1',
    name: 'Nurse Samantha Cole, RN',
    roleSlug: 'nurse',
    roleLabel: 'Nurse',
    department: 'Ward 4B / Inpatient Nursing',
    specialization: 'Critical Care & Bedside Vitals'
  },
  {
    id: 'rep-nurse-2',
    name: 'Nurse Kevin Brooks, BSN',
    roleSlug: 'nurse',
    roleLabel: 'Nurse',
    department: 'Outpatient Triage & Emergency Relief',
    specialization: 'Emergency Nursing & Patient Care'
  },
  {
    id: 'rep-nurse-3',
    name: 'Nurse Clara Oswald, RN',
    roleSlug: 'nurse',
    roleLabel: 'Nurse',
    department: 'Pediatrics & General Ward',
    specialization: 'Medication Administration & Vitals'
  },
  // Medicine Staff Backups (for Medicine Staff Replacement)
  {
    id: 'rep-med-1',
    name: 'Rachel Green, MLS',
    roleSlug: 'medical-staff',
    roleLabel: 'Medicine Staff',
    department: 'Central Medicine & Diagnostics',
    specialization: 'Clinical Pharmacy & Dispensing Support'
  },
  {
    id: 'rep-med-2',
    name: 'Aaron Brooks, PharmD',
    roleSlug: 'medical-staff',
    roleLabel: 'Medicine Staff',
    department: 'Central Hospital Pharmacy & Lab',
    specialization: 'Pharmacotherapy & Medication Verification'
  },
  {
    id: 'rep-med-3',
    name: 'Maya Lin, CPhT',
    roleSlug: 'medical-staff',
    roleLabel: 'Medicine Staff',
    department: 'Dispensary & Pharmaceutical Inventory',
    specialization: 'Medication Packaging & Stock Control'
  },
  // Billing Staff Backups (for Billing Staff Replacement)
  {
    id: 'rep-billing-1',
    name: 'Lisa Ray, CPC',
    roleSlug: 'billing',
    roleLabel: 'Billing Staff',
    department: 'Revenue Cycle & Claims Relief',
    specialization: 'Claims Adjudication & Insurance Reconciliation'
  },
  {
    id: 'rep-billing-2',
    name: 'Michael Chang, CPB',
    roleSlug: 'billing',
    roleLabel: 'Billing Staff',
    department: 'Patient Financial Services',
    specialization: 'Patient Accounts & Billing Gateway'
  },
  {
    id: 'rep-billing-3',
    name: 'Hannah Abbott, CPC',
    roleSlug: 'billing',
    roleLabel: 'Billing Staff',
    department: 'Invoicing & Claims Processing',
    specialization: 'ICD-10 Coding & Payment Verification'
  },
  // Receptionist Backups (for Receptionist Replacement)
  {
    id: 'rep-rec-1',
    name: 'Chloe Simmons',
    roleSlug: 'receptionist',
    roleLabel: 'Receptionist',
    department: 'Central Admissions & Front Desk',
    specialization: 'Patient Intake & Queue Management'
  },
  {
    id: 'rep-rec-2',
    name: 'Lucas Gray',
    roleSlug: 'receptionist',
    roleLabel: 'Receptionist',
    department: 'OPD Check-in & Patient Services',
    specialization: 'Registration & Appointment Scheduling'
  },
  {
    id: 'rep-rec-3',
    name: 'Emma Watson',
    roleSlug: 'receptionist',
    roleLabel: 'Receptionist',
    department: 'Admissions & Information Desk',
    specialization: 'Visitor Passes & Patient Triage Support'
  },
  // Doctor Backups (strictly for Doctor Replacement ONLY)
  {
    id: 'rep-doc-1',
    name: 'Dr. Olivia Bennett, MD',
    roleSlug: 'doctor',
    roleLabel: 'Doctor',
    department: 'Internal Medicine & Cardiology',
    specialization: 'Cardiology'
  },
  {
    id: 'rep-doc-2',
    name: 'Dr. Marcus Brody, MD',
    roleSlug: 'doctor',
    roleLabel: 'Doctor',
    department: 'General Medicine & OPD',
    specialization: 'Internal Medicine'
  }
]

export function getEligibleReplacementsForStaff(
  targetStaff: { id?: string; roleSlug?: string; roleLabel?: string; staffRole?: string; name?: string; staffName?: string } | null | undefined,
  allStaff: DemoAccount[] = []
): Array<{ id: string; name: string; roleLabel: string; department: string; roleSlug: string }> {
  if (!targetStaff) {
    // If no target specified, NEVER show doctors, patients, or admins
    const regular = allStaff
      .filter((s) => s.roleSlug !== 'patient' && s.roleSlug !== 'admin' && s.roleSlug !== 'doctor' && !s.name.startsWith('Dr.'))
      .map((s) => ({
        id: s.id,
        name: s.name,
        roleLabel: s.roleLabel,
        department: s.department,
        roleSlug: s.roleSlug
      }))
    const backups = BACKUP_STAFF_REPLACEMENTS.filter((b) => b.roleSlug !== 'doctor' && !b.name.startsWith('Dr.'))
    const combined = [...regular, ...backups]
    const seen = new Set<string>()
    return combined.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }

  const roleStr = (targetStaff.roleSlug || targetStaff.roleLabel || targetStaff.staffRole || '').toLowerCase()
  const nameStr = (targetStaff.name || targetStaff.staffName || '').toLowerCase()
  const isTargetDoctor = roleStr === 'doctor' || roleStr.includes('doctor') || roleStr.includes('physician') || nameStr.startsWith('dr.')

  if (isTargetDoctor) {
    // Only physicians/doctors can replace a doctor
    const regularDoc = allStaff
      .filter((s) => s.id !== targetStaff.id && (s.roleSlug === 'doctor' || s.roleLabel.toLowerCase().includes('doctor') || s.name.startsWith('Dr.')))
      .map((s) => ({
        id: s.id,
        name: s.name,
        roleLabel: s.roleLabel,
        department: s.department,
        roleSlug: s.roleSlug
      }))
    const backupDocs = BACKUP_STAFF_REPLACEMENTS.filter((b) => b.roleSlug === 'doctor' || b.name.startsWith('Dr.'))
    const combined = [...regularDoc, ...backupDocs]
    const seen = new Set<string>()
    return combined.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }

  // TARGET IS A NON-DOCTOR (Billing Staff, Nurse, Receptionist, Medicine Staff, etc.)
  // CRITICAL REQUIREMENT: Doctors' names MUST NOT be shown in replacement for any of these staff!
  const isNurse = roleStr === 'nurse' || roleStr.includes('nurse')
  const isMedicineStaff = roleStr === 'medical-staff' || roleStr.includes('medicine') || roleStr.includes('medical') || roleStr.includes('pharm') || roleStr.includes('lab')
  const isBilling = roleStr === 'billing' || roleStr.includes('billing') || roleStr.includes('claim') || roleStr.includes('finance')
  const isReceptionist = roleStr === 'receptionist' || roleStr.includes('reception') || roleStr.includes('front') || roleStr.includes('intake')

  const regularCandidates = allStaff
    .filter((s) => {
      if (s.id === targetStaff.id) return false
      if (s.roleSlug === 'patient' || s.roleSlug === 'admin') return false
      // STRICT FILTER: NEVER allow any doctor to be a replacement for nurse, medicine staff, billing staff, receptionist
      if (s.roleSlug === 'doctor' || s.name.startsWith('Dr.') || s.roleLabel.toLowerCase().includes('doctor') || s.roleLabel.toLowerCase().includes('physician')) {
        return false
      }
      if (isNurse) return s.roleSlug === 'nurse'
      if (isMedicineStaff) return s.roleSlug === 'medical-staff'
      if (isBilling) return s.roleSlug === 'billing'
      if (isReceptionist) return s.roleSlug === 'receptionist'
      return true
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      roleLabel: s.roleLabel,
      department: s.department,
      roleSlug: s.roleSlug
    }))

  const backupCandidates = BACKUP_STAFF_REPLACEMENTS.filter((b) => {
    if (b.id === targetStaff.id) return false
    // STRICT FILTER: NEVER allow any doctor
    if (b.roleSlug === 'doctor' || b.name.startsWith('Dr.') || b.roleLabel.toLowerCase().includes('doctor') || b.roleLabel.toLowerCase().includes('physician')) {
      return false
    }
    if (isNurse) return b.roleSlug === 'nurse'
    if (isMedicineStaff) return b.roleSlug === 'medical-staff'
    if (isBilling) return b.roleSlug === 'billing'
    if (isReceptionist) return b.roleSlug === 'receptionist'
    return true
  })

  const combined = [...regularCandidates, ...backupCandidates]
  const seen = new Set<string>()
  return combined.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

// ============================================================================
// HOSPITAL LOCATIONS & NAVIGATION MODELS
// ============================================================================
export interface HospitalLocation {
  id: string
  name: string
  building: string
  floor: 'Ground Floor' | '1st Floor' | '2nd Floor' | '3rd Floor' | '4th Floor' | 'Basement'
  roomNumber: string
  department: string
  category: 'Clinical' | 'Diagnostics' | 'Pharmacy' | 'Billing' | 'Emergency' | 'Admissions' | 'Wards' | 'Amenities'
  description: string
  landmarks: string
  routeSteps: string[]
  doctorId?: string
}

export const INITIAL_HOSPITAL_LOCATIONS: HospitalLocation[] = [
  {
    id: 'loc-rec-1',
    name: 'Main Admissions & Front Desk Reception',
    building: 'Main Hospital Building',
    floor: 'Ground Floor',
    roomNumber: 'G-01',
    department: 'Admissions',
    category: 'Admissions',
    description: 'Central patient intake, queue tokens, visitor badges, and general enquiry desk.',
    landmarks: 'Right in front of Main Entrance Gate 1, next to Atrium fountain.',
    routeSteps: ['Enter via Main Entrance Gate 1', 'Cross the Main Atrium lobby', 'Check in at Reception Desk G-01']
  },
  {
    id: 'loc-emg-1',
    name: 'STAT Emergency & Trauma Resuscitation Bay',
    building: 'Emergency Trauma Block',
    floor: 'Ground Floor',
    roomNumber: 'ER-100',
    department: 'Emergency Medicine',
    category: 'Emergency',
    description: '24/7 STAT emergency triage, trauma bays, cardiac resuscitation, and ambulance bay.',
    landmarks: 'East Wing Entrance, dedicated Red Emergency Ramp with 24/7 drive-in.',
    routeSteps: ['Follow Red Emergency Signage from Gate 2', 'Enter Trauma Triage Bay ER-100']
  },
  {
    id: 'loc-pharm-1',
    name: 'Central Hospital Pharmacy & Dispensary',
    building: 'Main Hospital Building',
    floor: 'Ground Floor',
    roomNumber: 'G-14',
    department: 'Pharmacy',
    category: 'Pharmacy',
    description: 'Inpatient & outpatient medication dispensing, e-Prescription pickup, and medication counseling.',
    landmarks: 'Ground floor west corridor, opposite General Cashier Desk.',
    routeSteps: ['From Main Reception, take Left Corridor', 'Walk 20 meters past Atrium', 'Pharmacy Counter G-14 on Left']
  },
  {
    id: 'loc-bill-1',
    name: 'Billing & Patient Financial Services Desk',
    building: 'Main Hospital Building',
    floor: 'Ground Floor',
    roomNumber: 'G-16',
    department: 'Patient Financial Services',
    category: 'Billing',
    description: 'Bill generation, payment counter (UPI/Card/Cash), insurance TPA claims desk, and itemized receipts.',
    landmarks: 'Next to Central Pharmacy, Ground Floor West Wing.',
    routeSteps: ['From Main Reception, proceed to West Wing', 'Adjacent to Pharmacy Counter G-14', 'Billing Desk G-16']
  },
  {
    id: 'loc-lab-1',
    name: 'Central Pathology & Blood Diagnostics Lab',
    building: 'Diagnostic Block',
    floor: '1st Floor',
    roomNumber: '108 (Diagnostic Wing)',
    department: 'Pathology & Diagnostics',
    category: 'Diagnostics',
    description: 'Phlebotomy blood draws, clinical biochemistry, urine analysis, and rapid automated analyzers.',
    landmarks: '1st Floor Diagnostic Wing, directly opposite Lift Lobby B.',
    routeSteps: ['Take Lift B from Ground Floor to 1st Floor', 'Exit Lift and turn Right', 'Enter Diagnostic Reception Room 108']
  },
  {
    id: 'loc-rad-1',
    name: 'Radiology, X-Ray, CT Scan & MRI Imaging',
    building: 'Diagnostic Block',
    floor: 'Basement',
    roomNumber: 'B-04 (Imaging Suite)',
    department: 'Radiology & Imaging',
    category: 'Diagnostics',
    description: '3 Tesla MRI scanner, 128-slice CT scan, digital X-rays, ultrasound, and echocardiography suites.',
    landmarks: 'Basement Level 1 via Dedicated Diagnostic Elevator B.',
    routeSteps: ['Take Diagnostic Lift B down to Basement (B1)', 'Follow Yellow Imaging Line to Suite B-04']
  },
  {
    id: 'loc-doc-cardio-1',
    name: 'OPD Room 204 (Cardiology & Heart Clinic)',
    building: 'Main Hospital Building',
    floor: '2nd Floor',
    roomNumber: '204',
    department: 'Cardiology',
    category: 'Clinical',
    description: 'Consultation room for Dr. Alexander Wright, MD (Cardiologist). ECG & cardiac vitals station.',
    landmarks: '2nd floor Cardiology Wing, 3rd door on the right after Elevator A.',
    routeSteps: ['Take Elevator A to 2nd Floor', 'Turn Right into Cardiology Clinic Corridor', 'Proceed to Room 204'],
    doctorId: 'demo-doctor'
  },
  {
    id: 'loc-doc-cardio-2',
    name: 'OPD Room 206 (Interventional Cardiology)',
    building: 'Main Hospital Building',
    floor: '2nd Floor',
    roomNumber: '206',
    department: 'Cardiology',
    category: 'Clinical',
    description: 'Consultation room for Dr. Olivia Bennett, MD (Senior Interventional Cardiologist).',
    landmarks: '2nd floor Cardiology Wing, next to Room 204.',
    routeSteps: ['Take Elevator A to 2nd Floor', 'Follow Blue Cardiology Line to Room 206'],
    doctorId: 'doc-cardio-2'
  },
  {
    id: 'loc-doc-cardio-3',
    name: 'OPD Room 208 (Clinical Cardiology)',
    building: 'Main Hospital Building',
    floor: '2nd Floor',
    roomNumber: '208',
    department: 'Cardiology',
    category: 'Clinical',
    description: 'Consultation room for Dr. Sanjay Rao, MD (Consultant Cardiologist).',
    landmarks: '2nd floor Cardiology Wing, adjacent to Echocardiography Lab.',
    routeSteps: ['Take Elevator A to 2nd Floor', 'Turn Right past Room 206 to Room 208'],
    doctorId: 'doc-cardio-3'
  },
  {
    id: 'loc-doc-internal-1',
    name: 'OPD Room 102 (General OPD & Internal Medicine)',
    building: 'Main Hospital Building',
    floor: '1st Floor',
    roomNumber: '102',
    department: 'Internal Medicine',
    category: 'Clinical',
    description: 'Consultation room for Dr. Marcus Brody, MD (Consultant Physician).',
    landmarks: '1st floor Medical OPD Corridor, near Nurse Station 1A.',
    routeSteps: ['Take Main Staircase / Lift to 1st Floor', 'Turn Left toward Medical OPD', 'Enter Room 102'],
    doctorId: 'doc-internal-1'
  },
  {
    id: 'loc-doc-internal-2',
    name: 'OPD Room 104 (Diabetes & Internal Medicine)',
    building: 'Main Hospital Building',
    floor: '1st Floor',
    roomNumber: '104',
    department: 'Internal Medicine',
    category: 'Clinical',
    description: 'Consultation room for Dr. Anita Sharma, MD (Diabetologist & Physician).',
    landmarks: '1st floor Medical OPD, next to Room 102.',
    routeSteps: ['Take Lift to 1st Floor', 'Follow Green OPD Signage to Room 104'],
    doctorId: 'doc-internal-2'
  },
  {
    id: 'loc-doc-ortho-1',
    name: 'OPD Room 301 (Orthopedics & Joint Clinic)',
    building: 'Main Hospital Building',
    floor: '3rd Floor',
    roomNumber: '301',
    department: 'Orthopedics',
    category: 'Clinical',
    description: 'Consultation room for Dr. Vikram Patel, MS (Orthopedic Surgeon). Plaster & splinting unit.',
    landmarks: '3rd Floor Surgical & Orthopedics Wing, immediately next to Elevator C.',
    routeSteps: ['Take Elevator C to 3rd Floor', 'Turn Left into Orthopedics Wing', 'Enter Room 301'],
    doctorId: 'doc-ortho-1'
  },
  {
    id: 'loc-doc-peds-1',
    name: 'OPD Room 112 (Pediatrics & Child Wellness)',
    building: 'Main Hospital Building',
    floor: '1st Floor',
    roomNumber: '112',
    department: 'Pediatrics',
    category: 'Clinical',
    description: 'Consultation room for Dr. Meera Nair, MD (Senior Pediatrician). Kids play & vaccination area.',
    landmarks: '1st Floor South Wing, next to Pediatric Playroom.',
    routeSteps: ['Take Lift to 1st Floor', 'Head South to Pediatric Play Lounge', 'Enter Room 112'],
    doctorId: 'doc-peds-1'
  },
  {
    id: 'loc-doc-neuro-1',
    name: 'OPD Room 210 (Neurology & Neuro-sciences)',
    building: 'Main Hospital Building',
    floor: '2nd Floor',
    roomNumber: '210',
    department: 'Neurology',
    category: 'Clinical',
    description: 'Consultation room for Dr. Rohan Verma, DM (Neurologist). EEG & nerve conduction test unit.',
    landmarks: '2nd Floor East Corridor, near Cardiac & Neuro Lounge.',
    routeSteps: ['Take Elevator A to 2nd Floor', 'Follow Violet Neuro Line to Room 210'],
    doctorId: 'doc-neuro-1'
  },
  {
    id: 'loc-doc-derm-1',
    name: 'OPD Room 118 (Dermatology & Skin Clinic)',
    building: 'Main Hospital Building',
    floor: '1st Floor',
    roomNumber: '118',
    department: 'Dermatology',
    category: 'Clinical',
    description: 'Consultation room for Dr. Maya Sen, MD (Dermatologist). Laser & skin procedure room.',
    landmarks: '1st Floor West Corridor, opposite Minor OT 2.',
    routeSteps: ['Take Lift to 1st Floor', 'Turn Right toward West Wing', 'Enter Room 118'],
    doctorId: 'doc-derm-1'
  },
  {
    id: 'loc-doc-ent-1',
    name: 'OPD Room 120 (ENT & Head-Neck Suite)',
    building: 'Main Hospital Building',
    floor: '1st Floor',
    roomNumber: '120',
    department: 'ENT',
    category: 'Clinical',
    description: 'Consultation room for Dr. Rajesh Kothari, MS (ENT Specialist). Audiometry & endoscopy booth.',
    landmarks: '1st Floor West Wing, next to Dermatology Clinic.',
    routeSteps: ['Take Lift to 1st Floor', 'Follow Orange Sign to Room 120'],
    doctorId: 'doc-ent-1'
  },
  {
    id: 'loc-ward-4b',
    name: 'Inpatient Medical/Surgical Ward 4B',
    building: 'Main Hospital Building',
    floor: '4th Floor',
    roomNumber: 'Ward 4B (Beds 401 - 424)',
    department: 'Inpatient Nursing',
    category: 'Wards',
    description: 'Inpatient recovery ward with central telemetry nursing station managed by Elena Rostova, RN.',
    landmarks: '4th Floor Central Core, accessed via Inpatient Ward Elevators.',
    routeSteps: ['Take Inpatient Lift to 4th Floor', 'Pass Visitor Security Desk', 'Enter Ward 4B Central Hub']
  },
  {
    id: 'loc-cafeteria',
    name: 'CareLink Wellness Cafeteria & Lounge',
    building: 'Main Hospital Building',
    floor: 'Ground Floor',
    roomNumber: 'Courtyard Wing',
    department: 'Amenities',
    category: 'Amenities',
    description: 'Fresh organic meals, hot beverages, dietary snacks, and visitor relaxation garden.',
    landmarks: 'Ground Floor North Courtyard, past the Pharmacy glass walkway.',
    routeSteps: ['From Main Entrance, walk North through Courtyard Glass Corridor', 'Enter Cafeteria']
  }
]

// ============================================================================
// HOSPITAL SERVICES MODELS
// ============================================================================
export interface HospitalService {
  id: string
  name: string
  department: string
  category: string
  description: string
  locationName: string
  floor: string
  roomNumber: string
  operatingHours: string
  availableDoctors: string[]
  supportsAppointment: boolean
  phoneContact?: string
}

export const INITIAL_HOSPITAL_SERVICES: HospitalService[] = [
  {
    id: 'srv-cardio',
    name: 'Cardiology & Heart Care Diagnostics',
    department: 'Cardiology',
    category: 'Clinical Specialty',
    description: 'Complete cardiac evaluation including 12-lead ECG, 2D Echocardiography, Holter monitoring, treadmill stress tests, and preventive hypertension management.',
    locationName: 'OPD Room 204 (Cardiology Wing)',
    floor: '2nd Floor',
    roomNumber: '204, 206, 208',
    operatingHours: '08:00 AM - 08:00 PM (Mon - Sat)',
    availableDoctors: ['Dr. Alexander Wright, MD', 'Dr. Olivia Bennett, MD', 'Dr. Sanjay Rao, MD'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11223'
  },
  {
    id: 'srv-internal',
    name: 'General Internal Medicine & Diabetes Clinic',
    department: 'Internal Medicine',
    category: 'Primary & Specialty Care',
    description: 'Comprehensive adult medical consultations, fever evaluation, diabetes mellitus titration, thyroid disorder management, and annual executive health checkups.',
    locationName: 'OPD Room 102 & 104',
    floor: '1st Floor',
    roomNumber: '102, 104',
    operatingHours: '08:30 AM - 06:00 PM (Mon - Sat)',
    availableDoctors: ['Dr. Marcus Brody, MD', 'Dr. Anita Sharma, MD'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11226'
  },
  {
    id: 'srv-emergency',
    name: 'STAT 24/7 Emergency & Trauma Resuscitation',
    department: 'Emergency Medicine',
    category: 'Emergency Services',
    description: 'Round-the-clock emergency medical triage, rapid acute cardiac care, trauma resuscitation, stroke intervention, and critical life support with on-call surgical teams.',
    locationName: 'Emergency Trauma Block',
    floor: 'Ground Floor',
    roomNumber: 'ER-100',
    operatingHours: '24 Hours / 7 Days Open',
    availableDoctors: ['On-Duty Emergency Trauma Physicians & Surgeons'],
    supportsAppointment: false,
    phoneContact: '+91 98450 11999 (Emergency Hotline)'
  },
  {
    id: 'srv-ortho',
    name: 'Orthopedics, Joint Replacement & Trauma Care',
    department: 'Orthopedics',
    category: 'Surgical Specialty',
    description: 'Bone, joint, and spine treatments, arthroscopy, joint replacement consultations, fracture casting, sports injury rehabilitation, and arthritis management.',
    locationName: 'OPD Room 301 & 303',
    floor: '3rd Floor',
    roomNumber: '301, 303',
    operatingHours: '09:00 AM - 05:00 PM (Mon - Fri)',
    availableDoctors: ['Dr. Vikram Patel, MS', 'Dr. David Miller, MS'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11228'
  },
  {
    id: 'srv-peds',
    name: 'Pediatrics, Neonatal Care & Vaccinations',
    department: 'Pediatrics',
    category: 'Child Care',
    description: 'Newborn and adolescent healthcare, growth milestone tracking, mandatory immunization schedules, pediatric infectious disease management, and child nutrition.',
    locationName: 'OPD Room 112 & 114',
    floor: '1st Floor',
    roomNumber: '112, 114',
    operatingHours: '09:00 AM - 06:00 PM (Mon - Sat)',
    availableDoctors: ['Dr. Meera Nair, MD', 'Dr. Ethan Cruz, MD'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11230'
  },
  {
    id: 'srv-neuro',
    name: 'Neurology, Headache & Stroke Clinic',
    department: 'Neurology',
    category: 'Clinical Specialty',
    description: 'Specialized diagnosis and treatment of epilepsy, migraines, Parkinson disease, neuropathy, neuromuscular disorders, and computerized EEG testing.',
    locationName: 'OPD Room 210',
    floor: '2nd Floor',
    roomNumber: '210',
    operatingHours: '10:00 AM - 04:00 PM (Mon - Thu)',
    availableDoctors: ['Dr. Rohan Verma, MD, DM'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11232'
  },
  {
    id: 'srv-derm',
    name: 'Dermatology, Skin & Cosmetology Clinic',
    department: 'Dermatology',
    category: 'Clinical Specialty',
    description: 'Clinical dermatology for eczema, psoriasis, acne therapy, hair & nail disorders, allergy skin patch testing, and minor outpatient skin procedures.',
    locationName: 'OPD Room 118',
    floor: '1st Floor',
    roomNumber: '118',
    operatingHours: '09:30 AM - 05:30 PM (Mon - Fri)',
    availableDoctors: ['Dr. Maya Sen, MD'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11233'
  },
  {
    id: 'srv-ent',
    name: 'ENT, Sinus & Audiology Head-Neck Clinic',
    department: 'ENT',
    category: 'Clinical Specialty',
    description: 'Ear, nose, and throat evaluations, diagnostic nasal endoscopy, hearing audiometry assessments, vertigo management, and allergic rhinitis care.',
    locationName: 'OPD Room 120',
    floor: '1st Floor',
    roomNumber: '120',
    operatingHours: '09:00 AM - 04:30 PM (Mon - Sat)',
    availableDoctors: ['Dr. Rajesh Kothari, MS'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11234'
  },
  {
    id: 'srv-pharmacy',
    name: 'Central Inpatient & Outpatient Pharmacy',
    department: 'Pharmacy',
    category: 'Diagnostic & Support',
    description: 'Dispensing authentic pharmaceutical medications, antibiotics, emergency injectables, sterile intravenous solutions, and patient drug counseling.',
    locationName: 'Central Dispensary Counter G-14',
    floor: 'Ground Floor',
    roomNumber: 'G-14',
    operatingHours: '24 Hours / 7 Days Open',
    availableDoctors: ['Licensed Clinical Pharmacists & Dispensary Staff'],
    supportsAppointment: false,
    phoneContact: '+91 98450 11250'
  },
  {
    id: 'srv-lab',
    name: 'Pathology & Diagnostic Laboratory Services',
    department: 'Diagnostics',
    category: 'Diagnostic & Support',
    description: 'Comprehensive biochemical blood profiles, CBC, HbA1c, lipid profiles, thyroid panels, microbiology cultures, and rapid automated emergency lab turnaround.',
    locationName: 'Diagnostic Block Room 108',
    floor: '1st Floor',
    roomNumber: '108',
    operatingHours: '07:00 AM - 09:00 PM (Emergency 24/7)',
    availableDoctors: ['Pathologists & Medical Laboratory Scientists'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11260'
  },
  {
    id: 'srv-radiology',
    name: 'Radiology, MRI, CT Scan & Digital X-Ray',
    department: 'Diagnostics',
    category: 'Imaging Specialty',
    description: 'State-of-the-art diagnostic imaging including high-resolution MRI, CT angiography, digital chest X-rays, abdominal ultrasound, and Doppler studies.',
    locationName: 'Imaging Suite B-04',
    floor: 'Basement Level 1',
    roomNumber: 'B-04',
    operatingHours: '08:00 AM - 08:00 PM (Emergency 24/7)',
    availableDoctors: ['Consultant Radiologists & Sonographers'],
    supportsAppointment: true,
    phoneContact: '+91 98450 11270'
  },
  {
    id: 'srv-billing',
    name: 'Patient Billing & Insurance Cashless Gateway',
    department: 'Billing',
    category: 'Financial Services',
    description: 'Real-time billing settlements, itemized invoice issuance, UPI/Card payment terminals, cashless insurance TPA approvals, and financial counseling.',
    locationName: 'Billing & Cashier Desk G-16',
    floor: 'Ground Floor',
    roomNumber: 'G-16',
    operatingHours: '08:00 AM - 10:00 PM (24/7 Cashier on duty)',
    availableDoctors: ['Billing Staff & Claims Counselors'],
    supportsAppointment: false,
    phoneContact: '+91 98450 11280'
  }
]

// LocalStorage helpers for Hospital Locations
export function getStoredHospitalLocations(): HospitalLocation[] {
  if (typeof window === 'undefined') return INITIAL_HOSPITAL_LOCATIONS
  try {
    const raw = localStorage.getItem('carelink_hospital_locations')
    return raw ? JSON.parse(raw) : INITIAL_HOSPITAL_LOCATIONS
  } catch {
    return INITIAL_HOSPITAL_LOCATIONS
  }
}

export function saveHospitalLocations(locs: HospitalLocation[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_hospital_locations', JSON.stringify(locs))
  }
}

// LocalStorage helpers for Hospital Services
export function getStoredHospitalServices(): HospitalService[] {
  if (typeof window === 'undefined') return INITIAL_HOSPITAL_SERVICES
  try {
    const raw = localStorage.getItem('carelink_hospital_services')
    return raw ? JSON.parse(raw) : INITIAL_HOSPITAL_SERVICES
  } catch {
    return INITIAL_HOSPITAL_SERVICES
  }
}

export function saveHospitalServices(srvs: HospitalService[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('carelink_hospital_services', JSON.stringify(srvs))
  }
}

// ============================================================================
// APPOINTMENT TIME SLOT GENERATION & REAL-TIME VALIDATION RULES
// ============================================================================
export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'EXPIRED' | 'UNAVAILABLE' | 'DOCTOR_ON_LEAVE'

export interface DoctorTimeSlot {
  time: string
  time24: string
  status: SlotStatus
  reason?: string
}

export const STANDARD_CLINIC_SLOTS = [
  { time: '09:00 AM', time24: '09:00', minutes: 9 * 60 },
  { time: '09:30 AM', time24: '09:30', minutes: 9 * 60 + 30 },
  { time: '10:00 AM', time24: '10:00', minutes: 10 * 60 },
  { time: '10:30 AM', time24: '10:30', minutes: 10 * 60 + 30 },
  { time: '11:00 AM', time24: '11:00', minutes: 11 * 60 },
  { time: '11:30 AM', time24: '11:30', minutes: 11 * 60 + 30 },
  { time: '12:00 PM', time24: '12:00', minutes: 12 * 60 },
  { time: '12:30 PM', time24: '12:30', minutes: 12 * 60 + 30 },
  { time: '02:00 PM', time24: '14:00', minutes: 14 * 60 },
  { time: '02:30 PM', time24: '14:30', minutes: 14 * 60 + 30 },
  { time: '03:00 PM', time24: '15:00', minutes: 15 * 60 },
  { time: '03:30 PM', time24: '15:30', minutes: 15 * 60 + 30 },
  { time: '04:00 PM', time24: '16:00', minutes: 16 * 60 },
  { time: '04:30 PM', time24: '16:30', minutes: 16 * 60 + 30 },
  { time: '05:00 PM', time24: '17:00', minutes: 17 * 60 }
]

export function parseSlotTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 0
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

export function getTodayDateIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function generateDoctorTimeSlots(
  doctorId: string,
  dateStr: string,
  existingAppointments?: AppointmentRequest[],
  leaveRequests?: LeaveRequest[]
): DoctorTimeSlot[] {
  const allAppts = existingAppointments || getStoredAppointments()
  const allLeaves = leaveRequests || getStoredLeaveRequests()
  const todayIso = getTodayDateIso()

  // 1. Check if date is in the past
  const isPastDate = dateStr < todayIso
  const isToday = dateStr === todayIso

  const now = new Date()
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes()

  // 2. Check if doctor is on approved leave on dateStr
  const isDoctorOnLeave = allLeaves.some((l) => {
    if (l.status !== 'approved' && l.status !== 'pending') return false
    const matchDoc = l.staffId === doctorId || l.staffRole?.toLowerCase().includes('doctor')
    if (!matchDoc) return false
    return dateStr >= l.startDate && dateStr <= l.endDate
  })

  return STANDARD_CLINIC_SLOTS.map((slot) => {
    // If date is completely in the past
    if (isPastDate) {
      return {
        time: slot.time,
        time24: slot.time24,
        status: 'EXPIRED',
        reason: 'Selected date has already passed.'
      }
    }

    // If date is today, check if this time slot is in the past
    if (isToday && slot.minutes <= currentMinutesFromMidnight) {
      return {
        time: slot.time,
        time24: slot.time24,
        status: 'EXPIRED',
        reason: 'Time slot has expired for today.'
      }
    }

    // If doctor is on leave
    if (isDoctorOnLeave) {
      return {
        time: slot.time,
        time24: slot.time24,
        status: 'DOCTOR_ON_LEAVE',
        reason: 'Doctor is on scheduled leave on this date.'
      }
    }

    // Check if slot is already booked by an active appointment
    const isBooked = allAppts.some((a) => {
      const matchDoc = a.doctorId === doctorId
      const matchDate = a.requestedDate === dateStr
      const matchTime = a.requestedTime?.trim().toLowerCase() === slot.time.trim().toLowerCase()
      const isActive = a.status !== 'cancelled' && a.status !== 'rejected'
      return matchDoc && matchDate && matchTime && isActive
    })

    if (isBooked) {
      return {
        time: slot.time,
        time24: slot.time24,
        status: 'BOOKED',
        reason: 'Slot is already booked by another patient.'
      }
    }

    return {
      time: slot.time,
      time24: slot.time24,
      status: 'AVAILABLE'
    }
  })
}

// Backend-style Appointment Validation Rule
export function validateAppointmentBooking(
  doctorId: string,
  dateStr: string,
  timeStr: string,
  existingAppointments?: AppointmentRequest[],
  leaveRequests?: LeaveRequest[]
): { isValid: boolean; error?: string } {
  if (!doctorId || !dateStr || !timeStr) {
    return { isValid: false, error: 'Doctor, appointment date, and time slot are required.' }
  }

  const todayIso = getTodayDateIso()
  if (dateStr < todayIso) {
    return { isValid: false, error: 'Appointment date cannot be in the past. Please select a valid future date.' }
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const slotMinutes = parseSlotTimeToMinutes(timeStr)

  if (dateStr === todayIso && slotMinutes <= currentMinutes) {
    return {
      isValid: false,
      error: `The selected time slot (${timeStr}) has already passed for today. Please select a future time slot.`
    }
  }

  const allLeaves = leaveRequests || getStoredLeaveRequests()
  const isDoctorOnLeave = allLeaves.some((l) => {
    if (l.status !== 'approved') return false
    const matchDoc = l.staffId === doctorId
    return matchDoc && dateStr >= l.startDate && dateStr <= l.endDate
  })

  if (isDoctorOnLeave) {
    return {
      isValid: false,
      error: 'The selected doctor is on approved leave on this date. Please choose another date or doctor.'
    }
  }

  const allAppts = existingAppointments || getStoredAppointments()
  const doubleBooked = allAppts.some((a) => {
    const matchDoc = a.doctorId === doctorId
    const matchDate = a.requestedDate === dateStr
    const matchTime = a.requestedTime?.trim().toLowerCase() === timeStr.trim().toLowerCase()
    const isActive = a.status !== 'cancelled' && a.status !== 'rejected'
    return matchDoc && matchDate && matchTime && isActive
  })

  if (doubleBooked) {
    return {
      isValid: false,
      error: 'This appointment slot is no longer available as another patient has just booked it. Please choose another slot.'
    }
  }

  return { isValid: true }
}


