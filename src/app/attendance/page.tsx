
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CalendarCheck, 
  Search, 
  Download, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Coffee,
  Eye,
  Settings2,
  Printer,
  Loader2
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
import { 
  format, 
  getDaysInMonth, 
  isSunday, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import type { Employee, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string, color: string, icon: any, bgColor: string }> = {
  'S': { label: 'Survey (Present)', color: 'text-emerald-600', icon: CheckCircle2, bgColor: 'bg-emerald-100' },
  'W': { label: 'Watching Duty', color: 'text-blue-600', icon: Eye, bgColor: 'bg-blue-100' },
  'CL': { label: 'Casual Leave', color: 'text-amber-600', icon: Coffee, bgColor: 'bg-amber-100' },
  'H': { label: 'Holiday', color: 'text-rose-600', icon: XCircle, bgColor: 'bg-rose-100' },
  'A': { label: 'Absent', color: 'text-slate-600', icon: AlertCircle, bgColor: 'bg-slate-100' },
  '': { label: 'Not Marked', color: 'text-slate-300', icon: MoreVertical, bgColor: 'bg-transparent' }
};

export default function AttendancePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [labourType, setLabourType] = useState<'SLR' | 'CLR'>('SLR');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize on mount to prevent hydration errors and ensure auth stability
  useEffect(() => {
    setCurrentDate(new Date());
    setIsMounted(true);
  }, []);

  const year = useMemo(() => currentDate?.getFullYear() || 0, [currentDate]);
  const month = useMemo(() => (currentDate ? currentDate.getMonth() + 1 : 0), [currentDate]);

  // 1. Fetch Employees - Centralized collection
  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isMounted) return null;
    return query(
      collection(firestore, 'employees'),
      where('designation', '==', labourType)
    );
  }, [firestore, isUserLoading, labourType, isMounted]);
  
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);

  // 2. Fetch Existing Attendance - Centralized collection
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !year || !month || !isMounted) return null;
    return query(
      collection(firestore, 'attendance_logs'),
      where('year', '==', year),
      where('month', '==', month),
      where('type', '==', labourType)
    );
  }, [firestore, isUserLoading, year, month, labourType, isMounted]);

  const { data: attendanceRecords, isLoading: attendanceLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  // 3. Local State for Grid
  const [gridData, setGridData] = useState<Record<string, Record<number, AttendanceStatus>>>({});

  useEffect(() => {
    if (attendanceRecords) {
      const mapped: Record<string, Record<number, AttendanceStatus>> = {};
      attendanceRecords.forEach(rec => {
        mapped[rec.employeeId] = rec.days || {};
      });
      setGridData(mapped);
    } else {
      setGridData({});
    }
  }, [attendanceRecords]);

  // 4. Derived Helpers
  const daysInMonth = useMemo(() => currentDate ? getDaysInMonth(currentDate) : 0, [currentDate]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchQuery]);

  const stats = useMemo(() => {
    let present = 0, leave = 0, holidays = 0, absent = 0;
    Object.values(gridData).forEach(empDays => {
      Object.values(empDays).forEach(status => {
        if (status === 'S' || status === 'W') present++;
        if (status === 'CL') leave++;
        if (status === 'H') holidays++;
        if (status === 'A') absent++;
      });
    });
    return { present, leave, holidays, absent };
  }, [gridData]);

  const chartData = useMemo(() => {
    return daysArray.map(day => {
      let count = 0;
      Object.values(gridData).forEach(empDays => {
        if (empDays[day] === 'S' || empDays[day] === 'W') count++;
      });
      return { day, count };
    });
  }, [gridData, daysArray]);

  // 5. Handlers
  const updateStatus = (empId: string, empName: string, day: number, status: AttendanceStatus) => {
    if (!user || !firestore || !year || !month) return;

    // Calculate next state for immediate UI feedback
    const currentEmpDays = { ...(gridData[empId] || {}) };
    const newDays = {
      ...currentEmpDays,
      [day]: status
    };

    // Update local UI immediately
    setGridData(prev => ({
      ...prev,
      [empId]: newDays
    }));

    // Synchronize with Cloud (Centralized)
    const recordId = `${empId}_${year}_${month}`;
    const recordRef = doc(firestore, 'attendance_logs', recordId);
    
    setDocumentNonBlocking(recordRef, {
      id: recordId,
      employeeId: empId,
      employeeName: empName,
      year,
      month,
      type: labourType,
      days: newDays,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleBulkMark = () => {
    const today = new Date();
    const dayNum = today.getDate();
    if (!currentDate || today.getMonth() !== currentDate.getMonth() || today.getFullYear() !== currentDate.getFullYear()) {
      toast({ title: "Date Mismatch", description: "Bulk mark only works for the current month.", variant: "destructive" });
      return;
    }

    filteredEmployees.forEach(emp => {
      const currentStatus = gridData[emp.id]?.[dayNum];
      if (!currentStatus) {
        updateStatus(emp.id, emp.name, dayNum, 'S');
      }
    });
    toast({ title: "Bulk Marked", description: `Marked all visible staff as Present for today.` });
  };

  const handleAutoFillSundays = () => {
    if (!currentDate) return;
    filteredEmployees.forEach(emp => {
      daysArray.forEach(day => {
        const d = new Date(year, month - 1, day);
        if (isSunday(d)) {
          const currentStatus = gridData[emp.id]?.[day];
          if (currentStatus !== 'H') {
            updateStatus(emp.id, emp.name, day, 'H');
          }
        }
      });
    });
    toast({ title: "Sundays Processed", description: "All Sundays marked as Holidays." });
  };

  const handleExportExcel = () => {
    if (!currentDate) return;
    const data = filteredEmployees.map((emp, i) => {
      const row: any = { '#': i + 1, 'Labourer Name': emp.name };
      daysArray.forEach(day => {
        row[day] = gridData[emp.id]?.[day] || '';
      });
      row['Total Present'] = Object.values(gridData[emp.id] || {}).filter(s => s === 'S' || s === 'W').length;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${labourType}_Attendance_${format(currentDate, 'MMM_yyyy')}.xlsx`);
  };

  if (!isMounted || !currentDate || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-primary/10 p-3 rounded-2xl ring-1 ring-primary/20">
            <CalendarCheck className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Seasonal Labour Roll</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Digital Register Management</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <Button 
              variant={labourType === 'SLR' ? 'white' : 'ghost'} 
              onClick={() => setLabourType('SLR')}
              className={cn("h-10 px-6 rounded-lg font-black text-[10px] uppercase", labourType === 'SLR' && "shadow-sm bg-white")}
            >
              SLR Unit
            </Button>
            <Button 
              variant={labourType === 'CLR' ? 'white' : 'ghost'} 
              onClick={() => setLabourType('CLR')}
              className={cn("h-10 px-6 rounded-lg font-black text-[10px] uppercase", labourType === 'CLR' && "shadow-sm bg-white")}
            >
              CLR Unit
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="h-9 w-9"><ChevronLeft className="size-4"/></Button>
            <span className="text-xs font-black uppercase px-4 text-slate-700">{format(currentDate, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="h-9 w-9"><ChevronRight className="size-4"/></Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2 bg-slate-900 shadow-xl shadow-slate-200">
                <Download className="size-4" /> EXPORT ROLL
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
              <DropdownMenuItem onClick={handleExportExcel} className="rounded-lg gap-2 cursor-pointer">
                <FileSpreadsheet className="size-4 text-emerald-600" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="rounded-lg gap-2 cursor-pointer">
                <Printer className="size-4 text-blue-600" /> Print Roll (A4)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          {[
            { label: 'Total Present', val: stats.present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'On Leave', val: stats.leave, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Holidays', val: stats.holidays, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Absentees', val: stats.absent, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200 rounded-3xl overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</span>
                <span className={cn("text-3xl font-black", s.color)}>{s.val}</span>
                <div className={cn("mt-3 h-1 w-8 rounded-full", s.bg.replace('bg-', 'bg-').replace('-50', '-500'))} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-8 border-none shadow-sm ring-1 ring-slate-200 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 py-4 px-8 border-b">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                <YAxis hide />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4, fill: '#1e3a8a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Attendance Grid */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[40px] overflow-hidden ring-1 ring-slate-200 bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search labourer name..." 
                className="h-11 pl-10 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-primary/20"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={handleAutoFillSundays} variant="outline" className="h-10 rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200 gap-2">
                <Settings2 className="size-3.5 text-slate-400" /> AUTO-FILL SUNDAYS
              </Button>
              <Button onClick={handleBulkMark} variant="outline" className="h-10 rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200 gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> MARK ALL PRESENT
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1400px]">
              <Table>
                <TableHeader>
                  <TableRow className="h-14 border-slate-200 hover:bg-transparent">
                    <TableHead className="w-12 text-center text-[9px] font-black uppercase sticky left-0 bg-white z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">#</TableHead>
                    <TableHead className="min-w-[240px] text-[10px] font-black uppercase tracking-widest sticky left-12 bg-white z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Labourer Name</TableHead>
                    {daysArray.map(day => (
                      <TableHead key={day} className={cn(
                        "w-10 text-center text-[10px] font-black p-0 border-l border-slate-100",
                        isSunday(new Date(year, month - 1, day)) && "bg-rose-50/50 text-rose-600"
                      )}>
                        {day}
                      </TableHead>
                    ))}
                    <TableHead className="w-20 text-center text-[10px] font-black uppercase bg-slate-50 sticky right-0 z-30 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesLoading || attendanceLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={daysInMonth + 3} className="h-12"><Loader2 className="size-4 animate-spin mx-auto" /></TableCell></TableRow>
                    ))
                  ) : filteredEmployees.map((emp, idx) => {
                    const rowDays = gridData[emp.id] || {};
                    const totalPresent = Object.values(rowDays).filter(s => s === 'S' || s === 'W').length;

                    return (
                      <TableRow key={emp.id} className="group h-12 border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-center font-bold text-slate-300 text-xs sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{idx + 1}</TableCell>
                        <TableCell className="font-black text-xs uppercase text-slate-700 sticky left-12 bg-white group-hover:bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{emp.name}</TableCell>
                        
                        {daysArray.map(day => {
                          const status = rowDays[day] || '';
                          const config = STATUS_CONFIG[status];
                          
                          return (
                            <TableCell key={day} className={cn(
                              "p-0 border-l border-slate-50 text-center cursor-pointer transition-all hover:scale-110",
                              config.bgColor
                            )}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div className="w-full h-12 flex items-center justify-center font-black text-xs">
                                    {status}
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 rounded-xl p-1 shadow-2xl">
                                  {Object.entries(STATUS_CONFIG).map(([code, cfg]) => {
                                    if (!code) return null;
                                    return (
                                      <DropdownMenuItem 
                                        key={code} 
                                        onClick={() => updateStatus(emp.id, emp.name, day, code as AttendanceStatus)}
                                        className="rounded-lg gap-3 py-2 cursor-pointer"
                                      >
                                        <div className={cn("size-6 rounded-md flex items-center justify-center font-black text-[10px]", cfg.bgColor, cfg.color)}>
                                          {code}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{cfg.label}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateStatus(emp.id, emp.name, day, '')} className="text-rose-600 font-bold rounded-lg uppercase text-[9px] py-2">
                                    Clear Entry
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          );
                        })}

                        <TableCell className="text-center bg-slate-50/80 font-black text-primary text-sm sticky right-0 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] group-hover:bg-slate-100">
                          {totalPresent}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 4. Legend */}
      <div className="flex flex-wrap items-center justify-center gap-8 bg-white/60 p-6 rounded-3xl border border-slate-200">
        {Object.entries(STATUS_CONFIG).map(([code, cfg]) => {
          if (!code) return null;
          return (
            <div key={code} className="flex items-center gap-2">
              <div className={cn("size-8 rounded-lg flex items-center justify-center font-black text-[10px]", cfg.bgColor, cfg.color)}>
                {code}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{cfg.label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
