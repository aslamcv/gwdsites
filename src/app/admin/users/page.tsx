'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { 
  Eye, 
  Trash2, 
  Building2, 
  Clock,
  User as UserIcon,
  ShieldCheck,
  UserPlus,
  Activity,
  Users,
  CheckCircle2,
  Lock,
  Crown,
  Link2,
  Mail,
  Fingerprint,
  AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Breadcrumb } from '@/components/breadcrumb';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
} from "@/components/ui/alert-dialog";
import { AddStaffForm } from '@/app/establishment/add-staff-form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

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

export default function UserManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading: isAuthLoading } = useUser();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Role detection using email indexing
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.email) return null;
    return doc(firestore, 'users', currentUser.email.toLowerCase());
  }, [firestore, currentUser?.email]);
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAdmin = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    if (currentUser?.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return true;
    return currentUserProfile?.role === 'admin';
  }, [currentUser, currentUserProfile, isAuthLoading, isProfileLoading]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'dd/MM/yyyy, hh:mm a'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'employees'));
  }, [firestore]);

  const { data: employees } = useCollection<Employee>(employeesQuery);

  const employeeMap = useMemo(() => {
    if (!employees) return new Map<string, Employee>();
    return new Map(employees.map(e => [e.id, e]));
  }, [employees]);

  const stats = useMemo(() => {
    if (!users) return { total: 0, admin: 0, technical: 0, active: 0 };
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin' || u.email?.toLowerCase() === MASTER_ADMIN_EMAIL).length,
      technical: users.filter(u => u.role === 'scientist' || u.role === 'engineer').length,
      active: users.filter(u => u.isApproved !== false).length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const matchesSearch = (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    }).sort((a, b) => {
      // Sort Master Admin to top
      if (a.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return -1;
      if (b.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return 1;
      
      const empA = employeeMap.get(a.staffRecordId || '');
      const empB = employeeMap.get(b.staffRecordId || '');
      
      const rankA = designationHierarchy.indexOf(empA?.designation || '');
      const rankB = designationHierarchy.indexOf(empB?.designation || '');
      
      const valA = rankA === -1 ? 999 : rankA;
      const valB = rankB === -1 ? 999 : rankB;
      
      if (valA !== valB) return valA - valB;
      
      return (a.displayName || '').localeCompare(b.displayName || '');
    });
  }, [users, searchQuery, roleFilter, employeeMap]);

  const handleRoleChange = (userEmail: string, newRole: string) => {
    if (!firestore || !isAdmin) return;
    const normalizedEmail = userEmail.toLowerCase();
    const userRef = doc(firestore, 'users', normalizedEmail);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ title: "Role Updated", description: "Access permissions have been synchronized." });
  };

  const handleStatusToggle = (userEmail: string, currentStatus: boolean) => {
    if (!firestore || !isAdmin) return;
    const normalizedEmail = userEmail.toLowerCase();
    const userRef = doc(firestore, 'users', normalizedEmail);
    updateDocumentNonBlocking(userRef, { isApproved: !currentStatus });
    toast({ 
      title: !currentStatus ? "Access Granted" : "Access Suspended", 
      variant: !currentStatus ? "default" : "destructive" 
    });
  };

  const handleDeleteUser = (userEmail: string) => {
    if (!firestore || !isAdmin) return;
    const normalizedEmail = userEmail.toLowerCase();
    if (normalizedEmail === MASTER_ADMIN_EMAIL) return;
    
    const userRef = doc(firestore, 'users', normalizedEmail);
    deleteDocumentNonBlocking(userRef);
    toast({
      title: "User Removed",
      description: "Portal access record has been deleted.",
      variant: "destructive"
    });
  };

  const isDataLoading = isAuthLoading || isProfileLoading || isLoading;

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">Access Control</h1>
            <p className="text-slate-700 font-bold text-[10px] uppercase tracking-widest mt-2">
              Manage Portal Accounts & Permissions 
              {!isAdmin && <Badge className="ml-2 bg-amber-50 text-amber-600 border-amber-100">READ ONLY</Badge>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xs bg-primary/5 px-5 py-2.5 rounded-full border border-primary/10">
            <Building2 className="size-4" />
            MALAPPURAM DISTRICT
          </div>
          <div className="flex items-center gap-3 text-slate-600 font-bold text-sm bg-white px-5 py-2.5 rounded-full shadow-sm ring-1 ring-slate-200">
            <Clock className="size-4 text-primary" />
            {currentTime || '00/00/0000, 00:00:00 AM'}
          </div>
        </div>
      </div>

      <div className="px-2">
        <Breadcrumb />
      </div>

      {/* 2. MASTER ADMIN SPOTLIGHT */}
      <Card className="border-none shadow-xl shadow-blue-900/10 rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1e3a8a] to-blue-900 text-white relative">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Crown className="size-40" /></div>
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
          <Avatar className="size-32 border-4 border-white/20 shadow-2xl">
            <AvatarImage src="" />
            <AvatarFallback className="bg-white/10 text-white text-3xl font-black">DO</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <Badge className="bg-amber-400 text-amber-900 border-none font-black uppercase text-[10px] tracking-widest px-4 h-7 rounded-full mb-3">SYSTEM ADMINISTRATOR</Badge>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none">District Officer (GWD)</h2>
              <p className="text-blue-100 font-bold uppercase text-[11px] tracking-[0.2em] mt-2 flex items-center justify-center md:justify-start gap-2">
                <Mail className="size-3" /> {MASTER_ADMIN_EMAIL}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mb-0.5">Primary Authority</p>
                <p className="text-xs font-bold uppercase">Full System Access</p>
              </div>
              <div className="bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mb-0.5">District Scope</p>
                <p className="text-xs font-bold uppercase">Malappuram HQ</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
             <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl backdrop-blur-sm" disabled>
               <Fingerprint className="size-4 mr-2" /> Root Account
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Portal Users', val: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-white' },
          { label: 'Administrators', val: stats.admin, icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50/50' },
          { label: 'Technical Staff', val: stats.technical, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'Active Sessions', val: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
        ].map((s, i) => (
          <Card key={i} className={cn("border-none shadow-sm ring-1 ring-slate-200 rounded-[24px] overflow-hidden", s.bg)}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</p>
                <h2 className={cn("text-xl font-black tracking-tighter", s.color)}>{s.val}</h2>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
                <s.icon className={cn("size-6", s.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. MAIN CONTENT CARD */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white">
        <CardHeader className="p-10 border-b bg-slate-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">User Registry</CardTitle>
              <CardDescription className="text-slate-700 font-bold text-[10px] uppercase tracking-widest mt-1">
                Designation-ordered registry linking portal accounts with establishment records.
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl ring-1 ring-slate-200">
                <Input 
                  placeholder="Search name or email..." 
                  className="h-10 w-64 border-none bg-transparent shadow-none font-bold text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-10 w-36 bg-white border-none shadow-sm rounded-lg font-bold text-[10px] uppercase tracking-wider">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase">All Roles</SelectItem>
                    <SelectItem value="admin" className="text-[10px] font-bold uppercase">Admin</SelectItem>
                    <SelectItem value="scientist" className="text-[10px] font-bold uppercase">Scientist</SelectItem>
                    <SelectItem value="engineer" className="text-[10px] font-bold uppercase">Engineer</SelectItem>
                    <SelectItem value="viewer" className="text-[10px] font-bold uppercase">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 font-black uppercase text-[10px] tracking-widest bg-[#1e3a8a] shadow-xl shadow-blue-900/20 h-12 px-8 rounded-2xl hover:scale-[1.02] transition-all active:scale-95">
                      <UserPlus className="size-4" /> PROVISION USER
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-slate-50 border-b">
                      <DialogTitle className="text-xl font-black uppercase text-slate-900">Link Technical Account</DialogTitle>
                      <DialogDescription className="font-bold text-[10px] uppercase text-slate-400">Add staff member and toggle system access to create a portal account.</DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                      <AddStaffForm setOpen={setIsAddUserOpen} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#E0F2F7]">
                <TableRow className="h-14 hover:bg-transparent border-slate-200">
                  <TableHead className="pl-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Professional</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contact / Email</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Technical Role</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Establishment Link</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="h-24 border-slate-100">
                      <TableCell colSpan={6} className="px-10"><div className="h-12 w-full bg-slate-50 animate-pulse rounded-2xl" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isMasterAdminOfRow = u.email?.toLowerCase() === MASTER_ADMIN_EMAIL;
                    const canEditRow = isAdmin && !isMasterAdminOfRow;
                    const linkedEmployee = employeeMap.get(u.staffRecordId || '');
                    
                    return (
                      <TableRow key={u.id} className={cn(
                        "h-24 border-slate-100 hover:bg-slate-50/50 transition-colors group",
                        isMasterAdminOfRow && "bg-blue-50/20"
                      )}>
                        <TableCell className="pl-10">
                          <div className="flex items-center gap-4">
                            <Avatar className="size-12 ring-2 ring-white shadow-md group-hover:scale-110 transition-transform">
                              <AvatarImage src={u.photoURL} alt={u.displayName} />
                              <AvatarFallback className={cn(
                                "text-xs font-black text-white",
                                (u.role === 'admin' || isMasterAdminOfRow) ? "bg-rose-500" : "bg-blue-500"
                              )}>
                                {u.displayName?.substring(0, 2).toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-700 text-sm uppercase tracking-tight">{u.displayName || 'Unnamed User'}</span>
                              {isMasterAdminOfRow && <Badge className="w-fit h-4 text-[7px] bg-amber-400 text-amber-900 mt-1 uppercase font-black">Master Admin</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-xs font-bold font-mono">{u.email}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Joined: {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '---'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={isMasterAdminOfRow ? 'admin' : (u.role || 'scientist')} 
                            onValueChange={(val) => handleRoleChange(u.email, val)}
                            disabled={!canEditRow}
                          >
                            <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl shadow-sm focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                              <SelectItem value="admin" disabled={isMasterAdminOfRow} className="text-[10px] font-black uppercase">Admin</SelectItem>
                              <SelectItem value="scientist" className="text-[10px] font-black uppercase">Scientist</SelectItem>
                              <SelectItem value="engineer" className="text-[10px] font-black uppercase">Engineer</SelectItem>
                              <SelectItem value="viewer" className="text-[10px] font-black uppercase">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                           {linkedEmployee ? (
                             <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="w-fit h-5 text-[8px] font-black uppercase bg-slate-50 border-slate-200 text-primary">
                                    {linkedEmployee.designation}
                                </Badge>
                                <div className="flex items-center gap-2 text-slate-400 transition-colors">
                                    <Link2 className="size-3" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[120px]">
                                        {linkedEmployee.name}
                                    </span>
                                </div>
                             </div>
                           ) : (
                             <span className="text-[10px] font-bold text-slate-300 uppercase italic">No Link found</span>
                           )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-4">
                            <Switch 
                              checked={u.isApproved !== false} 
                              onCheckedChange={() => handleStatusToggle(u.email, u.isApproved !== false)}
                              disabled={!canEditRow}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black uppercase px-4 h-7 rounded-full border-none shadow-sm flex items-center gap-1.5",
                              u.isApproved !== false ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                              <div className={cn("size-1.5 rounded-full animate-pulse", u.isApproved !== false ? "bg-emerald-500" : "bg-rose-500")} />
                              {u.isApproved !== false ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-3">
                            <Button variant="ghost" size="icon" className="size-9 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                              <Eye className="size-5" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  disabled={!canEditRow}
                                  className={cn("size-9 transition-colors", canEditRow ? "text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl" : "opacity-20")}
                                >
                                  <Trash2 className="size-5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl p-8">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-black uppercase text-slate-900">Revoke Portal Access?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2">
                                    This will permanently delete the login account for <strong>{u.displayName}</strong>. The associated establishment record will not be affected.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-8">
                                  <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px]">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(u.email)} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase text-[10px]">YES, DELETE RECORD</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                        <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <UserIcon className="size-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No Users Found</h2>
                        <p className="text-slate-700 font-bold text-[10px] uppercase tracking-widest mt-2 mb-8">Refine your search or add new system users to manage portal access.</p>
                        {isAdmin && (
                          <Button 
                            onClick={() => setIsAddUserOpen(true)}
                            className="h-14 px-10 rounded-2xl bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20 gap-2"
                          >
                            <UserPlus className="size-4" /> PROVISION TECHNICAL USER
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. PERMISSION NOTICE */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4 items-start max-w-4xl mx-auto">
        <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Administrative Policy</p>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            Only <strong>Approved</strong> users can record technical data (Drilling, Pumping Test, etc.). 
            Newly registered users default to <strong>Pending</strong> status and must be verified by the District Master Admin (`{MASTER_ADMIN_EMAIL}`) before their permissions are activated.
          </p>
        </div>
      </div>

    </div>
  );
}
