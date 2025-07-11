import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Payment } from '../types'
import { calculateTotalRemainingBalanceForAllPatients } from '../utils/paymentCalculations'

interface PaymentState {
  payments: Payment[]
  filteredPayments: Payment[]
  selectedPayment: Payment | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  statusFilter: string
  paymentMethodFilter: string
  totalRevenue: number
  pendingAmount: number
  totalRemainingBalance: number
  partialPaymentsCount: number
  monthlyRevenue: { [key: string]: number }
  paymentMethodStats: { [key: string]: number }
}

interface PaymentActions {
  // Data operations
  loadPayments: () => Promise<void>
  createPayment: (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  searchPayments: (query: string) => void

  // UI state
  setSelectedPayment: (payment: Payment | null) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: string) => void
  setPaymentMethodFilter: (method: string) => void
  filterPayments: () => void
  clearError: () => void

  // Analytics
  calculateTotalRevenue: () => void
  calculatePendingAmount: () => void
  calculateTotalRemainingBalance: () => void
  calculatePartialPaymentsCount: () => void
  calculateMonthlyRevenue: () => void
  calculatePaymentMethodStats: () => void
  getPaymentsByPatient: (patientId: string) => Payment[]
  getPaymentsByAppointment: (appointmentId: string) => Payment[]
  getPaymentsByDateRange: (startDate: Date, endDate: Date) => Payment[]

  // Payment status operations
  markAsCompleted: (id: string) => Promise<void>
  markAsPending: (id: string) => Promise<void>
  markAsFailed: (id: string) => Promise<void>
  markAsRefunded: (id: string) => Promise<void>
}

type PaymentStore = PaymentState & PaymentActions

export const usePaymentStore = create<PaymentStore>()(
  devtools(
    (set, get) => {
      // Listen for patient deletion events to update payments
      if (typeof window !== 'undefined') {
        window.addEventListener('patient-deleted', (event: any) => {
          const { patientId } = event.detail
          const { payments, selectedPayment } = get()

          // Remove payments for deleted patient
          const updatedPayments = payments.filter(p => p.patient_id !== patientId)

          set({
            payments: updatedPayments,
            selectedPayment: selectedPayment?.patient_id === patientId ? null : selectedPayment
          })

          // Recalculate all analytics immediately
          get().calculateTotalRevenue()
          get().calculatePendingAmount()
          get().calculateTotalRemainingBalance()
          get().calculatePartialPaymentsCount()
          get().calculateMonthlyRevenue()
          get().calculatePaymentMethodStats()
          get().filterPayments()

          console.log(`💰 Removed ${payments.length - updatedPayments.length} payments for deleted patient ${patientId}`)
        })
      }

      return {
        // Initial state
        payments: [],
        filteredPayments: [],
        selectedPayment: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        statusFilter: 'all',
        paymentMethodFilter: 'all',
        totalRevenue: 0,
        pendingAmount: 0,
        totalRemainingBalance: 0,
        partialPaymentsCount: 0,
        monthlyRevenue: {},
        paymentMethodStats: {},

      // Data operations
      loadPayments: async () => {
        set({ isLoading: true, error: null })
        try {
          const payments = await window.electronAPI.payments.getAll()
          set({
            payments,
            filteredPayments: payments, // Initialize filtered payments with all payments
            isLoading: false
          })

          // Calculate analytics and filter
          get().calculateTotalRevenue()
          get().calculatePendingAmount()
          get().calculateTotalRemainingBalance()
          get().calculatePartialPaymentsCount()
          get().calculateMonthlyRevenue()
          get().calculatePaymentMethodStats()
          get().filterPayments()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load payments',
            isLoading: false
          })
        }
      },

      createPayment: async (paymentData) => {
        set({ isLoading: true, error: null })
        try {
          const newPayment = await window.electronAPI.payments.create(paymentData)
          const { payments } = get()
          const updatedPayments = [...payments, newPayment]

          set({
            payments: updatedPayments,
            isLoading: false
          })

          // Recalculate analytics and filter
          get().calculateTotalRevenue()
          get().calculatePendingAmount()
          get().calculateTotalRemainingBalance()
          get().calculatePartialPaymentsCount()
          get().calculateMonthlyRevenue()
          get().calculatePaymentMethodStats()
          get().filterPayments()

          // Emit events for real-time sync
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('payment-changed', {
              detail: {
                type: 'created',
                paymentId: newPayment.id,
                payment: newPayment
              }
            }))
            window.dispatchEvent(new CustomEvent('payment-added', {
              detail: {
                type: 'created',
                paymentId: newPayment.id,
                payment: newPayment
              }
            }))
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create payment',
            isLoading: false
          })
        }
      },

      updatePayment: async (id, paymentData) => {
        set({ isLoading: true, error: null })
        try {
          // حذف التنبيهات القديمة المرتبطة بهذه الدفعة قبل التحديث
          try {
            const { SmartAlertsService } = await import('@/services/smartAlertsService')
            await SmartAlertsService.deletePaymentAlerts(id)
          } catch (error) {
            console.warn('Could not delete old payment alerts:', error)
          }

          const updatedPayment = await window.electronAPI.payments.update(id, paymentData)
          const { payments, selectedPayment } = get()

          const updatedPayments = payments.map(p =>
            p.id === id ? updatedPayment : p
          )

          set({
            payments: updatedPayments,
            selectedPayment: selectedPayment?.id === id ? updatedPayment : selectedPayment,
            isLoading: false
          })

          // Recalculate analytics and filter
          get().calculateTotalRevenue()
          get().calculatePendingAmount()
          get().calculateTotalRemainingBalance()
          get().calculatePartialPaymentsCount()
          get().calculateMonthlyRevenue()
          get().calculatePaymentMethodStats()
          get().filterPayments()

          // Emit events for real-time sync
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('payment-changed', {
              detail: {
                type: 'updated',
                paymentId: id,
                payment: updatedPayment
              }
            }))
            window.dispatchEvent(new CustomEvent('payment-updated', {
              detail: {
                type: 'updated',
                paymentId: id,
                payment: updatedPayment
              }
            }))
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update payment',
            isLoading: false
          })
        }
      },

      deletePayment: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await window.electronAPI.payments.delete(id)
          const { payments, selectedPayment } = get()

          const updatedPayments = payments.filter(p => p.id !== id)

          set({
            payments: updatedPayments,
            selectedPayment: selectedPayment?.id === id ? null : selectedPayment,
            isLoading: false
          })

          // Recalculate analytics and filter
          get().calculateTotalRevenue()
          get().calculatePendingAmount()
          get().calculateTotalRemainingBalance()
          get().calculatePartialPaymentsCount()
          get().calculateMonthlyRevenue()
          get().calculatePaymentMethodStats()
          get().filterPayments()

          // Emit events for real-time sync
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('payment-changed', {
              detail: {
                type: 'deleted',
                paymentId: id
              }
            }))
            window.dispatchEvent(new CustomEvent('payment-deleted', {
              detail: {
                type: 'deleted',
                paymentId: id
              }
            }))
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete payment',
            isLoading: false
          })
        }
      },

      searchPayments: (query) => {
        set({ searchQuery: query })
        get().filterPayments()
      },

      // UI state management
      setSelectedPayment: (payment) => {
        set({ selectedPayment: payment })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
        get().filterPayments()
      },

      setStatusFilter: (status) => {
        set({ statusFilter: status })
        get().filterPayments()
      },

      setPaymentMethodFilter: (method) => {
        set({ paymentMethodFilter: method })
        get().filterPayments()
      },

      filterPayments: () => {
        const { payments, searchQuery, statusFilter, paymentMethodFilter } = get()

        let filtered = payments

        // Apply search filter
        if (searchQuery) {
          filtered = filtered.filter(payment => {
            const patientName = payment.patient ?
              `${payment.patient.first_name} ${payment.patient.last_name}` : ''

            return (
              payment.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.amount.toString().includes(searchQuery) ||
              payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.status.toLowerCase().includes(searchQuery.toLowerCase())
            )
          })
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          filtered = filtered.filter(payment => payment.status === statusFilter)
        }

        // Apply payment method filter
        if (paymentMethodFilter !== 'all') {
          filtered = filtered.filter(payment => payment.payment_method === paymentMethodFilter)
        }

        set({ filteredPayments: filtered })
      },

      clearError: () => {
        set({ error: null })
      },

      // Analytics
      calculateTotalRevenue: () => {
        const { payments } = get()
        // Count completed and partial payments for total revenue
        const total = payments
          .filter(p => p.status === 'completed' || p.status === 'partial')
          .reduce((sum, payment) => {
            // For partial payments, use amount_paid instead of amount
            const amount = payment.status === 'partial' && payment.amount_paid !== undefined
              ? Number(payment.amount_paid)
              : Number(payment.amount)

            if (isNaN(amount) || !isFinite(amount)) {
              console.warn('Invalid payment amount:', payment.amount, 'for payment:', payment.id)
              return sum
            }
            return sum + amount
          }, 0)

        const validTotal = isNaN(total) || !isFinite(total) ? 0 : Math.round(total * 100) / 100
        set({ totalRevenue: validTotal }) // Round to 2 decimal places
      },

      calculatePendingAmount: () => {
        const { payments } = get()
        const pending = payments
          .filter(p => p.status === 'pending')
          .reduce((sum, payment) => {
            // Ensure amount is a valid number with proper validation
            const amount = Number(payment.amount)
            if (isNaN(amount) || !isFinite(amount)) {
              console.warn('Invalid pending payment amount:', payment.amount, 'for payment:', payment.id)
              return sum
            }
            return sum + amount
          }, 0)

        const validPending = isNaN(pending) || !isFinite(pending) ? 0 : Math.round(pending * 100) / 100
        set({ pendingAmount: validPending })
      },



      calculateTotalRemainingBalance: () => {
        // استخدام الطريقة المحسنة لحساب المبلغ المتبقي
        // سنحسب المبلغ المتبقي بناءً على الفرق بين المطلوب والمدفوع لكل مريض
        const { payments } = get()

        // تجميع المدفوعات حسب المريض
        const patientPayments: { [patientId: string]: Payment[] } = {}
        payments.forEach(payment => {
          if (!patientPayments[payment.patient_id]) {
            patientPayments[payment.patient_id] = []
          }
          patientPayments[payment.patient_id].push(payment)
        })

        let totalRemaining = 0

        // حساب المبلغ المتبقي لكل مريض
        Object.keys(patientPayments).forEach(patientId => {
          const patientPaymentsList = patientPayments[patientId]

          // حساب إجمالي المطلوب والمدفوع لهذا المريض
          let totalDue = 0
          let totalPaid = 0

          patientPaymentsList.forEach(payment => {
            totalPaid += payment.amount || 0
            if (payment.total_amount_due) {
              totalDue += payment.total_amount_due
            }
          })

          // المبلغ المتبقي = المطلوب - المدفوع (لا يقل عن صفر)
          const patientRemaining = Math.max(0, totalDue - totalPaid)
          totalRemaining += patientRemaining
        })

        set({ totalRemainingBalance: Math.round(totalRemaining * 100) / 100 })
      },

      calculatePartialPaymentsCount: () => {
        const { payments } = get()
        const partialCount = payments.filter(p => p.status === 'partial').length

        set({ partialPaymentsCount: partialCount })
      },

      calculateMonthlyRevenue: () => {
        const { payments } = get()
        const monthlyData: { [key: string]: number } = {}

        payments
          .filter(p => p.status === 'completed' || p.status === 'partial')
          .forEach(payment => {
            try {
              const paymentDate = new Date(payment.payment_date)
              // Validate date
              if (isNaN(paymentDate.getTime())) {
                console.warn('Invalid payment date:', payment.payment_date)
                return
              }

              const month = paymentDate.toISOString().slice(0, 7) // YYYY-MM
              // For partial payments, use amount_paid instead of amount
              const amount = payment.status === 'partial' && payment.amount_paid !== undefined
                ? Number(payment.amount_paid)
                : Number(payment.amount)

              if (isNaN(amount) || !isFinite(amount)) {
                console.warn('Invalid payment amount for monthly revenue:', payment.amount, 'for payment:', payment.id)
                return
              }

              const currentMonthTotal = monthlyData[month] || 0
              const newTotal = currentMonthTotal + amount

              if (isNaN(newTotal) || !isFinite(newTotal)) {
                console.warn('Invalid monthly total calculation for month:', month)
                return
              }

              monthlyData[month] = Math.round(newTotal * 100) / 100
            } catch (error) {
              console.warn('Error processing payment date:', payment.payment_date, error)
            }
          })

        set({ monthlyRevenue: monthlyData })
      },

      calculatePaymentMethodStats: () => {
        const { payments } = get()
        const methodStats: { [key: string]: number } = {}

        payments
          .filter(p => p.status === 'completed' || p.status === 'partial')
          .forEach(payment => {
            const method = payment.payment_method || 'unknown'
            // For partial payments, use amount_paid instead of amount
            const amount = payment.status === 'partial' && payment.amount_paid !== undefined
              ? Number(payment.amount_paid)
              : Number(payment.amount)

            if (isNaN(amount) || !isFinite(amount)) {
              console.warn('Invalid payment amount for method stats:', payment.amount, 'for payment:', payment.id)
              return
            }

            const currentMethodTotal = methodStats[method] || 0
            const newTotal = currentMethodTotal + amount

            if (isNaN(newTotal) || !isFinite(newTotal)) {
              console.warn('Invalid method total calculation for method:', method)
              return
            }

            methodStats[method] = Math.round(newTotal * 100) / 100
          })

        set({ paymentMethodStats: methodStats })
      },

      getPaymentsByPatient: (patientId) => {
        const { payments } = get()
        return payments.filter(p => p.patient_id === patientId)
      },

      getPaymentsByAppointment: (appointmentId) => {
        const { payments } = get()
        return payments.filter(p => p.appointment_id === appointmentId)
      },

      getPaymentsByDateRange: (startDate, endDate) => {
        const { payments } = get()

        return payments.filter(payment => {
          const paymentDate = new Date(payment.payment_date)
          return paymentDate >= startDate && paymentDate <= endDate
        })
      },

      // Payment status operations
      markAsCompleted: async (id) => {
        await get().updatePayment(id, { status: 'completed' })
      },

      markAsPending: async (id) => {
        await get().updatePayment(id, { status: 'pending' })
      },

      markAsFailed: async (id) => {
        await get().updatePayment(id, { status: 'failed' })
      },

      markAsRefunded: async (id) => {
        await get().updatePayment(id, { status: 'refunded' })
      }
      }
    },
    {
      name: 'payment-store',
    }
  )
)
