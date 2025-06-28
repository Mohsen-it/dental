import { v4 as uuidv4 } from 'uuid'
import type {
  Patient,
  Appointment,
  Payment,
  Treatment,
  InventoryItem,
  ClinicSettings,
  Lab,
  LabOrder,
  Medication,
  Prescription,
  ToothTreatment,
  ClinicNeed,
  DatabaseSchema
} from '../types'

// Mock Patients Data
export const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    serial_number: 'P001',
    full_name: 'أحمد محمد علي',
    gender: 'male',
    age: 35,
    patient_condition: 'جيد',
    allergies: 'لا يوجد',
    medical_conditions: 'لا يوجد',
    email: 'ahmed@example.com',
    address: 'الرياض، المملكة العربية السعودية',
    phone: '+966501234567',
    notes: 'مريض منتظم، يحتاج متابعة دورية',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'patient-2',
    serial_number: 'P002',
    full_name: 'فاطمة أحمد السالم',
    gender: 'female',
    age: 28,
    patient_condition: 'ممتاز',
    allergies: 'حساسية من البنسلين',
    medical_conditions: 'ضغط دم مرتفع',
    email: 'fatima@example.com',
    address: 'جدة، المملكة العربية السعودية',
    phone: '+966507654321',
    notes: 'تحتاج عناية خاصة بسبب الحساسية',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'patient-3',
    serial_number: 'P003',
    full_name: 'محمد عبدالله الخالد',
    gender: 'male',
    age: 42,
    patient_condition: 'جيد',
    allergies: 'لا يوجد',
    medical_conditions: 'سكري نوع 2',
    email: 'mohammed@example.com',
    address: 'الدمام، المملكة العربية السعودية',
    phone: '+966512345678',
    notes: 'يحتاج مراقبة مستوى السكر قبل العلاج',
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-01T09:15:00Z'
  },
  {
    id: 'patient-4',
    serial_number: 'P004',
    full_name: 'نورا سعد المطيري',
    gender: 'female',
    age: 31,
    patient_condition: 'جيد',
    allergies: 'لا يوجد',
    medical_conditions: 'لا يوجد',
    email: 'nora@example.com',
    address: 'مكة المكرمة، المملكة العربية السعودية',
    phone: '+966598765432',
    notes: 'مريضة جديدة، أول زيارة',
    created_at: '2024-02-10T11:45:00Z',
    updated_at: '2024-02-10T11:45:00Z'
  },
  {
    id: 'patient-5',
    serial_number: 'P005',
    full_name: 'خالد عبدالرحمن النصر',
    gender: 'male',
    age: 55,
    patient_condition: 'متوسط',
    allergies: 'حساسية من اللاتكس',
    medical_conditions: 'أمراض قلب',
    email: 'khalid@example.com',
    address: 'المدينة المنورة، المملكة العربية السعودية',
    phone: '+966523456789',
    notes: 'يحتاج استشارة طبيب القلب قبل العلاجات الكبيرة',
    created_at: '2024-02-15T16:20:00Z',
    updated_at: '2024-02-15T16:20:00Z'
  }
]

// Mock Treatments Data
export const mockTreatments: Treatment[] = [
  {
    id: 'treatment-1',
    name: 'تنظيف الأسنان',
    description: 'تنظيف شامل للأسنان وإزالة الجير',
    default_cost: 200,
    duration_minutes: 45,
    category: 'وقائي',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'treatment-2',
    name: 'حشو أسنان',
    description: 'حشو الأسنان المتضررة',
    default_cost: 150,
    duration_minutes: 60,
    category: 'علاجي',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'treatment-3',
    name: 'علاج عصب',
    description: 'علاج عصب السن',
    default_cost: 800,
    duration_minutes: 120,
    category: 'علاجي',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'treatment-4',
    name: 'تركيب تاج',
    description: 'تركيب تاج للسن',
    default_cost: 1200,
    duration_minutes: 90,
    category: 'تجميلي',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'treatment-5',
    name: 'قلع سن',
    description: 'قلع السن المتضرر',
    default_cost: 100,
    duration_minutes: 30,
    category: 'جراحي',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'treatment-6',
    name: 'تبييض الأسنان',
    description: 'تبييض الأسنان بالليزر',
    default_cost: 600,
    duration_minutes: 75,
    category: 'تجميلي',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock Appointments Data
export const mockAppointments: Appointment[] = [
  {
    id: 'appointment-1',
    patient_id: 'patient-1',
    treatment_id: 'treatment-1',
    title: 'تنظيف أسنان - أحمد محمد علي',
    description: 'جلسة تنظيف دورية',
    start_time: '2024-06-29T09:00:00Z',
    end_time: '2024-06-29T09:45:00Z',
    status: 'scheduled',
    cost: 200,
    notes: 'مريض منتظم',
    created_at: '2024-06-25T10:00:00Z',
    updated_at: '2024-06-25T10:00:00Z'
  },
  {
    id: 'appointment-2',
    patient_id: 'patient-2',
    treatment_id: 'treatment-2',
    title: 'حشو أسنان - فاطمة أحمد السالم',
    description: 'حشو السن رقم 14',
    start_time: '2024-06-29T10:30:00Z',
    end_time: '2024-06-29T11:30:00Z',
    status: 'completed',
    cost: 150,
    notes: 'تم الحشو بنجاح',
    created_at: '2024-06-20T14:30:00Z',
    updated_at: '2024-06-29T11:30:00Z'
  },
  {
    id: 'appointment-3',
    patient_id: 'patient-3',
    treatment_id: 'treatment-3',
    title: 'علاج عصب - محمد عبدالله الخالد',
    description: 'علاج عصب السن رقم 16',
    start_time: '2024-06-30T14:00:00Z',
    end_time: '2024-06-30T16:00:00Z',
    status: 'scheduled',
    cost: 800,
    notes: 'جلسة أولى من علاج العصب',
    created_at: '2024-06-22T09:15:00Z',
    updated_at: '2024-06-22T09:15:00Z'
  },
  {
    id: 'appointment-4',
    patient_id: 'patient-4',
    treatment_id: 'treatment-6',
    title: 'تبييض أسنان - نورا سعد المطيري',
    description: 'جلسة تبييض بالليزر',
    start_time: '2024-07-01T11:00:00Z',
    end_time: '2024-07-01T12:15:00Z',
    status: 'scheduled',
    cost: 600,
    notes: 'أول جلسة تبييض',
    created_at: '2024-06-28T11:45:00Z',
    updated_at: '2024-06-28T11:45:00Z'
  },
  {
    id: 'appointment-5',
    patient_id: 'patient-5',
    treatment_id: 'treatment-1',
    title: 'تنظيف أسنان - خالد عبدالرحمن النصر',
    description: 'تنظيف دوري مع فحص شامل',
    start_time: '2024-07-02T09:30:00Z',
    end_time: '2024-07-02T10:15:00Z',
    status: 'scheduled',
    cost: 200,
    notes: 'فحص دوري مع مراعاة حالة القلب',
    created_at: '2024-06-26T16:20:00Z',
    updated_at: '2024-06-26T16:20:00Z'
  }
]

// Mock Payments Data
export const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    patient_id: 'patient-1',
    appointment_id: 'appointment-1',
    amount: 200,
    payment_method: 'cash',
    payment_date: '2024-06-29T09:45:00Z',
    description: 'دفع تنظيف الأسنان',
    receipt_number: 'REC-001',
    status: 'completed',
    notes: 'دفع نقدي كامل',
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 200,
    appointment_total_cost: 200,
    appointment_total_paid: 200,
    appointment_remaining_balance: 0,
    created_at: '2024-06-29T09:45:00Z',
    updated_at: '2024-06-29T09:45:00Z'
  },
  {
    id: 'payment-2',
    patient_id: 'patient-2',
    appointment_id: 'appointment-2',
    amount: 150,
    payment_method: 'bank_transfer',
    payment_date: '2024-06-29T11:30:00Z',
    description: 'دفع حشو الأسنان',
    receipt_number: 'REC-002',
    status: 'completed',
    notes: 'تحويل بنكي',
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 150,
    appointment_total_cost: 150,
    appointment_total_paid: 150,
    appointment_remaining_balance: 0,
    created_at: '2024-06-29T11:30:00Z',
    updated_at: '2024-06-29T11:30:00Z'
  },
  {
    id: 'payment-3',
    patient_id: 'patient-3',
    appointment_id: 'appointment-3',
    amount: 400,
    payment_method: 'cash',
    payment_date: '2024-06-22T09:15:00Z',
    description: 'دفعة أولى لعلاج العصب',
    receipt_number: 'REC-003',
    status: 'partial',
    notes: 'دفعة أولى من إجمالي 800 ريال',
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 400,
    appointment_total_cost: 800,
    appointment_total_paid: 400,
    appointment_remaining_balance: 400,
    created_at: '2024-06-22T09:15:00Z',
    updated_at: '2024-06-22T09:15:00Z'
  }
]

// Mock Inventory Data
export const mockInventory: InventoryItem[] = [
  {
    id: 'inventory-1',
    name: 'حشوات مركبة',
    description: 'حشوات أسنان مركبة بيضاء',
    category: 'مواد حشو',
    quantity: 50,
    unit: 'قطعة',
    cost_per_unit: 25,
    supplier: 'شركة المواد الطبية المتقدمة',
    expiry_date: '2025-12-31',
    minimum_stock: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'inventory-2',
    name: 'مخدر موضعي',
    description: 'مخدر موضعي للأسنان',
    category: 'أدوية',
    quantity: 30,
    unit: 'أمبولة',
    cost_per_unit: 15,
    supplier: 'شركة الأدوية الحديثة',
    expiry_date: '2025-06-30',
    minimum_stock: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'inventory-3',
    name: 'قفازات طبية',
    description: 'قفازات طبية معقمة',
    category: 'مستلزمات',
    quantity: 200,
    unit: 'زوج',
    cost_per_unit: 2,
    supplier: 'شركة المستلزمات الطبية',
    expiry_date: '2026-01-31',
    minimum_stock: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'inventory-4',
    name: 'أدوات تنظيف',
    description: 'أدوات تنظيف الأسنان المعدنية',
    category: 'أدوات',
    quantity: 15,
    unit: 'مجموعة',
    cost_per_unit: 120,
    supplier: 'شركة الأدوات الطبية المتخصصة',
    minimum_stock: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  }
]

// Mock Labs Data
export const mockLabs: Lab[] = [
  {
    id: 'lab-1',
    name: 'مختبر الأسنان المتقدم',
    contact_person: 'أحمد التقني',
    phone: '+966511111111',
    email: 'info@advanceddentallab.com',
    address: 'الرياض، حي الملك فهد',
    services: 'تيجان، جسور، أطقم أسنان',
    notes: 'مختبر موثوق مع خدمة سريعة',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'lab-2',
    name: 'مختبر الابتسامة الذهبية',
    contact_person: 'محمد الفني',
    phone: '+966522222222',
    email: 'contact@goldensmilelab.com',
    address: 'جدة، حي الزهراء',
    services: 'تقويم، تبييض، زراعة',
    notes: 'متخصص في التقويم والزراعة',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock Lab Orders Data
export const mockLabOrders: LabOrder[] = [
  {
    id: 'lab-order-1',
    lab_id: 'lab-1',
    patient_id: 'patient-1',
    appointment_id: 'appointment-1',
    service_name: 'تاج خزفي',
    cost: 500,
    order_date: '2024-06-25T00:00:00Z',
    expected_delivery_date: '2024-07-05T00:00:00Z',
    status: 'معلق',
    notes: 'تاج للسن رقم 14',
    paid_amount: 250,
    remaining_balance: 250,
    created_at: '2024-06-25T00:00:00Z',
    updated_at: '2024-06-25T00:00:00Z'
  }
]

// Mock Medications Data
export const mockMedications: Medication[] = [
  {
    id: 'medication-1',
    name: 'أموكسيسيلين 500 مجم',
    instructions: 'كبسولة كل 8 ساعات لمدة 7 أيام',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'medication-2',
    name: 'إيبوبروفين 400 مجم',
    instructions: 'قرص كل 6 ساعات عند الحاجة للألم',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'medication-3',
    name: 'غسول فم مطهر',
    instructions: 'مضمضة مرتين يومياً لمدة أسبوع',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock Tooth Treatments Data
export const mockToothTreatments: ToothTreatment[] = [
  {
    id: 'tooth-treatment-1',
    patient_id: 'patient-1',
    tooth_number: 16,
    tooth_name: 'رحى أولى علوية يمين',
    treatment_type: 'حشو مركب',
    treatment_category: 'علاجي',
    treatment_status: 'completed',
    treatment_color: '#3b82f6',
    start_date: '2024-06-15',
    completion_date: '2024-06-15',
    cost: 150,
    priority: 1,
    notes: 'حشو مركب أبيض للسن 16',
    appointment_id: 'appointment-1',
    created_at: '2024-06-15T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z'
  },
  {
    id: 'tooth-treatment-2',
    patient_id: 'patient-2',
    tooth_number: 26,
    tooth_name: 'رحى أولى علوية يسار',
    treatment_type: 'علاج عصب',
    treatment_category: 'علاجي',
    treatment_status: 'in_progress',
    treatment_color: '#ef4444',
    start_date: '2024-06-20',
    cost: 800,
    priority: 1,
    notes: 'علاج عصب للسن 26 - جلسة أولى',
    appointment_id: 'appointment-2',
    created_at: '2024-06-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'tooth-treatment-3',
    patient_id: 'patient-3',
    tooth_number: 11,
    tooth_name: 'قاطع مركزي علوي يمين',
    treatment_type: 'تنظيف',
    treatment_category: 'وقائي',
    treatment_status: 'completed',
    treatment_color: '#22c55e',
    start_date: '2024-06-10',
    completion_date: '2024-06-10',
    cost: 100,
    priority: 1,
    notes: 'تنظيف دوري',
    created_at: '2024-06-10T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z'
  },
  {
    id: 'tooth-treatment-4',
    patient_id: 'patient-4',
    tooth_number: 21,
    tooth_name: 'قاطع مركزي علوي يسار',
    treatment_type: 'تبييض',
    treatment_category: 'تجميلي',
    treatment_status: 'planned',
    treatment_color: '#8b5cf6',
    cost: 300,
    priority: 1,
    notes: 'تبييض السن الأمامي',
    created_at: '2024-06-25T00:00:00Z',
    updated_at: '2024-06-25T00:00:00Z'
  },
  {
    id: 'tooth-treatment-5',
    patient_id: 'patient-5',
    tooth_number: 36,
    tooth_name: 'رحى أولى سفلية يمين',
    treatment_type: 'تاج',
    treatment_category: 'تجميلي',
    treatment_status: 'planned',
    treatment_color: '#f59e0b',
    cost: 1200,
    priority: 1,
    notes: 'تركيب تاج خزفي',
    created_at: '2024-06-28T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  }
]

// Mock Clinic Needs Data
export const mockClinicNeeds: ClinicNeed[] = [
  {
    id: 'need-1',
    item_name: 'كرسي أسنان جديد',
    description: 'كرسي أسنان كهربائي حديث',
    category: 'معدات',
    priority: 'high',
    estimated_cost: 15000,
    status: 'pending',
    notes: 'الكرسي الحالي يحتاج استبدال',
    created_at: '2024-06-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'need-2',
    item_name: 'جهاز أشعة رقمي',
    description: 'جهاز أشعة أسنان رقمي',
    category: 'تقنية',
    priority: 'medium',
    estimated_cost: 25000,
    status: 'approved',
    notes: 'لتحسين جودة التشخيص',
    created_at: '2024-06-15T00:00:00Z',
    updated_at: '2024-06-25T00:00:00Z'
  }
]

// Mock Clinic Settings
export const mockSettings: ClinicSettings = {
  id: 'clinic_settings',
  clinic_name: 'عيادة الابتسامة الطبية',
  doctor_name: 'د. محمد أحمد الطبيب',
  clinic_address: 'الرياض، المملكة العربية السعودية',
  clinic_phone: '+966501234567',
  clinic_email: 'info@smile-clinic.com',
  clinic_logo: '',
  currency: 'SAR',
  language: 'ar',
  timezone: 'Asia/Riyadh',
  backup_frequency: 'daily',
  auto_save_interval: 300,
  appointment_duration: 60,
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  working_days: 'sunday,monday,tuesday,wednesday,thursday',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-28T00:00:00Z'
}

// Complete Mock Database Schema
export const mockDatabase: DatabaseSchema = {
  patients: mockPatients,
  appointments: mockAppointments,
  payments: mockPayments,
  treatments: mockTreatments,
  inventory: mockInventory,
  settings: [mockSettings],
  installmentPayments: [],
  patientImages: [],
  inventoryUsage: [],
  labs: mockLabs,
  labOrders: mockLabOrders,
  medications: mockMedications,
  prescriptions: [],
  prescriptionMedications: [],
  dentalTreatmentImages: [],
  toothTreatments: mockToothTreatments,
  clinicNeeds: mockClinicNeeds,
  patientTreatmentTimeline: [],
  treatmentPlans: [],
  treatmentPlanItems: []
}