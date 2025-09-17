export interface SettingsProps {
    onBack: () => void;
}

export interface SettingsSection {
    id: string;
    label: string;
    icon: string;
}

export interface SettingsSectionProps {
    activeSection: string;
    onSettingChange?: (key: string, value: any) => void;
}

export type SettingsSectionId = 
    | 'general' 
    | 'storage' 
    | 'system' 
    | 'display' 
    | 'account' 
    | 'notifications' 
    | 'language' 
    | 'privacy';