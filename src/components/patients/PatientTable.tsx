import React, { useState, useMemo } from 'react'
import { Patient } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Edit,
  Trash2,
  Eye,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PatientTableProps {
  patients: Patient[]
  isLoading: boolean
  onEdit: (patient: Patient) => void
  onDelete: (patientId: string) => void
  onViewDetails: (patient: Patient) => void
}

type SortField = 'full_name' | 'gender' | 'age' | 'phone' | 'patient_condition'
type SortDirection = 'asc' | 'desc' | null

export default function PatientTable({
  patients,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails
}: PatientTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedAndPaginatedPatients = useMemo(() => {
    let sortedPatients = patients

    // Apply sorting
    if (sortField && sortDirection) {
      sortedPatients = [...patients].sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1

        // Convert to string for comparison
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedPatients = sortedPatients.slice(startIndex, endIndex)

    return {
      patients: paginatedPatients,
      totalPages: Math.ceil(sortedPatients.length / pageSize),
      totalCount: sortedPatients.length
    }
  }, [patients, sortField, sortDirection, currentPage, pageSize])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4" />
    }
    return <ArrowUpDown className="w-4 h-4 opacity-50" />
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none text-center"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-center space-x-1 space-x-reverse">
        <span>{children}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  )

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table className="table-center-all">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">الرقم التسلسلي</TableHead>
              <TableHead className="text-center">الاسم الكامل للمريض</TableHead>
              <TableHead className="text-center">الجنس</TableHead>
              <TableHead className="text-center">العمر</TableHead>
              <TableHead className="text-center">رقم الهاتف</TableHead>
              <TableHead className="text-center">حالة المريض</TableHead>
              <TableHead className="text-center">ملاحظات</TableHead>
              <TableHead className="text-center">الاجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {[...Array(7)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="border rounded-lg">
        <Table className="table-center-all">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">
                <span className="arabic-enhanced font-medium">الرقم التسلسلي</span>
              </TableHead>
              <SortableHeader field="full_name">الاسم الكامل للمريض</SortableHeader>
              <SortableHeader field="gender">الجنس</SortableHeader>
              <SortableHeader field="age">العمر</SortableHeader>
              <SortableHeader field="phone">رقم الهاتف</SortableHeader>
              <SortableHeader field="patient_condition">حالة المريض</SortableHeader>
              <TableHead className="text-center">ملاحظات</TableHead>
              <TableHead className="text-center">الاجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center space-y-2">
                  <User className="w-12 h-12 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">لا توجد مرضى</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  const { patients: paginatedPatients, totalPages, totalCount } = getSortedAndPaginatedPatients

  // Calculate start index for serial numbers
  const startIndex = (currentPage - 1) * pageSize

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="table-center-all">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center">
                  <span className="arabic-enhanced font-medium">الرقم التسلسلي</span>
                </TableHead>
                <SortableHeader field="full_name">
                  <span className="arabic-enhanced font-medium">الاسم الكامل للمريض</span>
                </SortableHeader>
                <SortableHeader field="gender">
                  <span className="arabic-enhanced font-medium">الجنس</span>
                </SortableHeader>
                <SortableHeader field="age">
                  <span className="arabic-enhanced font-medium">العمر</span>
                </SortableHeader>
                <SortableHeader field="phone">
                  <span className="arabic-enhanced font-medium">رقم الهاتف</span>
                </SortableHeader>
                <SortableHeader field="patient_condition">
                  <span className="arabic-enhanced font-medium">حالة المريض</span>
                </SortableHeader>
                <TableHead className="text-center">
                  <span className="arabic-enhanced font-medium">الاجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {paginatedPatients.map((patient, index) => (
            <TableRow key={patient.id} className="hover:bg-muted/50">
              <TableCell className="font-medium text-center">
                {startIndex + index + 1}
              </TableCell>
              <TableCell className="font-medium text-center">
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {patient.full_name.charAt(0)}
                  </div>
                  <span>{patient.full_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={patient.gender === 'male' ? 'default' : 'secondary'}>
                  {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{patient.age} سنة</TableCell>
              <TableCell className="min-w-[120px] text-center table-cell-wrap-truncate-sm">
                {patient.phone ? (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={async () => {
                        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${patient.phone}`;

                        // Try multiple methods to open external URL
                        try {
                          // Method 1: Try electronAPI system.openExternal
                          if (window.electronAPI && window.electronAPI.system && window.electronAPI.system.openExternal) {
                            await window.electronAPI.system.openExternal(whatsappUrl);
                            return;
                          }
                        } catch (error) {
                          console.log('Method 1 failed:', error);
                        }

                        try {
                          // Method 2: Try direct shell.openExternal via ipcRenderer
                          if (window.electronAPI) {
                            // @ts-ignore
                            await window.electronAPI.shell?.openExternal?.(whatsappUrl);
                            return;
                          }
                        } catch (error) {
                          console.log('Method 2 failed:', error);
                        }

                        // Method 3: Fallback to window.open
                        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-sm arabic-enhanced text-green-600 hover:text-green-800 hover:underline cursor-pointer transition-colors bg-transparent border-none p-0 flex items-center gap-1"
                      title="فتح محادثة واتساب"
                    >
                      {patient.phone}
                      <MessageCircle className="w-3 h-3 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm arabic-enhanced">غير محدد</span>
                )}
              </TableCell>
              <TableCell className="min-w-[150px] text-center">
                <Badge variant="outline" className="max-w-[150px] truncate arabic-enhanced" title={patient.patient_condition}>
                  {patient.patient_condition}
                </Badge>
              </TableCell>
              <TableCell className="min-w-[180px] text-center">
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="action-btn-view"
                    onClick={() => onViewDetails(patient)}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    <span className="text-xs arabic-enhanced">عرض</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="action-btn-edit"
                    onClick={() => onEdit(patient)}
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    <span className="text-xs arabic-enhanced">تعديل</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="action-btn-delete"
                    onClick={() => onDelete(patient.id)}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    <span className="text-xs arabic-enhanced">حذف</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>

    {/* Pagination Controls */}
    {totalCount > 0 && (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <p className="text-sm text-muted-foreground arabic-enhanced">
            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalCount)} من {totalCount} مريض
          </p>
        </div>

        <div className="flex items-center space-x-6 space-x-reverse lg:space-x-8">
          <div className="flex items-center space-x-2 space-x-reverse">
            <p className="text-sm font-medium arabic-enhanced">عدد الصفوف لكل صفحة</p>
            <Select
              value={`${pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-[100px] items-center justify-center text-sm font-medium arabic-enhanced">
            صفحة {currentPage} من {totalPages}
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">الذهاب إلى الصفحة الأولى</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">الذهاب إلى الصفحة السابقة</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">الذهاب إلى الصفحة التالية</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">الذهاب إلى الصفحة الأخيرة</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
