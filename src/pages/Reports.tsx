import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import { useReportsStore } from '@/store/reportsStore'
import { useSettingsStore } from '@/store/settingsStore'
import { usePaymentStore } from '@/store/paymentStore'
import { useAppointmentStore } from '@/store/appointmentStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { usePatientStore } from '@/store/patientStore'
import { useClinicNeedsStore } from '@/store/clinicNeedsStore'
import { useRealTimeReports } from '@/hooks/useRealTimeReports'
import useTimeFilteredStats from '@/hooks/useTimeFilteredStats'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCardStyles, getIconStyles } from '@/lib/cardStyles'
import PatientReports from '@/components/reports/PatientReports'
import InventoryReports from '@/components/reports/InventoryReports'
import AppointmentReports from '@/components/reports/AppointmentReports'
import FinancialReports from '@/components/reports/FinancialReports'
import TreatmentReports from '@/components/reports/TreatmentReports'
import ClinicNeedsReports from '@/components/reports/ClinicNeedsReports'
import CalculationValidator from '@/components/admin/CalculationValidator'
import CurrencyDisplay from '@/components/ui/currency-display'
import RealTimeIndicator from '@/components/ui/real-time-indicator'
import TimeFilter from '@/components/ui/time-filter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  FileText,
  PieChart,
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  Clock,
  CheckCircle

} from 'lucide-react'
import { notify } from '@/services/notificationService'
import { ComprehensiveExportService } from '@/services/comprehensiveExportService'

export default function Reports() {
  const { currency } = useSettingsStore()
  const { totalRevenue, pendingAmount, payments } = usePaymentStore()
  const { appointments } = useAppointmentStore()
  const { items: inventoryItems } = useInventoryStore()
  const { patients } = usePatientStore()
  const { needs: clinicNeeds, totalValue: clinicNeedsTotalValue } = useClinicNeedsStore()
  const {
    reportData,
    patientReports,
    appointmentReports,
    financialReports,
    inventoryReports,
    clinicNeedsReports,
    isLoading,
    isExporting,
    error,
    activeReportType,
    currentFilter,
    generateReport,
    generateAllReports,
    setActiveReportType,
    setFilter,
    exportReport,
    clearError
  } = useReportsStore()

  const [selectedTab, setSelectedTab] = useState('overview')

  // Time filtering for different data types in overview (excluding patients)
  const appointmentStats = useTimeFilteredStats({
    data: appointments,
    dateField: 'start_time',
    initialFilter: { preset: 'all', startDate: '', endDate: '' }
  })

  const paymentStats = useTimeFilteredStats({
    data: payments,
    dateField: 'payment_date',
    initialFilter: { preset: 'all', startDate: '', endDate: '' }
  })

  const inventoryStats = useTimeFilteredStats({
    data: inventoryItems,
    dateField: 'created_at',
    initialFilter: { preset: 'all', startDate: '', endDate: '' }
  })

  // Time filtering for clinic needs
  const clinicNeedsStats = useTimeFilteredStats({
    data: clinicNeeds,
    dateField: 'created_at',
    initialFilter: { preset: 'all', startDate: '', endDate: '' }
  })

  useEffect(() => {
    // Load initial reports with fresh data
    console.log('🔄 Loading initial reports...')
    clearError()
    generateAllReports()

    // Load data for filtering (excluding patients as they don't need filtering)
    const { loadAppointments } = useAppointmentStore.getState()
    const { loadPayments } = usePaymentStore.getState()
    const { loadItems } = useInventoryStore.getState()

    loadAppointments()
    loadPayments()
    loadItems()
  }, [generateAllReports, clearError])

  useEffect(() => {
    if (error) {
      console.error('❌ Reports error:', error)
      // Show error notification
      const event = new CustomEvent('showToast', {
        detail: {
          title: 'خطأ في التقارير',
          description: error,
          type: 'error'
        }
      })
      window.dispatchEvent(event)
    }
  }, [error])

  const handleTabChange = (value: string) => {
    setSelectedTab(value)
    setActiveReportType(value as any)

    // Generate specific report if not already loaded
    if (value !== 'overview') {
      generateReport(value as any)
    }
  }

  const handleRefresh = async () => {
    try {
      console.log('🔄 Refreshing all reports...')
      clearError()
      await generateAllReports()
      console.log('✅ All reports refreshed successfully')
    } catch (error) {
      console.error('❌ Error refreshing reports:', error)
      throw error
    }
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Show loading message
      const loadingEvent = new CustomEvent('showToast', {
        detail: {
          title: 'جاري التصدير... ⏳',
          description: `يتم تحضير ملف ${format.toUpperCase()}`,
          type: 'info'
        }
      })
      window.dispatchEvent(loadingEvent)

      const result = await exportReport(activeReportType, {
        format,
        includeCharts: true,
        includeDetails: true,
        language: 'ar',
        orientation: 'landscape',
        pageSize: 'A4'
      })

      if (result?.success) {
        // Show success message with toast notification
        const event = new CustomEvent('showToast', {
          detail: {
            title: 'تم التصدير بنجاح! 🎉',
            description: `${result.message}\nتم فتح الملف تلقائياً`,
            type: 'success'
          }
        })
        window.dispatchEvent(event)
        console.log('تم تصدير التقرير بنجاح:', result.filePath)
      } else {
        // Show error message
        const event = new CustomEvent('showToast', {
          detail: {
            title: 'خطأ في التصدير ❌',
            description: result?.message || 'فشل في تصدير التقرير',
            type: 'error'
          }
        })
        window.dispatchEvent(event)
        console.error('فشل في تصدير التقرير:', result?.message)
      }
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error)
    }
  }



  // Use real-time reports hook for automatic updates
  const { refreshReports } = useRealTimeReports(['overview'])

  // Use the store's auto-refresh functionality with shorter interval as backup
  useEffect(() => {
    const { startAutoRefresh, stopAutoRefresh } = useReportsStore.getState()

    // Start auto-refresh when component mounts with 1 minute interval as backup
    startAutoRefresh(1) // 1 minute interval as backup

    // Cleanup on unmount
    return () => {
      stopAutoRefresh()
    }
  }, [])

  // Update active report type when tab changes
  useEffect(() => {
    setActiveReportType(selectedTab as any)
  }, [selectedTab, setActiveReportType])



  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    trend,
    description
  }: {
    title: string
    value: string | number | React.ReactElement
    icon: any
    color?: string
    trend?: { value: number; isPositive: boolean }
    description?: string
  }) => (
    <Card className={getCardStyles(color)} dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground text-right">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconStyles(color)}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground text-right">{value}</div>
        {trend && (
          <div className={`text-xs flex items-center justify-end mt-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="ml-1">{Math.abs(trend.value)}%</span>
            <TrendingUp className={`h-3 w-3 ${
              trend.isPositive ? '' : 'rotate-180'
            }`} />
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">التقارير والتحليلات</h1>
            <RealTimeIndicator isActive={true} />
          </div>
          <p className="text-muted-foreground">
            تقارير شاملة ومفصلة لجميع جوانب العيادة - تحديث تلقائي في الوقت الفعلي
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            disabled={isExporting}
            className="flex items-center space-x-2 space-x-reverse bg-sky-600 hover:bg-sky-700"
onClick={async () => {
              try {
                // التحقق من وجود البيانات
                if (appointments.length === 0 && payments.length === 0 && inventoryItems.length === 0) {
                  notify.noDataToExport('لا توجد بيانات للتصدير')
                  return
                }

                // إعداد معلومات الفلاتر
                const appointmentFilterInfo = appointmentStats.timeFilter.startDate && appointmentStats.timeFilter.endDate
                  ? `من ${appointmentStats.timeFilter.startDate} إلى ${appointmentStats.timeFilter.endDate}`
                  : 'جميع البيانات'

                const paymentFilterInfo = paymentStats.timeFilter.startDate && paymentStats.timeFilter.endDate
                  ? `من ${paymentStats.timeFilter.startDate} إلى ${paymentStats.timeFilter.endDate}`
                  : 'جميع البيانات'

                const inventoryFilterInfo = inventoryStats.timeFilter.startDate && inventoryStats.timeFilter.endDate
                  ? `من ${inventoryStats.timeFilter.startDate} إلى ${inventoryStats.timeFilter.endDate}`
                  : 'جميع البيانات'

                // استخدام الخدمة الجديدة للتصدير الشامل
                await ComprehensiveExportService.exportComprehensiveReport({
                  patients: patients, // المرضى بدون فلترة كما هو مطلوب
                  filteredAppointments: appointmentStats.filteredData, // المواعيد المفلترة
                  filteredPayments: paymentStats.filteredData, // المدفوعات المفلترة
                  filteredInventory: inventoryStats.filteredData, // المخزون المفلتر
                  filterInfo: {
                    appointmentFilter: appointmentFilterInfo,
                    paymentFilter: paymentFilterInfo,
                    inventoryFilter: inventoryFilterInfo
                  }
                })

                const totalFilteredItems = appointmentStats.filteredData.length +
                                         paymentStats.filteredData.length +
                                         inventoryStats.filteredData.length

                notify.exportSuccess(`تم تصدير التقرير الشامل بنجاح! (${totalFilteredItems} عنصر مفلتر، ${patients.length} مريض)`)
              } catch (error) {
                console.error('Error exporting comprehensive report:', error)
                notify.exportError('فشل في تصدير التقرير الشامل')
              }
            }}
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير تقرير شامل'}</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 ml-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">خطأ في تحميل التقارير</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mr-auto"
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل التقارير...</p>
          </div>
        </div>
      )}

      {/* Reports Tabs */}
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center space-x-2 space-x-reverse">
            <Users className="w-4 h-4" />
            <span>المرضى</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center space-x-2 space-x-reverse">
            <Calendar className="w-4 h-4" />
            <span>المواعيد</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2 space-x-reverse">
            <DollarSign className="w-4 h-4" />
            <span>المالية</span>
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center space-x-2 space-x-reverse">
            <Stethoscope className="w-4 h-4" />
            <span>العلاجات</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center space-x-2 space-x-reverse">
            <Package className="w-4 h-4" />
            <span>المخزون</span>
          </TabsTrigger>
          <TabsTrigger value="clinicNeeds" className="flex items-center space-x-2 space-x-reverse">
            <ClipboardList className="w-4 h-4" />
            <span>احتياجات العيادة</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2 space-x-reverse">
            <FileText className="w-4 h-4" />
            <span>التحقق من الدقة</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" dir="rtl">
          {/* Time Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
            <TimeFilter
              value={appointmentStats.timeFilter}
              onChange={appointmentStats.handleFilterChange}
              onClear={appointmentStats.resetFilter}
              title="فلترة المواعيد"
              defaultOpen={false}
            />
            <TimeFilter
              value={paymentStats.timeFilter}
              onChange={paymentStats.handleFilterChange}
              onClear={paymentStats.resetFilter}
              title="فلترة المدفوعات"
              defaultOpen={false}
            />
            <TimeFilter
              value={inventoryStats.timeFilter}
              onChange={inventoryStats.handleFilterChange}
              onClear={inventoryStats.resetFilter}
              title="فلترة المخزون"
              defaultOpen={false}
            />
            <TimeFilter
              value={clinicNeedsStats.timeFilter}
              onChange={clinicNeedsStats.handleFilterChange}
              onClear={clinicNeedsStats.resetFilter}
              title="فلترة احتياجات العيادة"
              defaultOpen={false}
            />
          </div>

          {/* Stats Cards with Filtered Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" dir="rtl">
            <StatCard
              title="إجمالي المرضى"
              value={patientReports?.totalPatients || 0}
              icon={Users}
              color="blue"
              description="العدد الكلي للمرضى المسجلين"
            />
            <StatCard
              title="المواعيد"
              value={appointmentStats.filteredData.length}
              icon={Calendar}
              color="purple"
              trend={appointmentStats.trend}
              description={`من إجمالي ${appointmentReports?.totalAppointments || 0} موعد`}
            />
            <StatCard
              title="الإيرادات"
              value={<CurrencyDisplay amount={paymentStats.financialStats.totalRevenue || 0} currency={currency} />}
              icon={DollarSign}
              color="green"
              trend={paymentStats.trend}
              description={`من إجمالي ${formatCurrency(totalRevenue || 0, currency)}`}
            />
            <StatCard
              title="عناصر المخزون"
              value={inventoryStats.filteredData.length}
              icon={Package}
              color="orange"
              trend={inventoryStats.trend}
              description={`من إجمالي ${inventoryReports?.totalItems || 0} عنصر`}
            />
            <StatCard
              title="احتياجات العيادة"
              value={clinicNeedsStats.filteredData.length}
              icon={ClipboardList}
              color="indigo"
              trend={clinicNeedsStats.trend}
              description={`من إجمالي ${clinicNeedsReports?.totalNeeds || 0} احتياج`}
            />
          </div>

          {/* Quick Stats Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  ملخص البيانات المفلترة
                </CardTitle>
                <CardDescription>الإحصائيات المفلترة حسب الفترة الزمنية المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden" dir="rtl">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right">
                          <span className="arabic-enhanced font-medium">البيان</span>
                        </TableHead>
                        <TableHead className="text-center">
                          <span className="arabic-enhanced font-medium">القيمة</span>
                        </TableHead>
                        <TableHead className="text-center">
                          <span className="arabic-enhanced font-medium">الحالة</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">إجمالي المرضى</span>
                            <Users className="h-4 w-4 text-blue-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {patientReports?.totalPatients || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="arabic-enhanced">
                            {(patientReports?.totalPatients || 0) > 0 ? 'نشط' : 'منخفض'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">المواعيد</span>
                            <Calendar className="h-4 w-4 text-purple-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {appointmentStats.filteredData.length}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={appointmentStats.filteredData.length > 0 ? "default" : "secondary"}
                            className="arabic-enhanced"
                          >
                            {appointmentStats.filteredData.length > 0 ? 'نشط' : 'لا توجد مواعيد'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">الإيرادات المفلترة</span>
                            <DollarSign className="h-4 w-4 text-green-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold table-cell-wrap-truncate-sm">
                          <CurrencyDisplay amount={paymentStats.financialStats.totalRevenue || 0} currency={currency} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={(paymentStats.financialStats.totalRevenue || 0) > 0 ? "default" : "secondary"}
                            className="arabic-enhanced"
                          >
                            {(paymentStats.financialStats.totalRevenue || 0) > 0 ? 'إيرادات متاحة' : 'لا توجد إيرادات'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">المدفوعات المعلقة المفلترة</span>
                            <DollarSign className="h-4 w-4 text-red-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold table-cell-wrap-truncate-sm">
                          <CurrencyDisplay amount={paymentStats.financialStats.pendingAmount || 0} currency={currency} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={(paymentStats.financialStats.pendingAmount || 0) > 0 ? "destructive" : "default"}
                            className="arabic-enhanced"
                          >
                            {(paymentStats.financialStats.pendingAmount || 0) > 0 ? 'يتطلب متابعة' : 'مكتمل'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">عناصر المخزون</span>
                            <Package className="h-4 w-4 text-orange-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {inventoryStats.filteredData.length}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={inventoryStats.filteredData.length > 0 ? "default" : "secondary"}
                            className="arabic-enhanced"
                          >
                            {inventoryStats.filteredData.length > 0 ? 'متوفر' : 'لا توجد عناصر'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">احتياجات العيادة</span>
                            <ClipboardList className="h-4 w-4 text-indigo-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {clinicNeedsStats.filteredData.length}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={clinicNeedsStats.filteredData.length > 0 ? "default" : "secondary"}
                            className="arabic-enhanced"
                          >
                            {clinicNeedsStats.filteredData.length > 0 ? 'يوجد احتياجات' : 'لا توجد احتياجات'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium text-right table-cell-wrap-truncate-md">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="arabic-enhanced">قيمة احتياجات العيادة</span>
                            <DollarSign className="h-4 w-4 text-indigo-500" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold table-cell-wrap-truncate-sm">
                          <CurrencyDisplay
                            amount={clinicNeedsStats.filteredData.reduce((total, need) => total + (need.total_cost || 0), 0)}
                            currency={currency}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={clinicNeedsStats.filteredData.reduce((total, need) => total + (need.total_cost || 0), 0) > 0 ? "default" : "secondary"}
                            className="arabic-enhanced"
                          >
                            {clinicNeedsStats.filteredData.reduce((total, need) => total + (need.total_cost || 0), 0) > 0 ? 'قيمة متاحة' : 'لا توجد قيمة'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Clinic Needs Summary Card */}
            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  ملخص احتياجات العيادة
                </CardTitle>
                <CardDescription>إحصائيات مفصلة عن احتياجات العيادة المفلترة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`text-center p-4 ${getCardStyles('blue')} transition-all duration-200`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className={`h-4 w-4 ${getIconStyles('blue')}`} />
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {clinicNeedsStats.filteredData.filter(need => need.status === 'pending').length}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mt-1">معلقة</div>
                    </div>
                    <div className={`text-center p-4 ${getCardStyles('green')} transition-all duration-200`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className={`h-4 w-4 ${getIconStyles('green')}`} />
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {clinicNeedsStats.filteredData.filter(need => need.status === 'received').length}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mt-1">مستلمة</div>
                    </div>
                    <div className={`text-center p-4 ${getCardStyles('orange')} transition-all duration-200`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className={`h-4 w-4 ${getIconStyles('orange')}`} />
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {clinicNeedsStats.filteredData.filter(need => need.priority === 'urgent').length}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mt-1">عاجلة</div>
                    </div>
                    <div className={`text-center p-4 ${getCardStyles('purple')} transition-all duration-200`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className={`h-4 w-4 ${getIconStyles('purple')}`} />
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        <CurrencyDisplay
                          amount={clinicNeedsStats.filteredData.reduce((total, need) => total + (need.total_cost || 0), 0)}
                          currency={currency}
                          className="text-lg font-bold"
                        />
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mt-1">القيمة الإجمالية</div>
                    </div>
                  </div>

                  {/* Progress indicators */}
                  <div className={`space-y-3 p-4 ${getCardStyles('gray')} transition-all duration-200`}>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-foreground">معدل الإنجاز</span>
                      <span className={`font-bold ${getIconStyles('green')}`}>
                        {clinicNeedsStats.filteredData.length > 0 ? Math.round((clinicNeedsStats.filteredData.filter(need => need.status === 'received').length / clinicNeedsStats.filteredData.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 shadow-inner">
                      <div
                        className={`bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
                        style={{
                          width: `${clinicNeedsStats.filteredData.length > 0 ? (clinicNeedsStats.filteredData.filter(need => need.status === 'received').length / clinicNeedsStats.filteredData.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>مستلمة: {clinicNeedsStats.filteredData.filter(need => need.status === 'received').length}</span>
                      <span>الإجمالي: {clinicNeedsStats.filteredData.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Patient Reports Tab */}
        <TabsContent value="patients" dir="rtl">
          <PatientReports />
        </TabsContent>

        <TabsContent value="appointments" dir="rtl">
          <AppointmentReports />
        </TabsContent>

        <TabsContent value="financial" dir="rtl">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="treatments" dir="rtl">
          <TreatmentReports />
        </TabsContent>

        <TabsContent value="inventory" dir="rtl">
          <InventoryReports />
        </TabsContent>

        <TabsContent value="clinicNeeds" dir="rtl">
          <ClinicNeedsReports />
        </TabsContent>

        <TabsContent value="validation" dir="rtl">
          <CalculationValidator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
