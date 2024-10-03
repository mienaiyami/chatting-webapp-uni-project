import { useLayoutEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { setLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import useTokenStore from "@/store/token";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const schema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters" }),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters" }),
    avatar: z.instanceof(FileList).optional(),
});
type FormInputs = z.infer<typeof schema>;
export default function SignUp() {
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: zodResolver(schema),
    });

    const navigate = useNavigate();

    const userToken = useTokenStore((s) => s.token);
    useLayoutEffect(() => {
        if (userToken) navigate("/profile");
    }, [userToken, navigate]);
    const handleProfilePicUpload = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            const body = new FormData();
            body.append("email", data.email);
            body.append("username", data.username);
            body.append("password", data.password);
            if (data.avatar) {
                body.append("avatar", data.avatar[0]);
            }
            const response = await fetch("/api/signup", {
                method: "POST",
                // headers: {
                //     "Content-Type": "application/json",
                // },
                body,
            });
            const json = await response.json();
            console.log("json", json);
            if (!response.ok) {
                throw new Error(json.message);
            }
            if (json.token) {
                toast.success("Signed up successfully. Signing in...");
                localStorage.setItem("token", json.token);
                // navigate("/");
                window.location.href = "/";
            }
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            console.error("An unexpected error occurred:", error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen select-none">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Sign Up
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        id="signup-form"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                {...register("email")}
                                required
                            />
                            {errors.email && (
                                <p className="text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Choose a username"
                                {...register("username")}
                                required
                            />
                            {errors.username && (
                                <p className="text-red-500">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                {...register("password")}
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profilePic">Profile Picture</Label>
                            <Input
                                id="profilePic"
                                type="file"
                                accept="image/*"
                                {...register("avatar")}
                                onChange={handleProfilePicUpload}
                            />

                            {errors.avatar && (
                                <p className="text-red-500">
                                    {errors.avatar.message}
                                </p>
                            )}
                            {profilePic && (
                                <div className="mt-2 flex justify-center">
                                    <Avatar className="w-24 h-24">
                                        <AvatarImage
                                            src={profilePic}
                                            alt="Profile picture"
                                        />
                                        <AvatarFallback>UP</AvatarFallback>
                                    </Avatar>
                                </div>
                            )}
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button className="w-full" type="submit" form="signup-form">
                        Sign Up
                    </Button>
                    <p className="text-sm text-center">
                        Already have an account?{" "}
                        <Link
                            to="/signin"
                            className="text-blue-600 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
