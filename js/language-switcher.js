// js/language-switcher.js
document.addEventListener('DOMContentLoaded', function () {
    // Default language
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

    function applyTranslations(lang) {
        if (!siteTranslations || !siteTranslations[lang]) {
            console.warn(`Translations for language '${lang}' not found.`);
            return;
        }
        document.querySelectorAll('[data-translate-key]').forEach(element => {
            const key = element.getAttribute('data-translate-key');
            if (siteTranslations[lang][key]) {
                element.innerHTML = siteTranslations[lang][key]; // Use innerHTML to support basic HTML like &copy;
            } else {
                // Fallback to Turkish if key not found in current language, but exists in Turkish
                if (lang !== 'tr' && siteTranslations['tr'] && siteTranslations['tr'][key]) {
                    // console.warn(`Translation key '${key}' not found for '${lang}', using Turkish fallback.`);
                    // element.innerHTML = siteTranslations['tr'][key];
                } else {
                    console.warn(`Translation key '${key}' not found for language '${lang}' and no TR fallback.`);
                }
            }
        });
        // Update <html> lang attribute
        document.documentElement.lang = lang; // Standard is lowercase for lang attribute
    }

    function setLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        applyTranslations(lang);
        updateSwitcherUI(lang);

        // Dispatch a custom event when the language changes
        const langChangeEvent = new CustomEvent('languageChanged', { detail: { language: lang } });
        document.dispatchEvent(langChangeEvent);
    }

    function updateSwitcherUI(lang) {
        const enBtn = document.getElementById('lang-en');
        const trBtn = document.getElementById('lang-tr');
        if (enBtn && trBtn) {
            if (lang === 'en') {
                enBtn.classList.add('active');
                enBtn.style.fontWeight = 'bold'; // Example: bold for active
                trBtn.classList.remove('active');
                trBtn.style.fontWeight = 'normal';
            } else {
                trBtn.classList.add('active');
                trBtn.style.fontWeight = 'bold';
                enBtn.classList.remove('active');
                enBtn.style.fontWeight = 'normal';
            }
        }
    }

    // Expose setLanguage to global scope so inline HTML onclick can call it
    // This is not ideal, better to attach event listeners directly in this script if possible
    // For now, keeping it for compatibility with existing simple button onclicks.
    window.setSiteLanguage = setLanguage;

    // Attach event listeners to buttons if they exist
    const enBtn = document.getElementById('lang-en');
    const trBtn = document.getElementById('lang-tr');

    if (enBtn) {
        enBtn.addEventListener('click', () => setSiteLanguage('en'));
    }
    if (trBtn) {
        trBtn.addEventListener('click', () => setSiteLanguage('tr'));
    }

    // Initial translation application
    applyTranslations(currentLanguage);
    updateSwitcherUI(currentLanguage);
});
