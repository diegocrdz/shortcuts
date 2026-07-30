/**
 * Onboarding page for first-time users.
 * This page is shown when the app is launched for the first time
 */

import { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { scanGames } from "@/lib/api/scanner";
import { Shortcut } from "@/types";
import { Button } from "@/components/ui/button";
import { PartyPopper, ArrowRight, RefreshCcw, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const TOTAL_STEPS = 3; // Total number of steps in the onboarding process

const STEP_VARIANTS = {
    enter: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? 24 : -24,
    }),
    center: {
        opacity: 1,
        x: 0,
    },
    exit: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? -24 : 24,
    }),
};

/**
 * Step indicator for the onboarding process
 * @param {number} stepNumber - The step number (1, 2, 3, ...)
 * @param {number} currentStep - The current step the user is on
 */
const Step = ({ stepNumber, currentStep }: { stepNumber: number; currentStep: number }) => (
    <div
        className={`w-2 h-2 rounded-full flex items-center justify-center ${
            currentStep >= stepNumber ? "bg-brand" : "bg-primary/50"
        }`}
    />
);

/**
 * Steps indicator for the onboarding process
 * @param {number} currentStep - The current step the user is on
 * @param {number} totalSteps - The total number of steps in the onboarding process
 */
const StepsIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
            <Step key={i} stepNumber={i + 1} currentStep={currentStep} />
        ))}
    </div>
);

/**
 * Layout for each step in the onboarding process
 * @param {React.ReactNode} icon - The icon to display for the step
 * @param {string} title - The title of the step
 * @param {string} description - The description of the step
 * @param {React.ReactNode} actions - The actions (buttons) for the step
 */
const StepLayout = ({
    icon,
    title,
    description,
    content,
    actions,
}: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    content?: React.ReactNode;
    actions: React.ReactNode;
}) => (
    <div className="flex flex-col items-center gap-6 w-full">
        {/* Icon */}
        <div className="flex items-center justify-center h-24 w-24">
            {icon}
        </div>

        {/* Title and description */}
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Content */}
        {content && (
            <div className="w-full max-w-md max-h-[20vh] overflow-y-auto">
                {content}
            </div>
        )}

        {/* Actions */}
        <div className="w-full max-w-md flex justify-center gap-4">
            {actions}
        </div>
    </div>
);

interface OnboardingProps {
    onFinish: () => void;
}

/**
 * Onboarding component that guides the user through the initial setup process.
 * @param {function} onFinish - Callback function to be called when the onboarding is finished
 */
export default function Onboarding({
    onFinish
}: OnboardingProps) {
    const { t } = useTranslation();
    const [[step, direction], setStep] = useState<[number, number]>([1, 1]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanCompleted, setScanCompleted] = useState(false);
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

    function goToStep(newStep: number) {
        setStep([newStep, newStep > step ? 1 : -1]);
    }

    async function handleScanGames() {
        setIsScanning(true);
        try {
            const updatedShortcuts = await scanGames(shortcuts);
            setShortcuts(updatedShortcuts);
            setScanCompleted(true);
            goToStep(step + 1); // Move to the next step
        } catch (error) {
            console.error("Error scanning games:", error);
        }
        setIsScanning(false);
    }

    return (
        <div className="flex flex-col items-center justify-start h-full gap-8 p-8">
            {/* Step indicator */}
            <StepsIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

            {/* Step content */}
            <div className="flex flex-col items-center justify-center h-full w-full gap-8">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={STEP_VARIANTS}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                        className="w-full flex flex-col items-center justify-center gap-8"
                    >
                        {step === 1 && (
                            <StepLayout
                                icon={<img src="/icon.png" alt="Shortcuts Logo" className="w-24 h-24" />}
                                title={t("onboarding.step1.title")}
                                description={t("onboarding.step1.description")}
                                actions={
                                    <Button onClick={() => goToStep(2)}>
                                        {t("onboarding.actions.start")}
                                        <PartyPopper />
                                    </Button>
                                }
                            />
                        )}
                        {step === 2 && (
                            <StepLayout
                                icon={
                                    <div className="w-24 h-24 text-primary bg-brand p-4 rounded-full flex items-center justify-center">
                                        <RefreshCcw className="w-20 h-20 text-white" />
                                    </div>
                                }
                                title={t("onboarding.step2.title")}
                                description={t("onboarding.step2.description")}
                                actions={
                                    <>
                                        <Button onClick={() => goToStep(3)} variant="outline">
                                            {t("onboarding.actions.skip")}
                                            <ArrowRight />
                                        </Button>
                                        <Button onClick={handleScanGames} disabled={isScanning}>
                                            {t("onboarding.actions.sync")}
                                            <RefreshCcw />
                                        </Button>
                                    </>
                                }
                            />
                        )}
                        {step === 3 && (
                            <StepLayout
                                icon={
                                    <div className="w-24 h-24 text-primary bg-brand p-4 rounded-full flex items-center justify-center">
                                        <Check className="w-20 h-20 text-white" />
                                    </div>
                                }
                                title={t("onboarding.step3.title")}
                                description={t("onboarding.step3.description", { count: shortcuts.length })}
                                content={
                                    <ul className="flex flex-col gap-1 text-sm">
                                        {scanCompleted && shortcuts.length > 0 ? (
                                            shortcuts.map((s) => (
                                                <li key={s.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-muted/50">
                                                    <div className="flex items-center gap-2">
                                                        {s.icon_path ? (
                                                            <img src={convertFileSrc(s.icon_path)} alt={s.name} className="w-6 h-6 rounded" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded bg-muted" />
                                                        )}
                                                        <span className="truncate">{s.name}</span>
                                                    </div>
                                                    <Check className="w-4 h-4 text-brand shrink-0" />
                                                </li>
                                            ))
                                        ) : scanCompleted && shortcuts.length === 0 ? (
                                            <li className="px-2 py-1 rounded bg-muted/50">
                                                {t("onboarding.actions.noShortcuts")}
                                            </li>
                                        ) : null}
                                    </ul>
                                }
                                actions={
                                    <Button onClick={onFinish}>
                                        {t("onboarding.actions.finish")}
                                        <ArrowRight />
                                    </Button>
                                }
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}