'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  Edit3, 
  FileSpreadsheet, 
  Trash2, 
  Mail,
  Phone,
  Clock,
  Save,
  Loader2,
  Upload,
  ChevronDown,
  BookOpen,
  AlertCircle,
  Network
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const defaultOfficeInfo = {
    nameEn: 'GROUND WATER DEPARTMENT',
    addressEn: 'District Office, Third Floor, B1 Block, Civil Station, Malappuram - 676505',
    nameMl: 'ഭൂജല വകുപ്പ്',
    addressMl: 'ജില്ലാ ഓഫീസറുടെ കാര്യാലയം, മൂന്നാം നില, ബി1 ബ്ലോക്ക്, സിവിൽ സ്റ്റേഷൻ, മലപ്പുറം - 676505',
    phone: '0483 2731450',
    email: 'gwdmpm@gmail.com',
    officerName: 'Mohamed Kabeer Thekkedath',
    pan: 'AAAGD1843H',
    gst: '32AAAGD1843H1ZX',
    gstinTds: '32CHND01339C1D7'
  };

  const [editForm, setEditForm] = useState({ ...defaultOfficeInfo });
  const [manualUrls, setManualUrls] = useState({ malayalam: '', english: '' });
  
  // Real-time Cloud Settings
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appSettings', 'global_data');
  }, [firestore]);

  const { data: cloudSettings, isLoading: isCloudLoading } = useDoc(settingsRef);
  
  const officeInfo = cloudSettings?.officeInfo || defaultOfficeInfo;
  const lsgs = cloudSettings?.lsgs || [];
  const constituencies = cloudSettings?.constituencies || [];
  const lsgMappings = cloudSettings?.lsgMappings || [];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'dd/MM/yyyy, HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (cloudSettings?.manuals) {
      setManualUrls(cloudSettings.manuals);
    }
  }, [cloudSettings]);

  const handleSaveOfficeInfo = () => {
    if (!settingsRef) return;
    
    setDocumentNonBlocking(settingsRef, {
      ...cloudSettings,
      officeInfo: { ...editForm }
    }, { merge: true });

    setIsEditDialogOpen(false);
    toast({
      title: "Settings Updated",
      description: "Office address and official details have been saved to the cloud.",
    });
  };
  
  const handleSaveManualUrl = (type: 'malayalam' | 'english') => {
    const url = manualUrls[type];
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'URL Required',
        description: 'Please enter a valid URL for the manual.',
      });
      return;
    }
    
    if (!settingsRef) return;

    const updatedManuals = {
      ...(cloudSettings?.manuals || { malayalam: '', english: '' }),
      [type]: url
    };

    setDocumentNonBlocking(settingsRef, {
      ...cloudSettings,
      manuals: updatedManuals
    }, { merge: true });

    toast({
      title: 'URL Saved to Cloud',
      description: `The ${type} manual link has been updated globally.`,
    });
  };

  const handleImportExcelClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settingsRef) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          throw new Error("The selected Excel sheet appears to be empty.");
        }

        const mappings: { lsg: string, constituency: string }[] = [];

        jsonData.forEach((row: any) => {
          const keys = Object.keys(row);
          const lsgKey = keys.find(k => 
            k.toLowerCase().includes('lsg') || 
            k.toLowerCase().includes('local body') || 
            k.toLowerCase().includes('panchayat') ||
            k.toLowerCase().includes('municipality')
          );
          const constKey = keys.find(k => 
            k.toLowerCase().includes('const') || 
            k.toLowerCase().includes('lac') || 
            k.toLowerCase().includes('assembly')
          );
          
          if (lsgKey && row[lsgKey] && constKey && row[constKey]) {
            mappings.push({
              lsg: String(row[lsgKey]).trim(),
              constituency: String(row[constKey]).trim()
            });
          }
        });

        const uniqueMappings = Array.from(new Map(mappings.map(m => [m.lsg, m])).values())
          .sort((a, b) => a.lsg.localeCompare(b.lsg));

        const finalLsgs = uniqueMappings.map(m => m.lsg);
        const finalConstituencies = Array.from(new Set(uniqueMappings.map(m => m.constituency))).sort();

        setDocumentNonBlocking(settingsRef, {
          ...cloudSettings,
          lsgs: finalLsgs,
          constituencies: finalConstituencies,
          lsgMappings: uniqueMappings
        }, { merge: true });

        toast({
          title: "Import Successful",
          description: `Processed ${jsonData.length} rows. Relational data mappings saved to Cloud.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: error.message || "Could not process the Excel file.",
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        { 'Local Body': 'Pothukal Grama Panchayat', 'Constituency': 'Nilambur' },
        { 'Local Body': 'Malappuram Municipality', 'Constituency': 'Malappuram' },
        { 'Local Body': 'Areekode Block Panchayat', 'Constituency': 'Eranad' },
      ];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");
      XLSX.writeFile(workbook, "GWD_Bulk_Data_Template.xlsx");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate template." });
    }
  };

  const handleClearData = () => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, {
      ...cloudSettings,
      lsgs: [],
      constituencies: [],
      lsgMappings: []
    }, { merge: true });
    toast({ variant: "destructive", title: "Data Cleared", description: "All cloud data mappings have been reset." });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            General System Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage application-wide settings and bulk technical data mappings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-primary font-medium text-sm bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <Clock className="h-4 w-4" />
          {currentTime || 'Loading...'}
        </div>
      </div>

      {isCloudLoading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <Card className="border-none shadow-sm bg-secondary/20 overflow-hidden ring-1 ring-primary/10">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary">Office Address</CardTitle>
              </div>
              
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <Button variant="outline" size="sm" className="gap-2 bg-background border-primary/20 text-primary hover:bg-primary/10" onClick={() => { setEditForm({...officeInfo}); setIsEditDialogOpen(true); }}>
                  <Edit3 className="h-4 w-4" />
                  Edit Details
                </Button>
                <DialogContent className="sm:max-w-[900px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Edit Office Details</DialogTitle>
                    <DialogDescription className="text-muted-foreground">Update official contact and registration information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-6 max-h-[70vh] overflow-y-auto px-1">
                    <div className="space-y-2"><Label className="text-primary/70">Office Name (EN)</Label><Input className="bg-background border-primary/10" value={editForm.nameEn} onChange={(e) => setEditForm({...editForm, nameEn: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">Office Name (ML)</Label><Input className="bg-background border-primary/10" value={editForm.nameMl} onChange={(e) => setEditForm({...editForm, nameMl: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">Address (EN)</Label><Input className="bg-background border-primary/10" value={editForm.addressEn} onChange={(e) => setEditForm({...editForm, addressEn: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">Address (ML)</Label><Input className="bg-background border-primary/10" value={editForm.addressMl} onChange={(e) => setEditForm({...editForm, addressMl: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">Phone</Label><Input className="bg-background border-primary/10" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">Email</Label><Input className="bg-background border-primary/10" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">District Officer</Label><Input className="bg-background border-primary/10" value={editForm.officerName} onChange={(e) => setEditForm({...editForm, officerName: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">PAN</Label><Input className="bg-background border-primary/10" value={editForm.pan} onChange={(e) => setEditForm({...editForm, pan: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">GST</Label><Input className="bg-background border-primary/10" value={editForm.gst} onChange={(e) => setEditForm({...editForm, gst: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-primary/70">GSTIN (TDS)</Label><Input className="bg-background border-primary/10" value={editForm.gstinTds} onChange={(e) => setEditForm({...editForm, gstinTds: e.target.value})} /></div>
                  </div>
                  <DialogFooter className="border-t border-primary/10 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="border-primary/20 text-primary">Cancel</Button>
                    <Button size="sm" onClick={handleSaveOfficeInfo} className="gap-2"><Save className="h-4 w-4" />Save to Cloud</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-background/50 rounded-xl p-6 border border-primary/10">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div><h2 className="text-xl font-bold text-primary uppercase">{officeInfo.nameEn}</h2><p className="text-sm text-muted-foreground">{officeInfo.addressEn}</p></div>
                    <div className="space-y-1"><p className="text-lg font-medium text-foreground">{officeInfo.nameMl}</p><p className="text-sm text-muted-foreground">{officeInfo.addressMl}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm text-primary/80"><Phone className="h-4 w-4 text-primary" /><span className="font-semibold">Phone:</span> {officeInfo.phone}</div>
                      <div className="flex items-center gap-2 text-sm text-primary/80"><Mail className="h-4 w-4 text-primary" /><span className="font-semibold">Email:</span> {officeInfo.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-lg border border-primary/10 self-start">
                    <Avatar className="h-12 w-12 border-2 border-primary/20"><AvatarImage src="https://picsum.photos/seed/district-officer/100/100" data-ai-hint="man portrait" /><AvatarFallback>DO</AvatarFallback></Avatar>
                    <div><p className="text-xs text-primary/60 font-medium uppercase tracking-wider">District Officer</p><p className="text-sm font-bold text-primary">{officeInfo.officerName}</p></div>
                  </div>
                </div>
                <Separator className="my-6 bg-primary/10" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-secondary/50 p-2 rounded border border-primary/5"><span className="font-semibold text-primary/60 uppercase block mb-1">PAN</span><span className="font-mono text-primary/90">{officeInfo.pan}</span></div>
                  <div className="bg-secondary/50 p-2 rounded border border-primary/5"><span className="font-semibold text-primary/60 uppercase block mb-1">GST</span><span className="font-mono text-primary/90">{officeInfo.gst}</span></div>
                  <div className="bg-secondary/50 p-2 rounded border border-primary/5"><span className="font-semibold text-primary/60 uppercase block mb-1">GSTIN(TDS)</span><span className="font-mono text-primary/90">{officeInfo.gstinTds}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-secondary/20 overflow-hidden ring-1 ring-primary/10">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary">Department Manuals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                <h3 className="font-bold text-lg text-slate-800">Malayalam Manual URL</h3>
                <p className="text-xs text-muted-foreground">Paste the direct URL to the `malayalam.pdf` file.</p>
                <div className="flex gap-2">
                  <Input 
                    id="malayalam-url" 
                    type="url" 
                    placeholder="https://example.com/manual_ml.pdf"
                    className="w-full h-10 border-slate-200" 
                    value={manualUrls.malayalam}
                    onChange={(e) => setManualUrls(prev => ({...prev, malayalam: e.target.value}))}
                  />
                  <Button onClick={() => handleSaveManualUrl('malayalam')} className="h-10 gap-2"><Save className="h-4 w-4"/> Save</Button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-slate-800">English Manual URL</h3>
                <p className="text-xs text-muted-foreground">Paste the direct URL to the `english.pdf` file.</p>
                <div className="flex gap-2">
                  <Input 
                    id="english-url" 
                    type="url"
                    placeholder="https://example.com/manual_en.pdf"
                    className="w-full h-10 border-slate-200"
                    value={manualUrls.english}
                    onChange={(e) => setManualUrls(prev => ({...prev, english: e.target.value}))}
                  />
                  <Button onClick={() => handleSaveManualUrl('english')} className="h-10 gap-2"><Save className="h-4 w-4"/> Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-secondary/20 overflow-hidden ring-1 ring-primary/10">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-500/10">
              <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-blue-400" /><CardTitle className="text-lg text-blue-400">Bulk Data Management</CardTitle></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImportExcelClick} disabled={isImporting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Import to Cloud
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="gap-2 bg-background border-primary/20 text-primary"> <FileSpreadsheet className="h-4 w-4" />Template</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="gap-2"> <Trash2 className="h-4 w-4" />Clear Cloud Data</Button></AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-primary/20">
                    <AlertDialogHeader><AlertDialogTitle className="text-primary">Clear All Data?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">This will clear all Local Self Governments and Constituencies from the cloud database.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel className="bg-background border-primary/20 text-primary">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">Clear Everything</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <p className="text-sm text-muted-foreground -mt-4">Excel data is saved permanently in the cloud and synced across all investigation forms with mapped Constituencies.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Card className={cn("bg-blue-500/5 border-blue-500/10 shadow-none transition-all outline-none", lsgs.length > 0 && "hover:bg-blue-500/10 cursor-pointer border-blue-500/20")}>
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center relative group">
                        {lsgs.length > 0 && <ChevronDown className="absolute top-4 right-4 h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        <p className="text-sm font-medium text-blue-400 uppercase tracking-tighter mb-1">Local Self Governments</p>
                        <p className="text-5xl font-bold text-blue-500">{lsgs.length}</p>
                      </CardContent>
                    </Card>
                  </DropdownMenuTrigger>
                  {lsgs.length > 0 && (
                    <DropdownMenuContent className="w-80 max-h-[400px] p-0 overflow-hidden bg-card border-primary/20" align="center">
                      <DropdownMenuLabel className="px-4 py-3 bg-secondary/50 flex items-center justify-between text-primary"><span>Local Bodies</span><Badge variant="secondary" className="bg-primary/20 text-primary">{lsgs.length}</Badge></DropdownMenuLabel>
                      <DropdownMenuSeparator className="m-0 bg-primary/10" />
                      <ScrollArea className="h-[300px]"><div className="p-2">{lsgs.map((item, idx) => (<DropdownMenuItem key={idx} className="text-xs py-2 px-3 rounded-sm text-primary/80 focus:bg-primary/10 focus:text-primary">{item}</DropdownMenuItem>))}</div></ScrollArea>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Card className={cn("bg-primary/5 border-primary/10 shadow-none transition-all outline-none", constituencies.length > 0 && "hover:bg-primary/10 cursor-pointer border-primary/20")}>
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center relative group">
                        {constituencies.length > 0 && <ChevronDown className="absolute top-4 right-4 h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                        <p className="text-sm font-medium text-primary/70 uppercase tracking-tighter mb-1">Constituencies (LAC)</p>
                        <p className="text-5xl font-bold text-primary">{constituencies.length}</p>
                      </CardContent>
                    </Card>
                  </DropdownMenuTrigger>
                  {constituencies.length > 0 && (
                    <DropdownMenuContent className="w-80 max-h-[400px] p-0 overflow-hidden bg-card border-primary/20" align="center">
                      <DropdownMenuLabel className="px-4 py-3 bg-secondary/50 flex items-center justify-between text-primary"><span>Constituencies</span><Badge variant="secondary" className="bg-primary/20 text-primary">{constituencies.length}</Badge></DropdownMenuLabel>
                      <DropdownMenuSeparator className="m-0 bg-primary/10" />
                      <ScrollArea className="h-[300px]"><div className="p-2">{constituencies.map((item, idx) => (<DropdownMenuItem key={idx} className="text-xs py-2 px-3 rounded-sm text-primary/80 focus:bg-primary/10 focus:text-primary">{item}</DropdownMenuItem>))}</div></ScrollArea>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </div>

              {/* NEW: Display Mapped Relations */}
              {lsgMappings.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg text-primary uppercase">Mapped Technical Relations</h3>
                  </div>
                  <div className="border border-primary/10 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                          <TableRow className="h-12 border-primary/10">
                            <TableHead className="pl-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Local Self Government (LSGD)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-right pr-12">Constituency (LAC)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lsgMappings.map((mapping, idx) => (
                            <TableRow key={idx} className="h-11 border-primary/5 hover:bg-primary/5 transition-colors">
                              <td className="pl-6 text-[11px] font-bold text-slate-700 uppercase">{mapping.lsg}</td>
                              <td className="text-right pr-12">
                                <Badge variant="secondary" className="text-[9px] font-black bg-blue-50 text-blue-600 border-none uppercase tracking-tighter">
                                  {mapping.constituency}
                                </Badge>
                              </td>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
