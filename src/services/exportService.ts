import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ExcelJS from 'exceljs'
import type { Patient, Appointment, Payment, ReportExportOptions, PatientReportData, AppointmentReportData, FinancialReportData, InventoryReportData } from '../types'
import { formatCurrency, formatDate } from '../lib/utils'
import { getTreatmentNameInArabic, getCategoryNameInArabic } from '../data/teethData'

export class ExportService {
  // Generate descriptive filename with date and time in DD-MM-YYYY format
  static generateFileName(type: string, format: string, options?: { includeTime?: boolean, customSuffix?: string }): string {
    const now = new Date()
    // Format date as DD-MM-YYYY for filename (Gregorian calendar)
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    const dateStr = `${day}-${month}-${year}`
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS

    // Arabic report names mapping
    const reportNames: { [key: string]: string } = {
      'patients': 'تقرير_المرضى',
      'appointments': 'تقرير_المواعيد',
      'financial': 'التقرير_المالي',
      'inventory': 'تقرير_المخزون',
      'analytics': 'تقرير_التحليلات',
      'overview': 'التقرير_الشامل'
    }

    const reportName = reportNames[type] || `تقرير_${type}`
    let fileName = `${reportName}_${dateStr}`

    if (options?.includeTime) {
      fileName += `_${timeStr}`
    }

    if (options?.customSuffix) {
      fileName += `_${options.customSuffix}`
    }

    return `${fileName}.${format}`
  }

  // Advanced Report Export Functions
  static async exportReport(
    type: 'patients' | 'appointments' | 'financial' | 'inventory' | 'analytics' | 'overview',
    data: any,
    options: ReportExportOptions
  ): Promise<string> {
    try {
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(type, data, options)
        case 'excel':
          return await this.exportToExcel(type, data, options)
        case 'csv':
          return await this.exportToCSV(type, data, options)
        default:
          throw new Error('Unsupported export format')
      }
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }

  // PDF Export Functions using HTML to Canvas conversion
  static async exportToPDF(type: string, data: any, options: ReportExportOptions): Promise<string> {
    try {
      // Create HTML content for the report
      const htmlContent = this.createReportHTML(type, data, options)

      // Generate filename
      const fileName = this.generateFileName(type, 'pdf', { includeTime: true })

      // Convert HTML to PDF using html2canvas + jsPDF
      await this.convertHTMLToPDF(htmlContent, fileName)

      return fileName
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      throw new Error('فشل في تصدير التقرير إلى PDF')
    }
  }

  // Convert HTML to PDF using html2canvas + jsPDF
  private static async convertHTMLToPDF(htmlContent: string, filename: string): Promise<void> {
    try {
      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px' // Fixed width for consistent rendering
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.direction = 'rtl'
      tempDiv.style.fontSize = '14px'
      tempDiv.style.lineHeight = '1.6'
      tempDiv.style.color = '#000'
      tempDiv.style.background = '#fff'
      tempDiv.style.padding = '20px'

      document.body.appendChild(tempDiv)

      // Wait a bit for fonts to load
      await new Promise(resolve => setTimeout(resolve, 100))

      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0
      })

      // Remove temporary div
      document.body.removeChild(tempDiv)

      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20 // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10 // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - 20) // Subtract page height minus margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - 20)
      }

      // Save the PDF
      pdf.save(filename)

    } catch (error) {
      console.error('Error converting HTML to PDF:', error)
      throw new Error('فشل في تحويل التقرير إلى PDF')
    }
  }

  // Create HTML content for reports
  private static createReportHTML(type: string, data: any, options: ReportExportOptions): string {
    const reportTitles = {
      patients: 'تقرير المرضى',
      appointments: 'تقرير المواعيد',
      financial: 'التقرير المالي',
      inventory: 'تقرير المخزون',
      analytics: 'تقرير التحليلات',
      overview: 'التقرير الشامل'
    }

    const title = reportTitles[type as keyof typeof reportTitles] || 'تقرير'

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background: #fff;
            color: #000;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #64748b;
          }
          .summary-cards {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            flex-wrap: wrap;
          }
          .summary-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            min-width: 150px;
            margin: 5px;
            border: 1px solid #e2e8f0;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #1e293b;
          }
          .summary-card .number {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
          }
          .section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          th {
            background: #f8fafc;
            font-weight: bold;
            color: #1e293b;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">عيادة الأسنان الحديثة</div>
          <div class="report-title">${title}</div>
          <div class="report-date">${(() => {
            // Format date as DD/MM/YYYY (Gregorian calendar)
            const date = new Date()
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
          })()}</div>
        </div>

        ${this.generateReportContent(type, data, options)}

        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام إدارة العيادة - ${(() => {
            const date = new Date()
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
          })()}
        </div>
      </body>
      </html>
    `
  }

  // Generate specific content for each report type
  private static generateReportContent(type: string, data: any, options: ReportExportOptions): string {
    switch (type) {
      case 'patients':
        return this.generatePatientReportContent(data, options)
      case 'appointments':
        return this.generateAppointmentReportContent(data, options)
      case 'financial':
        return this.generateFinancialReportContent(data, options)
      case 'inventory':
        return this.generateInventoryReportContent(data, options)
      case 'overview':
        return this.generateOverviewReportContent(data, options)
      default:
        return '<div class="section">لا توجد بيانات متاحة</div>'
    }
  }

  // Generate Patient Report HTML Content
  private static generatePatientReportContent(data: PatientReportData, options: ReportExportOptions): string {
    return `
      <div class="summary-cards">
        <div class="summary-card">
          <h3>إجمالي المرضى</h3>
          <div class="number">${data.totalPatients || 0}</div>
        </div>
        <div class="summary-card">
          <h3>المرضى الجدد</h3>
          <div class="number">${data.newPatientsThisMonth || 0}</div>
        </div>
        <div class="summary-card">
          <h3>المرضى النشطون</h3>
          <div class="number">${data.activePatients || 0}</div>
        </div>
        <div class="summary-card">
          <h3>متوسط العمر</h3>
          <div class="number">${data.averageAge || 0} سنة</div>
        </div>
      </div>

      ${data.ageDistribution && data.ageDistribution.length > 0 ? `
      <div class="section">
        <div class="section-title">توزيع الأعمار</div>
        <table>
          <thead>
            <tr>
              <th>الفئة العمرية</th>
              <th>العدد</th>
              <th>النسبة المئوية</th>
            </tr>
          </thead>
          <tbody>
            ${data.ageDistribution.map(item => `
              <tr>
                <td>${item.ageGroup || item.range}</td>
                <td>${item.count}</td>
                <td>${((item.count / data.totalPatients) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.genderDistribution && data.genderDistribution.length > 0 ? `
      <div class="section">
        <div class="section-title">توزيع الجنس</div>
        <table>
          <thead>
            <tr>
              <th>الجنس</th>
              <th>العدد</th>
              <th>النسبة المئوية</th>
            </tr>
          </thead>
          <tbody>
            ${data.genderDistribution.map(item => `
              <tr>
                <td>${item.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td>${item.count}</td>
                <td>${((item.count / data.totalPatients) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${options.includeDetails && data.patients && data.patients.length > 0 ? `
      <div class="section">
        <div class="section-title">تفاصيل المرضى</div>
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>العمر</th>
              <th>آخر زيارة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${data.patients.slice(0, 50).map(patient => `
              <tr>
                <td>${patient.first_name} ${patient.last_name}</td>
                <td>${patient.phone || 'غير محدد'}</td>
                <td>${patient.age || 'غير محدد'}</td>
                <td>${patient.last_visit || 'لا توجد زيارات'}</td>
                <td>${patient.status || 'نشط'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    `
  }

  // Generate Appointment Report HTML Content
  private static generateAppointmentReportContent(data: AppointmentReportData, options: ReportExportOptions): string {
    return `
      <div class="summary-cards">
        <div class="summary-card">
          <h3>إجمالي المواعيد</h3>
          <div class="number">${data.totalAppointments || 0}</div>
        </div>
        <div class="summary-card">
          <h3>المكتملة</h3>
          <div class="number">${data.completedAppointments || 0}</div>
        </div>
        <div class="summary-card">
          <h3>الملغية</h3>
          <div class="number">${data.cancelledAppointments || 0}</div>
        </div>
        <div class="summary-card">
          <h3>معدل الحضور</h3>
          <div class="number">${data.attendanceRate?.toFixed(1) || 0}%</div>
        </div>
      </div>

      ${data.appointmentsByStatus && data.appointmentsByStatus.length > 0 ? `
      <div class="section">
        <div class="section-title">توزيع المواعيد حسب الحالة</div>
        <table>
          <thead>
            <tr>
              <th>الحالة</th>
              <th>العدد</th>
              <th>النسبة المئوية</th>
            </tr>
          </thead>
          <tbody>
            ${data.appointmentsByStatus.map(item => `
              <tr>
                <td>${this.translateStatus(item.status)}</td>
                <td>${item.count}</td>
                <td>${item.percentage?.toFixed(1) || 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    `
  }

  // Generate Financial Report HTML Content
  private static generateFinancialReportContent(data: FinancialReportData, options: ReportExportOptions): string {
    return `
      <div class="summary-cards">
        <div class="summary-card">
          <h3>إجمالي الإيرادات</h3>
          <div class="number">${formatCurrency(data.totalRevenue || 0, 'USD')}</div>
        </div>
        <div class="summary-card">
          <h3>المدفوعات المكتملة</h3>
          <div class="number">${formatCurrency(data.completedPayments || 0, 'USD')}</div>
        </div>
        <div class="summary-card">
          <h3>المدفوعات المعلقة</h3>
          <div class="number">${formatCurrency(data.pendingPayments || 0, 'USD')}</div>
        </div>
        <div class="summary-card">
          <h3>المدفوعات المتأخرة</h3>
          <div class="number">${formatCurrency(data.overduePayments || 0, 'USD')}</div>
        </div>
      </div>

      ${data.paymentMethodStats && data.paymentMethodStats.length > 0 ? `
      <div class="section">
        <div class="section-title">إحصائيات طرق الدفع</div>
        <table>
          <thead>
            <tr>
              <th>طريقة الدفع</th>
              <th>المبلغ</th>
              <th>عدد المعاملات</th>
            </tr>
          </thead>
          <tbody>
            ${data.paymentMethodStats.map(item => `
              <tr>
                <td>${this.translatePaymentMethod(item.method)}</td>
                <td>${formatCurrency(item.amount)} $</td>
                <td>${item.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    `
  }

  // Generate Inventory Report HTML Content
  private static generateInventoryReportContent(data: InventoryReportData, options: ReportExportOptions): string {
    return `
      <div class="summary-cards">
        <div class="summary-card">
          <h3>إجمالي الأصناف</h3>
          <div class="number">${data.totalItems || 0}</div>
        </div>
        <div class="summary-card">
          <h3>القيمة الإجمالية</h3>
          <div class="number">${formatCurrency(data.totalValue || 0)}</div>
        </div>
        <div class="summary-card">
          <h3>أصناف منخفضة المخزون</h3>
          <div class="number" style="color: #f59e0b;">${data.lowStockItems || 0}</div>
        </div>
        <div class="summary-card">
          <h3>أصناف منتهية الصلاحية</h3>
          <div class="number" style="color: #ef4444;">${data.expiredItems || 0}</div>
        </div>
      </div>

      ${data.itemsByCategory && data.itemsByCategory.length > 0 ? `
      <div class="section">
        <div class="section-title">توزيع الأصناف حسب الفئة</div>
        <table>
          <thead>
            <tr>
              <th>الفئة</th>
              <th>عدد الأصناف</th>
              <th>القيمة</th>
            </tr>
          </thead>
          <tbody>
            ${data.itemsByCategory.map(item => `
              <tr>
                <td>${item.category}</td>
                <td>${item.count}</td>
                <td>${formatCurrency(item.value)} $</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    `
  }

  // Generate Overview Report HTML Content
  private static generateOverviewReportContent(data: any, options: ReportExportOptions): string {
    return `
      <div class="section">
        <div class="section-title">ملخص شامل للعيادة</div>
        <div class="summary-cards">
          ${data.patients ? `
          <div class="summary-card">
            <h3>المرضى</h3>
            <div class="number">${data.patients.totalPatients || 0}</div>
          </div>
          ` : ''}
          ${data.appointments ? `
          <div class="summary-card">
            <h3>المواعيد</h3>
            <div class="number">${data.appointments.totalAppointments || 0}</div>
          </div>
          ` : ''}
          ${data.financial ? `
          <div class="summary-card">
            <h3>الإيرادات</h3>
            <div class="number">${formatCurrency(data.financial.totalRevenue || 0)}</div>
          </div>
          ` : ''}
          ${data.inventory ? `
          <div class="summary-card">
            <h3>المخزون</h3>
            <div class="number">${data.inventory.totalItems || 0}</div>
          </div>
          ` : ''}
        </div>
      </div>

      ${data.patients ? this.generatePatientReportContent(data.patients, options) : ''}
      ${data.appointments ? this.generateAppointmentReportContent(data.appointments, options) : ''}
      ${data.financial ? this.generateFinancialReportContent(data.financial, options) : ''}
      ${data.inventory ? this.generateInventoryReportContent(data.inventory, options) : ''}
    `
  }

  // Helper methods for translations
  private static translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'مجدول',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'no-show': 'عدم حضور',
      'in-progress': 'قيد التنفيذ'
    }
    return statusMap[status] || status
  }

  private static translatePaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'نقدي',
      'card': 'بطاقة ائتمان',
      'bank_transfer': 'تحويل بنكي',
      'insurance': 'تأمين',
      'installment': 'تقسيط'
    }
    return methodMap[method] || method
  }

  private static getPaymentStatusInArabic(status: string): string {
    const statusMap: { [key: string]: string } = {
      'completed': 'مكتمل',
      'partial': 'جزئي',
      'pending': 'معلق',
      'overdue': 'متأخر',
      'cancelled': 'ملغي'
    }
    return statusMap[status] || status
  }

  static addPDFHeader(doc: jsPDF, type: string, options: ReportExportOptions): void {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Clinic name
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('عيادة الأسنان الحديثة', pageWidth / 2, 20, { align: 'center' })

    // Report title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'normal')
    const titles = {
      patients: 'تقرير المرضى',
      appointments: 'تقرير المواعيد',
      financial: 'التقرير المالي',
      inventory: 'تقرير المخزون',
      analytics: 'تقرير التحليلات',
      overview: 'التقرير الشامل'
    }
    doc.text(titles[type as keyof typeof titles] || 'تقرير', pageWidth / 2, 35, { align: 'center' })

    // Date and time
    doc.setFontSize(12)
    const currentDate = new Date()
    const day = currentDate.getDate().toString().padStart(2, '0')
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const year = currentDate.getFullYear()
    const formattedDate = `${day}/${month}/${year}`
    doc.text(`تاريخ التقرير: ${formattedDate}`, pageWidth - 20, 45, { align: 'right' })

    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 48, pageWidth - 20, 48)
  }

  static addPDFFooter(doc: jsPDF, options: ReportExportOptions): void {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('تم إنشاء هذا التقرير بواسطة نظام إدارة العيادة', pageWidth / 2, pageHeight - 10, { align: 'center' })
  }

  // Patient Report PDF
  static async addPatientReportToPDF(doc: jsPDF, data: PatientReportData, yPosition: number, options: ReportExportOptions): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Summary statistics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ملخص إحصائيات المرضى', 20, yPosition)
    yPosition += 15

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`إجمالي المرضى: ${data.totalPatients || 0}`, 20, yPosition)
    doc.text(`المرضى الجدد هذا الشهر: ${data.newPatientsThisMonth || 0}`, 150, yPosition)
    yPosition += 10
    doc.text(`المرضى النشطون: ${data.activePatients || 0}`, 20, yPosition)
    doc.text(`متوسط العمر: ${data.averageAge || 0} سنة`, 150, yPosition)
    yPosition += 20

    // Age distribution chart (if includeCharts is true)
    if (options.includeCharts && data.ageDistribution) {
      doc.setFont('helvetica', 'bold')
      doc.text('توزيع الأعمار', 20, yPosition)
      yPosition += 10

      data.ageDistribution.forEach((group: any) => {
        doc.setFont('helvetica', 'normal')
        doc.text(`${group.range}: ${group.count} مريض`, 30, yPosition)
        yPosition += 8
      })
      yPosition += 10
    }

    // Patient details table (if includeDetails is true)
    if (options.includeDetails && data.patients) {
      doc.setFont('helvetica', 'bold')
      doc.text('تفاصيل المرضى', 20, yPosition)
      yPosition += 15

      // Table headers
      doc.setFontSize(10)
      doc.text('الاسم', 20, yPosition)
      doc.text('الهاتف', 80, yPosition)
      doc.text('العمر', 130, yPosition)
      doc.text('آخر زيارة', 170, yPosition)
      doc.text('الحالة', 220, yPosition)

      doc.line(20, yPosition + 2, pageWidth - 20, yPosition + 2)
      yPosition += 10

      // Patient rows
      doc.setFont('helvetica', 'normal')
      data.patients.slice(0, 20).forEach((patient: any) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }

        doc.text(`${patient.first_name} ${patient.last_name}`, 20, yPosition)
        doc.text(patient.phone || 'غير محدد', 80, yPosition)
        doc.text(patient.age?.toString() || 'غير محدد', 130, yPosition)
        doc.text(patient.last_visit || 'لا توجد زيارات', 170, yPosition)
        doc.text(patient.status || 'نشط', 220, yPosition)
        yPosition += 8
      })
    }

    return yPosition + 20
  }

  // Appointment Report PDF
  static async addAppointmentReportToPDF(doc: jsPDF, data: AppointmentReportData, yPosition: number, options: ReportExportOptions): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Summary statistics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ملخص إحصائيات المواعيد', 20, yPosition)
    yPosition += 15

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`إجمالي المواعيد: ${data.totalAppointments || 0}`, 20, yPosition)
    doc.text(`المواعيد المكتملة: ${data.completedAppointments || 0}`, 150, yPosition)
    yPosition += 10
    doc.text(`المواعيد الملغية: ${data.cancelledAppointments || 0}`, 20, yPosition)
    doc.text(`معدل الحضور: ${data.attendanceRate || 0}%`, 150, yPosition)
    yPosition += 20

    // Status distribution
    if (options.includeCharts && data.appointmentsByStatus) {
      doc.setFont('helvetica', 'bold')
      doc.text('توزيع حالات المواعيد', 20, yPosition)
      yPosition += 10

      data.appointmentsByStatus.forEach((status: any) => {
        doc.setFont('helvetica', 'normal')
        doc.text(`${status.status}: ${status.count} موعد`, 30, yPosition)
        yPosition += 8
      })
      yPosition += 10
    }

    return yPosition + 20
  }

  // Financial Report PDF
  static async addFinancialReportToPDF(doc: jsPDF, data: FinancialReportData, yPosition: number, options: ReportExportOptions): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Summary statistics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ملخص الإحصائيات المالية', 20, yPosition)
    yPosition += 15

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`إجمالي الإيرادات: ${formatCurrency(data.totalRevenue || 0)}`, 20, yPosition)
    doc.text(`المدفوعات المكتملة: ${formatCurrency(data.completedPayments || 0)}`, 150, yPosition)
    yPosition += 10
    doc.text(`المدفوعات المعلقة: ${formatCurrency(data.pendingPayments || 0)}`, 20, yPosition)
    doc.text(`المدفوعات المتأخرة: ${formatCurrency(data.overduePayments || 0)}`, 150, yPosition)
    yPosition += 20

    // Payment methods distribution
    if (options.includeCharts && data.paymentMethodStats) {
      doc.setFont('helvetica', 'bold')
      doc.text('توزيع طرق الدفع', 20, yPosition)
      yPosition += 10

      data.paymentMethodStats.forEach((method: any) => {
        doc.setFont('helvetica', 'normal')
        doc.text(`${method.method}: ${formatCurrency(method.amount)} (${method.count} معاملة)`, 30, yPosition)
        yPosition += 8
      })
      yPosition += 10
    }

    // Monthly revenue trend
    if (options.includeCharts && data.monthlyRevenue) {
      doc.setFont('helvetica', 'bold')
      doc.text('الإيرادات الشهرية', 20, yPosition)
      yPosition += 10

      data.monthlyRevenue.slice(-6).forEach((month: any) => {
        doc.setFont('helvetica', 'normal')
        doc.text(`${month.month}: ${formatCurrency(month.revenue)}`, 30, yPosition)
        yPosition += 8
      })
      yPosition += 10
    }

    return yPosition + 20
  }

  // Inventory Report PDF
  static async addInventoryReportToPDF(doc: jsPDF, data: InventoryReportData, yPosition: number, options: ReportExportOptions): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Summary statistics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ملخص إحصائيات المخزون', 20, yPosition)
    yPosition += 15

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`إجمالي العناصر: ${data.totalItems || 0}`, 20, yPosition)
    doc.text(`القيمة الإجمالية: ${formatCurrency(data.totalValue || 0)}`, 150, yPosition)
    yPosition += 10
    doc.text(`عناصر منخفضة المخزون: ${data.lowStockItems || 0}`, 20, yPosition)
    doc.text(`عناصر منتهية الصلاحية: ${data.expiredItems || 0}`, 150, yPosition)
    yPosition += 10
    doc.text(`عناصر نفدت من المخزون: ${data.outOfStockItems || 0}`, 20, yPosition)
    doc.text(`معدل دوران المخزون: ${data.turnoverRate || 0}%`, 150, yPosition)
    yPosition += 20

    // Top categories
    if (options.includeCharts && data.topCategories) {
      doc.setFont('helvetica', 'bold')
      doc.text('أعلى الفئات استهلاكاً', 20, yPosition)
      yPosition += 10

      data.topCategories.slice(0, 5).forEach((category: any) => {
        doc.setFont('helvetica', 'normal')
        doc.text(`${category.name}: ${category.count} عنصر`, 30, yPosition)
        yPosition += 8
      })
      yPosition += 10
    }

    return yPosition + 20
  }

  // Overview Report PDF
  static async addOverviewReportToPDF(doc: jsPDF, data: any, yPosition: number, options: ReportExportOptions): Promise<number> {
    // Add each section
    if (data.patients) {
      yPosition = await this.addPatientReportToPDF(doc, data.patients, yPosition, options)
    }

    if (data.appointments) {
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 30
      }
      yPosition = await this.addAppointmentReportToPDF(doc, data.appointments, yPosition, options)
    }

    if (data.financial) {
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 30
      }
      yPosition = await this.addFinancialReportToPDF(doc, data.financial, yPosition, options)
    }

    if (data.inventory) {
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 30
      }
      yPosition = await this.addInventoryReportToPDF(doc, data.inventory, yPosition, options)
    }

    return yPosition
  }

  // Excel Export Functions
  static async exportToExcel(type: string, data: any, options: ReportExportOptions): Promise<string> {
    const workbook = new ExcelJS.Workbook()

    // Set workbook properties
    workbook.creator = 'نظام إدارة العيادة'
    workbook.created = new Date()
    workbook.modified = new Date()

    switch (type) {
      case 'patients':
        await this.addPatientReportToExcel(workbook, data, options)
        break
      case 'appointments':
        await this.addAppointmentReportToExcel(workbook, data, options)
        break
      case 'financial':
        await this.addFinancialReportToExcel(workbook, data, options)
        break
      case 'inventory':
        await this.addInventoryReportToExcel(workbook, data, options)
        break
      case 'overview':
        await this.addOverviewReportToExcel(workbook, data, options)
        break
    }

    const fileName = this.generateFileName(type, 'xlsx', { includeTime: true })
    await workbook.xlsx.writeFile(fileName)
    return fileName
  }

  static async addPatientReportToExcel(workbook: ExcelJS.Workbook, data: PatientReportData, options: ReportExportOptions): Promise<void> {
    const worksheet = workbook.addWorksheet('تقرير المرضى')

    // Header
    worksheet.mergeCells('A1:F1')
    const headerCell = worksheet.getCell('A1')
    headerCell.value = 'تقرير المرضى - عيادة الأسنان الحديثة'
    headerCell.font = { size: 16, bold: true }
    headerCell.alignment = { horizontal: 'center' }

    // Summary statistics
    worksheet.getCell('A3').value = 'ملخص الإحصائيات'
    worksheet.getCell('A3').font = { bold: true }

    worksheet.getCell('A4').value = 'إجمالي المرضى:'
    worksheet.getCell('B4').value = data.totalPatients || 0
    worksheet.getCell('A5').value = 'المرضى الجدد هذا الشهر:'
    worksheet.getCell('B5').value = data.newPatientsThisMonth || 0
    worksheet.getCell('A6').value = 'المرضى النشطون:'
    worksheet.getCell('B6').value = data.activePatients || 0
    worksheet.getCell('A7').value = 'متوسط العمر:'
    worksheet.getCell('B7').value = `${data.averageAge || 0} سنة`

    // Patient details
    if (options.includeDetails && data.patients) {
      let row = 10
      worksheet.getCell(`A${row}`).value = 'تفاصيل المرضى'
      worksheet.getCell(`A${row}`).font = { bold: true }
      row += 2

      // Headers
      const headers = ['الاسم الأول', 'الاسم الأخير', 'الهاتف', 'البريد الإلكتروني', 'العمر', 'آخر زيارة']
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(row, index + 1)
        cell.value = header
        cell.font = { bold: true }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
      })
      row++

      // Data rows
      data.patients.forEach((patient: any) => {
        worksheet.getCell(row, 1).value = patient.first_name || ''
        worksheet.getCell(row, 2).value = patient.last_name || ''
        worksheet.getCell(row, 3).value = patient.phone || ''
        worksheet.getCell(row, 4).value = patient.email || ''
        worksheet.getCell(row, 5).value = patient.age || ''
        worksheet.getCell(row, 6).value = patient.last_visit || ''
        row++
      })
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15
    })
  }

  static async addFinancialReportToExcel(workbook: ExcelJS.Workbook, data: FinancialReportData, options: ReportExportOptions): Promise<void> {
    const worksheet = workbook.addWorksheet('التقرير المالي')

    // Header
    worksheet.mergeCells('A1:F1')
    const headerCell = worksheet.getCell('A1')
    headerCell.value = 'التقرير المالي - عيادة الأسنان الحديثة'
    headerCell.font = { size: 16, bold: true }
    headerCell.alignment = { horizontal: 'center' }

    // Summary statistics
    worksheet.getCell('A3').value = 'ملخص الإحصائيات المالية'
    worksheet.getCell('A3').font = { bold: true }

    worksheet.getCell('A4').value = 'إجمالي الإيرادات:'
    worksheet.getCell('B4').value = `${formatCurrency(data.totalRevenue || 0)}`
    worksheet.getCell('A5').value = 'المدفوعات المكتملة:'
    worksheet.getCell('B5').value = `${formatCurrency(data.completedPayments || 0)}`
    worksheet.getCell('A6').value = 'المدفوعات المعلقة:'
    worksheet.getCell('B6').value = `${formatCurrency(data.pendingPayments || 0)}`
    worksheet.getCell('A7').value = 'المدفوعات المتأخرة:'
    worksheet.getCell('B7').value = `${formatCurrency(data.overduePayments || 0)}`

    // Payment methods
    if (data.paymentMethodStats) {
      let row = 10
      worksheet.getCell(`A${row}`).value = 'توزيع طرق الدفع'
      worksheet.getCell(`A${row}`).font = { bold: true }
      row += 2

      worksheet.getCell(row, 1).value = 'طريقة الدفع'
      worksheet.getCell(row, 2).value = 'المبلغ'
      worksheet.getCell(row, 3).value = 'عدد المعاملات'
      worksheet.getRow(row).font = { bold: true }
      row++

      data.paymentMethodStats.forEach((method: any) => {
        worksheet.getCell(row, 1).value = method.method
        worksheet.getCell(row, 2).value = `${formatCurrency(method.amount)}`
        worksheet.getCell(row, 3).value = method.count
        row++
      })
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20
    })
  }

  static async addAppointmentReportToExcel(workbook: ExcelJS.Workbook, data: AppointmentReportData, options: ReportExportOptions): Promise<void> {
    const worksheet = workbook.addWorksheet('تقرير المواعيد')

    // Header and summary similar to other reports
    worksheet.mergeCells('A1:F1')
    const headerCell = worksheet.getCell('A1')
    headerCell.value = 'تقرير المواعيد - عيادة الأسنان الحديثة'
    headerCell.font = { size: 16, bold: true }
    headerCell.alignment = { horizontal: 'center' }

    // Summary statistics
    worksheet.getCell('A3').value = 'ملخص إحصائيات المواعيد'
    worksheet.getCell('A3').font = { bold: true }

    worksheet.getCell('A4').value = 'إجمالي المواعيد:'
    worksheet.getCell('B4').value = data.totalAppointments || 0
    worksheet.getCell('A5').value = 'المواعيد المكتملة:'
    worksheet.getCell('B5').value = data.completedAppointments || 0
    worksheet.getCell('A6').value = 'المواعيد الملغية:'
    worksheet.getCell('B6').value = data.cancelledAppointments || 0
    worksheet.getCell('A7').value = 'معدل الحضور:'
    worksheet.getCell('B7').value = `${data.attendanceRate || 0}%`

    worksheet.columns.forEach(column => {
      column.width = 20
    })
  }

  static async addInventoryReportToExcel(workbook: ExcelJS.Workbook, data: InventoryReportData, options: ReportExportOptions): Promise<void> {
    const worksheet = workbook.addWorksheet('تقرير المخزون')

    // Header and summary
    worksheet.mergeCells('A1:F1')
    const headerCell = worksheet.getCell('A1')
    headerCell.value = 'تقرير المخزون - عيادة الأسنان الحديثة'
    headerCell.font = { size: 16, bold: true }
    headerCell.alignment = { horizontal: 'center' }

    // Summary statistics
    worksheet.getCell('A3').value = 'ملخص إحصائيات المخزون'
    worksheet.getCell('A3').font = { bold: true }

    worksheet.getCell('A4').value = 'إجمالي العناصر:'
    worksheet.getCell('B4').value = data.totalItems || 0
    worksheet.getCell('A5').value = 'القيمة الإجمالية:'
    worksheet.getCell('B5').value = `${formatCurrency(data.totalValue || 0)}`
    worksheet.getCell('A6').value = 'عناصر منخفضة المخزون:'
    worksheet.getCell('B6').value = data.lowStockItems || 0
    worksheet.getCell('A7').value = 'عناصر منتهية الصلاحية:'
    worksheet.getCell('B7').value = data.expiredItems || 0

    worksheet.columns.forEach(column => {
      column.width = 20
    })
  }

  static async addOverviewReportToExcel(workbook: ExcelJS.Workbook, data: any, options: ReportExportOptions): Promise<void> {
    if (data.patients) {
      await this.addPatientReportToExcel(workbook, data.patients, options)
    }
    if (data.appointments) {
      await this.addAppointmentReportToExcel(workbook, data.appointments, options)
    }
    if (data.financial) {
      await this.addFinancialReportToExcel(workbook, data.financial, options)
    }
    if (data.inventory) {
      await this.addInventoryReportToExcel(workbook, data.inventory, options)
    }
  }

  // CSV Export Functions
  static async exportToCSV(type: string, data: any, options: ReportExportOptions): Promise<string> {
    let csvContent = '\uFEFF' // BOM for Arabic support

    switch (type) {
      case 'patients':
        csvContent += this.generatePatientCSV(data, options)
        break
      case 'appointments':
        csvContent += this.generateAppointmentCSV(data, options)
        break
      case 'financial':
        csvContent += this.generateFinancialCSV(data, options)
        break
      case 'inventory':
        csvContent += this.generateInventoryCSV(data, options)
        break
      case 'overview':
        csvContent += this.generateOverviewCSV(data, options)
        break
    }

    const fileName = this.generateFileName(type, 'csv', { includeTime: true })
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create download link
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return fileName
  }

  static generatePatientCSV(data: PatientReportData, options: ReportExportOptions): string {
    let csv = 'تقرير المرضى - عيادة الأسنان الحديثة\n\n'
    csv += 'ملخص الإحصائيات\n'
    csv += `إجمالي المرضى,${data.totalPatients || 0}\n`
    csv += `المرضى الجدد هذا الشهر,${data.newPatientsThisMonth || 0}\n`
    csv += `المرضى النشطون,${data.activePatients || 0}\n`
    csv += `متوسط العمر,${data.averageAge || 0} سنة\n\n`

    // Add age distribution to CSV
    if (data.ageDistribution && data.ageDistribution.length > 0) {
      csv += 'توزيع الأعمار\n'
      csv += 'الفئة العمرية,العدد,النسبة المئوية\n'

      data.ageDistribution.forEach((group: any) => {
        const percentage = data.totalPatients > 0 ? ((group.count / data.totalPatients) * 100).toFixed(1) : '0.0'
        csv += `"${group.ageGroup}",${group.count},${percentage}%\n`
      })
      csv += '\n'
    }

    // Add gender distribution to CSV
    if (data.genderDistribution && data.genderDistribution.length > 0) {
      csv += 'توزيع الجنس\n'
      csv += 'الجنس,العدد,النسبة المئوية\n'

      data.genderDistribution.forEach((group: any) => {
        const percentage = data.totalPatients > 0 ? ((group.count / data.totalPatients) * 100).toFixed(1) : '0.0'
        const genderLabel = group.gender === 'male' || group.gender === 'ذكور' ? 'ذكر' : 'أنثى'
        csv += `"${genderLabel}",${group.count},${percentage}%\n`
      })
      csv += '\n'
    }

    if (options.includeDetails && data.patients) {
      csv += 'تفاصيل المرضى\n'
      csv += 'الرقم التسلسلي,الاسم الكامل,الجنس,العمر,الهاتف,البريد الإلكتروني,تاريخ التسجيل\n'

      data.patients.forEach((patient: any) => {
        const genderLabel = patient.gender === 'male' ? 'ذكر' : 'أنثى'
        const registrationDate = patient.created_at ? new Date(patient.created_at).toLocaleDateString('ar-SA') : ''
        csv += `"${patient.serial_number || ''}","${patient.full_name || ''}","${genderLabel}","${patient.age || ''}","${patient.phone || ''}","${patient.email || ''}","${registrationDate}"\n`
      })
    }

    return csv
  }

  static generateFinancialCSV(data: FinancialReportData, options: ReportExportOptions): string {
    let csv = 'التقرير المالي - عيادة الأسنان الحديثة\n\n'

    // Add current date and time
    const currentDate = new Date()
    const day = currentDate.getDate().toString().padStart(2, '0')
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const year = currentDate.getFullYear()
    const formattedDate = `${day}/${month}/${year}`
    const formattedTime = currentDate.toLocaleTimeString('ar-SA')

    csv += `تاريخ التقرير,${formattedDate}\n`
    csv += `وقت الإنشاء,${formattedTime}\n\n`

    // Add filter information if available
    if (data.filterInfo) {
      csv += 'معلومات الفلترة المطبقة\n'
      csv += `نطاق البيانات,"${data.filterInfo}"\n`
      csv += `عدد المعاملات المصدرة,${data.dataCount || 0}\n\n`
    }

    csv += 'ملخص الإحصائيات المالية\n'
    csv += `إجمالي الإيرادات,${formatCurrency(data.totalRevenue || 0)}\n`
    csv += `المدفوعات المكتملة,${formatCurrency(data.completedPayments || 0)}\n`
    csv += `المدفوعات المعلقة,${formatCurrency(data.pendingPayments || 0)}\n`
    csv += `المدفوعات المتأخرة,${formatCurrency(data.overduePayments || 0)}\n`

    // إضافة المبالغ المتبقية من الدفعات الجزئية إذا كانت متوفرة
    if ((data as any).payments && Array.isArray((data as any).payments)) {
      const partialPaymentsRemaining = (data as any).payments
        .filter((p: any) => p.status === 'partial')
        .reduce((sum: number, p: any) => {
          const remaining = p.remaining_balance !== undefined
            ? Number(p.remaining_balance)
            : (Number(p.total_amount_due || p.amount) - Number(p.amount_paid || p.amount))
          return sum + Math.max(0, remaining)
        }, 0)

      if (partialPaymentsRemaining > 0) {
        csv += `المبالغ المتبقية من الدفعات الجزئية,${formatCurrency(partialPaymentsRemaining)}\n`
      }
    }

    csv += `الرصيد المستحق الإجمالي,${formatCurrency(data.outstandingBalance || 0)}\n\n`

    if (data.paymentMethodStats && data.paymentMethodStats.length > 0) {
      csv += 'توزيع طرق الدفع\n'
      csv += 'طريقة الدفع,المبلغ,عدد المعاملات,النسبة المئوية\n'

      const totalAmount = data.paymentMethodStats.reduce((sum, method) => sum + method.amount, 0)

      data.paymentMethodStats.forEach((method: any) => {
        const percentage = totalAmount > 0 ? ((method.amount / totalAmount) * 100).toFixed(1) : '0.0'
        csv += `"${method.method}","${formatCurrency(method.amount)}","${method.count}","${percentage}%"\n`
      })
      csv += '\n'
    }

    // Add detailed payment transactions if available and details are requested
    if (options.includeDetails && (data as any).payments && Array.isArray((data as any).payments)) {
      const payments = (data as any).payments
      csv += 'تفاصيل المعاملات المالية\n'
      csv += 'رقم الإيصال,تاريخ الدفع,اسم المريض,وصف العلاج,المبلغ الإجمالي,المبلغ المدفوع,الرصيد المتبقي,طريقة الدفع,الحالة,ملاحظات\n'

      payments.forEach((payment: any) => {
        const receiptNumber = payment.receipt_number || `#${payment.id?.slice(-6) || ''}`
        const paymentDate = payment.payment_date ? formatDate(payment.payment_date) : ''
        const patientName = payment.patient_name || `${payment.patient?.first_name || ''} ${payment.patient?.last_name || ''}`.trim() || 'غير محدد'
        const description = payment.description || payment.treatment_type || 'غير محدد'
        // حساب المبالغ بناءً على نوع الدفعة
        let totalAmount, amountPaid, remainingBalance

        if (payment.status === 'partial') {
          // للدفعات الجزئية: استخدم المبالغ المحسوبة من النظام
          totalAmount = formatCurrency(Number(payment.total_amount_due || payment.amount) || 0)
          amountPaid = formatCurrency(Number(payment.amount_paid || payment.amount) || 0)
          remainingBalance = formatCurrency(Number(payment.remaining_balance || 0))
        } else if (payment.appointment_id && payment.appointment_total_cost) {
          // للمدفوعات المرتبطة بمواعيد: استخدم بيانات الموعد
          totalAmount = formatCurrency(Number(payment.appointment_total_cost) || 0)
          amountPaid = formatCurrency(Number(payment.appointment_total_paid || payment.amount) || 0)
          remainingBalance = formatCurrency(Number(payment.appointment_remaining_balance || 0))
        } else {
          // للمدفوعات العادية
          totalAmount = formatCurrency(Number(payment.amount) || 0)
          amountPaid = formatCurrency(Number(payment.amount) || 0)
          remainingBalance = formatCurrency(0)
        }
        const paymentMethod = this.translatePaymentMethod(payment.payment_method || 'غير محدد')
        const status = this.getPaymentStatusInArabic(payment.status)
        const notes = payment.notes || ''

        csv += `"${receiptNumber}","${paymentDate}","${patientName}","${description}","${totalAmount}","${amountPaid}","${remainingBalance}","${paymentMethod}","${status}","${notes}"\n`
      })
      csv += '\n'
    }

    return csv
  }

  static generateAppointmentCSV(data: AppointmentReportData, options: ReportExportOptions): string {
    let csv = 'تقرير المواعيد - عيادة الأسنان الحديثة\n\n'
    csv += 'ملخص إحصائيات المواعيد\n'
    csv += `إجمالي المواعيد,${data.totalAppointments || 0}\n`
    csv += `المواعيد المكتملة,${data.completedAppointments || 0}\n`
    csv += `المواعيد الملغية,${data.cancelledAppointments || 0}\n`
    csv += `المواعيد المجدولة,${data.scheduledAppointments || 0}\n`
    csv += `عدم الحضور,${data.noShowAppointments || 0}\n`
    csv += `معدل الحضور,${data.attendanceRate?.toFixed(1) || '0.0'}%\n`
    csv += `معدل الإلغاء,${data.cancellationRate?.toFixed(1) || '0.0'}%\n\n`

    // Add appointment status distribution
    if (data.appointmentsByStatus && data.appointmentsByStatus.length > 0) {
      csv += 'توزيع حالات المواعيد\n'
      csv += 'الحالة,العدد,النسبة المئوية\n'

      data.appointmentsByStatus.forEach((status: any) => {
        const percentage = status.percentage?.toFixed(1) || '0.0'
        csv += `"${status.status}",${status.count},${percentage}%\n`
      })
      csv += '\n'
    }

    // Add appointment by treatment distribution
    if (data.appointmentsByTreatment && data.appointmentsByTreatment.length > 0) {
      csv += 'توزيع المواعيد حسب نوع العلاج\n'
      csv += 'نوع العلاج,عدد المواعيد\n'

      data.appointmentsByTreatment.forEach((treatment: any) => {
        csv += `"${treatment.treatment}",${treatment.count}\n`
      })
      csv += '\n'
    }

    // Add filter information if available
    if (data.filterInfo) {
      csv += 'معلومات الفلترة\n'
      csv += `نطاق البيانات,"${data.filterInfo}"\n`
      csv += `عدد المواعيد المصدرة,${data.dataCount || data.totalAppointments || 0}\n`
    }

    return csv
  }

  static generateInventoryCSV(data: InventoryReportData, options: ReportExportOptions): string {
    let csv = 'تقرير المخزون - عيادة الأسنان الحديثة\n\n'
    csv += 'ملخص إحصائيات المخزون\n'
    csv += `إجمالي العناصر,${data.totalItems || 0}\n`
    csv += `القيمة الإجمالية,${formatCurrency(data.totalValue || 0)}\n`
    csv += `عناصر منخفضة المخزون,${data.lowStockItems || 0}\n`
    csv += `عناصر منتهية الصلاحية,${data.expiredItems || 0}\n`

    return csv
  }

  static generateOverviewCSV(data: any, options: ReportExportOptions): string {
    let csv = 'التقرير الشامل - عيادة الأسنان الحديثة\n\n'

    if (data.patients) {
      csv += this.generatePatientCSV(data.patients, options) + '\n\n'
    }
    if (data.appointments) {
      csv += this.generateAppointmentCSV(data.appointments, options) + '\n\n'
    }
    if (data.financial) {
      csv += this.generateFinancialCSV(data.financial, options) + '\n\n'
    }
    if (data.inventory) {
      csv += this.generateInventoryCSV(data.inventory, options)
    }

    return csv
  }

  // Clinic Needs Export Functions
  static async exportClinicNeedsToCSV(clinicNeeds: any[], filename: string = 'clinic-needs-report'): Promise<void> {
    try {
      // CSV Headers in Arabic
      const headers = [
        'الرقم التسلسلي',
        'اسم الاحتياج',
        'الكمية',
        'السعر',
        'الإجمالي',
        'الوصف',
        'الفئة',
        'الأولوية',
        'الحالة',
        'المورد',
        'الملاحظات',
        'تاريخ الإنشاء',
        'تاريخ التحديث'
      ]

      // Helper function for Gregorian date formatting
      const formatGregorianDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          if (isNaN(date.getTime())) {
            return '--'
          }

          // Format as DD/MM/YYYY (Gregorian format)
          const day = date.getDate().toString().padStart(2, '0')
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const year = date.getFullYear()

          return `${day}/${month}/${year}`
        } catch (error) {
          return '--'
        }
      }

      // Convert data to CSV format
      const csvData = clinicNeeds.map(need => [
        need.serial_number || '',
        need.need_name || '',
        need.quantity?.toString() || '0',
        need.price?.toString() || '0',
        ((need.price || 0) * (need.quantity || 0)).toString(),
        need.description || '',
        need.category || '',
        this.getPriorityLabel(need.priority || ''),
        this.getStatusLabel(need.status || ''),
        need.supplier || '',
        need.notes || '',
        need.created_at ? formatGregorianDate(need.created_at) : '',
        need.updated_at ? formatGregorianDate(need.updated_at) : ''
      ])

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Add BOM for proper Arabic display in Excel
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      // Create download link
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log(`✅ Clinic needs exported to CSV: ${filename}.csv`)
    } catch (error) {
      console.error('Error exporting clinic needs to CSV:', error)
      throw new Error('فشل في تصدير احتياجات العيادة إلى CSV')
    }
  }

  private static getPriorityLabel(priority: string): string {
    const labels = {
      urgent: 'عاجل',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض'
    }
    return labels[priority] || priority
  }

  private static getStatusLabel(status: string): string {
    const labels = {
      pending: 'معلق',
      ordered: 'مطلوب',
      received: 'مستلم',
      cancelled: 'ملغي'
    }
    return labels[status] || status
  }

  // Legacy export functions for backward compatibility
  // NOTE: These functions now support filtered data - pass filtered arrays instead of full datasets
  static async exportPatientsToPDF(patients: Patient[], clinicName: string = 'عيادة الأسنان الحديثة'): Promise<void> {
    // Calculate statistics from the provided patients array (which should be filtered)
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const newPatientsThisMonth = patients.filter(p =>
      new Date(p.created_at) >= thisMonth
    ).length

    // Calculate age distribution from actual data
    const ageGroups = { children: 0, teens: 0, adults: 0, seniors: 0 }
    const genderGroups = { male: 0, female: 0 }
    let totalAge = 0
    let patientsWithAge = 0

    patients.forEach(patient => {
      // Age calculation - use the age field directly from database
      if (patient.age && typeof patient.age === 'number' && patient.age > 0) {
        const age = patient.age
        totalAge += age
        patientsWithAge++

        if (age < 13) ageGroups.children++
        else if (age < 20) ageGroups.teens++
        else if (age < 60) ageGroups.adults++
        else ageGroups.seniors++
      }

      // Gender calculation
      if (patient.gender === 'male') genderGroups.male++
      else if (patient.gender === 'female') genderGroups.female++
    })

    const averageAge = patientsWithAge > 0 ? Math.round(totalAge / patientsWithAge) : 0

    const patientData: PatientReportData = {
      totalPatients: patients.length,
      newPatientsThisMonth: newPatientsThisMonth,
      activePatients: patients.length,
      averageAge: averageAge,
      patients: patients,
      ageDistribution: [
        { ageGroup: 'أطفال (0-12)', count: ageGroups.children },
        { ageGroup: 'مراهقون (13-19)', count: ageGroups.teens },
        { ageGroup: 'بالغون (20-59)', count: ageGroups.adults },
        { ageGroup: 'كبار السن (60+)', count: ageGroups.seniors }
      ],
      genderDistribution: [
        { gender: 'ذكور', count: genderGroups.male },
        { gender: 'إناث', count: genderGroups.female }
      ],
      registrationTrend: []
    }

    const options: ReportExportOptions = {
      format: 'pdf',
      includeCharts: false,
      includeDetails: true,
      language: 'ar',
      orientation: 'landscape',
      pageSize: 'A4'
    }

    await this.exportToPDF('patients', patientData, options)
  }

  static async exportAppointmentsToPDF(appointments: Appointment[], clinicName: string = 'عيادة الأسنان الحديثة'): Promise<void> {
    // Calculate statistics from the provided appointments array (which should be filtered)
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(a => a.status === 'completed').length
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length
    const noShowAppointments = appointments.filter(a => a.status === 'no-show').length
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length

    // Calculate rates
    const attendanceRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
    const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0

    const appointmentData: AppointmentReportData = {
      totalAppointments: totalAppointments,
      completedAppointments: completedAppointments,
      cancelledAppointments: cancelledAppointments,
      noShowAppointments: noShowAppointments,
      scheduledAppointments: scheduledAppointments,
      attendanceRate: attendanceRate,
      cancellationRate: cancellationRate,
      appointmentsByStatus: [
        { status: 'مكتمل', count: completedAppointments, percentage: attendanceRate },
        { status: 'ملغي', count: cancelledAppointments, percentage: cancellationRate },
        { status: 'لم يحضر', count: noShowAppointments, percentage: totalAppointments > 0 ? Math.round((noShowAppointments / totalAppointments) * 100) : 0 },
        { status: 'مجدول', count: scheduledAppointments, percentage: totalAppointments > 0 ? Math.round((scheduledAppointments / totalAppointments) * 100) : 0 }
      ],
      appointmentsByTreatment: [],
      appointmentsByDay: [],
      appointmentsByHour: [],
      peakHours: [],
      appointmentTrend: [],
      filterInfo: `البيانات المصدرة: ${totalAppointments} موعد`,
      dataCount: totalAppointments
    }

    const options: ReportExportOptions = {
      format: 'pdf',
      includeCharts: false,
      includeDetails: true,
      language: 'ar',
      orientation: 'landscape',
      pageSize: 'A4'
    }

    await this.exportToPDF('appointments', appointmentData, options)
  }

  static async exportPaymentsToPDF(payments: Payment[], clinicName: string = 'عيادة الأسنان الحديثة'): Promise<void> {
    // Calculate statistics from the provided payments array (which should be filtered)
    // Handle partial payments correctly by using amount_paid when available
    const totalRevenue = payments.reduce((sum, p) => {
      if (p.status === 'partial' && p.amount_paid !== undefined) {
        return sum + Number(p.amount_paid)
      }
      return sum + Number(p.amount)
    }, 0)

    const completedPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0)
    const partialPayments = payments.filter(p => p.status === 'partial').reduce((sum, p) => {
      // For partial payments, use amount_paid if available, otherwise use amount
      const amount = p.amount_paid !== undefined ? Number(p.amount_paid) : Number(p.amount)
      return sum + amount
    }, 0)
    const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0)
    const overduePayments = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0)

    // Calculate payment method statistics
    const paymentMethods = payments
      .filter(p => p.status === 'completed' || p.status === 'partial')
      .reduce((acc, payment) => {
        const method = payment.payment_method || 'غير محدد'
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 }
        }
        acc[method].count++
        // For partial payments, use amount_paid if available, otherwise use amount
        const amount = payment.status === 'partial' && payment.amount_paid !== undefined
          ? Number(payment.amount_paid)
          : Number(payment.amount)
        acc[method].amount += amount
        return acc
      }, {} as Record<string, { count: number; amount: number }>)

    const paymentMethodStats = Object.entries(paymentMethods).map(([method, stats]) => ({
      method,
      count: stats.count,
      amount: stats.amount
    }))

    const financialData: FinancialReportData = {
      totalRevenue: totalRevenue,
      completedPayments: completedPayments + partialPayments, // Include partial payments in completed
      pendingPayments: pendingPayments,
      overduePayments: overduePayments,
      paymentMethodStats: paymentMethodStats,
      monthlyRevenue: [],
      revenueTrend: [],
      topTreatments: [],
      outstandingBalance: pendingPayments + overduePayments,
      filterInfo: `البيانات المصدرة: ${payments.length} دفعة (مكتملة: ${payments.filter(p => p.status === 'completed').length}, جزئية: ${payments.filter(p => p.status === 'partial').length})`,
      dataCount: payments.length
    }

    const options: ReportExportOptions = {
      format: 'pdf',
      includeCharts: false,
      includeDetails: true,
      language: 'ar',
      orientation: 'landscape',
      pageSize: 'A4'
    }

    await this.exportToPDF('financial', financialData, options)
  }

  // Legacy Excel export functions
  // NOTE: These functions now support filtered data - pass filtered arrays instead of full datasets
  static async exportPatientsToExcel(patients: Patient[]): Promise<void> {
    // Calculate statistics from the provided patients array (which should be filtered)
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const newPatientsThisMonth = patients.filter(p =>
      new Date(p.created_at) >= thisMonth
    ).length

    // Calculate age distribution from actual data
    const ageGroups = { children: 0, teens: 0, adults: 0, seniors: 0 }
    const genderGroups = { male: 0, female: 0 }
    let totalAge = 0
    let patientsWithAge = 0

    patients.forEach(patient => {
      // Age calculation - use the age field directly from database
      if (patient.age && typeof patient.age === 'number' && patient.age > 0) {
        const age = patient.age
        totalAge += age
        patientsWithAge++

        if (age < 13) ageGroups.children++
        else if (age < 20) ageGroups.teens++
        else if (age < 60) ageGroups.adults++
        else ageGroups.seniors++
      }

      // Gender calculation
      if (patient.gender === 'male') genderGroups.male++
      else if (patient.gender === 'female') genderGroups.female++
    })

    const averageAge = patientsWithAge > 0 ? Math.round(totalAge / patientsWithAge) : 0

    const patientData: PatientReportData = {
      totalPatients: patients.length,
      newPatientsThisMonth: newPatientsThisMonth,
      activePatients: patients.length,
      averageAge: averageAge,
      patients: patients,
      ageDistribution: [
        { ageGroup: 'أطفال (0-12)', count: ageGroups.children },
        { ageGroup: 'مراهقون (13-19)', count: ageGroups.teens },
        { ageGroup: 'بالغون (20-59)', count: ageGroups.adults },
        { ageGroup: 'كبار السن (60+)', count: ageGroups.seniors }
      ],
      genderDistribution: [
        { gender: 'ذكور', count: genderGroups.male },
        { gender: 'إناث', count: genderGroups.female }
      ],
      registrationTrend: []
    }

    const options: ReportExportOptions = {
      format: 'excel',
      includeCharts: false,
      includeDetails: true,
      language: 'ar'
    }

    await this.exportToExcel('patients', patientData, options)
  }

  static async exportAppointmentsToExcel(appointments: Appointment[]): Promise<void> {
    // Calculate statistics from the provided appointments array (which should be filtered)
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(a => a.status === 'completed').length
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length
    const noShowAppointments = appointments.filter(a => a.status === 'no-show').length
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length

    // Calculate rates
    const attendanceRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
    const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0

    const appointmentData: AppointmentReportData = {
      totalAppointments: totalAppointments,
      completedAppointments: completedAppointments,
      cancelledAppointments: cancelledAppointments,
      noShowAppointments: noShowAppointments,
      scheduledAppointments: scheduledAppointments,
      attendanceRate: attendanceRate,
      cancellationRate: cancellationRate,
      appointmentsByStatus: [
        { status: 'مكتمل', count: completedAppointments, percentage: attendanceRate },
        { status: 'ملغي', count: cancelledAppointments, percentage: cancellationRate },
        { status: 'لم يحضر', count: noShowAppointments, percentage: totalAppointments > 0 ? Math.round((noShowAppointments / totalAppointments) * 100) : 0 },
        { status: 'مجدول', count: scheduledAppointments, percentage: totalAppointments > 0 ? Math.round((scheduledAppointments / totalAppointments) * 100) : 0 }
      ],
      appointmentsByTreatment: [],
      appointmentsByDay: [],
      appointmentsByHour: [],
      peakHours: [],
      appointmentTrend: [],
      filterInfo: `البيانات المصدرة: ${totalAppointments} موعد`,
      dataCount: totalAppointments
    }

    const options: ReportExportOptions = {
      format: 'excel',
      includeCharts: false,
      includeDetails: true,
      language: 'ar'
    }

    await this.exportToExcel('appointments', appointmentData, options)
  }

  static async exportTreatmentsToCSV(treatments: any[]): Promise<void> {
    const csvData = []

    // Add header
    csvData.push([
      'نوع العلاج',
      'فئة العلاج',
      'حالة العلاج',
      'التكلفة',
      'تاريخ البداية',
      'تاريخ الإنجاز',
      'اسم المريض',
      'رقم السن',
      'تاريخ الإنشاء'
    ])

    // Add treatment data
    treatments.forEach(treatment => {
      const getStatusLabel = (status: string): string => {
        const statusLabels: { [key: string]: string } = {
          'planned': 'مخطط',
          'in_progress': 'قيد التنفيذ',
          'completed': 'مكتمل',
          'cancelled': 'ملغي'
        }
        return statusLabels[status] || status
      }

      csvData.push([
        getTreatmentNameInArabic(treatment.treatment_type || ''),
        getCategoryNameInArabic(treatment.treatment_category || ''),
        getStatusLabel(treatment.treatment_status || 'planned'),
        treatment.cost || 0,
        treatment.start_date || '',
        treatment.completion_date || '',
        treatment.patient_name || `مريض ${treatment.patient_id}`,
        treatment.tooth_number || '',
        treatment.created_at || ''
      ])
    })

    // Add summary statistics
    const totalTreatments = treatments.length
    const completedTreatments = treatments.filter(t => t.treatment_status === 'completed').length
    const plannedTreatments = treatments.filter(t => t.treatment_status === 'planned').length
    const inProgressTreatments = treatments.filter(t => t.treatment_status === 'in_progress').length
    const cancelledTreatments = treatments.filter(t => t.treatment_status === 'cancelled').length

    const validateAmount = (amount: any): number => {
      const num = Number(amount)
      return isNaN(num) || !isFinite(num) ? 0 : Math.round(num * 100) / 100
    }

    const totalRevenue = treatments
      .filter(t => t.treatment_status === 'completed')
      .reduce((sum, t) => sum + validateAmount(t.cost), 0)

    const completionRate = totalTreatments > 0
      ? Math.round((completedTreatments / totalTreatments) * 100)
      : 0

    csvData.push([]) // Empty row
    csvData.push(['ملخص الإحصائيات'])
    csvData.push(['إجمالي العلاجات', totalTreatments])
    csvData.push(['العلاجات المكتملة', completedTreatments])
    csvData.push(['العلاجات المخططة', plannedTreatments])
    csvData.push(['العلاجات قيد التنفيذ', inProgressTreatments])
    csvData.push(['العلاجات الملغية', cancelledTreatments])
    csvData.push(['إجمالي الإيرادات', totalRevenue])
    csvData.push(['معدل الإنجاز (%)', completionRate])

    // Convert to CSV string
    const csvContent = csvData.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    // Add BOM for Arabic support
    const csvWithBOM = '\uFEFF' + csvContent

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `تقرير_العلاجات_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  static async exportPaymentsToExcel(payments: Payment[]): Promise<void> {
    // Calculate statistics from the provided payments array (which should be filtered)
    // Handle partial payments correctly by using amount_paid when available
    const totalRevenue = payments.reduce((sum, p) => {
      if (p.status === 'partial' && p.amount_paid !== undefined) {
        return sum + Number(p.amount_paid)
      }
      return sum + Number(p.amount)
    }, 0)

    const completedPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0)
    const partialPayments = payments.filter(p => p.status === 'partial').reduce((sum, p) => {
      // For partial payments, use amount_paid if available, otherwise use amount
      const amount = p.amount_paid !== undefined ? Number(p.amount_paid) : Number(p.amount)
      return sum + amount
    }, 0)

    // Calculate pending and overdue payments using the same logic as useTimeFilteredStats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const pendingPayments = payments
      .filter(p => p.status === 'pending')
      .filter(p => {
        const paymentDate = new Date(p.payment_date || p.created_at)
        return paymentDate >= thirtyDaysAgo
      })
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const overduePayments = payments
      .filter(p => p.status === 'pending')
      .filter(p => {
        const paymentDate = new Date(p.payment_date || p.created_at)
        return paymentDate < thirtyDaysAgo
      })
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Calculate payment method statistics
    const paymentMethods = payments
      .filter(p => p.status === 'completed' || p.status === 'partial')
      .reduce((acc, payment) => {
        const method = payment.payment_method || 'غير محدد'
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 }
        }
        acc[method].count++
        // For partial payments, use amount_paid if available, otherwise use amount
        const amount = payment.status === 'partial' && payment.amount_paid !== undefined
          ? Number(payment.amount_paid)
          : Number(payment.amount)
        acc[method].amount += amount
        return acc
      }, {} as Record<string, { count: number; amount: number }>)

    const paymentMethodStats = Object.entries(paymentMethods).map(([method, stats]) => ({
      method,
      count: stats.count,
      amount: stats.amount
    }))

    // حساب إجمالي المبالغ المتبقية من الدفعات الجزئية
    const totalRemainingFromPartialPayments = payments
      .filter(p => p.status === 'partial')
      .reduce((sum, p) => {
        // استخدم remaining_balance إذا كان متوفراً، وإلا احسب الفرق
        const remaining = p.remaining_balance !== undefined
          ? Number(p.remaining_balance)
          : (Number(p.total_amount_due || p.amount) - Number(p.amount_paid || p.amount))
        return sum + Math.max(0, remaining)
      }, 0)

    const financialData: FinancialReportData = {
      totalRevenue: totalRevenue,
      completedPayments: completedPayments + partialPayments, // Include partial payments in completed
      pendingPayments: pendingPayments,
      overduePayments: overduePayments,
      paymentMethodStats: paymentMethodStats,
      monthlyRevenue: [],
      revenueTrend: [],
      topTreatments: [],
      outstandingBalance: pendingPayments + overduePayments + totalRemainingFromPartialPayments,
      filterInfo: `البيانات المصدرة: ${payments.length} دفعة (مكتملة: ${payments.filter(p => p.status === 'completed').length}, جزئية: ${payments.filter(p => p.status === 'partial').length}, معلقة: ${payments.filter(p => p.status === 'pending').length}, متأخرة: ${overduePayments > 0 ? payments.filter(p => p.status === 'pending' && new Date(p.payment_date || p.created_at) < thirtyDaysAgo).length : 0}, مبلغ متبقي من الجزئية: ${formatCurrency(totalRemainingFromPartialPayments)})`,
      dataCount: payments.length
    }

    const options: ReportExportOptions = {
      format: 'excel',
      includeCharts: false,
      includeDetails: true,
      language: 'ar'
    }

    await this.exportToExcel('financial', financialData, options)
  }

  static async exportPaymentsToCSV(payments: Payment[]): Promise<void> {
    // Calculate statistics from the provided payments array (which should be filtered)
    // Handle partial payments correctly by using amount_paid when available
    const totalRevenue = payments.reduce((sum, p) => {
      if (p.status === 'partial' && p.amount_paid !== undefined) {
        return sum + Number(p.amount_paid)
      }
      return sum + Number(p.amount)
    }, 0)

    const completedPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0)
    const partialPayments = payments.filter(p => p.status === 'partial').reduce((sum, p) => {
      // For partial payments, use amount_paid if available, otherwise use amount
      const amount = p.amount_paid !== undefined ? Number(p.amount_paid) : Number(p.amount)
      return sum + amount
    }, 0)

    // Calculate pending and overdue payments using the same logic as useTimeFilteredStats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const pendingPayments = payments
      .filter(p => p.status === 'pending')
      .filter(p => {
        const paymentDate = new Date(p.payment_date || p.created_at)
        return paymentDate >= thirtyDaysAgo
      })
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const overduePayments = payments
      .filter(p => p.status === 'pending')
      .filter(p => {
        const paymentDate = new Date(p.payment_date || p.created_at)
        return paymentDate < thirtyDaysAgo
      })
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Calculate payment method statistics
    const paymentMethods = payments
      .filter(p => p.status === 'completed' || p.status === 'partial')
      .reduce((acc, payment) => {
        const method = payment.payment_method || 'غير محدد'
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 }
        }
        acc[method].count++
        // For partial payments, use amount_paid if available, otherwise use amount
        const amount = payment.status === 'partial' && payment.amount_paid !== undefined
          ? Number(payment.amount_paid)
          : Number(payment.amount)
        acc[method].amount += amount
        return acc
      }, {} as Record<string, { count: number; amount: number }>)

    const paymentMethodStats = Object.entries(paymentMethods).map(([method, stats]) => ({
      method,
      count: stats.count,
      amount: stats.amount
    }))

    // حساب إجمالي المبالغ المتبقية من الدفعات الجزئية
    const totalRemainingFromPartialPayments = payments
      .filter(p => p.status === 'partial')
      .reduce((sum, p) => {
        // استخدم remaining_balance إذا كان متوفراً، وإلا احسب الفرق
        const remaining = p.remaining_balance !== undefined
          ? Number(p.remaining_balance)
          : (Number(p.total_amount_due || p.amount) - Number(p.amount_paid || p.amount))
        return sum + Math.max(0, remaining)
      }, 0)

    // Enhanced financial data with detailed payment information
    const financialData: FinancialReportData = {
      totalRevenue: totalRevenue,
      completedPayments: completedPayments + partialPayments, // Include partial payments in completed
      pendingPayments: pendingPayments,
      overduePayments: overduePayments,
      paymentMethodStats: paymentMethodStats,
      monthlyRevenue: [],
      revenueTrend: [],
      topTreatments: [],
      outstandingBalance: pendingPayments + overduePayments + totalRemainingFromPartialPayments,
      filterInfo: `البيانات المصدرة: ${payments.length} دفعة (مكتملة: ${payments.filter(p => p.status === 'completed').length}, جزئية: ${payments.filter(p => p.status === 'partial').length}, معلقة: ${payments.filter(p => p.status === 'pending').length}, متأخرة: ${overduePayments > 0 ? payments.filter(p => p.status === 'pending' && new Date(p.payment_date || p.created_at) < thirtyDaysAgo).length : 0}, مبلغ متبقي من الجزئية: ${formatCurrency(totalRemainingFromPartialPayments)})`,
      dataCount: payments.length,
      // Add the actual payments data for detailed export
      payments: payments
    }

    const options: ReportExportOptions = {
      format: 'csv',
      includeCharts: false,
      includeDetails: true,
      language: 'ar'
    }

    await this.exportToCSV('financial', financialData, options)
  }
}
