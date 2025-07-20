import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import "./App.css";
import Home from "./pages/Home/Home";
import Layout from "./pages/Layout/Layout";
import NotFound from "./pages/NotFound/NotFound";
import Radio from "./pages/Radio/Radio";
import Debug from "./pages/Debug/Debug";

export default function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/radio" element={<Radio />} />
                        <Route path="/debug" element={<Debug />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}
