
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { format } from 'date-fns';

const staffFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  name_ml: z.string().optional(),
  designation: z.string().min(2, 'Designation is required.'),
  designation_ml: z.string().optional(),
  pen: z.string().min(1, 'PEN/TEN is required.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
  hasSystemAccess: z.boolean().default(false),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number.'),
  dob: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'A valid date of birth is required.',
  }),
  photoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  roles: z.string().min(1, "At least one role is required."),
  remarks: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

const designationOptions = [
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

const designationOptionsMl = [
  'എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ',
  'സീനിയർ ഹൈഡ്രോജിയോളജിസ്റ്റ്',
  'അസിസ്റ്റന്റ് എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ',
  'ഹൈഡ്രോജിയോളജിസ്റ്റ്',
  'ജിയോഫിസിസ്റ്റ്',
  'അസിസ്റ്റന്റ് എഞ്ചിനീയർ',
  'ജൂനിയർ ഹൈഡ്രോജിയോളജിസ്റ്റ്',
  'ജൂനിയർ ജിയോഫിസിസ്റ്റ്',
  'മാസ്റ്റർ ഡ്രില്ലർ',
  'സീനിയർ ഡ്രില്ലർ',
  'സീനിയർ ക്ലർക്ക്',
  'ക്ലർക്ക്',
  'യു.ഡി. ടൈപ്പിസ്റ്റ്',
  'ജിയോളജിക്കൽ അസിസ്റ്റന്റ്',
  'ജിയോഫിസിക്കൽ അസിസ്റ്റന്റ്',
  'ഡ്രില്ലർ',
  'ഡ്രില്ലർ മെക്കാനിക്',
  'ഡ്രില്ലിംഗ് അസിസ്റ്റന്റ്',
  'കംപ്രസർ ഡ്രൈവർ',
  'HDV ഡ്രൈവർ',
  'LDV ഡ്രൈവർ',
  'വാച്ചർ',
  'സർവേയർ',
  'ഓഫീസ് അറ്റൻഡന്റ്',
  'പി.ടി.എസ്.',
  'സ്‌കിൽഡ് വർക്കർ',
  'എസ്.എൽ.ആർ.',
  'സി.എൽ.ആർ.',
  'സി.എൽ.ആർ. (എംപ്ലോയ്മെന്റ്)',
  'ലസ്കർ',
];

export function EditStaffForm({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: employee.name,
      name_ml: employee.name_ml || '',
      designation: employee.designation,
      designation_ml: employee.designation_ml || '',
      pen: employee.pen,
      email: employee.email || '',
      hasSystemAccess: employee.hasSystemAccess || false,
      phone: employee.phone,
      dob: format(new Date(employee.dob), 'yyyy-MM-dd'),
      photoUrl: employee.photoUrl,
      roles: employee.roles.join(', '),
      remarks: '',
    },
  });

  function onSubmit(data: StaffFormValues) {
    if (!user) return;

    startTransition(() => {
      const normalizedEmail = (data.email || '').toLowerCase().trim();
      const employeeDocRef = doc(firestore, 'employees', employee.id);
      
      const updatedEmployeeData = {
        name: data.name,
        name_ml: data.name_ml,
        designation: data.designation,
        designation_ml: data.designation_ml,
        pen: data.pen,
        email: normalizedEmail,
        hasSystemAccess: data.hasSystemAccess,
        phone: data.phone,
        dob: data.dob,
        photoUrl: data.photoUrl || '',
        roles: data.roles.split(',').map(role => role.trim()),
      };

      updateDoc(employeeDocRef, updatedEmployeeData)
        .then(() => {
          if (normalizedEmail) {
            const userPortalRef = doc(firestore, 'users', normalizedEmail);
            const userPortalData = {
              email: normalizedEmail,
              displayName: data.name,
              photoURL: data.photoUrl || '',
              role: data.designation.toLowerCase().includes('engineer') ? 'engineer' : 'scientist',
              isApproved: data.hasSystemAccess,
              updatedAt: new Date().toISOString(),
              staffRecordId: employee.id
            };

            setDoc(userPortalRef, userPortalData, { merge: true })
              .catch(async (error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: userPortalRef.path,
                  operation: 'update',
                  requestResourceData: userPortalData,
                }));
              });
          }

          toast({
            title: 'Staff Member Updated',
            description: `${data.name}'s details have been updated.`,
          });
          setOpen(false);
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: employeeDocRef.path,
            operation: 'update',
            requestResourceData: updatedEmployeeData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 py-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name (English)</FormLabel>
                <FormControl>
                  <Input className="h-8 text-xs" placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name_ml"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name (Malayalam)</FormLabel>
                <FormControl>
                  <Input className="h-8 text-xs" placeholder="ജോൺ ഡോ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pen"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">PEN/TEN</FormLabel>
                <FormControl>
                  <Input className="h-8 text-xs" placeholder="123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Designation (EN)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {designationOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="designation_ml"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Designation (ML)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="തിരഞ്ഞെടുക്കുക" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {designationOptionsMl.map((option, index) => (
                      <SelectItem key={`${option}-${index}`} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Phone No.</FormLabel>
                <FormControl>
                  <Input className="h-8 text-xs" placeholder="+91 98765 43210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Official Email ID</FormLabel>
                <FormControl>
                  <Input type="email" className="h-8 text-xs" placeholder="name@gwd.kerala.gov.in" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" className="h-8 text-xs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Photo URL</FormLabel>
                <FormControl>
                  <Input type="url" className="h-8 text-xs" placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roles"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel className="text-xs">Roster Roles (e.g., Unit In-Charge, Site Verification)</FormLabel>
                <FormControl>
                  <Input className="h-8 text-xs" placeholder="Comma separated roles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel className="text-xs">General Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes"
                    className="resize-none min-h-[40px] text-xs py-1 px-3"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hasSystemAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 bg-slate-50 rounded-xl border border-slate-200 md:col-span-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-[10px] font-black uppercase text-primary">Modify System Access</FormLabel>
                  <FormDescription className="text-[9px] font-bold text-slate-400">
                    Checked allows login with default password: <strong>123456</strong>. User will appear in User Management portal.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="h-8 text-xs" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
