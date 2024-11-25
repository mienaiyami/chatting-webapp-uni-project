import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import useUserDetailStore from "@/store/userDetails";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const schema = z.object({
    username: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z
            .string()
            .min(3, { message: "Username must be at least 3 characters" })
            .optional()
    ),
    password: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z
            .string()
            .min(6, { message: "Password must be at least 6 characters" })
            .optional()
    ),
    avatar: z.instanceof(FileList).optional(),
});
type FormInputs = z.infer<typeof schema>;

export function EditProfileDialog() {
    const { userDetails, setUserDetails } = useUserDetailStore((s) => ({
        userDetails: s.userDetails!,
        setUserDetails: s.setUserDetails,
    }))!;
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormInputs>({
        resolver: zodResolver(schema),
        defaultValues: {
            username: userDetails.username,
        },
    });

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
            if (data.username) body.append("username", data.username);
            if (data.password) body.append("password", data.password);
            if (data.avatar) body.append("avatar", data.avatar[0]);
            const response = await fetch("/api/updateProfile", {
                method: "POST",
                headers: {
                    // "Content-Type": "application/json",
                    // Authorization: `Bearer ${userToken}`,
                },
                body,
                // body: JSON.stringify(data),
            });
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.message || json.error);
            }
            toast.success("Profile updated successfully");
            reset();
            setUserDetails(json.user);
            setIsOpen(false);
        } catch (error) {
            console.error("An unexpected error occurred:", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Username
                            </Label>
                            <Input
                                id="username"
                                placeholder="Leave blank to keep the same"
                                {...register("username")}
                                className="col-span-3"
                            />
                            {errors.username && (
                                <p className="text-red-500 col-span-4">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Leave blank to keep the same"
                                {...register("password")}
                                className="col-span-3"
                            />
                            {errors.password && (
                                <p className="text-red-500 col-span-4">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="avatar" className="text-right">
                                Avatar
                            </Label>
                            <Input
                                id="avatar"
                                type="file"
                                {...register("avatar")}
                                className="col-span-3"
                                onChange={handleProfilePicUpload}
                            />
                            {errors.avatar && (
                                <p className="text-red-500 col-span-4">
                                    {errors.avatar.message}
                                </p>
                            )}
                        </div>
                        <div>
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
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
