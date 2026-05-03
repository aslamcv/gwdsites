'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Users,
  FileSpreadsheet,
  FileDown,
  Activity,
  ArrowLeft,
  User as UserIcon,
  FilterX,
  Calendar as CalendarIcon,
  CalendarCheck,
  SearchCode
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths, parseISO, isValid } from 'date-fns';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
} from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function SiteStaffAttendancePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStaffFilter, setAttendanceStaffFilter] = useState('all');
  const [attendanceModuleFilter, setAttendanceModuleFilter] = useState('all');

  // Fetch all reports to aggregate staff assignments across all modules
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, 'groundwaterReports'));
  }, [firestore, user, isUserLoading]);
  const { data: reports, isLoading: isReportsLoading } = useCollection<GroundwaterReport>(reportsQuery);

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, 'employees'));
  }, [firestore, user, isUserLoading]);
  const { data: employees } = useCollection<Employee>(employeesQuery);

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  /**
   * Aggregates staff attendance data across ALL modules (Investigation, Drilling, PT, Supervision)
   */
  const staffAttendanceData = useMemo(() => {
    if (!reports || !employees) return [];
    
    const start = startOfMonth(attendanceDate);
    const end = endOfMonth(attendanceDate);
    let deployments: any[] = [];

    reports.forEach(report => {
      if (report.status === 'Archived') return;

      // 1. Resolve Work Date with multiple fallbacks
      let rawDate = report.reportDate || report.dateOfInvestigation?.split(/\s*[–-]\s*/)[0].trim() || report.applicationDate || report.createdAt?.split('T')[0];
      if (!rawDate) return;

      let rDate = parseISO(rawDate);
      if (!isValid(rDate)) {
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length <= 2 && parts[2].length === 4) rDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          else if (parts[0].length === 4) rDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }

      if (!isValid(rDate) || !isWithinInterval(rDate, { start, end })) return;

      // 2. Extract Work Category/Name
      let workName = 'TECHNICAL SURVEY';
      const category = (report.category || '').toLowerCase();
      const purpose = (report.purpose || '').toLowerCase();

      if (category.includes('investigation') || purpose.includes('investigation')) workName = 'INVESTIGATION';
      else if (category.includes('drilling') || report.workType === 'DRILLING') workName = 'DRILLING';
      else if (category.includes('flushing') || report.workType === 'FLUSHING') workName = 'FLUSHING';
      else if (category.includes('pumping') || purpose.includes('pumping')) workName = 'PUMPING TEST';
      else if (category.includes('supervision') || purpose.includes('supervision') || report.arsSubType) workName = 'SUPERVISION';
      else if (category.includes('estimate') || category.includes('measurement')) workName = 'E/M SERVICE';

      const siteDisplayName = (report.nameOfSite || report.applicantName || report.location || report.fileNo || 'TECHNICAL SITE').toUpperCase();

      // 3. Aggregate Staff from ALL possible assignment keys
      const sa = report.staffAssignment;
      if (!sa) return;

      const rolesToProcess = [
        { key: 'hydrogeologist', label: 'Hydrogeologist' }, 
        { key: 'juniorHydrogeologist', label: 'Jr. Hydrogeologist' },
        { key: 'geologicalAssistant', label: 'Geological Asst.' }, 
        { key: 'geophysicist', label: 'Geophysicist' },
        { key: 'juniorGeophysicist', label: 'Jr. Geophysicist' }, 
        { key: 'geophysicalAssistant', label: 'Geophysical Asst.' },
        { key: 'unitInCharge', label: 'Unit In-Charge' }, 
        { key: 'supervisor', label: 'Supervisor' },
        { key: 'siteSupervisor', label: 'Supervisor' }, 
        { key: 'assistantEngineer', label: 'Asst. Engineer' },
        { key: 'assistantExecutiveEngineer', label: 'Asst. Exec. Engineer' }, 
        { key: 'drillers', label: 'Driller' },
        { key: 'drivers', label: 'Driver' }, 
        { key: 'watchers', label: 'Watcher' },
        { key: 'drillingAssistants', label: 'Drilling Asst.' }, 
        { key: 'lascar', label: 'Lascar' },
        { key: 'otherStaff', label: 'Other Staff' }, 
        { key: 'slr', label: 'SLR' }, 
        { key: 'clr', label: 'CLR' }
      ];

      Object.entries(sa).forEach(([roleKey, val]) => {
        const roleConfig = rolesToProcess.find(r => r.key === roleKey);
        if (!val) return;
        
        // Handle both comma-separated strings and arrays
        const names = Array.isArray(val) ? val : (typeof val === 'string' ? val.split(',').map(n => n.trim()) : []);
        
        names.forEach(singleName => {
          if (!singleName || singleName === 'Unassigned') return;
          
          const normalizedInput = singleName.replace(/\s+/g, '').toLowerCase();
          const emp = employees.find(e => (e.name || '').replace(/\s+/g, '').toLowerCase() === normalizedInput);
          
          const staffName = (emp?.name || singleName).toUpperCase();
          const designation = (emp?.designation || roleConfig?.label || roleKey.replace(/([A-Z])/g, ' $1')).toUpperCase();
          
          // Apply filters
          const matchesStaff = attendanceStaffFilter === 'all' || staffName === attendanceStaffFilter.toUpperCase();
          const matchesModule = attendanceModuleFilter === 'all' || workName === attendanceModuleFilter;
          const searchLower = attendanceSearch.toLowerCase();
          const matchesSearch = 
            siteDisplayName.toLowerCase().includes(searchLower) || 
            workName.toLowerCase().includes(searchLower) ||
            staffName.toLowerCase().includes(searchLower) ||
            designation.toLowerCase().includes(searchLower);

          if (matchesStaff && matchesSearch && matchesModule) {
            deployments.push({
              date: format(rDate, 'dd/MM/yyyy'),
              rawDate: rawDate,
              workName: workName,
              staffName: staffName,
              designation: designation,
              siteName: siteDisplayName,
              id: `${report.id}-${staffName}-${roleKey}`
            });
          }
        });
      });
    });

    return deployments.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  }, [reports, employees, attendanceDate, attendanceSearch, attendanceStaffFilter, attendanceModuleFilter]);

  const handleExportAttendanceExcel = () => {
    const data = staffAttendanceData.map((d, i) => ({ 
      'Sl No': i + 1, 
      'Date': d.date, 
      'Name of Work': d.workName, 
      'Name of Staff': d.staffName, 
      'Designation': d.designation, 
      'Name of Sites': d.siteName 
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `District_Site_Attendance_${format(attendanceDate, 'MMM_yyyy')}.xlsx`);
  };

  const handleExportAttendancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DISTRICT SITE STAFF ATTENDANCE", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text("Ground water Department, District Office, Malappuram", 105, 22, { align: 'center' });
    doc.text(`Month: ${format(attendanceDate, 'MMMM yyyy')}`, 105, 28, { align: 'center' });
    autoTable(doc, { 
      startY: 35, 
      head: [['Sl No', 'Date', 'Module', 'Name of Staff', 'Designation', 'Name of Sites']], 
      body: staffAttendanceData.map((d, i) => [i + 1, d.date, d.workName, d.staffName, d.designation, d.siteName]), 
      styles: { fontSize: 8 }, 
      headStyles: { fillColor: [30, 58, 138] } 
    });
    doc.save(`District_Site_Attendance_${format(attendanceDate, 'MMM_yyyy')}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20 shadow-sm"><Logo /></div>
           <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">District Staff Attendance</h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Field Deployment Logs across All Technical Modules</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExportAttendanceExcel} variant="outline" className="h-11 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
            <FileSpreadsheet className="size-3.5 text-emerald-600" /> EXPORT EXCEL
          </Button>
          <Button onClick={handleExportAttendancePDF} className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest gap-2 shadow-xl shadow-slate-200">
            <FileDown className="size-3.5" /> EXPORT PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[24px] overflow-hidden bg-white/80 backdrop-blur-md p-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setAttendanceDate(subMonths(attendanceDate, 1))}><ChevronLeft className="size-4"/></Button>
                <span className="text-[11px] font-black uppercase px-4 text-slate-700 w-48 text-center tracking-widest">{format(attendanceDate, 'MMMM - yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setAttendanceDate(addMonths(attendanceDate, 1))}><ChevronRight className="size-4"/></Button>
            </div>
            <div className="w-full md:w-[240px]">
              <Select onValueChange={setAttendanceStaffFilter} value={attendanceStaffFilter}>
                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl font-bold text-xs">
                  <div className="flex items-center gap-2"><UserIcon className="size-3.5 text-primary" /><SelectValue placeholder="Filter by Staff" /></div>
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="all" className="font-bold text-[11px] uppercase">All Personnel</SelectItem>
                  {sortedEmployees?.map(emp => (<SelectItem key={emp.id} value={emp.name} className="text-[11px] uppercase">{emp.name} ({emp.designation})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[240px]">
              <Select onValueChange={setAttendanceModuleFilter} value={attendanceModuleFilter}>
                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl font-bold text-xs">
                  <div className="flex items-center gap-2"><Activity className="size-3.5 text-primary" /><SelectValue placeholder="Filter by Module" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold text-[11px] uppercase">All Modules</SelectItem>
                  <SelectItem value="INVESTIGATION" className="text-[11px] uppercase">Investigation</SelectItem>
                  <SelectItem value="DRILLING" className="text-[11px] uppercase">Drilling</SelectItem>
                  <SelectItem value="FLUSHING" className="text-[11px] uppercase">Flushing</SelectItem>
                  <SelectItem value="PUMPING TEST" className="text-[11px] uppercase">Pumping Test</SelectItem>
                  <SelectItem value="SUPERVISION" className="text-[11px] uppercase">Supervision</SelectItem>
                  <SelectItem value="E/M SERVICE" className="text-[11px] uppercase">Estimate / Measurement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <Input 
                  placeholder="Search Site, File No..." 
                  className="h-12 pl-10 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 font-bold text-xs" 
                  value={attendanceSearch} 
                  onChange={(e) => setAttendanceSearch(e.target.value)} 
                />
            </div>
        </div>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
             <CalendarCheck className="size-4 text-primary" /> MONTHLY ENGAGEMENT LOG
          </CardTitle>
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest px-3 h-6 rounded-full">{staffAttendanceData.length} TOTAL ENTRIES</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader className="bg-slate-50/80 border-b">
                  <TableRow className="h-12 hover:bg-transparent">
                    <TableHead className="w-16 text-center font-black text-[10px] uppercase text-slate-900 border-r">Sl No</TableHead>
                    <TableHead className="w-32 font-black text-[10px] uppercase text-slate-900 border-r">Date</TableHead>
                    <TableHead className="w-48 font-black text-[10px] uppercase text-slate-900 border-r text-center">Module</TableHead>
                    <TableHead className="w-64 font-black text-[10px] uppercase text-slate-900 border-r">Personnel</TableHead>
                    <TableHead className="w-56 font-black text-[10px] uppercase text-slate-900 border-r">Official Designation</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-900">Assigned Site / Project</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isReportsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="h-16">
                        <TableCell colSpan={6}><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                      </TableRow>
                    ))
                  ) : staffAttendanceData.length > 0 ? (
                    staffAttendanceData.map((row, idx) => (
                      <TableRow key={row.id} className="h-14 hover:bg-slate-50/80 transition-colors border-slate-100">
                        <TableCell className="text-center font-black text-slate-300 text-[11px] border-r">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-slate-900 text-[11px] border-r">{row.date}</TableCell>
                        <TableCell className="border-r text-center">
                            <Badge variant="outline" className={cn(
                                "text-[8px] font-black uppercase h-5 px-2",
                                row.workName === 'INVESTIGATION' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                row.workName === 'DRILLING' ? "bg-orange-50 text-orange-700 border-orange-100" :
                                row.workName === 'SUPERVISION' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                "bg-slate-50 text-slate-700"
                            )}>
                                {row.workName}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-black text-slate-900 text-[11px] uppercase border-r">{row.staffName}</TableCell>
                        <TableCell className="border-r"><span className="text-[10px] font-bold text-slate-500 uppercase">{row.designation}</span></TableCell>
                        <TableCell className="font-bold text-slate-700 text-[11px] uppercase truncate max-w-[400px]" title={row.siteName}>{row.siteName}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20 px-8">
                          <Users className="size-16 mb-4 mx-auto" />
                          <h2 className="text-xl font-black uppercase tracking-widest">No deployments recorded for this period</h2>
                        </div>
                      </TableCell>
                    </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="max-w-4xl mx-auto flex items-center gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="bg-blue-50 p-3 rounded-2xl">
          <Activity className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900">Integrated Technical Roster</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">This ledger automatically aggregates staff deployments from the <strong>Investigation</strong>, <strong>Well Drilling</strong>, <strong>Pumping Test</strong>, and <strong>Supervision</strong> portals.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 h-8 px-4 font-black text-[9px] uppercase tracking-widest">REAL-TIME SYNC</Badge>
      </div>

    </div>
  );
}
