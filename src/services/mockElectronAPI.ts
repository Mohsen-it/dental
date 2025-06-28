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
  DashboardStats
} from '../types'
import {
  mockPatients,
  mockAppointments,
  mockPayments,
  mockTreatments,
  mockInventory,
  mockSettings,
  mockLabs,
  mockLabOrders,
  mockMedications,
  mockClinicNeeds,
  mockToothTreatments
} from '../data/mockData'

// In-memory storage for demo
let patients = [...mockPatients]
let appointments = [...mockAppointments]
let payments = [...mockPayments]
let treatments = [...mockTreatments]
let inventory = [...mockInventory]
let settings = mockSettings
let labs = [...mockLabs]
let labOrders = [...mockLabOrders]
let medications = [...mockMedications]
let clinicNeeds = [...mockClinicNeeds]
let prescriptions: Prescription[] = []
let toothTreatments: ToothTreatment[] = [...mockToothTreatments]

// Helper function to simulate async operations
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms))

// Mock ElectronAPI implementation
export const mockElectronAPI = {
  // Patient operations
  patients: {
    getAll: async (): Promise<Patient[]> => {
      await delay()
      return [...patients]
    },

    create: async (patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> => {
      await delay()
      const now = new Date().toISOString()
      const newPatient: Patient = {
        ...patientData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      patients.push(newPatient)
      return newPatient
    },

    update: async (id: string, patientData: Partial<Patient>): Promise<Patient | null> => {
      await delay()
      const index = patients.findIndex(p => p.id === id)
      if (index === -1) return null

      const updatedPatient = {
        ...patients[index],
        ...patientData,
        updated_at: new Date().toISOString()
      }
      patients[index] = updatedPatient
      return updatedPatient
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = patients.findIndex(p => p.id === id)
      if (index === -1) return false

      patients.splice(index, 1)
      // Also remove related appointments and payments
      appointments = appointments.filter(a => a.patient_id !== id)
      payments = payments.filter(p => p.patient_id !== id)
      return true
    },

    search: async (query: string): Promise<Patient[]> => {
      await delay()
      if (!query) return [...patients]

      const lowerQuery = query.toLowerCase()
      return patients.filter(p =>
        p.full_name.toLowerCase().includes(lowerQuery) ||
        p.phone?.toLowerCase().includes(lowerQuery) ||
        p.serial_number.toLowerCase().includes(lowerQuery)
      )
    }
  },

  // Appointment operations
  appointments: {
    getAll: async (): Promise<Appointment[]> => {
      await delay()
      // Populate patient data
      return appointments.map(appointment => ({
        ...appointment,
        patient: patients.find(p => p.id === appointment.patient_id),
        treatment: treatments.find(t => t.id === appointment.treatment_id)
      }))
    },

    getByPatient: async (patientId: string): Promise<Appointment[]> => {
      await delay()
      return appointments
        .filter(a => a.patient_id === patientId)
        .map(appointment => ({
          ...appointment,
          patient: patients.find(p => p.id === appointment.patient_id),
          treatment: treatments.find(t => t.id === appointment.treatment_id)
        }))
    },

    create: async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> => {
      await delay()
      const now = new Date().toISOString()
      const newAppointment: Appointment = {
        ...appointmentData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      appointments.push(newAppointment)

      // Return with populated data
      return {
        ...newAppointment,
        patient: patients.find(p => p.id === newAppointment.patient_id),
        treatment: treatments.find(t => t.id === newAppointment.treatment_id)
      }
    },

    update: async (id: string, appointmentData: Partial<Appointment>): Promise<Appointment | null> => {
      await delay()
      const index = appointments.findIndex(a => a.id === id)
      if (index === -1) return null

      const updatedAppointment = {
        ...appointments[index],
        ...appointmentData,
        updated_at: new Date().toISOString()
      }
      appointments[index] = updatedAppointment

      // Return with populated data
      return {
        ...updatedAppointment,
        patient: patients.find(p => p.id === updatedAppointment.patient_id),
        treatment: treatments.find(t => t.id === updatedAppointment.treatment_id)
      }
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = appointments.findIndex(a => a.id === id)
      if (index === -1) return false

      appointments.splice(index, 1)
      // Also remove related payments
      payments = payments.filter(p => p.appointment_id !== id)
      return true
    }
  },

  // Payment operations
  payments: {
    getAll: async (): Promise<Payment[]> => {
      await delay()
      return [...payments]
    },

    getByPatient: async (patientId: string): Promise<Payment[]> => {
      await delay()
      return payments.filter(p => p.patient_id === patientId)
    },

    getByAppointment: async (appointmentId: string): Promise<Payment[]> => {
      await delay()
      return payments.filter(p => p.appointment_id === appointmentId)
    },

    create: async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> => {
      await delay()
      const now = new Date().toISOString()
      const newPayment: Payment = {
        ...paymentData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      payments.push(newPayment)
      return newPayment
    },

    update: async (id: string, paymentData: Partial<Payment>): Promise<Payment | null> => {
      await delay()
      const index = payments.findIndex(p => p.id === id)
      if (index === -1) return null

      const updatedPayment = {
        ...payments[index],
        ...paymentData,
        updated_at: new Date().toISOString()
      }
      payments[index] = updatedPayment
      return updatedPayment
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = payments.findIndex(p => p.id === id)
      if (index === -1) return false

      payments.splice(index, 1)
      return true
    }
  },

  // Treatment operations
  treatments: {
    getAll: async (): Promise<Treatment[]> => {
      await delay()
      return [...treatments]
    },

    create: async (treatmentData: Omit<Treatment, 'id' | 'created_at' | 'updated_at'>): Promise<Treatment> => {
      await delay()
      const now = new Date().toISOString()
      const newTreatment: Treatment = {
        ...treatmentData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      treatments.push(newTreatment)
      return newTreatment
    },

    update: async (id: string, treatmentData: Partial<Treatment>): Promise<Treatment | null> => {
      await delay()
      const index = treatments.findIndex(t => t.id === id)
      if (index === -1) return null

      const updatedTreatment = {
        ...treatments[index],
        ...treatmentData,
        updated_at: new Date().toISOString()
      }
      treatments[index] = updatedTreatment
      return updatedTreatment
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = treatments.findIndex(t => t.id === id)
      if (index === -1) return false

      treatments.splice(index, 1)
      return true
    }
  },

  // Inventory operations
  inventory: {
    getAll: async (): Promise<InventoryItem[]> => {
      await delay()
      return [...inventory]
    },

    create: async (inventoryData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
      await delay()
      const now = new Date().toISOString()
      const newItem: InventoryItem = {
        ...inventoryData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      inventory.push(newItem)
      return newItem
    },

    update: async (id: string, inventoryData: Partial<InventoryItem>): Promise<InventoryItem | null> => {
      await delay()
      const index = inventory.findIndex(i => i.id === id)
      if (index === -1) return null

      const updatedItem = {
        ...inventory[index],
        ...inventoryData,
        updated_at: new Date().toISOString()
      }
      inventory[index] = updatedItem
      return updatedItem
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = inventory.findIndex(i => i.id === id)
      if (index === -1) return false

      inventory.splice(index, 1)
      return true
    }
  },

  // Settings operations
  settings: {
    get: async (): Promise<ClinicSettings> => {
      await delay()
      return { ...settings }
    },

    update: async (settingsData: Partial<ClinicSettings>): Promise<ClinicSettings> => {
      await delay()
      settings = {
        ...settings,
        ...settingsData,
        updated_at: new Date().toISOString()
      }
      return { ...settings }
    }
  },

  // Lab operations
  labs: {
    getAll: async (): Promise<Lab[]> => {
      await delay()
      return [...labs]
    },

    create: async (labData: Omit<Lab, 'id' | 'created_at' | 'updated_at'>): Promise<Lab> => {
      await delay()
      const now = new Date().toISOString()
      const newLab: Lab = {
        ...labData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      labs.push(newLab)
      return newLab
    },

    update: async (id: string, labData: Partial<Lab>): Promise<Lab | null> => {
      await delay()
      const index = labs.findIndex(l => l.id === id)
      if (index === -1) return null

      const updatedLab = {
        ...labs[index],
        ...labData,
        updated_at: new Date().toISOString()
      }
      labs[index] = updatedLab
      return updatedLab
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = labs.findIndex(l => l.id === id)
      if (index === -1) return false

      labs.splice(index, 1)
      return true
    }
  },

  // Lab Orders operations
  labOrders: {
    getAll: async (): Promise<LabOrder[]> => {
      await delay()
      return [...labOrders]
    },

    create: async (labOrderData: Omit<LabOrder, 'id' | 'created_at' | 'updated_at'>): Promise<LabOrder> => {
      await delay()
      const now = new Date().toISOString()
      const newLabOrder: LabOrder = {
        ...labOrderData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      labOrders.push(newLabOrder)
      return newLabOrder
    },

    update: async (id: string, labOrderData: Partial<LabOrder>): Promise<LabOrder | null> => {
      await delay()
      const index = labOrders.findIndex(lo => lo.id === id)
      if (index === -1) return null

      const updatedLabOrder = {
        ...labOrders[index],
        ...labOrderData,
        updated_at: new Date().toISOString()
      }
      labOrders[index] = updatedLabOrder
      return updatedLabOrder
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = labOrders.findIndex(lo => lo.id === id)
      if (index === -1) return false

      labOrders.splice(index, 1)
      return true
    }
  },

  // Medications operations
  medications: {
    getAll: async (): Promise<Medication[]> => {
      await delay()
      return [...medications]
    },

    create: async (medicationData: Omit<Medication, 'id' | 'created_at' | 'updated_at'>): Promise<Medication> => {
      await delay()
      const now = new Date().toISOString()
      const newMedication: Medication = {
        ...medicationData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      medications.push(newMedication)
      return newMedication
    },

    update: async (id: string, medicationData: Partial<Medication>): Promise<Medication | null> => {
      await delay()
      const index = medications.findIndex(m => m.id === id)
      if (index === -1) return null

      const updatedMedication = {
        ...medications[index],
        ...medicationData,
        updated_at: new Date().toISOString()
      }
      medications[index] = updatedMedication
      return updatedMedication
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = medications.findIndex(m => m.id === id)
      if (index === -1) return false

      medications.splice(index, 1)
      return true
    }
  },

  // Prescriptions operations
  prescriptions: {
    getAll: async (): Promise<Prescription[]> => {
      await delay()
      return [...prescriptions]
    },

    create: async (prescriptionData: Omit<Prescription, 'id' | 'created_at' | 'updated_at'>): Promise<Prescription> => {
      await delay()
      const now = new Date().toISOString()
      const newPrescription: Prescription = {
        ...prescriptionData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      prescriptions.push(newPrescription)
      return newPrescription
    },

    update: async (id: string, prescriptionData: Partial<Prescription>): Promise<Prescription | null> => {
      await delay()
      const index = prescriptions.findIndex(p => p.id === id)
      if (index === -1) return null

      const updatedPrescription = {
        ...prescriptions[index],
        ...prescriptionData,
        updated_at: new Date().toISOString()
      }
      prescriptions[index] = updatedPrescription
      return updatedPrescription
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = prescriptions.findIndex(p => p.id === id)
      if (index === -1) return false

      prescriptions.splice(index, 1)
      return true
    }
  },

  // Tooth Treatments operations
  toothTreatments: {
    getAll: async (): Promise<ToothTreatment[]> => {
      await delay()
      return [...toothTreatments]
    },

    getByPatient: async (patientId: string): Promise<ToothTreatment[]> => {
      await delay()
      return toothTreatments.filter(tt => tt.patient_id === patientId)
    },

    getByTooth: async (patientId: string, toothNumber: number): Promise<ToothTreatment[]> => {
      await delay()
      return toothTreatments.filter(tt =>
        tt.patient_id === patientId && tt.tooth_number === toothNumber
      ).sort((a, b) => a.priority - b.priority)
    },

    create: async (toothTreatmentData: Omit<ToothTreatment, 'id' | 'created_at' | 'updated_at'>): Promise<ToothTreatment> => {
      await delay()
      const now = new Date().toISOString()
      const newToothTreatment: ToothTreatment = {
        ...toothTreatmentData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      toothTreatments.push(newToothTreatment)
      return newToothTreatment
    },

    update: async (id: string, toothTreatmentData: Partial<ToothTreatment>): Promise<ToothTreatment | null> => {
      await delay()
      const index = toothTreatments.findIndex(tt => tt.id === id)
      if (index === -1) return null

      const updatedToothTreatment = {
        ...toothTreatments[index],
        ...toothTreatmentData,
        updated_at: new Date().toISOString()
      }
      toothTreatments[index] = updatedToothTreatment
      return updatedToothTreatment
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = toothTreatments.findIndex(tt => tt.id === id)
      if (index === -1) return false

      toothTreatments.splice(index, 1)
      return true
    },

    reorder: async (patientId: string, toothNumber: number, treatmentIds: string[]): Promise<boolean> => {
      await delay()

      // Update priorities based on the new order
      treatmentIds.forEach((treatmentId, index) => {
        const treatment = toothTreatments.find(tt =>
          tt.id === treatmentId &&
          tt.patient_id === patientId &&
          tt.tooth_number === toothNumber
        )
        if (treatment) {
          treatment.priority = index + 1
          treatment.updated_at = new Date().toISOString()
        }
      })

      return true
    }
  },

  // Clinic Needs operations
  clinicNeeds: {
    getAll: async (): Promise<ClinicNeed[]> => {
      await delay()
      return [...clinicNeeds]
    },

    create: async (clinicNeedData: Omit<ClinicNeed, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicNeed> => {
      await delay()
      const now = new Date().toISOString()
      const newClinicNeed: ClinicNeed = {
        ...clinicNeedData,
        id: uuidv4(),
        created_at: now,
        updated_at: now
      }
      clinicNeeds.push(newClinicNeed)
      return newClinicNeed
    },

    update: async (id: string, clinicNeedData: Partial<ClinicNeed>): Promise<ClinicNeed | null> => {
      await delay()
      const index = clinicNeeds.findIndex(cn => cn.id === id)
      if (index === -1) return null

      const updatedClinicNeed = {
        ...clinicNeeds[index],
        ...clinicNeedData,
        updated_at: new Date().toISOString()
      }
      clinicNeeds[index] = updatedClinicNeed
      return updatedClinicNeed
    },

    delete: async (id: string): Promise<boolean> => {
      await delay()
      const index = clinicNeeds.findIndex(cn => cn.id === id)
      if (index === -1) return false

      clinicNeeds.splice(index, 1)
      return true
    }
  },

  // Dashboard operations
  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      await delay()

      const totalPatients = patients.length
      const totalAppointments = appointments.length
      const completedAppointments = appointments.filter(a => a.status === 'completed').length
      const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
      const pendingPayments = payments.filter(p => p.status === 'partial' || p.status === 'pending').length

      return {
        totalPatients,
        totalAppointments,
        completedAppointments,
        scheduledAppointments,
        totalRevenue,
        pendingPayments,
        lowStockItems: inventory.filter(i => i.quantity <= i.minimum_stock).length,
        todayAppointments: appointments.filter(a => {
          const today = new Date().toISOString().split('T')[0]
          return a.start_time.split('T')[0] === today
        }).length
      }
    }
  },

  // Mock operations for features not needed in demo
  backup: {
    create: async (): Promise<string> => {
      await delay()
      return 'demo-backup-' + Date.now() + '.json'
    },
    restore: async (backupPath: string): Promise<boolean> => {
      await delay()
      return true
    },
    list: async (): Promise<string[]> => {
      await delay()
      return []
    },
    delete: async (backupName: string): Promise<boolean> => {
      await delay()
      return true
    }
  },

  files: {
    selectFile: async (options?: any): Promise<string | null> => {
      await delay()
      return null
    },
    selectDirectory: async (options?: any): Promise<string | null> => {
      await delay()
      return null
    },
    saveFile: async (options?: any): Promise<string | null> => {
      await delay()
      return null
    }
  },

  export: {
    pdf: async (data: any, type: string): Promise<string> => {
      await delay()
      return 'demo-export.pdf'
    },
    excel: async (data: any, type: string): Promise<string> => {
      await delay()
      return 'demo-export.xlsx'
    }
  },

  system: {
    getVersion: async (): Promise<string> => {
      await delay()
      return '1.0.0-demo'
    },
    getPath: async (name: string): Promise<string> => {
      await delay()
      return '/demo/path'
    },
    openExternal: async (url: string): Promise<void> => {
      await delay()
      window.open(url, '_blank')
    }
  }
}
