import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, UserPlus, UserCheck, Users, ShieldCheck, Focus, Clock3, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

type Person = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
};

const focusProfiles = [
  { name: "Deep work", schedule: "Weekdays · 09:00–11:00", blocks: "Social, video and news", color: "#2563eb" },
  { name: "Evening reset", schedule: "Daily · 21:30–07:00", blocks: "All except essentials", color: "#7c3aed" },
];

function PersonRow({ person }: { person: Person }) {
  const queryClient = useQueryClient();
  const follow = useMutation({
    mutationFn: () => apiRequest(person.isFollowing ? "DELETE" : "POST", `/api/users/${person.id}/follow`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/search"] }),
  });
  const displayName = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/social/${person.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={person.profileImageUrl || undefined} />
          <AvatarFallback>{person.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#18202a]">{person.username}</p>
          <p className="truncate text-xs text-muted-foreground">{displayName || person.bio || "Dojo member"}</p>
        </div>
      </Link>
      <Button size="sm" variant={person.isFollowing ? "outline" : "default"} onClick={() => follow.mutate()} disabled={follow.isPending}>
        {person.isFollowing ? <UserCheck className="mr-1.5 h-4 w-4" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
        {person.isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}

export default function Social() {
  const [query, setQuery] = useState("");
  const normalized = query.trim();
  const { data: people = [], isFetching } = useQuery<Person[]>({
    queryKey: ["/api/users/search", normalized],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(normalized)}`);
      return response.json();
    },
    staleTime: 15_000,
  });
  const filtered = useMemo(() => people.slice(0, 20), [people]);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
        <header className="mb-8 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">People</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] text-[#18202a]">Your circle</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Find people, share progress deliberately and manage accountability without exposing your private life by default.</p>
        </header>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
            {[
              ["discover", "Discover"],
              ["connections", "Connections"],
              ["accountability", "Accountability"],
              ["focus", "Focus profiles"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-[#18202a] data-[state=active]:bg-transparent data-[state=active]:shadow-none">{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="discover" className="space-y-5">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people by name or username" className="h-12 rounded-2xl pl-11" />
            </div>
            <section className="max-w-2xl divide-y">
              {isFetching ? <p className="py-8 text-sm text-muted-foreground">Searching…</p> : filtered.length ? filtered.map((person) => <PersonRow key={person.id} person={person} />) : <p className="py-8 text-sm text-muted-foreground">{normalized ? "No people found." : "Search for someone you know."}</p>}
            </section>
          </TabsContent>

          <TabsContent value="connections">
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/profile" className="group rounded-[22px] border bg-card p-5">
                <Users className="h-6 w-6 text-[#2563eb]" />
                <h2 className="mt-8 text-lg font-semibold">Following and followers</h2>
                <p className="mt-1 text-sm text-muted-foreground">Review the people connected to your profile.</p>
                <ChevronRight className="mt-5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="rounded-[22px] border bg-card p-5">
                <ShieldCheck className="h-6 w-6 text-[#20a65a]" />
                <h2 className="mt-8 text-lg font-semibold">Private by design</h2>
                <p className="mt-1 text-sm text-muted-foreground">Only widgets you explicitly publish appear on your public profile.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accountability">
            <div className="max-w-2xl rounded-[22px] border bg-card p-6">
              <ShieldCheck className="h-7 w-7 text-[#7c3aed]" />
              <h2 className="mt-6 text-xl font-semibold">No accountability partners yet</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Choose a trusted connection, then grant only the planner, goal and override information they genuinely need.</p>
              <Button className="mt-6" onClick={() => (document.querySelector('[data-state="inactive"][value="discover"]') as HTMLElement | null)?.click()}>Find a trusted person</Button>
            </div>
          </TabsContent>

          <TabsContent value="focus">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                {focusProfiles.map((profile) => (
                  <div key={profile.name} className="flex items-center gap-4 rounded-[22px] border bg-card p-5">
                    <span className="h-11 w-2 rounded-full" style={{ backgroundColor: profile.color }} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{profile.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{profile.schedule}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{profile.blocks}</p>
                    </div>
                    <Clock3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <aside className="rounded-[22px] bg-[#18202a] p-6 text-white">
                <Focus className="h-6 w-6" />
                <h2 className="mt-8 text-lg font-semibold">Device connection required</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">The web app can plan focus. Enforcing app and website blocks requires the future Dojo device companion.</p>
                <Button variant="secondary" className="mt-6 w-full" disabled>Connect device</Button>
              </aside>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
