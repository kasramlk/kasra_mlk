// js/expediacalculator.js
let currentLanguage = localStorage.getItem('preferredLanguage') || 'tr'; // Ensure this is at the top

const expediaPromoGroups = {
    group1: [ // General Promotions
        { id: 'g1_none', nameKey: 'ecalc-g1-none-label', defaultPercent: 0, type: 'radio', groupName: 'group1' },
        { id: 'g1_basic', nameKey: 'ecalc-g1-basic-label', inputId: 'g1_basic_percent', defaultPercent: 10, type: 'radio', groupName: 'group1' },
        { id: 'g1_early', nameKey: 'ecalc-g1-early-label', inputId: 'g1_early_percent', defaultPercent: 15, type: 'radio', groupName: 'group1' },
        { id: 'g1_lastmin', nameKey: 'ecalc-g1-lastmin-label', inputId: 'g1_lastmin_percent', defaultPercent: 10, type: 'radio', groupName: 'group1' },
        { id: 'g1_minstay', nameKey: 'ecalc-g1-minstay-label', inputId: 'g1_minstay_percent', defaultPercent: 5, type: 'radio', groupName: 'group1' }
    ],
    group2: [ // Channel-Specific
        { id: 'g2_none', nameKey: 'ecalc-g2-none-label', defaultPercent: 0, type: 'radio', groupName: 'group2' },
        { id: 'g2_mobile', nameKey: 'ecalc-g2-mobile-label', inputId: 'g2_mobile_percent', defaultPercent: 10, type: 'radio', groupName: 'group2' },
        { id: 'g2_xpos', nameKey: 'ecalc-g2-xpos-label', inputId: 'g2_xpos_percent', defaultPercent: 10, type: 'radio', groupName: 'group2' }
    ],
    group3: [ // Package Deals
        { id: 'g3_none', nameKey: 'ecalc-g3-none-label', defaultPercent: 0, type: 'radio', groupName: 'group3' },
        { id: 'g3_package1', nameKey: 'ecalc-g3-package1-label', inputId: 'g3_package1_percent', defaultPercent: 12, type: 'radio', groupName: 'group3' }
    ],
    group4: [ // Campaigns
        { id: 'g4_none', nameKey: 'ecalc-g4-none-label', defaultPercent: 0, type: 'radio', groupName: 'group4' },
        { id: 'g4_campaign1', nameKey: 'ecalc-g4-campaign1-label', inputId: 'g4_campaign1_percent', defaultPercent: 20, type: 'radio', groupName: 'group4' }
    ],
    group5: { id: 'g5_rewards', nameKey: 'ecalc-g5-rewards-label', fixedPercent: 5, type: 'checkbox', groupName: 'group5' },
    group6: { id: 'g6_smart', nameKey: 'ecalc-g6-smart-label', fixedPercent: 8, type: 'checkbox', groupName: 'group6' },
    group7: { id: 'g7_points', nameKey: 'ecalc-g7-points-label', fixedPercent: 3, type: 'checkbox', groupName: 'group7' }
};

// Stacking Rules Matrix (7x7 for G1 to G7)
// true = stackable, false = not stackable.
// For Expedia, it's often simpler: A base promo (G1-G4) can stack with G5, G6, G7.
// Multiple selections from G5, G6, G7 can stack with each other.
// Generally, you can only have ONE from G1-G4.
// This simplified matrix assumes:
// - G1-G4 are mutually exclusive (handled by radio buttons, but matrix reflects no stacking between them).
// - G5, G6, G7 can stack with each other.
// - Any ONE of G1-G4 can stack with any combination of G5, G6, G7.
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
        const group = expediaPromoGroups[groupKey];
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
                        // Optional: Disable percentage input if radio is not selected
                        if (radioElement) {
                           inputElement.disabled = !radioElement.checked;
                           radioElement.addEventListener('change', () => {inputElement.disabled = !radioElement.checked;});
                        }
                    }
                }
            });
        } else { // Checkbox groups
            const checkboxElement = document.getElementById(group.id);
            if (checkboxElement) {
                checkboxElement.addEventListener('change', recalcAll);
            }
        }
    });
     // Ensure "none" options also trigger recalc and disable sibling inputs
    expediaPromoGroups.group1.forEach(promo => { // Example for group1, repeat for g2, g3, g4
        if(promo.type === 'radio' && promo.id.endsWith('_none')) {
            const noneRadio = document.getElementById(promo.id);
            if(noneRadio) {
                noneRadio.addEventListener('change', () => {
                    if(noneRadio.checked) {
                        expediaPromoGroups.group1.forEach(p => {
                            if(p.inputId) document.getElementById(p.inputId).disabled = true;
                        });
                    }
                    recalcAll();
                });
            }
        } else if (promo.type === 'radio' && promo.inputId) {
            const promoRadio = document.getElementById(promo.id);
            const promoInput = document.getElementById(promo.inputId);
            if(promoRadio && promoInput) {
                 promoRadio.addEventListener('change', () => {
                    if(promoRadio.checked) { // Enable this one, disable others in group
                         expediaPromoGroups.group1.forEach(p => {
                            if(p.inputId && p.inputId !== promo.inputId) document.getElementById(p.inputId).disabled = true;
                         });
                         promoInput.disabled = false;
                    }
                });
                // Initial state based on "checked"
                promoInput.disabled = !promoRadio.checked;

            }
        }
    });
    // Repeat for group2, group3, group4 (simplification: only group1 shown for this logic)
    ['group1', 'group2', 'group3', 'group4'].forEach(groupKeyName => {
        const groupArray = expediaPromoGroups[groupKeyName];
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
            } else if (promo.inputId) {
                const inputEl = document.getElementById(promo.inputId);
                if (inputEl) {
                    radioEl.addEventListener('change', () => {
                        if (radioEl.checked) {
                            groupArray.forEach(p => { // Disable others in this group
                                if (p.inputId && p.id !== promo.id) document.getElementById(p.inputId).disabled = true;
                            });
                            inputEl.disabled = false;
                        }
                        recalcAll();
                    });
                    inputEl.disabled = !radioEl.checked; // Initial state
                }
            } else { // Radio without inputId (shouldn't happen for non-"none")
                 radioEl.addEventListener('change', recalcAll);
            }
        });
    });


}

function getSelectedPromotions() {
    const selected = [];
    groupKeys.forEach(groupKey => {
        const groupConfig = expediaPromoGroups[groupKey];
        if (Array.isArray(groupConfig)) { // Radio groups (G1-G4)
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
        } else { // Checkbox groups (G5-G7)
            const el = document.getElementById(groupConfig.id);
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
                return false; // Found an incompatible pair
            }
        }
    }
    return true;
}

// Generates all subsets (power set) of a given array
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
        scenarioLabel.textContent = getCalcTranslation('ecalc-noDiscountApplied');
        scenarioNote.textContent = getCalcTranslation('ecalc-noDiscountNote');
        return;
    }

    const allSubsets = getPowerSet(selectedPromos);
    const validCombinations = [];

    allSubsets.forEach(subset => {
        if (subset.length === 0) return; // Skip empty set

        // Rule: Max one from G1-G4 combined
        const group1To4Promos = subset.filter(p => ['group1', 'group2', 'group3', 'group4'].includes(p.groupKey));
        if (group1To4Promos.length > 1) {
            return; // Invalid combination: more than one promo from G1-G4
        }

        if (isCombinationValid(subset)) {
            let currentPrice = baseRate;
            const promoNames = [];
            subset.forEach(promo => {
                currentPrice *= (1 - (promo.percent / 100));
                promoNames.push(getCalcTranslation(promo.nameKey)); // Use nameKey for display
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
        scenarioLabel.textContent = getCalcTranslation('ecalc-noDiscountApplied');
        scenarioNote.textContent = getCalcTranslation('ecalc-noDiscountNote');
        return;
    }

    // Find the best combination (lowest price)
    validCombinations.sort((a, b) => a.price - b.price);
    const bestCombination = validCombinations[0];

    finalRateOutput.textContent = '€' + bestCombination.price.toFixed(2);
    scenarioLabel.textContent = getCalcTranslation('ecalc-bestDiscountLabel', {
        totalPercent: bestCombination.effectiveTotalPercent.toFixed(1),
        promos: bestCombination.promoNames.join(' + ')
    });
    scenarioNote.textContent = getCalcTranslation('ecalc-appliedPromosNote', {
        promos: bestCombination.promoNames.join(', ')
    });
}
