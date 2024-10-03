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
import { useLayoutEffect } from "react";
import useTokenStore from "@/store/token";

const schema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters" }),
});
type FormInputs = z.infer<typeof schema>;

export default function SignIn() {
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

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            const response = await fetch("/api/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.message || json.error);
            }
            if (json.token) {
                toast.success("Signed in successfully");
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
                        Sign In
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form id="signin-form" onSubmit={handleSubmit(onSubmit)}>
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
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button className="w-full" type="submit" form="signin-form">
                        Sign In
                    </Button>
                    <p className="text-sm text-center">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-blue-600 hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
