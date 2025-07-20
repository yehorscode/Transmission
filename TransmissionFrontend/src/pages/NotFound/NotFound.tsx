import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export default function NotFound() {
    const location = useLocation();
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-screen">
            <h1 className="text-9xl font-bold mx-auto animate-caret-blink text-red-500">404</h1>
            <span className="font-mono">Page <span className="font-bold">{location.pathname}</span> not found</span>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/'}>
                Go home
            </Button>
        </div>
    )
}