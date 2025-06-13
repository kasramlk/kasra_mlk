// js/simulator.js
// Uplift factors and constants
const upliftFactors = {
    ota: { adr: 0.05, occupancy: 0.10 },
    pricing: { adr: 0.10, occupancy: 0.05 },
    direct: { adr: 0.02, occupancy: 0.08 },
    reputation: { adr: 0.03, occupancy: 0.05 }
};
const MAX_OCCUPANCY = 0.95; // Represents 95%

// DOM Elements
let hotelTypeElement, numRoomsElement, currentOccupancyElement, currentADRElement;
let strategyOTAElement, strategyPricingElement, strategyDirectElement, strategyReputationElement;
let currentRevenueElement, potentialRevenueElement, upliftPercentageElement;
let currentOccupancyValueDisplay;

// Chart instance (optional)
let revenueChart = null;
let currentLanguage = 'tr'; // Default, will be updated

function getSimTranslation(key, replacements = {}) {
    // Ensure siteTranslations and currentLanguage are accessible
    let text = (siteTranslations && siteTranslations[currentLanguage] && siteTranslations[currentLanguage][key]) ? siteTranslations[currentLanguage][key] : key;
    for (const placeholder in replacements) {
        text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    }
    return text;
}

document.addEventListener('DOMContentLoaded', () => {
    hotelTypeElement = document.getElementById('hotelType');
    numRoomsElement = document.getElementById('numRooms');
    currentOccupancyElement = document.getElementById('currentOccupancy');
    currentOccupancyValueDisplay = document.getElementById('currentOccupancyValue');
    currentADRElement = document.getElementById('currentADR');

    strategyOTAElement = document.getElementById('strategyOTA');
    strategyPricingElement = document.getElementById('strategyPricing');
    strategyDirectElement = document.getElementById('strategyDirect');
    strategyReputationElement = document.getElementById('strategyReputation');

    currentRevenueElement = document.getElementById('currentRevenue');
    potentialRevenueElement = document.getElementById('potentialRevenue');
    upliftPercentageElement = document.getElementById('upliftPercentage');

    currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

    const inputs = [
        hotelTypeElement, numRoomsElement, currentOccupancyElement, currentADRElement,
        strategyOTAElement, strategyPricingElement, strategyDirectElement, strategyReputationElement
    ];

    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updateSimulator);
            if (input.type === 'checkbox' || input.type === 'select-one') { // Also trigger on change for these
                 input.addEventListener('change', updateSimulator);
            }
        }
    });

    document.addEventListener('languageChanged', function(event) {
        currentLanguage = event.detail.language;
        updateSimulator(); // Re-calculate and re-display everything with new language
    });

    updateSimulator();
});

function calculateRevenue(occupancyDecimal, adr, numRooms) {
    if (numRooms <= 0 || adr <= 0 || occupancyDecimal < 0) { // occupancyDecimal can be 0
        return 0;
    }
    return adr * numRooms * occupancyDecimal * 365;
}

function updateSimulator() {
    if (!currentOccupancyValueDisplay || !currentOccupancyElement || !currentRevenueElement || !potentialRevenueElement || !upliftPercentageElement) {
        // If any crucial element is missing, don't proceed
        return;
    }

    currentOccupancyValueDisplay.textContent = currentOccupancyElement.value + '%';

    const numRooms = parseInt(numRoomsElement.value) || 0;
    const currentOccupancyPercent = parseInt(currentOccupancyElement.value) || 0;
    const currentADR = parseFloat(currentADRElement.value) || 0;

    const currentOccupancyDecimal = currentOccupancyPercent / 100.0;

    const currentAnnualRevenue = calculateRevenue(currentOccupancyDecimal, currentADR, numRooms);
    currentRevenueElement.textContent = `€${currentAnnualRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let potentialADR = currentADR;
    let potentialOccupancyDecimal = currentOccupancyDecimal;

    if (strategyOTAElement.checked) {
        potentialADR *= (1 + upliftFactors.ota.adr);
        potentialOccupancyDecimal *= (1 + upliftFactors.ota.occupancy);
    }
    if (strategyPricingElement.checked) {
        potentialADR *= (1 + upliftFactors.pricing.adr);
        potentialOccupancyDecimal *= (1 + upliftFactors.pricing.occupancy);
    }
    if (strategyDirectElement.checked) {
        potentialADR *= (1 + upliftFactors.direct.adr);
        potentialOccupancyDecimal *= (1 + upliftFactors.direct.occupancy);
    }
    if (strategyReputationElement.checked) {
        potentialADR *= (1 + upliftFactors.reputation.adr);
        potentialOccupancyDecimal *= (1 + upliftFactors.reputation.occupancy);
    }

    if (potentialOccupancyDecimal > MAX_OCCUPANCY) {
        potentialOccupancyDecimal = MAX_OCCUPANCY;
    }
    if (potentialOccupancyDecimal < 0) { // Ensure it doesn't go below 0
        potentialOccupancyDecimal = 0;
    }

    const potentialAnnualRevenue = calculateRevenue(potentialOccupancyDecimal, potentialADR, numRooms);
    potentialRevenueElement.textContent = `€${potentialAnnualRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let upliftPercentageVal = 0;
    if (currentAnnualRevenue > 0) {
        upliftPercentageVal = ((potentialAnnualRevenue - currentAnnualRevenue) / currentAnnualRevenue) * 100;
    } else if (potentialAnnualRevenue > 0) {
        upliftPercentageVal = Infinity; // Represent as a very large improvement if starting from 0
    }

    if (upliftPercentageVal === Infinity) {
        upliftPercentageElement.textContent = getSimTranslation("sim-uplift-infinite") || "N/A (Huge Increase)"; // Or some other appropriate text
    } else {
        upliftPercentageElement.textContent = `${upliftPercentageVal.toFixed(1)}%`;
    }
    // Note: The surrounding text for these results ("Current Estimated Annual Revenue:", etc.)
    // is handled by data-translate-key attributes in the HTML. This script only updates the numbers/values.
}

// Optional: Placeholder for Chart.js update function
/*
function updateRevenueChart(current, potential) {
    // ... (Chart.js logic would also need to consider language for labels if any)
}
*/
