// js/adventure.js
// Ensure siteTranslations is loaded before this script.

const story = {
    start: {
        textKey: "adv-start-text",
        choices: [
            { textKey: "adv-start-choice1", nodeId: "deepDiscount" },
            { textKey: "adv-start-choice2", nodeId: "analyzeMarket" }
        ]
    },
    deepDiscount: {
        textKey: "adv-deepDiscount-text",
        choices: [
            { textKey: "adv-deepDiscount-choice1", nodeId: "keepDiscounting" },
            { textKey: "adv-deepDiscount-choice2", nodeId: "seekExpertAdviceFromDiscount" }
        ],
        outcomeType: "intermediate"
    },
    keepDiscounting: {
        textKey: "adv-keepDiscounting-text",
        isEndpoint: true,
        outcomeType: "bad"
    },
    analyzeMarket: {
        textKey: "adv-analyzeMarket-text",
        choices: [
            { textKey: "adv-analyzeMarket-choice1", nodeId: "diyUpdate" },
            { textKey: "adv-analyzeMarket-choice2", nodeId: "engageOtelCiro" }
        ],
        outcomeType: "intermediate"
    },
    diyUpdate: {
        textKey: "adv-diyUpdate-text",
        choices: [
            { textKey: "adv-diyUpdate-choice1", nodeId: "manageAlone" },
            { textKey: "adv-diyUpdate-choice2", nodeId: "seekExpertAdviceFromDIY" }
        ],
        outcomeType: "intermediate"
    },
    manageAlone: {
        textKey: "adv-manageAlone-text",
        isEndpoint: true,
        outcomeType: "neutral"
    },
    engageOtelCiro: {
        textKey: "adv-engageOtelCiro-text",
        isEndpoint: true,
        outcomeType: "good"
    },
    seekExpertAdviceFromDiscount: {
        textKey: "adv-seekExpertAdviceFromDiscount-text",
        isEndpoint: true,
        outcomeType: "good"
    },
    seekExpertAdviceFromDIY: {
        textKey: "adv-seekExpertAdviceFromDIY-text",
        isEndpoint: true,
        outcomeType: "good"
    }
};

let currentNodeId = 'start';
let storyTextElement, choicesAreaElement, restartButtonElement;
let currentLanguage = 'tr'; // Default, will be updated

function getAdventureTranslation(key) {
    // Ensure siteTranslations and currentLanguage are accessible
    // Fallback to key itself if not found, to help debug missing keys
    if (siteTranslations && siteTranslations[currentLanguage] && siteTranslations[currentLanguage][key]) {
        return siteTranslations[currentLanguage][key];
    }
    console.warn(`Adventure translation key '${key}' not found for language '${currentLanguage}'.`);
    return key; // Return the key itself as a fallback
}


document.addEventListener('DOMContentLoaded', () => {
    storyTextElement = document.getElementById('story-text');
    choicesAreaElement = document.getElementById('choices-area');
    restartButtonElement = document.getElementById('restart-adventure-btn');

    if (!storyTextElement || !choicesAreaElement || !restartButtonElement) {
        console.error("Story elements not found! Check your HTML IDs.");
        return;
    }

    currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

    restartButtonElement.addEventListener('click', () => {
        currentNodeId = 'start';
        renderNode(currentNodeId);
    });

    // Listen for language changes from language-switcher.js
    document.addEventListener('languageChanged', function(event) {
        currentLanguage = event.detail.language;
        renderNode(currentNodeId); // Re-render the current story node with the new language
        // Also update static button texts if they are part of the adventure UI and not handled by global selector
        if (restartButtonElement) {
            restartButtonElement.innerHTML = getAdventureTranslation("adv-restart-btn");
        }
    });

    // Initial render
    if (restartButtonElement) { // Set initial text for restart button
         restartButtonElement.innerHTML = getAdventureTranslation("adv-restart-btn");
    }
    renderNode(currentNodeId);
});

function renderNode(nodeId) {
    const node = story[nodeId];
    if (!node) {
        console.error(`Story node "${nodeId}" not found!`);
        storyTextElement.innerHTML = "Bir hata oluştu, hikaye düğümü bulunamadı. Lütfen yeniden başlatın."; // Default error in TR
        choicesAreaElement.innerHTML = '';
        if(restartButtonElement) restartButtonElement.style.display = 'block';
        return;
    }

    storyTextElement.innerHTML = getAdventureTranslation(node.textKey).replace(/\n/g, "<br>");
    choicesAreaElement.innerHTML = '';

    if (node.isEndpoint) {
        let outcomeMessageKey = "";
        if (node.outcomeType === "good") {
            outcomeMessageKey = "adv-outcome-good";
        } else if (node.outcomeType === "bad") {
            outcomeMessageKey = "adv-outcome-bad";
        } else { // neutral
            outcomeMessageKey = "adv-outcome-neutral";
        }
        storyTextElement.innerHTML += getAdventureTranslation(outcomeMessageKey);
        if(restartButtonElement) restartButtonElement.style.display = 'block';
    } else {
        node.choices.forEach(choice => {
            const button = document.createElement('button');
            // Remove old classes
            button.classList.remove('btn', 'btn-outline-primary', 'me-2', 'mb-2', 'd-block', 'w-100');
            // Add new global classes
            button.classList.add('btn-global', 'btn-global-primary');
            button.innerHTML = getAdventureTranslation(choice.textKey);
            button.addEventListener('click', () => selectChoice(choice.nodeId));
            choicesAreaElement.appendChild(button);
        });
        if(restartButtonElement) restartButtonElement.style.display = 'none';
    }
}

function selectChoice(nodeId) {
    currentNodeId = nodeId;
    renderNode(currentNodeId);
}
