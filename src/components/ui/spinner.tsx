import { Loader2 } from "lucide-react";
import { cn } from "./utils";
import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number; // Optional size prop
}

export function Spinner({ size = 24, className, ...props }: SpinnerProps) {
    return (
        <div
            className={cn("animate-spin text-primary", className)}
            style={{ width: size, height: size }}
            {...props}
        >
            <Loader2 size={size} />
        </div>
    );
}