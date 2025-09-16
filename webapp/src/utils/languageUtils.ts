// src/utils/languageUtils.ts
import i18n from 'i18next'; // Make sure to import i18next

let globalLanguage: string | null = null;

export const setGlobalLanguage = (language: string) => {
    globalLanguage = language;
    i18n.changeLanguage(language); // Change i18next language
    localStorage.setItem('appLanguage', language); // Store in localStorage
};

export const getGlobalLanguage = (): string => {
    if (!globalLanguage) {
        // If globalLanguage is not set, try to get it from localStorage
        const storedLanguage = localStorage.getItem('appLanguage');
        if (storedLanguage) {
            globalLanguage = storedLanguage;
        } else {
            // If not in localStorage, use browser language or default to 'en-US'
            globalLanguage = navigator.language || 'en-US';
        }
    }
    return globalLanguage;
};

export const initializeLanguage = () => {
    const language = getGlobalLanguage().toLocaleLowerCase();
    setGlobalLanguage(language);
};