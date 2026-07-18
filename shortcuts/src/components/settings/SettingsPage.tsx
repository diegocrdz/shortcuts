/**
 * General settings component
 */

type GeneralSettingsProps = {
    name: string;
    description: string;
    children: React.ReactNode;
};

export default function GeneralSettings({
    name,
    description,
    children,
}: GeneralSettingsProps) {
    return (
        <div className="flex flex-col w-full gap-8 p-8 overflow-auto">
            {/* Header */}
            <div className="flex flex-col jusitfy-center">
                <h2 className="text-md font-semibold">{name}</h2>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {/* Content */}
            {children}
        </div>
    );
}