import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Mail, User as UserIcon, Shield, Briefcase, Activity, CheckCircle2, Lock } from 'lucide-react';

import { useAuthContext } from '@/store/AuthContext';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  department: z.string().min(1, 'Department is required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, 'Password must be at least 8 characters, contain 1 uppercase letter and 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuthContext();
  const { toast } = useToast();
  const { data: departments } = useStore<any>("esg_departments");
  const { data: allParticipations } = useStore<any>("esg_employee_participations");
  const { data: challengeParticipations } = useStore<any>("esg_challenge_participations");

  const [isEditing, setIsEditing] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      department: user?.department || '',
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    const result = await updateProfile(data);
    if (result.success) {
      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully.' });
      setIsEditing(false);
    } else {
      toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    const result = await changePassword(data.currentPassword, data.newPassword);
    if (result.success) {
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
      passwordForm.reset();
    } else {
      toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
    }
  };

  if (!user) return null;

  const initials = user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const roleColor = user.role === 'admin' ? 'bg-primary text-primary-foreground' : 
                    user.role === 'manager' ? 'bg-soc text-primary-foreground' : 'bg-gov text-primary-foreground';

  // My Activity Data
  const myActivities = [
    ...allParticipations.filter((p: any) => p.employeeName === user.name).map((p: any) => ({
      id: `act-${p.id}`,
      title: 'CSR Activity Participated',
      status: p.approvalStatus,
      points: p.pointsEarned,
      date: p.completionDate || 'Pending'
    })),
    ...challengeParticipations.filter((p: any) => p.employeeName === user.name).map((p: any) => ({
      id: `cha-${p.id}`,
      title: 'Challenge Progress',
      status: p.approvalStatus,
      points: p.xpAwarded,
      date: 'Recent' // Mock date
    }))
  ].slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 md:items-start">
        {/* Profile Sidebar */}
        <Card className="w-full md:w-80 shrink-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg mb-4 ${roleColor}`}>
                {initials}
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              
              <Badge variant="secondary" className="mb-6 capitalize px-3 py-1 text-sm font-medium">
                {user.role}
              </Badge>

              <div className="w-full space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground flex items-center"><Building2 className="w-4 h-4 mr-2"/> Dept</span>
                  <span className="text-sm font-medium">{user.department}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground flex items-center"><Activity className="w-4 h-4 mr-2"/> XP</span>
                  <span className="text-sm font-medium text-primary">{user.xp || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-2"/> Points</span>
                  <span className="text-sm font-medium text-gov">{user.points || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <div className="flex-1 w-full">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Overview</TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your personal details and department affiliation.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input {...profileForm.register('name')} />
                        {profileForm.formState.errors.name && <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select 
                          defaultValue={profileForm.getValues('department')} 
                          onValueChange={(v) => profileForm.setValue('department', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d: any) => (
                              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email Address</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{user.department}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest interactions and challenges within EcoSphere.</CardDescription>
                </CardHeader>
                <CardContent>
                  {myActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      No recent activity found. Start a challenge!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myActivities.map((act, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{act.title}</p>
                              <p className="text-xs text-muted-foreground">{act.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={act.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                              {act.status}
                            </Badge>
                            {act.points > 0 && (
                              <span className="font-medium text-primary">+{act.points}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" {...passwordForm.register('currentPassword')} />
                      {passwordForm.formState.errors.currentPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" {...passwordForm.register('newPassword')} />
                      {passwordForm.formState.errors.newPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" {...passwordForm.register('confirmPassword')} />
                      {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <div className="pt-4">
                      <Button type="submit">Update Password</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
