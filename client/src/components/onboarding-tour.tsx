import React, { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

export function OnboardingTour() {
    const [run, setRun] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Check if user has already seen the tour
        const hasCompleted = localStorage.getItem("dojo_onboarding_completed");
        if (!hasCompleted) {
            // Small delay to let the UI render before starting tour
            const timer = setTimeout(() => {
                setRun(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem("dojo_onboarding_completed", "true");
        }
    };

    const steps: Step[] = [
        {
            target: "body",
            placement: "center",
            title: "Welcome to DojoOS",
            content: "This is your personal operating system for discipline and learning. Let's take a quick tour to get you acquainted with the platform.",
            disableBeacon: true,
        },
        {
            target: ".layout",
            title: "Your Dashboard",
            content: "This is your command center. These modules give you a high-level overview of your progress across all areas of your life.",
            placement: "bottom",
        },
        {
            target: "#tour-customize-btn",
            title: "Make It Yours",
            content: "Click 'Customize' to unlock your dashboard. You can drag cards to reorder them, change the grid layouts, and paint your modules with custom themes!",
            placement: "bottom-end",
        },
        {
            target: "[data-testid=\"sidebar-main\"]",
            title: "Main Navigation",
            content: "The sidebar is your map. Access all your core modules, check out what's coming soon, and hit 'Find Friends' to connect with others on the journey.",
            placement: "right",
        },
        {
            target: "[data-testid=\"link-public-profile\"]",
            title: "Your Identity",
            content: "Your public profile showcases your journey. You can customize your bio and see your followers here. That's it, you're ready to start building discipline!",
            placement: "top",
        }
    ];

    if (!isClient) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            hideCloseButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: "hsl(var(--primary))",
                    textColor: "hsl(var(--popover-foreground))",
                    backgroundColor: "hsl(var(--popover))",
                    arrowColor: "hsl(var(--popover))",
                    overlayColor: "rgba(0, 0, 0, 0.6)",
                },
                tooltipContainer: {
                    textAlign: "left",
                    fontSize: "14px",
                    maxWidth: "calc(100vw - 32px)", /* Prevent cutoff on small mobile edges */
                },
                tooltipTitle: {
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "8px",
                },
                buttonNext: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                },
                buttonBack: {
                    color: "hsl(var(--muted-foreground))",
                    marginRight: "8px",
                },
                buttonSkip: {
                    color: "hsl(var(--muted-foreground))",
                    fontSize: "14px",
                }
            }}
        />
    );
}

