"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { EditProfileDialog } from "./EditProfileDialog";
import useUserDetailStore from "@/store/userDetails";
import AddContactDialog from "./AddContactDialog";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
    const [mounted, setMounted] = useState(false);
    const userDetails = useUserDetailStore((s) => s.userDetails);
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);
    if (!userDetails) {
        window.location.href = "/";
        // navigate("/");
    }
    if (!mounted || !userDetails) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <Card className="w-full max-w-xl">
                <CardHeader className="flex flex-col items-center space-y-2">
                    <Avatar className="w-24 h-24">
                        <AvatarImage
                            draggable={false}
                            src={userDetails.avatarUrl}
                            alt={userDetails.username}
                        />
                        <AvatarFallback>
                            {userDetails.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl font-bold">
                        {userDetails.username}
                    </CardTitle>
                    <p className="text-muted-foreground text-center">
                        {userDetails.email}
                    </p>
                </CardHeader>
                <CardFooter className="flex flex-wrap justify-center gap-2">
                    {/* <AddContactDialog /> */}
                    <EditProfileDialog />
                    <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            localStorage.removeItem("token");
                            fetch("/api/logout")
                                .then((e) => e.json())
                                .then((e) => {
                                    console.log(e);
                                })
                                .finally(() => {
                                    window.location.href = "/signin";
                                });
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
