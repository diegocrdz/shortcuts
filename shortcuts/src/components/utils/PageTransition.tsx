/**
* Motion page transition.
*/

import { motion } from "motion/react"
import { ReactNode } from "react"

type PageTransitionProps = {
    children: ReactNode;
    position?: "left" | "right";
};

export function PageTransition({
    children,
    position = "right",
}: PageTransitionProps) {
    const x = position === "left" ? "-20" : "20";

    return (
        <motion.div
            className="h-full overflow-hidden"
            initial={{ opacity: 0, x: x }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -x }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    )
}