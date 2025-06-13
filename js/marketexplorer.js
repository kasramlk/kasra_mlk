document.addEventListener('DOMContentLoaded', () => {
    const regionCards = document.querySelectorAll('.region-card');
    const insightContents = document.querySelectorAll('.region-insight-content');
    const regionCardsContainer = document.getElementById('region-cards-container');
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';
    let currentlyDisplayedRegion = null; // To track which region's insights are visible

    if (!regionCards.length || !insightContents.length || !regionCardsContainer) {
        console.error('Essential elements for Market Explorer not found. Check HTML IDs and classes.');
        return;
    }

    function getTranslation(key, lang = currentLanguage) {
        return (siteTranslations && siteTranslations[lang] && siteTranslations[lang][key]) ? siteTranslations[lang][key] : key;
    }

    function populateInsights(region) {
        const insightContainer = document.getElementById(region + '-insights');
        if (!insightContainer) return;

        const titleElement = insightContainer.querySelector('h4');
        const listElement = insightContainer.querySelector('ul');
        const ctaButton = insightContainer.querySelector('a.btn');

        if (!titleElement || !listElement || !ctaButton) {
            console.error(`Missing elements within insight container for region: ${region}`);
            return;
        }

        // Update title
        titleElement.innerHTML = getTranslation(`mexp-${region}-insights-title`);

        // Clear previous insights
        listElement.innerHTML = '';

        // Populate new insights (assuming 4 insights per region as per translations.js structure)
        for (let i = 1; i <= 4; i++) {
            const insightKey = `mexp-${region}-insight${i}`;
            const insightText = getTranslation(insightKey);
            if (insightText !== insightKey) { // Only add if translation exists
                const listItem = document.createElement('li');
                listItem.innerHTML = insightText; // innerHTML to render potential <strong> tags etc.
                listElement.appendChild(listItem);
            }
        }
        // Update CTA button text
        ctaButton.innerHTML = getTranslation(`mexp-${region}-cta`);
    }


    regionCards.forEach(card => {
        card.addEventListener('click', () => {
            regionCards.forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');

            insightContents.forEach(content => {
                content.style.display = 'none';
            });

            const regionId = card.getAttribute('data-region');
            currentlyDisplayedRegion = regionId; // Track current region
            const targetInsightDiv = document.getElementById(regionId + '-insights');

            if (targetInsightDiv) {
                populateInsights(regionId); // Populate with current language
                targetInsightDiv.style.display = 'block';

                const insightsDisplayArea = document.getElementById('insights-display-area');
                if (insightsDisplayArea) {
                    insightsDisplayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                console.warn(`Insight content for region "${regionId}" not found.`);
            }
        });
    });

    document.addEventListener('languageChanged', function(event) {
        currentLanguage = event.detail.language;
        // Re-render static elements handled by language-switcher.js global selector
        // For dynamic content here, re-populate the currently visible insight section
        if (currentlyDisplayedRegion) {
            // Hide all first to ensure clean state if any other was visible
            insightContents.forEach(content => {
                content.style.display = 'none';
            });
            const targetInsightDiv = document.getElementById(currentlyDisplayedRegion + '-insights');
            if (targetInsightDiv) {
                 populateInsights(currentlyDisplayedRegion);
                 targetInsightDiv.style.display = 'block'; // Ensure it's visible after re-populating
            }
        }
    });
});
