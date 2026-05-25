'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users,
  FileText,
  Calendar as CalendarIcon,
  FilterX,
  ChevronLeft,
  ChevronRight,
  SearchCode,
  Pickaxe,
  Activity,
  ShieldCheck,
  Calculator,
  BarChart3,
  Loader2,
  FlaskConical,
  Leaf,
  FileCheck,
  Wrench,
  Settings,
  Database,
  BookOpen,
  MapPin,
  Droplets,
  X
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
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, isValid, addMonths, subMonths } from 'date-fns';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { GroundwaterReport, Employee, AttendanceRecord } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatToTechnicalDate } from '@/lib/malayalam-utils';

// Helper to safely parse dates from various formats
const safeParseDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  let date = parseISO(dateString);
  if (isValid(date)) return date;
  
  // Try DD-MM-YYYY or DD/MM/YYYY
  const parts = dateString.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      date = new Date(year, month, day);
      if (isValid(date)) return date;
    }
  }
  return null;
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedWork, setSelectedWork] = useState<GroundwaterReport | null>(null);
  const [selectedServiceImage, setSelectedServiceImage] = useState<{ url: string, title: string } | null>(null);

  // Data queries
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, 'groundwaterReports'));
  }, [firestore, user, isUserLoading]);

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, 'employees'));
  }, [firestore, user, isUserLoading]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    return query(
      collection(firestore, 'attendance_logs'),
      where('year', '==', year),
      where('month', '==', month)
    );
  }, [firestore, user, isUserLoading, currentMonth]);

  const { data: reports, isLoading: isReportsLoading } = useCollection<GroundwaterReport>(reportsQuery);
  const { data: employees, isLoading: isEmployeesLoading } = useCollection<Employee>(employeesQuery);
  const { data: attendanceRecords, isLoading: isAttendanceLoading } = useCollection<AttendanceRecord>(attendanceQuery);

  const employeeMap = useMemo(() => {
    if (!employees) return new Map();
    return new Map(employees.map(e => [e.name.toLowerCase().trim(), e]));
  }, [employees]);

  // Overall Statistics Aggregation
  const stats = useMemo(() => {
    if (!reports) return { total: 0, investigation: 0, drilling: 0, pumping: 0, supervision: 0, estimates: 0, census: 0 };
    
    return {
      total: reports.length,
      investigation: reports.filter(r => r.purpose?.toLowerCase().includes('investigation') || r.category?.toLowerCase().includes('survey')).length,
      drilling: reports.filter(r => r.workType === 'DRILLING' || r.purpose?.toLowerCase().includes('drilling')).length,
      pumping: reports.filter(r => r.purpose?.toLowerCase().includes('pumping test')).length,
      supervision: reports.filter(r => r.purpose?.toLowerCase().includes('supervision')).length,
      estimates: reports.filter(r => r.category === 'ESTIMATE_MEASUREMENT' || r.reportType).length,
      census: reports.filter(r => r.purpose?.toLowerCase().includes('census')).length,
    };
  }, [reports]);

  const summaryCards = [
    { title: "TOTAL RECORDS", count: stats.total, icon: FileText, color: "text-slate-600", border: "border-slate-200" },
    { title: "INVESTIGATION", count: stats.investigation, icon: SearchCode, color: "text-blue-600", border: "border-blue-200" },
    { title: "DRILLING JOBS", count: stats.drilling, icon: Pickaxe, color: "text-orange-600", border: "border-orange-200" },
    { title: "PUMPING TESTS", count: stats.pumping, icon: Activity, color: "text-amber-600", border: "border-amber-200" },
    { title: "SUPERVISION", count: stats.supervision, icon: ShieldCheck, color: "text-rose-600", border: "border-rose-200" },
    { title: "ESTIMATES", count: stats.estimates, icon: Calculator, color: "text-purple-600", border: "border-purple-200" },
    { title: "CENSUS", count: stats.census, icon: BarChart3, color: "text-emerald-600", border: "border-emerald-200" }
  ];

  const departmentServices = [
    { title: "GROUNDWATER INVESTIGATION", subtitle: "SITE SELECTION", icon: SearchCode, color: "text-blue-600", bgColor: "bg-blue-50", imageId: "service-investigation" },
    { title: "DRILLING SERVICES", subtitle: "BORE WELL/TUBE WELL", icon: Pickaxe, color: "text-orange-600", bgColor: "bg-orange-50", imageId: "service-drilling" },
    { title: "PUMPING TEST", subtitle: "YIELD ANALYSIS", icon: Activity, color: "text-emerald-600", bgColor: "bg-emerald-50", imageId: "service-pumping" },
    { title: "WATER QUALITY ANALYSIS", subtitle: "LAB TESTING", icon: FlaskConical, color: "text-purple-600", bgColor: "bg-purple-50", imageId: "service-quality" },
    { title: "CONSERVATION & RECHARGE", subtitle: "ARS SUPERVISION", icon: Leaf, color: "text-green-600", bgColor: "bg-green-50", imageId: "service-conservation" },
    { title: "PERMIT & REGULATION", subtitle: "NOC PROCESSING", icon: FileCheck, color: "text-amber-600", bgColor: "bg-amber-50", imageId: "service-permit" },
    { title: "WELL DEVELOPMENT", subtitle: "FLUSHING/CLEANING", icon: Wrench, color: "text-slate-600", bgColor: "bg-slate-50", imageId: "service-depth" },
    { title: "EQUIPMENT HIRE", subtitle: "MACHINERY SUPPORT", icon: Settings, color: "text-blue-500", bgColor: "bg-blue-50/50", imageId: "service-equipment" },
    { title: "DATA & RESEARCH", subtitle: "TECHNICAL RECORDS", icon: Database, color: "text-indigo-600", bgColor: "bg-indigo-50", imageId: "service-research" },
    { title: "AWARENESS PROGRAMS", subtitle: "COMMUNITY OUTREACH", icon: BookOpen, color: "text-rose-500", bgColor: "bg-rose-50", imageId: "service-awareness" },
    { title: "MONITORING & CENSUS", subtitle: "STATION DATA", icon: MapPin, color: "text-cyan-600", bgColor: "bg-cyan-50", imageId: "service-monitoring" },
    { title: "DRINKING WATER SCHEMES", subtitle: "MWSS/GWBDWS", icon: Droplets, color: "text-blue-700", bgColor: "bg-blue-100/50", imageId: "service-drinking" },
  ];

  // Data aggregation for Work Details panel
  const dailyWorkData = useMemo(() => {
    if (!reports) return [];
    return reports.filter(report => {
      const reportDate = safeParseDate(report.reportDate || report.dateOfInvestigation?.split(/\s*[–-]\s*/)[0]);
      return reportDate && isSameDay(reportDate, selectedDate);
    });
  }, [reports, selectedDate]);

  // Data aggregation for Staff Attendance panel
  const dailyAttendanceData = useMemo(() => {
    const engagements: any[] = [];

    // From technical reports
    dailyWorkData.forEach(report => {
      if (report.staffAssignment) {
        Object.entries(report.staffAssignment).forEach(([role, names]) => {
          if (role === 'conveyance') return; // Skip conveyance
          if (names) {
            const nameList = Array.isArray(names) ? names : (typeof names === 'string' ? names.split(',') : []);
            nameList.forEach(name => {
              const trimmedName = name.trim();
              if (trimmedName) {
                const emp = employeeMap.get(trimmedName.toLowerCase());
                engagements.push({
                  staffName: trimmedName,
                  designation: emp?.designation || role.replace(/([A-Z])/g, ' $1'),
                  work: report.purpose || report.category,
                  site: report.nameOfSite,
                  status: 'Present'
                });
              }
            });
          }
        });
      }
    });

    // From SLR/CLR attendance logs
    if (attendanceRecords) {
      attendanceRecords.forEach(record => {
        const dayStatus = record.days[selectedDate.getDate()];
        if (dayStatus === 'S' || dayStatus === 'W') {
          engagements.push({
            staffName: record.employeeName,
            designation: record.type,
            work: dayStatus === 'S' ? 'Survey' : 'Watching Duty',
            site: 'Field',
            status: 'Present'
          });
        }
      });
    }
    
    return engagements;
  }, [dailyWorkData, attendanceRecords, selectedDate, employeeMap]);

  const isLoading = isReportsLoading || isEmployeesLoading || isAttendanceLoading;

  const handleServiceClick = (imageId: string, title: string) => {
    const img = PlaceHolderImages.find(p => p.id === imageId);
    if (img) {
      setSelectedServiceImage({ url: img.imageUrl, title });
    }
  };

  return (
    <div className="dashboard-bg min-h-screen relative overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      
      {/* Background Design Layer */}
      <div className="absolute inset-0 z-0">
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-100 w-full h-full"></div>
        {/* Soft floating shapes */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-blue-200 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-indigo-200 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        {/* Subtle pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#1e3a8a 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1e3a8a] uppercase">Dashboard Overview</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Daily Work & Staff Deployment Tracker</p>
          </div>
        </div>

        {/* OVERALL RECORDS SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title} className={cn("border-white/40 shadow-md hover:shadow-lg transition-all group rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md")}>
              <CardContent className="p-4 flex flex-col gap-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#1e3a8a] transition-colors">{card.title}</span>
                  <div className="flex items-center justify-between">
                    {isReportsLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <h2 className={cn("text-2xl font-black tracking-tighter", card.color)}>{card.count}</h2>
                    )}
                    <card.icon className={cn("size-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all", card.color)} />
                  </div>
                  <div className={cn("h-0.5 w-full bg-slate-100/50 rounded-full overflow-hidden mt-1")}>
                    <div className={cn("h-full w-1/3 transition-all group-hover:w-full", card.color.replace('text-', 'bg-'))} />
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* DEPARTMENT SERVICES GRID */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#1e3a8a] rounded-full" />
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Department Services</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {departmentServices.map((service) => (
              <Card 
                key={service.title} 
                className="border-white/40 shadow-sm hover:shadow-xl transition-all cursor-pointer group rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-md text-center py-8 hover:-translate-y-1"
                onClick={() => handleServiceClick(service.imageId, service.title)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-black/5", service.bgColor)}>
                    <service.icon className={cn("size-6", service.color)} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight px-2">{service.title}</h3>
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <div className={cn("size-1.5 rounded-full", service.color.replace('text-', 'bg-'))} />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{service.subtitle}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end pr-4 text-left">
          <div className="relative group">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:text-[#1e3a8a] transition-colors" />
            <Input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                  const newDate = new Date(e.target.value + 'T00:00:00');
                  if (isValid(newDate)) {
                      setSelectedDate(newDate);
                  }
              }}
              className="w-[280px] pl-10 h-12 rounded-2xl text-base font-bold bg-white/80 backdrop-blur-md shadow-lg border-white/40 focus:ring-primary/20 hover:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-left">
          {/* Work Details Panel */}
          <Card className="border-white/40 shadow-xl rounded-[32px] bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-[#1e3a8a]/5 border-b border-white/40 py-6 px-8">
              <CardTitle className="text-[#1e3a8a] uppercase text-xs font-black tracking-[0.2em] flex items-center gap-2">
                <Activity className="size-4" /> Work Details
              </CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase text-slate-400">Technical activities for {formatToTechnicalDate(format(selectedDate, 'yyyy-MM-dd'))}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="h-12 border-slate-100/50">
                      <TableHead className="pl-8 text-[9px] font-black uppercase text-slate-500">Activity / Work</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-slate-500">Category</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-slate-500">Site Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={3} className="px-8"><Skeleton className="h-10 w-full rounded-xl" /></TableCell></TableRow>)
                    ) : dailyWorkData.length > 0 ? (
                      dailyWorkData.map(work => (
                        <TableRow key={work.id} className="h-14 border-slate-100/50 hover:bg-white/40 transition-colors">
                          <TableCell className="pl-8 font-bold text-xs uppercase text-slate-700">{work.purpose || work.workType || 'N/A'}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-[8px] font-black bg-white/50 border-white/40">{work.category}</Badge></TableCell>
                          <TableCell>
                            <button 
                              className="p-0 h-auto text-xs font-black text-[#1e3a8a] hover:text-blue-800 uppercase tracking-tight text-left border-none bg-transparent cursor-pointer"
                              onClick={() => setSelectedWork(work)}
                            >
                              {work.nameOfSite}
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-40 text-slate-300">
                          <FilterX className="size-12 mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No activities scheduled for this date</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Staff Attendance Panel */}
          <Card className="border-white/40 shadow-xl rounded-[32px] bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-white/40 py-6 px-8">
              <CardTitle className="text-emerald-800 uppercase text-xs font-black tracking-[0.2em] flex items-center gap-2">
                <Users className="size-4" /> Staff Attendance
              </CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase text-slate-400">Personnel deployed on {formatToTechnicalDate(format(selectedDate, 'yyyy-MM-dd'))}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="h-12 border-slate-100/50">
                      <TableHead className="pl-8 text-[9px] font-black uppercase text-slate-500">Staff Name</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-slate-500">Official Designation</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={3} className="px-8"><Skeleton className="h-10 w-full rounded-xl" /></TableCell></TableRow>)
                    ) : dailyAttendanceData.length > 0 ? (
                      dailyAttendanceData.map((att, i) => (
                        <TableRow key={i} className="h-14 border-slate-100/50 hover:bg-white/40 transition-colors">
                          <TableCell className="pl-8 font-black text-xs text-slate-800 uppercase">{att.staffName}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-400 uppercase">{att.designation}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase h-5 px-3 rounded-full">PRESENT</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-40 text-slate-300">
                           <Users className="size-12 mx-auto mb-3 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No staff deployments recorded</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Informational Footer Section */}
        <div className="max-w-6xl mx-auto flex items-center gap-4 p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white/40 shadow-lg ring-1 ring-black/5 text-left">
          <div className="bg-[#1e3a8a]/10 p-3 rounded-2xl">
            <Database className="h-6 w-6 text-[#1e3a8a]" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 uppercase">Integrated Technical Roster</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              This dashboard automatically aggregates data from all field modules. All findings are synchronized in real-time with the central district node for secure technical oversight.
            </p>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-100 h-8 px-4 font-black text-[9px] uppercase tracking-widest">TECHNICAL NODE ACTIVE</Badge>
        </div>
      </div>

      {/* MODALS & DIALOGS */}
      <Dialog open={!!selectedWork} onOpenChange={(isOpen) => !isOpen && setSelectedWork(null)}>
        <DialogContent className="sm:max-w-[550px] bg-white rounded-3xl shadow-2xl p-0 border-none overflow-hidden">
          <DialogHeader className="p-8 bg-slate-50 border-b">
            <DialogTitle className="text-[#1e3a8a] flex items-center gap-3 text-lg font-black uppercase tracking-tight">
              <Users className="size-5" />
              Staff Deployed: {selectedWork?.nameOfSite}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold pt-1 tracking-widest">
              Work: <strong>{selectedWork?.purpose || selectedWork?.category}</strong> on <strong>{selectedWork && selectedWork.reportDate ? formatToTechnicalDate(selectedWork.reportDate) : 'N/A'}</strong>
            </DialogDescription>
          </DialogHeader>
          {selectedWork?.staffAssignment ? (
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto text-left">
              {Object.entries(selectedWork.staffAssignment)
                .filter(([key, names]) => key !== 'conveyance' && names && (Array.isArray(names) ? names.length > 0 : typeof names === 'string' && names.trim() !== ''))
                .map(([role, names]) => (
                  <div key={role} className="flex flex-col gap-2 border-l-2 border-slate-100 pl-4 py-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(names) ? names : (typeof names === 'string' ? names.split(',') : [])).map(name => name.trim() && (
                        <Badge key={name} variant="secondary" className="font-bold bg-blue-50 text-blue-700 text-[10px] uppercase h-7 px-4 rounded-xl shadow-sm border-blue-100">{name.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-300">
               <Users className="size-12 mx-auto mb-4 opacity-20" />
               <p className="font-bold uppercase text-[10px] tracking-widest">No staff assignment data found for this record</p>
            </div>
          )}
          <DialogFooter className="p-6 bg-slate-50 border-t justify-end">
            <Button variant="outline" onClick={() => setSelectedWork(null)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Close Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Preview Modal */}
      {selectedServiceImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedServiceImage(null)}
        >
          <div 
            className="relative bg-white p-2 rounded-[32px] shadow-2xl max-w-5xl w-full animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-6 right-6 z-[210]">
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={() => setSelectedServiceImage(null)}
                className="rounded-full size-10 shadow-lg border-white/20"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="absolute top-8 left-8 z-[210] bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-md">
              <span className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">{selectedServiceImage.title}</span>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-[24px]">
              <Image 
                src={selectedServiceImage.url} 
                alt={selectedServiceImage.title} 
                fill 
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
