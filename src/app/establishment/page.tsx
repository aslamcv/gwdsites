
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Employee } from '@/lib/types';
import {
  MoreHorizontal,
  PlusCircle,
  User,
  LayoutList,
  LayoutGrid,
  Search,
  RotateCcw,
  Phone,
  MessageSquare,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Activity,
  Building2,
  Users,
  Lock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { AddStaffForm } from './add-staff-form';
import { useCollection, useUser, useFirestore, useDoc, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EditStaffForm } from './edit-staff-form';
import { cn } from '@/lib/utils';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export default function EstablishmentPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Role detection using email as ID for reliable lookups
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAdmin = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return userProfile?.role === 'admin';
  }, [user, userProfile, isAuthLoading, isProfileLoading]);

  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // FETCH DATA: Centralized root collection for district-wide visibility
  const employeesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'employees');
  }, [firestore]);

  const { data: employees, isLoading: isDataLoading } = useCollection<Employee>(employeesCollection);
  
  const designationHierarchy = [
    'Executive engineer',
    'Senior Hydrogeologist',
    'Assistant Executive Engineer',
    'Hydrogeologist',
    'Geophysicist',
    'Assistant Engineer',
    'Junior Hydrogeologist',
    'Junior Geophysicist',
    'Master Driller',
    'Senior Driller',
    'Senior Clerk',
    'Clerk',
    'UD Typist',
    'Geological Assistant',
    'Geophysical Assistant',
    'Driller',
    'Driller Mechanic',
    'Drilling Assistant',
    'Compressor Driver',
    'HDV Driver',
    'LDV Driver',
    'Watcher',
    'Surveyor',
    'Office Attendant',
    'PTS',
    'Skilled Worker',
    'SLR',
    'CLR',
    'CLR (Employment)',
    'Lascar',
  ];

  const getDesignationColor = (designation: string) => {
    const d = designation.toLowerCase();
    if (d.includes('hydrogeologist')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (d.includes('geophysicist')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (d.includes('driller')) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (d.includes('assistant')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (d.includes('engineer')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (d.includes('clerk') || d.includes('typist')) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const filteredAndSortedEmployees = useMemo(() => {
    if (!employees) return [];
    
    let result = employees.filter(emp => {
      const matchesSearch = 
        (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.pen || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.phone || '').includes(searchQuery);
      
      const matchesDesignation = designationFilter === 'all' || emp.designation === designationFilter;
      
      return matchesSearch && matchesDesignation;
    });

    return result.sort((a, b) => {
      const indexA = designationHierarchy.indexOf(a.designation);
      const indexB = designationHierarchy.indexOf(b.designation);
      const pA = indexA === -1 ? 999 : indexA;
      const pB = indexB === -1 ? 999 : indexB;
      if (pA !== pB) return pA - pB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [employees, searchQuery, designationFilter]);

  const uniqueDesignations = useMemo(() => {
    if (!employees) return [];
    return Array.from(new Set(employees.map(e => e.designation))).filter(Boolean).sort();
  }, [employees]);

  const stats = useMemo(() => {
    if (!employees) return { total: 0, technical: 0 };
    return {
      total: employees.length,
      technical: employees.filter(e => e.designation.toLowerCase().includes('hydrogeologist') || e.designation.toLowerCase().includes('engineer')).length
    };
  }, [employees]);

  const isLoading = isAuthLoading || isProfileLoading || (isDataLoading && !employees);

  const handleDelete = () => {
    if (!firestore || !employeeToDelete || !isAdmin) return;
    const docRef = doc(firestore, 'employees', employeeToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Employee Deleted",
        description: `${employeeToDelete.name} has been removed from the directory.`,
    });
    setEmployeeToDelete(null);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDesignationFilter('all');
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 bg-background min-h-screen max-w-[1400px] mx-auto animate-in fade-in duration-700">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-[#1e3a8a] uppercase leading-none">
            DISTRICT STAFF MANAGEMENT
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-slate-500 font-bold text-sm">
              Manage official employee records for the Ground Water Department establishment.
            </p>
            {!isAdmin && !isAuthLoading && !isProfileLoading && (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-black h-7 px-3 gap-2 uppercase text-[9px] tracking-widest">
                <Lock className="size-3" />
                READ ONLY ACCESS
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 py-1.5 px-4 gap-2 shadow-sm rounded-full font-bold uppercase text-[10px]">
              <Users className="size-3 text-primary" />
              Total Employees: {stats.total}
            </Badge>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 py-1.5 px-4 gap-2 shadow-sm rounded-full font-bold uppercase text-[10px]">
              <Activity className="size-3 text-blue-500" />
              Technical Staff: {stats.technical}
            </Badge>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 py-1.5 px-4 gap-2 shadow-sm rounded-full font-bold uppercase text-[10px]">
              <Building2 className="size-3 text-emerald-500" />
              Field Units: 15
            </Badge>
          </div>
        </div>

        {isAdmin && (
          <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl h-14 px-10 bg-[#1e3a8a] hover:bg-blue-900 shadow-xl shadow-blue-900/20 font-black uppercase tracking-widest text-[11px] gap-3">
                <PlusCircle className="size-5" />
                ADD STAFF MEMBER
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="p-8 bg-slate-50 border-b">
                <DialogTitle className="text-xl font-black uppercase text-slate-900">Register Staff Member</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase text-slate-400">Add a new technical or administrative employee to the district roster.</DialogDescription>
              </DialogHeader>
              <div className="p-8">
                {user && <AddStaffForm setOpen={setIsAddStaffDialogOpen} />}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 2. ADVANCED FILTER CARD */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-md rounded-3xl ring-1 ring-slate-200 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input 
                placeholder="Search by Name, PEN, or Phone..." 
                className="pl-12 h-12 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 font-bold text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={designationFilter} onValueChange={setDesignationFilter}>
                <SelectTrigger className="w-full md:w-[220px] h-12 bg-white rounded-2xl border-slate-200 font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <Filter className="size-3 text-slate-400" />
                    <SelectValue placeholder="All Designations" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-bold uppercase">All Designations</SelectItem>
                  {uniqueDesignations.map(d => (
                    <SelectItem key={d} value={d} className="text-xs font-bold uppercase">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                <Button 
                  variant={viewMode === 'list' ? 'white' : 'ghost'} 
                  size="icon" 
                  className={cn("h-10 w-12 rounded-xl", viewMode === 'list' && "shadow-sm bg-white")} 
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="size-4" />
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'white' : 'ghost'} 
                  size="icon" 
                  className={cn("h-10 w-12 rounded-xl", viewMode === 'grid' && "shadow-sm bg-white")} 
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>

              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-primary transition-colors" onClick={resetFilters}>
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. EMPLOYEE LIST/GRID */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-[32px] border-none shadow-sm p-8 flex items-center gap-8">
                <Skeleton className="size-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedEmployees.length > 0 ? (
          <div className={cn("grid gap-4 animate-in fade-in duration-500", viewMode === 'list' ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
            {filteredAndSortedEmployees.map((employee) => (
              <Card 
                key={employee.id} 
                className={cn(
                  "group transition-all duration-300 border-none shadow-sm hover:shadow-md hover:scale-[1.005] rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white",
                  viewMode === 'list' ? "flex flex-col md:flex-row items-center p-6 md:px-10" : "p-8 text-center flex flex-col items-center"
                )}
              >
                {/* Avatar Section */}
                <div className={cn("relative", viewMode === 'list' ? "md:mr-8" : "mb-6")}>
                  <Avatar className={cn(viewMode === 'list' ? "size-16" : "size-24", "border-4 border-white shadow-lg ring-1 ring-slate-100 group-hover:scale-105 transition-transform")}>
                    <AvatarImage src={employee.photoUrl} alt={employee.name} />
                    <AvatarFallback className="bg-slate-50 text-primary uppercase font-bold">
                      {employee.name?.substring(0, 2) || <User className="size-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm" title="Active Account" />
                </div>

                {/* Primary Info */}
                <div className={cn("flex-1", viewMode === 'list' ? "text-left" : "w-full mb-6")}>
                  <div className={cn("flex flex-col", viewMode === 'grid' && "items-center")}>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">
                      {employee.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
                      <Badge variant="outline" className={cn("text-[9px] font-black py-0 h-6 px-3 rounded-full uppercase tracking-widest border", getDesignationColor(employee.designation))}>
                        {employee.designation}
                      </Badge>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        DOB: {employee.dob ? format(new Date(employee.dob), 'MMM dd, yyyy') : '---'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Data Columns */}
                {viewMode === 'list' && (
                  <div className="flex items-center gap-12 mx-12">
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PEN/TEN</span>
                      <span className="font-black text-slate-700 text-sm tracking-tight">{employee.pen || '---'}</span>
                    </div>
                    <div className="flex flex-col min-w-[140px]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MOBILE</span>
                      <span className="text-sm font-black text-blue-600 flex items-center gap-2">
                        <Phone className="size-3.5" />
                        {employee.phone || '---'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={cn("flex items-center gap-3", viewMode === 'list' ? "ml-auto" : "justify-center mt-auto w-full pt-6 border-t border-slate-50")}>
                  <Button variant="ghost" size="icon" className="size-10 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all" title="View Profile" onClick={() => setEmployeeToView(employee)}>
                    <Eye className="size-5" />
                  </Button>
                  
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-10 rounded-2xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" 
                      title="Edit Record" 
                      onClick={() => setEmployeeToEdit(employee)}
                    >
                      <Pencil className="size-5" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-10 rounded-2xl text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                        <MoreHorizontal className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2">Quick Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="rounded-xl gap-3 py-3 cursor-pointer" onClick={() => window.open(`tel:${employee.phone}`)}>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Phone className="size-4" /></div>
                        <span className="font-bold text-xs uppercase">Direct Call</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl gap-3 py-3 cursor-pointer" onClick={() => window.open(`https://wa.me/${(employee.phone || '').replace(/\D/g, '')}`)}>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><MessageSquare className="size-4" /></div>
                        <span className="font-bold text-xs uppercase">WhatsApp</span>
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator className="my-2" />
                          <DropdownMenuItem 
                            className="rounded-xl gap-3 py-3 text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" 
                            onClick={() => setEmployeeToDelete(employee)}
                          >
                            <div className="p-2 bg-rose-100/50 rounded-lg"><Trash2 className="size-4" /></div>
                            <span className="font-bold text-xs uppercase">Delete Record</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center px-10 animate-in fade-in zoom-in duration-700">
            <div className="bg-slate-50 size-24 rounded-full flex items-center justify-center mb-8">
              <Users className="size-12 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No Personnel Found</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3 max-w-sm">
              The shared district roster is empty or no staff matched your search criteria.
            </p>
            {isAdmin && (
              <Button onClick={() => setIsAddStaffDialogOpen(true)} className="mt-10 rounded-2xl px-10 h-14 bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-blue-900/20">
                <PlusCircle className="size-4" />
                Add First Staff Member
              </Button>
            )}
          </div>
        )}
      </div>

       {/* View Employee Detail Modal */}
      <Dialog open={!!employeeToView} onOpenChange={(open) => !open && setEmployeeToView(null)}>
        <DialogContent className="sm:max-w-xl rounded-[40px] overflow-hidden p-0 border-none shadow-2xl animate-in zoom-in-95 duration-300">
          {employeeToView && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-[#1e3a8a] to-blue-600 p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Building2 className="size-32" /></div>
                <div className="flex items-center gap-8 relative z-10">
                  <Avatar className="size-28 border-4 border-white/20 shadow-2xl">
                    <AvatarImage src={employeeToView.photoUrl} />
                    <AvatarFallback className="bg-white/10 text-white text-2xl uppercase font-bold">{employeeToView.name?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{employeeToView.name}</h2>
                    <p className="text-blue-100 font-bold uppercase text-[11px] tracking-[0.2em]">{employeeToView.designation}</p>
                    <div className="flex gap-2 mt-4">
                      <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase px-3 h-6">ACTIVE</Badge>
                      <Badge className="bg-white/20 hover:bg-white/30 border-none text-[9px] font-black uppercase px-3 h-6">MALAPPURAM</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-10 space-y-10 bg-white">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PEN/TEN Number</Label>
                    <p className="text-lg font-mono font-black text-slate-700">{employeeToView.pen || '---'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Contact</Label>
                    <p className="text-lg font-black text-blue-600 flex items-center gap-2">{employeeToView.phone || '---'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</Label>
                    <p className="text-lg font-black text-slate-700">{employeeToView.dob ? format(new Date(employeeToView.dob), 'MMMM dd, yyyy') : '---'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department Entry</Label>
                    <p className="text-lg font-black text-slate-700">{employeeToView.createdAt ? format(new Date(employeeToView.createdAt), 'MMM dd, yyyy') : '---'}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Roles & Roster Duties</Label>
                  <div className="flex flex-wrap gap-2">
                    {employeeToView.roles?.length > 0 ? employeeToView.roles.map(role => (
                      <Badge key={role} className="bg-slate-100 text-slate-600 border-none font-black uppercase text-[10px] px-4 h-8 rounded-xl shadow-sm">{role}</Badge>
                    )) : <p className="text-xs italic text-slate-400">No specific roles assigned.</p>}
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <Button className="flex-1 rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest gap-3 shadow-lg shadow-blue-900/10" onClick={() => window.open(`tel:${employeeToView.phone}`)}>
                    <Phone className="size-4" /> CALL STAFF
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest gap-3 border-slate-200 hover:bg-slate-50" onClick={() => window.open(`https://wa.me/${(employeeToView.phone || '').replace(/\D/g, '')}`)}>
                    <MessageSquare className="size-4 text-emerald-500" /> WHATSAPP
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Employee Modal */}
      <Dialog open={!!employeeToEdit} onOpenChange={(open) => { if(!open) setEmployeeToEdit(null) }}>
        <DialogContent className="sm:max-w-4xl rounded-[40px] shadow-2xl p-0 overflow-hidden border-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          <DialogHeader className="p-8 bg-slate-50 border-b">
            <DialogTitle className="text-xl font-black uppercase text-slate-900">Update Official Record</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase text-slate-400">Modify technical details for {employeeToEdit?.name}.</DialogDescription>
          </DialogHeader>
          <div className="p-8">
            {employeeToEdit && <EditStaffForm employee={employeeToEdit} setOpen={(open) => !open && setEmployeeToEdit(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent className="rounded-[40px] p-10 border-none shadow-2xl">
            <AlertDialogHeader className="flex flex-col items-center text-center">
                <div className="size-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                  <Trash2 className="size-10" />
                </div>
                <AlertDialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Delete Official Record?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-lg mt-4 font-medium leading-relaxed">
                    You are about to permanently remove <strong>{employeeToDelete?.name}</strong> from the district directory. This action is irreversible.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-10 flex gap-4 sm:justify-center">
                <AlertDialogCancel onClick={() => setEmployeeToDelete(null)} className="rounded-2xl h-14 px-10 border-slate-200 font-bold uppercase text-[11px] tracking-widest">Keep Record</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-14 px-10 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-rose-200">Confirm Deletion</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
