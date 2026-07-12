import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Building2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuthContext } from '@/store/AuthContext';
import { seedData } from '@/lib/seed-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().regex(passwordRegex, 'Password must be at least 8 characters, contain 1 uppercase letter and 1 number'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'employee', 'manager']),
  department: z.string().min(1, 'Department is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { register: authRegister } = useAuthContext();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Get departments from localStorage or fallback to seedData
  const getDepartments = () => {
    try {
      const stored = localStorage.getItem('esg_departments');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return seedData.esg_departments;
  };
  const departments = getDepartments();

  const {
    register: formRegister,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'employee',
      department: '',
    }
  });

  const watchPassword = watch('password', '');
  
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-muted' };
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-destructive' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: RegisterFormValues) => {
    setError('');
    const result = await authRegister(data);
    if (result.success) {
      toast({
        title: 'Account created',
        description: 'Welcome to EcoSphere!',
      });
      setLocation('/');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden text-foreground">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl mb-4 shadow-lg shadow-primary/20">
                ES
              </div>
              <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
              <p className="text-muted-foreground mt-2">Join EcoSphere and track your ESG impact</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="name"
                      placeholder="Jane Doe" 
                      className="pl-10"
                      {...formRegister('name')}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="name@company.com" 
                      className="pl-10"
                      {...formRegister('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select onValueChange={(value) => setValue('role', value as any)} defaultValue="employee">
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Select role" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select onValueChange={(value) => setValue('department', value)}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Select dept" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="password"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10"
                      {...formRegister('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Strength */}
                  {watchPassword.length > 0 && (
                    <div className="pt-1">
                      <div className="flex gap-1 h-1.5 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div 
                            key={level} 
                            className={`flex-1 rounded-full ${level <= strength.score ? strength.color : 'bg-muted'}`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className="pl-10"
                      {...formRegister('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full py-6 mt-6" disabled={isSubmitting}>
                Create Account
              </Button>
            </form>
          </div>
          
          <div className="bg-muted/50 p-6 text-center border-t border-border">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login">
                <span className="font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
