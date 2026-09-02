import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Check, Copy, Lock, MoreHorizontal, Settings2, Share2, UserCheck, UserPlus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProfileData = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  isPrivate: boolean;
  stats: { followers: number; following: number; friends?: number };
  relationship: { isFollowing: boolean; isSelf: boolean };
  modules: { goals: number | null };
};

const publications = [
  { id: "consistency", title: "Consistency", value: "86%", note: "last 30 days", accent: "#2563eb", kind: "ring" },
  { id: "training", title: "Training", value: "14", note: "sessions this month", accent: "#e5484d", kind: "bars" },
  { id: "learning", title: "Learning", value: "32h", note: "focused this month", accent: "#7c3aed", kind: "path" },
  { id: "goals", title: "Goals", value: "4/6", note: "moving forward", accent: "#20a65a", kind: "tiles" },
  { id: "running", title: "Running", value: "48 km", note: "this month", accent: "#ea7c16", kind: "line" },
  { id: "recovery", title: "Recovery", value: "79", note: "30-day average", accent: "#0891b2", kind: "ring" },
];

function Publication({ item, editing, enabled, onToggle }: { item: typeof publications[number]; editing: boolean; enabled: boolean; onToggle: () => void }) {
  if (!enabled && !editing) return null;
  return (
    <button type="button" onClick={editing ? onToggle : undefined} className={`group relative aspect-square overflow-hidden rounded-[22px] border bg-card p-4 text-left ${editing && !enabled ? "opacity-35" : ""}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{item.title}</span>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {item.kind === "ring" ? (
            <div className="grid aspect-square w-[58%] place-items-center rounded-full border-[9px]" style={{ borderColor: `color-mix(in srgb, ${item.accent} 22%, white)` }}>
              <span className="text-2xl font-semibold tracking-[-.05em]">{item.value}</span>
            </div>
          ) : item.kind === "bars" ? (
            <div className="flex h-[58%] w-full items-end gap-2">{[36, 72, 49, 88, 65, 94].map((height, index) => <i key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%`, backgroundColor: index === 5 ? item.accent : `color-mix(in srgb, ${item.accent} 20%, white)` }} />)}</div>
          ) : item.kind === "path" ? (
            <div className="flex w-full items-center">{[0, 1, 2, 3, 4].map((node) => <span key={node} className="contents"><i className="h-4 w-4 rounded-full" style={{ backgroundColor: node < 4 ? item.accent : `color-mix(in srgb, ${item.accent} 18%, white)` }} />{node < 4 ? <i className="h-1 flex-1" style={{ backgroundColor: node < 3 ? item.accent : `color-mix(in srgb, ${item.accent} 18%, white)` }} /> : null}</span>)}</div>
          ) : (
            <strong className="text-[34px] font-semibold tracking-[-.06em]">{item.value}</strong>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{item.note}</p>
      </div>
      {editing ? <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#18202a] text-white">{enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span> : null}
    </button>
  );
}

export default function ProfileView() {
  const { username } = useParams();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [visible, setVisible] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("dojo-publications") || "null") ?? publications.slice(0, 4).map((item) => item.id); }
    catch { return publications.slice(0, 4).map((item) => item.id); }
  });
  const { data: profile, isLoading } = useQuery<ProfileData>({ queryKey: [`/api/users/${username}/profile`] });

  useEffect(() => localStorage.setItem("dojo-publications", JSON.stringify(visible)), [visible]);
  const isSelf = profile?.relationship.isSelf;
  const canSee = profile && (!profile.isPrivate || profile.relationship.isFollowing || isSelf);

  const follow = useMutation({
    mutationFn: () => apiRequest(profile?.relationship.isFollowing ? "DELETE" : "POST", `/api/users/${profile?.id}/follow`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] }),
  });
  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/me/profile", { username: editUsername, bio: editBio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
      setEditing(false);
      if (editUsername !== profile?.username) window.location.href = `/social/${editUsername}`;
    },
  });

  const startEdit = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditBio(profile.bio || "");
    setEditing(true);
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: `@${profile?.username} on DojoOS`, url });
    else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Profile link copied" });
    }
  };

  if (isLoading) return <div className="mx-auto max-w-4xl space-y-8 p-6"><Skeleton className="h-36 w-full rounded-[22px]" /><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[1,2,3,4,5,6].map((item) => <Skeleton key={item} className="aspect-square rounded-[22px]" />)}</div></div>;
  if (!profile) return <div className="p-10 text-center">Profile not found.</div>;

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <header className="grid gap-6 border-b pb-8 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32">
            <AvatarImage src={profile.profileImageUrl || undefined} />
            <AvatarFallback className="text-2xl">{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {editing ? <Input value={editUsername} onChange={(event) => setEditUsername(event.target.value)} className="max-w-56 text-lg font-semibold" /> : <h1 className="text-2xl font-semibold tracking-[-.04em]">{profile.username}</h1>}
              {isSelf ? (
                editing ? <><Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}><Check className="mr-1.5 h-4 w-4" />Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></> :
                <Button size="sm" variant="outline" onClick={startEdit}><Settings2 className="mr-1.5 h-4 w-4" />Edit profile</Button>
              ) : (
                <Button size="sm" variant={profile.relationship.isFollowing ? "outline" : "default"} onClick={() => follow.mutate()}>
                  {profile.relationship.isFollowing ? <UserCheck className="mr-1.5 h-4 w-4" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
                  {profile.relationship.isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={share} aria-label="Share profile"><Share2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="More options"><MoreHorizontal className="h-4 w-4" /></Button>
            </div>
            <div className="mt-5 flex gap-7 text-sm">
              <span><strong>{isSelf ? visible.length : publications.length}</strong> publications</span>
              <span><strong>{profile.stats.followers}</strong> followers</span>
              <span><strong>{profile.stats.following}</strong> following</span>
            </div>
            {editing ? <Textarea value={editBio} onChange={(event) => setEditBio(event.target.value)} placeholder="Tell people what you are working on" className="mt-5 max-w-lg" /> : <p className="mt-5 max-w-lg whitespace-pre-line text-sm leading-6">{profile.bio || "No bio yet."}</p>}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">{profile.isPrivate ? <Lock className="h-3.5 w-3.5" /> : null}{profile.isPrivate ? "Private profile" : "Public profile"}</div>
          </div>
        </header>

        {editing ? <div className="flex items-center justify-between py-5"><div><h2 className="text-sm font-semibold">Published widgets</h2><p className="mt-1 text-xs text-muted-foreground">Choose what appears publicly. Tap a tile to show or hide it.</p></div><Button variant="ghost" size="sm" onClick={() => toast({ title: "Profile link copied" })}><Copy className="mr-1.5 h-4 w-4" />Copy link</Button></div> : <div className="py-5"><h2 className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Published progress</h2></div>}

        {!canSee ? (
          <div className="grid min-h-72 place-items-center text-center"><div><Lock className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-5 text-lg font-semibold">This profile is private</h2><p className="mt-2 text-sm text-muted-foreground">Follow @{profile.username} to see published widgets.</p></div></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {publications.map((item) => <Publication key={item.id} item={item} editing={editing} enabled={isSelf ? visible.includes(item.id) : true} onToggle={() => setVisible((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />)}
          </div>
        )}
      </div>
    </main>
  );
}
