import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, UserPlus, UserMinus, Shield, Trophy, Activity, Wallet, BookOpen, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
    id: string;
    username: string;
    bio: string | null;
    profileImageUrl: string | null;
    isPrivate: boolean;
    stats: {
        followers: number;
        following: number;
    };
    relationship: {
        isFollowing: boolean;
        isSelf: boolean;
    };
    modules: {
        goals: number;
    };
}

export default function ProfileView() {
    const { username } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const { toast } = useToast();

    const { data: profile, isLoading } = useQuery<ProfileData>({
        queryKey: [`/api/users/${username}/profile`],
    });

    const followMutation = useMutation({
        mutationFn: async () => {
            if (!profile) return;
            await apiRequest("POST", `/api/users/${profile.id}/follow`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            if (!profile) return;
            await apiRequest("DELETE", `/api/users/${profile.id}/follow`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("PATCH", "/api/me/profile", { username: editUsername, bio: editBio });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
            setIsEditing(false);
            if (editUsername !== profile?.username) {
                window.location.href = `/social/${editUsername}`;
            } else {
                toast({ title: "Profile updated successfully" });
            }
        },
        onError: (err: any) => {
            toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
        }
    });

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto p-4 space-y-8">
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center p-8">User not found</div>;
    }

    const isFollowing = profile.relationship.isFollowing;
    const isSelf = profile.relationship.isSelf;

    const startEditing = () => {
        setEditUsername(profile.username);
        setEditBio(profile.bio || "");
        setIsEditing(true);
    };

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={profile.profileImageUrl || undefined} />
                    <AvatarFallback className="text-2xl">{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="space-y-4 flex-1">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {isEditing ? (
                            <Input
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="text-xl font-bold max-w-[200px]"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold">{profile.username}</h1>
                        )}

                        {!isSelf && (
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                                disabled={followMutation.isPending || unfollowMutation.isPending}
                            >
                                {isFollowing ? (
                                    <><UserMinus className="mr-2 h-4 w-4" /> Unfollow</>
                                ) : (
                                    <><UserPlus className="mr-2 h-4 w-4" /> Follow</>
                                )}
                            </Button>
                        )}

                        {isSelf && !isEditing && (
                            <Button variant="outline" size="sm" onClick={startEditing}>
                                Edit Profile
                            </Button>
                        )}
                        {isSelf && isEditing && (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
                                    <Check className="w-4 h-4 mr-1" /> Save
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={updateProfileMutation.isPending}>
                                    <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-6 justify-center md:justify-start text-sm">
                        <div className="text-center">
                            <span className="font-bold block text-lg">{profile.stats.followers}</span>
                            <span className="text-muted-foreground">Followers</span>
                        </div>
                        <div className="text-center">
                            <span className="font-bold block text-lg">{profile.stats.following}</span>
                            <span className="text-muted-foreground">Following</span>
                        </div>
                    </div>

                    {isEditing ? (
                        <Textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Add a bio..."
                            className="max-w-md"
                        />
                    ) : (
                        <p className="max-w-md text-muted-foreground">
                            {profile.bio || "No bio yet."}
                        </p>
                    )}
                </div>
            </div>

            <hr className="border-border/50" />

            {/* Access Control Message */}
            {profile.isPrivate && !isFollowing && !isSelf ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-4">
                    <Lock className="h-12 w-12 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">This Account is Private</h3>
                    <p>Follow to see their shared modules.</p>
                </div>
            ) : (
                /* Content Grid - Bento Style */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Goals Module */}
                    <ModuleCard
                        title="Goals"
                        icon={Trophy}
                        count={profile.modules.goals}
                        label="Active Goals"
                    />
                    {/* Add other modules similarly once API supports them */}
                    <ModuleCard
                        title="Body"
                        icon={Activity}
                        count={null}
                        label="Coming Soon"
                        disabled
                    />
                    <ModuleCard
                        title="Finances"
                        icon={Wallet}
                        count={null}
                        label="Coming Soon"
                        disabled
                    />
                </div>
            )}
        </div>
    );
}

function ModuleCard({ title, icon: Icon, count, label, disabled }: any) {
    if (count === null && !disabled) return null; // Hidden by privacy

    return (
        <Card className={`h-full ${disabled ? 'opacity-50' : 'hover:border-primary/50 transition-colors cursor-pointer'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count ?? "-"}</div>
                <p className="text-xs text-muted-foreground">
                    {label}
                </p>
            </CardContent>
        </Card>
    )
}

