// Shared by the Settings page (server) and SettingsTabs (client). A 'use client' module can only
// export components to the server, so the tab names live here.
export const SETTINGS_TABS = ['profile', 'claude'] as const
export type SettingsTab = (typeof SETTINGS_TABS)[number]
