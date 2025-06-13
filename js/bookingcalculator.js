// js/bookingcalculator.js
// TODO: This file contains specific Booking.com logic.
// Ensure siteTranslations is loaded before this script.

let currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

// DOM Elements
const baseRate = document.getElementById('baseRate');
const geniusToggle = document.getElementById('geniusToggle');
const geniusValue = document.getElementById('geniusValue');
const mobileToggle = document.getElementById('mobileToggle');
const mobileValue = document.getElementById('mobileValue');
const countryToggle = document.getElementById('countryToggle');
const countryValue = document.getElementById('countryValue');
const campaignToggle = document.getElementById('campaignToggle');
const campaignValue = document.getElementById('campaignValue');
const basicToggle = document.getElementById('basicToggle');
const basicValue = document.getElementById('basicValue');
const lastMinToggle = document.getElementById('lastMinToggle');
const lastMinValue = document.getElementById('lastMinValue');
const earlyBookToggle = document.getElementById('earlyBookToggle');
const earlyBookValue = document.getElementById('earlyBookValue');
const deepToggle = document.getElementById('deepToggle');
const deepValue = document.getElementById('deepValue');

const finalRateOutput = document.getElementById('finalRateOutput');
const scenarioLabel = document.getElementById('scenarioLabel');
const scenarioNote = document.getElementById('scenarioNote');

function getCalcTranslation(key, replacements = {}) {
    let text = (siteTranslations && siteTranslations[currentLanguage] && siteTranslations[currentLanguage][key]) ? siteTranslations[currentLanguage][key] : key;
    for (const placeholder in replacements) {
        text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
    }
    return text;
}

document.addEventListener('DOMContentLoaded', () => {
    currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

    const allInputs = document.querySelectorAll('#geniusValue, #mobileValue, #countryValue, #campaignValue, #basicValue, #lastMinValue, #earlyBookValue, #deepValue, #baseRate, #geniusToggle, #mobileToggle, #countryToggle, #campaignToggle, #basicToggle, #lastMinToggle, #earlyBookToggle, #deepToggle');

    allInputs.forEach(el => {
        if (el) { // Check if element actually exists
            el.addEventListener('input', recalcAll);
            if (el.type === 'checkbox') {
                 el.addEventListener('change', recalcAll);
            }
        }
    });

    document.addEventListener('languageChanged', function(event) {
        currentLanguage = event.detail.language;
        recalcAll();
    });

    recalcAll(); // Initial calculation
});


function recalcAll() {
    if (!baseRate || !finalRateOutput || !scenarioLabel || !scenarioNote) {
        // If crucial elements are missing, don't proceed.
        // This can happen if script runs before DOM is fully ready for these specific elements.
        // The DOMContentLoaded listener should prevent this, but as a safeguard:
        // console.warn("Calculator elements not found, recalcAll aborted.");
        return;
    }

    let base = parseFloat(baseRate.value) || 0;

    if (allOff()) {
        finalRateOutput.textContent = '€' + base.toFixed(2);
        scenarioLabel.textContent = getCalcTranslation('bcalc-no-discount-active');
        scenarioNote.textContent = getCalcTranslation('bcalc-all-toggles-off');
        return;
    }

    let scenarioResults = [];

    scenarioResults.push(calcDeepScenario(base));
    scenarioResults.push(...calcSingleDiscountScenarios(base));
    scenarioResults.push(calcGeniusCampaignScenario(base));
    scenarioResults.push(calcGeniusTargetPortfolioScenario(base));
    scenarioResults.push(calcGeniusWithMobileCountry(base));
    scenarioResults.push(calcMobileCountryWithPortfolio(base));
    scenarioResults.push(calcGeniusWithPortfolio(base)); // This returns one best from its internal checks

    let valid = scenarioResults.filter(x => x.finalRate < Number.MAX_VALUE && x.finalRate >= 0);

    if (valid.length === 0) {
        finalRateOutput.textContent = '€' + base.toFixed(2);
        scenarioLabel.textContent = getCalcTranslation('bcalc-no-valid-scenario');
        scenarioNote.textContent = '';
    } else {
        let best = valid.reduce((acc, sc) => sc.finalRate < acc.finalRate ? sc : acc);
        finalRateOutput.textContent = '€' + best.finalRate.toFixed(2);
        scenarioLabel.textContent = best.label; // Already translated from helper
        scenarioNote.textContent = best.note; // Already translated from helper
    }
}

function calcDeepScenario(base) {
    if (!deepToggle || !deepToggle.checked) { // Check if toggle element exists
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    let dVal = parseFloat(deepValue.value) || 0;
    let finalRate = base * (1 - (dVal / 100));
    return {
        finalRate,
        label: getCalcTranslation('bcalc-scenario-label-deep-deal', { val: dVal }),
        note: getCalcTranslation('bcalc-scenario-note-deep-deal')
    };
}

function calcSingleDiscountScenarios(base) {
    let arr = [];
    const candidates = [
        { toggle: geniusToggle, valEl: geniusValue, nameKey: 'bcalc-name-genius' },
        { toggle: mobileToggle, valEl: mobileValue, nameKey: 'bcalc-name-mobile' },
        { toggle: countryToggle, valEl: countryValue, nameKey: 'bcalc-name-country' },
        { toggle: campaignToggle, valEl: campaignValue, nameKey: 'bcalc-name-campaign' },
        { toggle: basicToggle, valEl: basicValue, nameKey: 'bcalc-name-basic-portfolio' },
        { toggle: lastMinToggle, valEl: lastMinValue, nameKey: 'bcalc-name-lastmin-portfolio' },
        { toggle: earlyBookToggle, valEl: earlyBookValue, nameKey: 'bcalc-name-early-portfolio' }
    ];
    for (let item of candidates) {
        if (item.toggle && item.toggle.checked) { // Check if toggle element exists
            let disc = parseFloat(item.valEl.value) || 0;
            let price = base * (1 - (disc / 100));
            arr.push({
                finalRate: price,
                label: getCalcTranslation('bcalc-scenario-label-single-deal', { val: disc, name: getCalcTranslation(item.nameKey) }),
                note: getCalcTranslation('bcalc-scenario-note-single-active')
            });
        }
    }
    return arr;
}

function calcGeniusCampaignScenario(base) {
    if (!geniusToggle || !geniusToggle.checked || !campaignToggle || !campaignToggle.checked) {
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    let gVal = parseFloat(geniusValue.value) || 0;
    let cVal = parseFloat(campaignValue.value) || 0;
    let rate = base;
    if (gVal > 0) rate *= (1 - (gVal / 100));
    if (cVal > 0) rate *= (1 - (cVal / 100));
    return {
        finalRate: rate,
        label: getCalcTranslation('bcalc-scenario-label-booking-genius-campaign', { gVal: gVal, cVal: cVal }),
        note: getCalcTranslation('bcalc-scenario-note-booking-genius-campaign')
    };
}

function calcGeniusTargetPortfolioScenario(base) {
    let pVals = [];
    if (basicToggle && basicToggle.checked) pVals.push(parseFloat(basicValue.value) || 0);
    if (lastMinToggle && lastMinToggle.checked) pVals.push(parseFloat(lastMinValue.value) || 0);
    if (earlyBookToggle && earlyBookToggle.checked) pVals.push(parseFloat(earlyBookValue.value) || 0);
    let maxP = (pVals.length > 0) ? Math.max(...pVals) : 0;

    let gOn = geniusToggle && geniusToggle.checked;
    let gVal = gOn ? (parseFloat(geniusValue.value) || 0) : 0;

    let tVal = 0;
    if (mobileToggle && mobileToggle.checked) tVal = Math.max(tVal, parseFloat(mobileValue.value) || 0);
    if (countryToggle && countryToggle.checked) tVal = Math.max(tVal, parseFloat(countryValue.value) || 0);

    if (!gOn || maxP === 0 || tVal === 0) {
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    let rate = base * (1 - (gVal / 100)) * (1 - (tVal / 100)) * (1 - (maxP / 100));
    return {
        finalRate: rate,
        label: getCalcTranslation('bcalc-scenario-label-booking-genius-target-portfolio', { gVal: gVal, tVal: tVal, pVal: maxP }),
        note: getCalcTranslation('bcalc-scenario-note-booking-genius-target-portfolio')
    };
}

function calcGeniusWithMobileCountry(base) {
    if (!geniusToggle || !geniusToggle.checked || (!mobileToggle || !mobileToggle.checked) && (!countryToggle || !countryToggle.checked)) {
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    let gVal = parseFloat(geniusValue.value) || 0;
    let tVal = 0;
    if (mobileToggle && mobileToggle.checked) tVal = parseFloat(mobileValue.value) || 0;
    if (countryToggle && countryToggle.checked) tVal = Math.max(tVal, parseFloat(countryValue.value) || 0);

    if (tVal === 0) return { finalRate: Number.MAX_VALUE, label: '', note: '' }; // Need at least one targeting

    let rate = base * (1 - (gVal / 100)) * (1 - (tVal / 100));
    return {
        finalRate: rate,
        label: getCalcTranslation('bcalc-scenario-label-booking-genius-mobile-country', { gVal: gVal, tVal: tVal }),
        note: getCalcTranslation('bcalc-scenario-note-booking-genius-mobile-country')
    };
}

function calcMobileCountryWithPortfolio(base) {
    let tVal = 0;
    if (mobileToggle && mobileToggle.checked) tVal = parseFloat(mobileValue.value) || 0;
    if (countryToggle && countryToggle.checked) tVal = Math.max(tVal, parseFloat(countryValue.value) || 0);

    let pVals = [];
    if (basicToggle && basicToggle.checked) pVals.push(parseFloat(basicValue.value) || 0);
    if (lastMinToggle && lastMinToggle.checked) pVals.push(parseFloat(lastMinValue.value) || 0);
    if (earlyBookToggle && earlyBookToggle.checked) pVals.push(parseFloat(earlyBookValue.value) || 0);
    let maxP = (pVals.length > 0) ? Math.max(...pVals) : 0;

    if (tVal === 0 || maxP === 0) {
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    let rate = base * (1 - (tVal / 100)) * (1 - (maxP / 100));
    return {
        finalRate: rate,
        label: getCalcTranslation('bcalc-scenario-label-booking-mobile-country-portfolio', { tVal: tVal, pVal: maxP }),
        note: getCalcTranslation('bcalc-scenario-note-booking-mobile-country-portfolio')
    };
}

function calcGeniusWithPortfolio(base) {
    if (!geniusToggle || !geniusToggle.checked) {
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    let gVal = parseFloat(geniusValue.value) || 0;
    let portfolioResults = [];

    const portfolioDeals = [
        { toggle: basicToggle, valEl: basicValue, nameKey: 'bcalc-name-basic-portfolio', noteKey: 'bcalc-scenario-note-booking-genius-basic', labelKey: 'bcalc-scenario-label-booking-genius-basic' },
        { toggle: lastMinToggle, valEl: lastMinValue, nameKey: 'bcalc-name-lastmin-portfolio', noteKey: 'bcalc-scenario-note-booking-genius-lastmin', labelKey: 'bcalc-scenario-label-booking-genius-lastmin' },
        { toggle: earlyBookToggle, valEl: earlyBookValue, nameKey: 'bcalc-name-early-portfolio', noteKey: 'bcalc-scenario-note-booking-genius-early', labelKey: 'bcalc-scenario-label-booking-genius-early' }
    ];

    for (let item of portfolioDeals) {
        if (item.toggle && item.toggle.checked) {
            let pVal = parseFloat(item.valEl.value) || 0;
            let rate = base * (1 - (gVal / 100)) * (1 - (pVal / 100));
            portfolioResults.push({
                finalRate: rate,
                label: getCalcTranslation(item.labelKey, { gVal: gVal, pVal: pVal }),
                note: getCalcTranslation(item.noteKey)
            });
        }
    }
    if (portfolioResults.length === 0) {
        return { finalRate: Number.MAX_VALUE, label: '', note: '' };
    }
    return portfolioResults.reduce((best, current) => current.finalRate < best.finalRate ? current : best);
}

function allOff() {
    const toggles = [
        geniusToggle, mobileToggle, countryToggle, campaignToggle,
        basicToggle, lastMinToggle, earlyBookToggle, deepToggle
    ];
    return toggles.every(t => !t || !t.checked); // Check if toggle exists
}

// No initial recalcAll() here, it's called after DOMContentLoaded.
// The listeners will handle subsequent calls.
