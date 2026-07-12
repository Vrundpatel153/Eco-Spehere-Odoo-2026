import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { useAuthContext } from "@/store/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Gift, Target, Coins, ShieldCheck, Leaf, Users as UsersIcon, Award, Plus, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DIFF_COLORS: Record<string, string> = { easy: "text-[#00d4aa]", medium: "text-[#f59e0b]", hard: "text-destructive" };

function ChallengeIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "Leaf": return <Leaf className="w-8 h-8 text-[#00d4aa]" />;
    case "Users": return <UsersIcon className="w-8 h-8 text-[#3b82f6]" />;
    case "ShieldCheck": return <ShieldCheck className="w-8 h-8 text-[#f59e0b]" />;
    default: return <Award className="w-8 h-8 text-primary" />;
  }
}

export default function Gamification() {
  const { user } = useAuthContext();
  const { data: challenges, add: addChallenge, update: updateChallenge, remove: removeChallenge } = useStore<any>("esg_challenges");
  const { data: badges } = useStore<any>("esg_badges");
  const { data: rewards, update: updateReward } = useStore<any>("esg_rewards");
  const { data: employees, update: updateEmployee } = useStore<any>("esg_employees");
  const { data: challengeParticipations, add: addParticipation, update: updateParticipation } = useStore<any>("esg_challenge_participations");
  const { data: categories } = useStore<any>("esg_categories");

  // Join Challenge dialog
  const [joinModal, setJoinModal] = useState(false);
  const [joinChallenge, setJoinChallenge] = useState<any>(null);

  // Proof submission dialog
  const [proofModal, setProofModal] = useState(false);
  const [proofParticipation, setProofParticipation] = useState<any>(null);
  const [proofConfirm, setProofConfirm] = useState(false);

  // Add Challenge modal (admin/manager)
  const [challengeModal, setChallengeModal] = useState(false);
  const [challengeEdit, setChallengeEdit] = useState<any>(null);
  const challengeCats = categories.filter((c: any) => c.type === "challenge");
  const defChal = { title: "", categoryId: challengeCats[0]?.id || "3", description: "", xp: "500", difficulty: "easy", evidenceRequired: false, deadline: "", status: "active" };
  const [cForm, setCForm] = useState<any>(defChal);
  const [cErr, setCErr] = useState<any>({});

  const myParticipations = challengeParticipations.filter((cp: any) => cp.employeeName === user?.name);

  const isJoined = (challengeId: string) => myParticipations.some((p: any) => p.challengeId === challengeId);

  const currentUserEmployee = employees[0] || { id: "1", points: 0 };

  const openJoin = (c: any) => {
    if (isJoined(c.id)) { toast({ title: "Already joined", description: "You have already joined this challenge." }); return; }
    setJoinChallenge(c);
    setJoinModal(true);
  };

  const confirmJoin = () => {
    addParticipation({ challengeId: joinChallenge.id, employeeName: user?.name || "Unknown", progress: 0, proofSubmitted: false, approvalStatus: "pending", xpAwarded: 0 });
    toast({ title: "Challenge joined! 🌱", description: `Good luck with "${joinChallenge.title}"!` });
    setJoinModal(false);
  };

  const openProof = (participation: any) => {
    setProofParticipation(participation);
    setProofConfirm(false);
    setProofModal(true);
  };

  const submitProof = () => {
    if (!proofConfirm) { toast({ title: "Please confirm completion", variant: "destructive" }); return; }
    updateParticipation(proofParticipation.id, { progress: 100, proofSubmitted: true });
    toast({ title: "Proof submitted! ✓", description: "Awaiting manager approval." });
    setProofModal(false);
  };

  const handleRedeem = (reward: any) => {
    if (reward.stock <= 0) { toast({ title: "Out of stock", variant: "destructive" }); return; }
    if ((user?.points || 0) < reward.pointsRequired) { toast({ title: "Insufficient points", description: `You need ${reward.pointsRequired - (user?.points || 0)} more points.`, variant: "destructive" }); return; }
    updateReward(reward.id, { stock: reward.stock - 1 });
    toast({ title: "Reward Redeemed! 🎉", description: `You claimed: ${reward.name}` });
  };

  const openChallengeModal = (item?: any) => {
    setChallengeEdit(item || null);
    setCForm(item ? { ...item, xp: String(item.xp) } : defChal);
    setCErr({});
    setChallengeModal(true);
  };

  const saveChallenge = () => {
    const e: any = {};
    if (!cForm.title.trim()) e.title = "Required";
    if (!cForm.description.trim()) e.description = "Required";
    if (!cForm.deadline) e.deadline = "Required";
    if (isNaN(Number(cForm.xp)) || Number(cForm.xp) <= 0) e.xp = "Must be positive number";
    if (Object.keys(e).length) { setCErr(e); return; }

    if (challengeEdit) {
      updateChallenge(challengeEdit.id, { ...cForm, xp: Number(cForm.xp) });
      toast({ title: "Challenge updated! 🚀" });
    } else {
      addChallenge({ ...cForm, xp: Number(cForm.xp) });
      toast({ title: "Challenge created! 🚀" });
    }
    setChallengeModal(false);
    setChallengeEdit(null);
    setCForm(defChal);
    setCErr({});
  };

  const handleChallengeApprove = async (participation: any) => {
    const challenge = challenges.find((c: any) => c.id === participation.challengeId);
    const xp = challenge?.xp || 500;
    await updateParticipation(participation.id, { approvalStatus: "approved", xpAwarded: xp });
    window.dispatchEvent(new CustomEvent("esg_store_update", { detail: { key: "esg_employees" } }));
    window.dispatchEvent(new Event("esg_auth_update"));
    toast({ title: "Approved ✓", description: `Challenge approved and ${xp} XP/points awarded!` });
  };

  const handleChallengeReject = (id: string) => {
    updateParticipation(id, { approvalStatus: "rejected" });
    toast({ title: "Rejected", variant: "destructive" });
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gamification</h1>
          <p className="text-muted-foreground text-sm mt-1">Engage employees through challenges and rewards.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end bg-card border border-border px-4 py-2 rounded-lg">
            <span className="text-xs text-muted-foreground">My Points</span>
            <span className="font-bold text-[#f97316] flex items-center gap-1"><Coins className="w-4 h-4" />{user?.points || 0}</span>
          </div>
          <div className="flex flex-col items-end bg-card border border-border px-4 py-2 rounded-lg">
            <span className="text-xs text-muted-foreground">My XP</span>
            <span className="font-bold text-primary flex items-center gap-1">{user?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="bg-secondary/50 border border-border w-full justify-start overflow-x-auto h-auto py-1 mb-6 flex-wrap gap-1">
          <TabsTrigger value="challenges" className="data-[state=active]:bg-[#f97316]/10 data-[state=active]:text-[#f97316]">Challenges</TabsTrigger>
          <TabsTrigger value="my-progress" className="data-[state=active]:bg-[#f97316]/10 data-[state=active]:text-[#f97316]">My Progress</TabsTrigger>
          <TabsTrigger value="badges" className="data-[state=active]:bg-[#f97316]/10 data-[state=active]:text-[#f97316]">Badges</TabsTrigger>
          <TabsTrigger value="rewards" className="data-[state=active]:bg-[#f97316]/10 data-[state=active]:text-[#f97316]">Rewards</TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#f97316]/10 data-[state=active]:text-[#f97316]">Leaderboard</TabsTrigger>
          {(user?.role === "admin" || user?.role === "manager") && (
            <TabsTrigger value="approvals" className="data-[state=active]:bg-[#f97316]/10 data-[state=active]:text-[#f97316]">Approvals</TabsTrigger>
          )}
        </TabsList>

        {/* Challenges */}
        <TabsContent value="challenges">
          <div className="flex justify-end mb-4">
            {(user?.role === "admin" || user?.role === "manager") && (
              <Button size="sm" className="bg-[#f97316] text-white hover:bg-[#f97316]/90" onClick={() => openChallengeModal()}><Plus className="w-4 h-4 mr-2" />Add Challenge</Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.filter((c: any) => c.status === "active" || c.status === "under_review").map((challenge: any) => {
              const joined = isJoined(challenge.id);
              return (
                <Card key={challenge.id} className="bg-card border-card-border flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20">+{challenge.xp} XP</Badge>
                      <div className="flex items-center gap-1">
                        <Badge variant={challenge.difficulty === "hard" ? "destructive" : challenge.difficulty === "medium" ? "default" : "secondary"} className={`capitalize ${challenge.difficulty === "medium" ? "bg-[#f59e0b] text-background" : ""}`}>{challenge.difficulty}</Badge>
                        {(user?.role === "admin" || user?.role === "manager") && (
                          <div className="flex items-center gap-0.5 ml-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => openChallengeModal(challenge)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-destructive hover:text-destructive/80" onClick={() => removeChallenge(challenge.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{challenge.description}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Target className="w-3 h-3" /> Deadline: {new Date(challenge.deadline).toLocaleDateString()}
                    </div>
                    {challenge.evidenceRequired && <p className="text-xs text-[#f59e0b] mt-1">⚠ Evidence required</p>}
                  </CardContent>
                  <CardFooter className="pt-0">
                    {joined ? (
                      <Button className="w-full bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30 hover:bg-[#00d4aa]/30" variant="outline" disabled>✓ Joined</Button>
                    ) : (
                      <Button className="w-full bg-[#f97316] hover:bg-[#f97316]/90 text-white" onClick={() => openJoin(challenge)}>Join Challenge</Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {challenges.filter((c: any) => c.status === "active" || c.status === "under_review").length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No active challenges at this time.</div>
          )}
        </TabsContent>

        {/* My Progress */}
        <TabsContent value="my-progress">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle>My Challenge Progress</CardTitle></CardHeader>
            <CardContent>
              {myParticipations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't joined any challenges yet.</p>
                  <Button variant="outline" onClick={() => document.querySelector('[value="challenges"]')?.dispatchEvent(new MouseEvent("click"))}>Browse Challenges</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Challenge</TableHead><TableHead>XP Reward</TableHead><TableHead>Progress</TableHead><TableHead>Proof</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>{myParticipations.map((p: any) => {
                    const challenge = challenges.find((c: any) => c.id === p.challengeId);
                    return (<TableRow key={p.id}>
                      <TableCell className="font-medium">{challenge?.title || "Challenge"}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20">+{challenge?.xp || 0} XP</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress} className="h-1.5 w-20 [&>div]:bg-[#f97316]" />
                          <span className="text-xs text-muted-foreground">{p.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.proofSubmitted ? <Badge variant="outline" className="bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/20">Submitted</Badge> : <span className="text-xs text-muted-foreground">Not yet</span>}</TableCell>
                      <TableCell><Badge variant={p.approvalStatus === "approved" ? "default" : p.approvalStatus === "rejected" ? "destructive" : "secondary"} className={p.approvalStatus === "approved" ? "bg-[#00d4aa] text-background" : ""}>{p.approvalStatus}</Badge></TableCell>
                      <TableCell className="text-right">
                        {!p.proofSubmitted && p.approvalStatus === "pending" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-[#f97316] text-[#f97316] hover:bg-[#f97316]/10" onClick={() => openProof(p)}>Submit Proof</Button>
                        )}
                        {p.approvalStatus === "approved" && <span className="text-xs text-[#00d4aa]">✓ Complete</span>}
                      </TableCell>
                    </TableRow>);
                  })}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge: any) => (
            <Card key={badge.id} className="bg-card border-card-border text-center flex flex-col items-center justify-center p-6">
              <div className="w-20 h-20 rounded-full bg-secondary/50 border border-border flex items-center justify-center mb-4">
                <ChallengeIcon icon={badge.icon} />
              </div>
              <CardTitle className="text-lg mb-2">{badge.name}</CardTitle>
              <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
              <Badge variant="secondary" className="mt-auto">{badge.earnedCount} employees earned</Badge>
            </Card>
          ))}
        </TabsContent>

        {/* Rewards */}
        <TabsContent value="rewards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rewards.map((reward: any) => (
            <Card key={reward.id} className="bg-card border-card-border flex flex-col">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-2">
                  <Gift className="w-6 h-6 text-[#f97316]" />
                </div>
                <CardTitle className="text-lg">{reward.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#f97316] flex items-center gap-1"><Coins className="w-4 h-4" />{reward.pointsRequired}</span>
                  <span className={`text-xs ${reward.stock === 0 ? "text-destructive" : "text-muted-foreground"}`}>{reward.stock} left</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white transition-colors"
                  disabled={reward.stock <= 0 || (user?.points || 0) < reward.pointsRequired}
                  onClick={() => handleRedeem(reward)}>
                  {reward.stock <= 0 ? "Out of Stock" : (user?.points || 0) < reward.pointsRequired ? `Need ${reward.pointsRequired - (user?.points || 0)} more` : "Redeem"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle>Company Leaderboard</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead className="w-16">Rank</TableHead><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Badges</TableHead><TableHead className="text-right">Challenges</TableHead><TableHead className="text-right">Total XP</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[...employees].sort((a: any, b: any) => b.xp - a.xp).map((emp: any, i: number) => (
                    <TableRow key={emp.id} className={i < 3 ? "bg-primary/5 hover:bg-primary/10" : ""}>
                      <TableCell className="font-bold">{i === 0 ? "🥇 1" : i === 1 ? "🥈 2" : i === 2 ? "🥉 3" : i + 1}</TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell className="text-right">{emp.badgesEarned}</TableCell>
                      <TableCell className="text-right">{emp.challengesCompleted}</TableCell>
                      <TableCell className="text-right font-bold text-[#f97316]">{emp.xp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      {/* Join Dialog */}
      <Dialog open={joinModal} onOpenChange={setJoinModal}>
        <DialogContent className="bg-card border-card-border max-w-sm">
          <DialogHeader><DialogTitle>Join Challenge</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-[#f97316]/10 rounded-lg border border-[#f97316]/20">
              <p className="font-medium">{joinChallenge?.title}</p>
              <p className="text-xs text-muted-foreground mt-1">+{joinChallenge?.xp} XP · Deadline: {joinChallenge ? new Date(joinChallenge.deadline).toLocaleDateString() : ""}</p>
            </div>
            <p className="text-sm text-muted-foreground">Once completed, submit proof for manager approval to earn your XP and points.</p>
            {joinChallenge?.evidenceRequired && <p className="text-xs text-[#f59e0b] font-medium">⚠ Evidence required for this challenge.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinModal(false)}>Cancel</Button>
            <Button className="bg-[#f97316] text-white hover:bg-[#f97316]/90" onClick={confirmJoin}>Join Challenge 🌱</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Submission Dialog */}
      <Dialog open={proofModal} onOpenChange={setProofModal}>
        <DialogContent className="bg-card border-card-border max-w-sm">
          <DialogHeader><DialogTitle>Submit Challenge Proof</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="font-medium text-sm">{challenges.find((c: any) => c.id === proofParticipation?.challengeId)?.title}</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="confirm-complete" checked={proofConfirm} onChange={e => setProofConfirm(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#f97316]" />
              <Label htmlFor="confirm-complete" className="font-normal cursor-pointer text-sm">I confirm I have completed this challenge and my submission is truthful.</Label>
            </div>
            <p className="text-xs text-muted-foreground">Your manager will review and approve your submission to award XP.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProofModal(false)}>Cancel</Button>
            <Button className="bg-[#f97316] text-white hover:bg-[#f97316]/90" onClick={submitProof}><CheckCircle className="w-4 h-4 mr-2" />Submit Proof</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Challenge Modal */}
      <Dialog open={challengeModal} onOpenChange={setChallengeModal}>
        <DialogContent className="bg-card border-card-border max-w-md">
          <DialogHeader><DialogTitle>{challengeEdit ? "Edit" : "Create"} Challenge</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input className="bg-background border-border" value={cForm.title} onChange={e => setCForm({ ...cForm, title: e.target.value })} />{cErr.title && <p className="text-xs text-destructive">{cErr.title}</p>}</div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea className="bg-background border-border resize-none" rows={3} value={cForm.description} onChange={e => setCForm({ ...cForm, description: e.target.value })} />{cErr.description && <p className="text-xs text-destructive">{cErr.description}</p>}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>XP Reward</Label><Input type="number" className="bg-background border-border" value={cForm.xp} onChange={e => setCForm({ ...cForm, xp: e.target.value })} />{cErr.xp && <p className="text-xs text-destructive">{cErr.xp}</p>}</div>
              <div className="space-y-1.5"><Label>Difficulty</Label><Select value={cForm.difficulty} onValueChange={v => setCForm({ ...cForm, difficulty: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={cForm.status} onValueChange={v => setCForm({ ...cForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="under_review">Under Review</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" className="bg-background border-border" value={cForm.deadline} onChange={e => setCForm({ ...cForm, deadline: e.target.value })} />{cErr.deadline && <p className="text-xs text-destructive">{cErr.deadline}</p>}</div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ev-req" checked={cForm.evidenceRequired} onChange={e => setCForm({ ...cForm, evidenceRequired: e.target.checked })} className="w-4 h-4 accent-[#f97316]" />
              <Label htmlFor="ev-req" className="font-normal cursor-pointer">Evidence Required</Label>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setChallengeModal(false)}>Cancel</Button><Button className="bg-[#f97316] text-white hover:bg-[#f97316]/90" onClick={saveChallenge}>{challengeEdit ? "Save Changes" : "Create Challenge"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge Proof Approvals Tab */}
      {(user?.role === "admin" || user?.role === "manager") && (
        <TabsContent value="approvals">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle>Challenge Proof Approvals</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Challenge</TableHead>
                    <TableHead>XP/Points</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challengeParticipations.filter((p: any) => p.approvalStatus === "pending" && p.proofSubmitted).map((p: any) => {
                    const ch = challenges.find((c: any) => c.id === p.challengeId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.employeeName}</TableCell>
                        <TableCell>{ch?.title || "Unknown Challenge"}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20">+{ch?.xp || 0} XP</Badge></TableCell>
                        <TableCell>
                          <span className="text-xs text-[#00d4aa] font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Checked (Truthful statement)
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" className="border-destructive text-destructive h-7 text-xs hover:bg-destructive/10" onClick={() => handleChallengeReject(p.id)}>
                            Reject
                          </Button>
                          <Button size="sm" className="bg-[#f97316] hover:bg-[#f97316]/90 h-7 text-xs text-white" onClick={() => handleChallengeApprove(p)}>
                            Approve & Award
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {challengeParticipations.filter((p: any) => p.approvalStatus === "pending" && p.proofSubmitted).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No pending challenge approvals.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      </Tabs>
    </Layout>
  );
}
