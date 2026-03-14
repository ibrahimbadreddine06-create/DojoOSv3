
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface SearchResult {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isFollowing: boolean;
}

export function UserSearchDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Search Query
    const { data: users = [], isLoading } = useQuery<SearchResult[]>({
        queryKey: ["/api/users/search", query],
        queryFn: async () => {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: isOpen, // Search applies automatically
        staleTime: 0, // Always fresh search
    });

    // Follow Mutation
    const followMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiRequest("POST", `/api/users/${userId}/follow`, {});
        },
        onSuccess: (_, userId) => {
            // Invalidate both search results and following list
            queryClient.setQueryData(["/api/users/search", query], (old: SearchResult[] | undefined) => {
                if (!old) return [];
                return old.map(u => u.id === userId ? { ...u, isFollowing: true } : u);
            });
            queryClient.invalidateQueries({ queryKey: ["/api/me/following"] });

            toast({ title: "Followed user" });
        },
    });

    // Unfollow Mutation
    const unfollowMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiRequest("DELETE", `/api/users/${userId}/follow`, {});
        },
        onSuccess: (_, userId) => {
            queryClient.setQueryData(["/api/users/search", query], (old: SearchResult[] | undefined) => {
                if (!old) return [];
                return old.map(u => u.id === userId ? { ...u, isFollowing: false } : u);
            });
            queryClient.invalidateQueries({ queryKey: ["/api/me/following"] });

            toast({ title: "Unfollowed user" });
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground mb-4">
                    <Search className="h-4 w-4" />
                    <span>Find Fighters</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md h-[400px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Find Fellow Fighters</DialogTitle>
                </DialogHeader>

                <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by username or name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="flex-1 overflow-y-auto mt-4 space-y-2">
                    {isLoading && (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!isLoading && users.length === 0 && query.length >= 2 && (
                        <div className="text-center text-muted-foreground p-4 text-sm">
                            No fighters found.
                        </div>
                    )}

                    {!isLoading && query.length < 2 && (
                        <div className="text-center text-muted-foreground p-4 text-sm">
                            Type at least 2 characters to search.
                        </div>
                    )}

                    {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                            <Link href={`/social/${user.username}`} onClick={() => setIsOpen(false)}>
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <Avatar>
                                        <AvatarImage src={user.profileImageUrl || undefined} />
                                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-foreground">{user.username}</span>
                                        {(user.firstName || user.lastName) && (
                                            <span className="text-xs text-muted-foreground">
                                                {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            <Button
                                size="sm"
                                variant={user.isFollowing ? "secondary" : "default"}
                                className="h-8 gap-1"
                                disabled={followMutation.isPending || unfollowMutation.isPending}
                                onClick={() => {
                                    if (user.isFollowing) {
                                        unfollowMutation.mutate(user.id);
                                    } else {
                                        followMutation.mutate(user.id);
                                    }
                                }}
                            >
                                {user.isFollowing ? (
                                    <>
                                        <UserCheck className="h-3 w-3" />
                                        <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Following</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-3 w-3" />
                                        <span className="sr-only sm:not-sr-only sm:inline-block text-xs">Follow</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

