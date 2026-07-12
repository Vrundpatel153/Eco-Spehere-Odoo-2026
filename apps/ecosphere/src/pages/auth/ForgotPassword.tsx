import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/store/useAuth';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  password: z.string().regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, 'Password must be at least 8 characters, contain 1 uppercase letter and 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const onEmailSubmit = (data: z.infer<typeof emailSchema>) => {
    setError('');
    // Mock sending email
    setResetEmail(data.email);
    setStep(2);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    setError('');
    
    // Manual local storage update for reset
    const usersStr = localStorage.getItem('esg_users');
    if (!usersStr) {
      setError('No users found in database');
      return;
    }
    
    let users: User[] = JSON.parse(usersStr);
    const userIndex = users.findIndex(u => u.email === resetEmail);
    
    if (userIndex === -1) {
      // Simulate success even if user not found for security
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully reset.',
      });
      setTimeout(() => setLocation('/login'), 2000);
      return;
    }

    users[userIndex].password = data.password;
    localStorage.setItem('esg_users', JSON.stringify(users));
    
    toast({
      title: 'Password Updated',
      description: 'Your password has been successfully reset.',
      className: "bg-green-50 border-green-200",
    });
    
    setTimeout(() => setLocation('/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/login">
          <span className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer transition-colors w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </span>
        </Link>

        <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center">
              {step === 1 ? 'Forgot Password?' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              {step === 1 
                ? "No worries, we'll send you reset instructions."
                : "If this email is registered, you can set a new password now."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-sm mb-6">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-10"
                    {...emailForm.register('email')}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full py-6" disabled={emailForm.formState.isSubmitting}>
                Reset Password
              </Button>
            </form>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border border-border mb-6 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Resetting password for:</p>
                  <p className="font-medium text-foreground">{resetEmail}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="password"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10"
                      {...passwordForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className="pl-10"
                      {...passwordForm.register('confirmPassword')}
                    />
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full py-6" disabled={passwordForm.formState.isSubmitting}>
                Update Password
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
