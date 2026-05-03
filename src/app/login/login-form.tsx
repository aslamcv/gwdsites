'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useTransition, useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid official email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: MASTER_ADMIN_EMAIL,
      password: '123456',
    },
  });

  async function validateAndProvision(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const isMasterAdmin = normalizedEmail === MASTER_ADMIN_EMAIL;

    // 1. Check if user exists in the official Registry (Firestore)
    const userDocRef = doc(firestore, 'users', normalizedEmail);
    let userDoc;
    try {
      userDoc = await getDoc(userDocRef);
    } catch (e) {
      if (!isMasterAdmin) {
        throw new Error('Registry Check Failed: Could not verify your account status.');
      }
    }

    // If doc doesn't exist AND it's not the Master Admin, block login
    if (!userDoc?.exists() && !isMasterAdmin) {
      throw new Error('Access Denied: You are not registered in the system user registry.');
    }

    // If doc exists, check approval status
    if (userDoc?.exists()) {
      const userData = userDoc.data();
      if (userData.isApproved === false && !isMasterAdmin) {
        throw new Error('Access Pending: Your account is awaiting administrative approval.');
      }
    }

    // 2. Try normal sign in
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (signInError: any) {
      // 3. Just-in-Time Provisioning logic for the first login
      if (password === '123456') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          
          // Ensure document exists in registry and link UID
          if (!userDoc?.exists()) {
            await setDoc(userDocRef, {
              uid: userCredential.user.uid,
              email: normalizedEmail,
              displayName: isMasterAdmin ? 'District Officer' : 'System User',
              role: isMasterAdmin ? 'admin' : 'viewer',
              isApproved: true,
              createdAt: new Date().toISOString()
            });
          } else {
            await updateDoc(userDocRef, { uid: userCredential.user.uid });
          }
          return;
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
             throw new Error('Authentication failed: Invalid password for this account.');
          }
          throw new Error('Authentication failed: Could not establish session.');
        }
      }
      
      throw new Error('Invalid email or password.');
    }
  }

  function onSubmit(data: LoginFormValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await validateAndProvision(data.email, data.password);
        setSuccess('Authorized. Redirecting to technical portal...');
        toast({ title: 'Session Established', description: `Authenticated as ${data.email.toLowerCase()}` });
        setTimeout(() => router.push('/'), 800);
      } catch (err: any) {
        setError(err.message || 'An unexpected system error occurred.');
        if (auth) await signOut(auth);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <ShieldAlert className="size-4 text-rose-600" />
            <AlertTitle className="text-xs font-black uppercase tracking-tight">Access Restricted</AlertTitle>
            <AlertDescription className="text-[11px] font-medium leading-tight mt-1">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertTitle className="text-xs font-black uppercase tracking-tight">Authorized</AlertTitle>
            <AlertDescription className="text-[11px] font-medium leading-tight mt-1">{success}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">Registered Official Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@gwd.kerala.gov.in" {...field} className="h-12 bg-white/50 border-slate-200 rounded-xl font-bold" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">Portal Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="h-12 bg-white/50 border-slate-200 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isPending} 
          className="w-full h-14 rounded-2xl bg-[#1e3a8a] hover:bg-blue-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20 mt-4 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'AUTHENTICATE ACCESS'}
        </Button>

        <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest mt-6 px-4 leading-relaxed">
          Access is strictly limited to authorized personnel. Use your registered official email and password to proceed.
        </p>
      </form>
    </Form>
  );
}
