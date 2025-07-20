import { Outlet, Link } from "react-router-dom";
// import { Button } from "@/components/ui/button"
// import { useTheme } from "@/components/theme-provider"

export default function Layout() {
    // const { theme, setTheme } = useTheme()
    // const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

    return (
        <div className="flex flex-col h-full">
            <nav className="bg-white/40 text-white/80 p-2">
                <div className="flex items-center justify-between">
                    <div className="gap-4 flex">
                        <Link to="/" className="font-mono">
                            Transmission
                        </Link>
                        <Link to="/radio" className="font-mono">
                            Receiver (radio)
                        </Link>
                        <Link to="/transmit" className="font-mono">
                            Transmit
                        </Link>
                        <Link to="/schedule" className="font-mono">
                            Schedule
                        </Link>
                        
                    </div>

                    {/* <Button onClick={toggleTheme}>Toggle Theme</Button> */}
                </div>
            </nav>
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
}
