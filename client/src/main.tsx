import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import ErrorPage from "./error-page.tsx";
import ProfilePage from "./components/Profile.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { ThemeProvider } from "next-themes";

const router = createBrowserRouter([
    {
        element: (
            <ThemeProvider attribute="class" defaultTheme="system">
                <Outlet />
                <Toaster richColors duration={10000} />
            </ThemeProvider>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <App />,
            },
            {
                path: "/signin",
                element: <SignIn />,
            },
            {
                path: "/signup",
                element: <SignUp />,
            },
            {
                path: "/profile",
                element: <ProfilePage />,
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
