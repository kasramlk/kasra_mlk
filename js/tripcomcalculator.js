// js/tripcomcalculator.js
let currentLanguage = localStorage.getItem('preferredLanguage') || 'tr'; // Ensure this is at the top

// TODO: Finalize Trip.com promo names, categories, actual fixed discount percentages, and stacking rules.
const tripcomPromoGroups = {
    group1: [ // General Promotions - Trip.com Examples
        { id: 'g1_none', nameKey: 'tcalc-g1-none-label', defaultPercent: 0, type: 'radio', groupName: 'group1' },
        { id: 'g1_basic', nameKey: 'tcalc-g1-basic-label', inputId: 'g1_basic_percent', defaultPercent: 8, type: 'radio', groupName: 'group1' },
        { id: 'g1_early', nameKey: 'tcalc-g1-early-label', inputId: 'g1_early_percent', defaultPercent: 10, type: 'radio', groupName: 'group1' },
        { id: 'g1_lastmin', nameKey: 'tcalc-g1-lastmin-label', inputId: 'g1_lastmin_percent', defaultPercent: 12, type: 'radio', groupName: 'group1' },
        { id: 'g1_minstay', nameKey: 'tcalc-g1-minstay-label', inputId: 'g1_minstay_percent', defaultPercent: 7, type: 'radio', groupName: 'group1' }
    ],
    group2: [ // Channel-Specific - Trip.com Examples
        { id: 'g2_none', nameKey: 'tcalc-g2-none-label', defaultPercent: 0, type: 'radio', groupName: 'group2' },
        { id: 'g2_mobile', nameKey: 'tcalc-g2-mobile-label', inputId: 'g2_mobile_percent', defaultPercent: 10, type: 'radio', groupName: 'group2' },
        { id: 'g2_geotarget', nameKey: 'tcalc-g2-geotarget-label', inputId: 'g2_geotarget_percent', defaultPercent: 9, type: 'radio', groupName: 'group2' }
    ],
    group3: [ // Package Deals - Trip.com Examples
        { id: 'g3_none', nameKey: 'tcalc-g3-none-label', defaultPercent: 0, type: 'radio', groupName: 'group3' },
        { id: 'g3_package1', nameKey: 'tcalc-g3-package1-label', inputId: 'g3_package1_percent', defaultPercent: 15, type: 'radio', groupName: 'group3' }
    ],
    group4: [ // Campaigns - Trip.com Examples
        { id: 'g4_none', nameKey: 'tcalc-g4-none-label', defaultPercent: 0, type: 'radio', groupName: 'group4' },
        { id: 'g4_campaign1', nameKey: 'tcalc-g4-campaign1-label', inputId: 'g4_campaign1_percent', defaultPercent: 18, type: 'radio', groupName: 'group4' }
    ],
    // Trip.com specific programs - values are placeholders
    group5: { id: 'g5_member', nameKey: 'tcalc-g5-member-label', fixedPercent: 6, type: 'checkbox', groupName: 'group5' },      // Trip.com Member Price
    group6: { id: 'g6_tripcoins', nameKey: 'tcalc-g6-tripcoins-label', fixedPercent: 4, type: 'checkbox', groupName: 'group6' },// Trip Coins related bonus
    group7: { id: 'g7_flashdeal', nameKey: 'tcalc-g7-flashdeal-label', fixedPercent: 20, type: 'checkbox', groupName: 'group7' } // Trip.com Flash Deal
};

// Stacking Rules Matrix (7x7 for G1 to G7) - Assuming similar logic for now
// TODO: Verify and update Trip.com's actual stacking rules. This is a placeholder.
const stackingMatrix = [
//   G1     G2     G3     G4     G5     G6     G7
    [false, false, false, false, true,  true,  true ], // G1
    [false, false, false, false, true,  true,  true ], // G2
    [false, false, false, false, true,  true,  true ], // G3
    [false, false, false, false, true,  true,  true ], // G4
    [true,  true,  true,  true,  false, true,  true ], // G5
    [true,  true,  true,  true,  true,  false, true ], // G6
    [true,  true,  true,  true,  true,  true,  false]  // G7
];
const groupKeys = ['group1', 'group2', 'group3', 'group4', 'group5', 'group6', 'group7'];


function getCalcTranslation(key, replacements = {}) {
    let translation = siteTranslations[currentLanguage]?.[key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return translation;
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    recalcAll(); // Initial calculation
});

document.addEventListener('languageChanged', function(event) {
    currentLanguage = event.detail.language;
    recalcAll(); // Recalculate and update text
});

function setupEventListeners() {
    document.getElementById('baseRate').addEventListener('input', recalcAll);

    groupKeys.forEach(groupKey => {
        const group = tripcomPromoGroups[groupKey]; // Use tripcomPromoGroups
        if (Array.isArray(group)) { // Radio groups
            group.forEach(promo => {
                const radioElement = document.getElementById(promo.id);
                if (radioElement) {
                    radioElement.addEventListener('change', recalcAll);
                }
                if (promo.inputId) {
                    const inputElement = document.getElementById(promo.inputId);
                    if (inputElement) {
                        inputElement.addEventListener('input', recalcAll);
                    }
                }
            });
        } else { // Checkbox groups
            const checkboxElement = document.getElementById(group.id); // IDs g5_member, g6_tripcoins, g7_flashdeal
            if (checkboxElement) {
                checkboxElement.addEventListener('change', recalcAll);
            }
        }
    });

    // Logic to disable/enable percentage inputs based on radio selection
    ['group1', 'group2', 'group3', 'group4'].forEach(groupKeyName => {
        const groupArray = tripcomPromoGroups[groupKeyName]; // Use tripcomPromoGroups
        groupArray.forEach(promo => {
            const radioEl = document.getElementById(promo.id);
            if (!radioEl) return;

            if (promo.id.endsWith('_none')) {
                radioEl.addEventListener('change', () => {
                    if (radioEl.checked) {
                        groupArray.forEach(p => {
                            if (p.inputId) document.getElementById(p.inputId).disabled = true;
                        });
                        recalcAll();
                    }
                });
                if(radioEl.checked) { // Initial state
                    groupArray.forEach(p => { if (p.inputId) document.getElementById(p.inputId).disabled = true; });
                }
            } else if (promo.inputId) {
                const inputEl = document.getElementById(promo.inputId);
                if (inputEl) {
                    radioEl.addEventListener('change', () => {
                        if (radioEl.checked) {
                             groupArray.forEach(p => {
                                if (p.inputId && p.id !== promo.id) document.getElementById(p.inputId).disabled = true;
                            });
                            inputEl.disabled = false;
                        }
                        recalcAll();
                    });
                    inputEl.disabled = !radioEl.checked;
                }
            } else {
                 radioEl.addEventListener('change', recalcAll);
            }
        });
    });
}


function getSelectedPromotions() {
    const selected = [];
    groupKeys.forEach(groupKey => {
        const groupConfig = tripcomPromoGroups[groupKey]; // Use tripcomPromoGroups
        if (Array.isArray(groupConfig)) {
            const selectedRadio = groupConfig.find(promo => {
                const el = document.getElementById(promo.id);
                return el && el.checked;
            });
            if (selectedRadio && selectedRadio.id.indexOf('_none') === -1) {
                let percent = selectedRadio.defaultPercent;
                if (selectedRadio.inputId) {
                    const inputEl = document.getElementById(selectedRadio.inputId);
                    if (inputEl) percent = parseFloat(inputEl.value) || 0;
                }
                selected.push({ ...selectedRadio, percent: percent, groupKey: groupKey });
            }
        } else {
            const el = document.getElementById(groupConfig.id); // IDs g5_member, g6_tripcoins, g7_flashdeal
            if (el && el.checked) {
                selected.push({ ...groupConfig, percent: groupConfig.fixedPercent, groupKey: groupKey });
            }
        }
    });
    return selected;
}

function isCombinationValid(combination) {
    if (combination.length <= 1) return true;
    for (let i = 0; i < combination.length; i++) {
        for (let j = i + 1; j < combination.length; j++) {
            const promo1 = combination[i];
            const promo2 = combination[j];
            const group1Idx = groupKeys.indexOf(promo1.groupKey);
            const group2Idx = groupKeys.indexOf(promo2.groupKey);
            if (!stackingMatrix[group1Idx][group2Idx]) {
                return false;
            }
        }
    }
    return true;
}

function getPowerSet(arr) {
    return arr.reduce((subsets, value) => subsets.concat(
        subsets.map(set => [value, ...set])
    ), [[]]);
}

function recalcAll() {
    const baseRateInput = document.getElementById('baseRate');
    const finalRateOutput = document.getElementById('finalRateOutput');
    const scenarioLabel = document.getElementById('scenarioLabel');
    const scenarioNote = document.getElementById('scenarioNote');

    if (!baseRateInput || !finalRateOutput || !scenarioLabel || !scenarioNote) return;

    const baseRate = parseFloat(baseRateInput.value) || 0;
    const selectedPromos = getSelectedPromotions();

    if (selectedPromos.length === 0) {
        finalRateOutput.textContent = '€' + baseRate.toFixed(2);
        scenarioLabel.textContent = getCalcTranslation('tcalc-noDiscountApplied'); // Trip.com key
        scenarioNote.textContent = getCalcTranslation('tcalc-noDiscountNote');    // Trip.com key
        return;
    }

    const allSubsets = getPowerSet(selectedPromos);
    const validCombinations = [];

    allSubsets.forEach(subset => {
        if (subset.length === 0) return;

        const group1To4Promos = subset.filter(p => ['group1', 'group2', 'group3', 'group4'].includes(p.groupKey));
        if (group1To4Promos.length > 1) {
            return;
        }

        if (isCombinationValid(subset)) {
            let currentPrice = baseRate;
            const promoNames = [];
            subset.forEach(promo => {
                currentPrice *= (1 - (promo.percent / 100));
                promoNames.push(getCalcTranslation(promo.nameKey));
            });
            const effectiveTotalPercent = (baseRate > 0) ? (1 - (currentPrice / baseRate)) * 100 : 0;
            validCombinations.push({
                price: currentPrice,
                promoNames: promoNames,
                effectiveTotalPercent: effectiveTotalPercent,
                promos: subset
            });
        }
    });

    if (validCombinations.length === 0) {
        finalRateOutput.textContent = '€' + baseRate.toFixed(2);
        scenarioLabel.textContent = getCalcTranslation('tcalc-noDiscountApplied'); // Trip.com key
        scenarioNote.textContent = getCalcTranslation('tcalc-noDiscountNote');    // Trip.com key
        return;
    }

    validCombinations.sort((a, b) => a.price - b.price);
    const bestCombination = validCombinations[0];

    finalRateOutput.textContent = '€' + bestCombination.price.toFixed(2);
    scenarioLabel.textContent = getCalcTranslation('tcalc-bestDiscountLabel', { // Trip.com key
        totalPercent: bestCombination.effectiveTotalPercent.toFixed(1),
        promos: bestCombination.promoNames.join(' + ')
    });
    scenarioNote.textContent = getCalcTranslation('tcalc-appliedPromosNote', { // Trip.com key
        promos: bestCombination.promoNames.join(', ')
    });
}
