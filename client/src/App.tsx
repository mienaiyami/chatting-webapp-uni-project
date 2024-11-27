import { Outlet } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "next-themes";

function App() {
    return (
        <ThemeProvider defaultTheme="system">
            <Toaster />
            <Outlet />
        </ThemeProvider>
    );
}

export default App;
