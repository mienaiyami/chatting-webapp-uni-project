import { scan } from "react-scan";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import ErrorPage from "./error-page.tsx";
import ProfilePage from "./components/Profile.tsx";
import ChatApp from "./components/Chat.tsx";
import { Route } from "react-router-dom";

// if (typeof window !== "undefined") {
//     scan({
//         enabled: true,
//         log: true,
//     });
// }

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {/* <RouterProvider router={router} /> */}
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<ChatApp />} />
                    <Route path="signin" element={<SignIn />} />
                    <Route path="signup" element={<SignUp />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="*" element={<ErrorPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
