let currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

function getChatbotTranslation(key) {
    // Ensure siteTranslations is accessible (it's global in translations.js)
    // and currentLanguage is also up-to-date via the event listener.
    return siteTranslations[currentLanguage]?.[key] || key; // Fallback to key if not found
}

const qaPairs = [
    {
        question: "What services do you offer?",
        keywords: ["services", "offer", "what do you do", "hizmetler", "ne yaparsınız", "servisler"],
        answerKey: "chatbot-ans-services"
    },
    {
        question: "How can I contact you?",
        keywords: ["contact", "email", "phone", "reach you", "iletişim", "telefon", "eposta"],
        answerKey: "chatbot-ans-contact"
    },
    {
        question: "Show me your portfolio.",
        keywords: ["portfolio", "case studies", "examples", "clients", "portföy", "referanslar", "müşteriler"],
        answerKey: "chatbot-ans-portfolio"
    },
    {
        question: "What is dynamic pricing?",
        keywords: ["dynamic pricing", "pricing strategy", "dinamik fiyatlandırma", "fiyat stratejisi"],
        answerKey: "chatbot-ans-dynamic-pricing"
    },
    {
        question: "How can I increase direct bookings?",
        keywords: ["direct bookings", "increase bookings", "website bookings", "doğrudan rezervasyon", "rezervasyon artırma"],
        answerKey: "chatbot-ans-direct-bookings"
    },
    {
        question: "What is OtelCiro?",
        keywords: ["otelciro", "who are you", "about", "hakkında", "kimsiniz"],
        answerKey: "chatbot-ans-what-is-otelciro"
    },
    {
        question: "Where are you located?",
        keywords: ["location", "address", "based", "neredesiniz", "adres"],
        answerKey: "chatbot-ans-location"
    },
    {
        question: "What is OTA optimization?",
        keywords: ["ota", "ota optimization", "optimize ota", "ota optimizasyonu"],
        answerKey: "chatbot-ans-ota-optimization"
    }
];

const fallbackAnswerKey = "chatbot-fallback-ans";

let chatIcon, chatWindow, closeChatBtn, chatBody, chatInput, sendChatBtn;

document.addEventListener('DOMContentLoaded', () => {
    chatIcon = document.getElementById('chat-icon');
    chatWindow = document.getElementById('chat-window');
    closeChatBtn = document.getElementById('close-chat-btn');
    chatBody = document.getElementById('chat-body');
    chatInput = document.getElementById('chat-input');
    sendChatBtn = document.getElementById('send-chat-btn');

    // Set initial placeholder text
    if (chatInput) {
        chatInput.placeholder = getChatbotTranslation('chatbot-input-placeholder');
    }

    if (chatIcon) {
        chatIcon.addEventListener('click', toggleChatWindow);
    }
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', toggleChatWindow);
    }
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', processUserInput);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                processUserInput();
            }
        });
    }

    // Listen for language changes to update dynamic text
    document.addEventListener('languageChanged', function(event) {
        currentLanguage = event.detail.language;
        const chatBodyElement = document.getElementById('chat-body'); // Use local var
        const firstBotMessageP = chatBodyElement ? chatBodyElement.querySelector('.bot-message.initial-bot-message p') : null;

        if (firstBotMessageP && chatBodyElement.children.length <= 2) { // Heuristic: if only greeting or greeting + 1 user msg
            let isGreeting = false;
            for (const lang_code in siteTranslations) { // Check against all known greeting translations
                if (firstBotMessageP.textContent === siteTranslations[lang_code]['chatbot-greeting']) {
                    isGreeting = true;
                    break;
                }
            }
            if (isGreeting) {
                firstBotMessageP.textContent = getChatbotTranslation('chatbot-greeting');
            }
        }

        // Update placeholder of input field
        if (chatInput) {
            chatInput.placeholder = getChatbotTranslation('chatbot-input-placeholder');
        }
        // Future messages will use the new language automatically.
        // Re-translating entire chat history is complex and out of scope for now.
    });
});

function toggleChatWindow() {
    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
        addMessageToChat(getChatbotTranslation('chatbot-greeting'), 'bot', true); // Use translated greeting
    } else {
        chatWindow.style.display = 'none';
    }
}

function addMessageToChat(message, sender, isInitial = false) {
    if (!chatBody) return;

    // Avoid adding initial message multiple times if window is toggled
    if (isInitial && chatBody.querySelector('.initial-bot-message')) {
        // Still scroll to bottom even if message is not re-added
        chatBody.scrollTop = chatBody.scrollHeight;
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    if (isInitial) {
        messageElement.classList.add('initial-bot-message');
    }

    const p = document.createElement('p');
    p.textContent = message;
    messageElement.appendChild(p);
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll to the latest message
}

function processUserInput() {
    const userInput = chatInput.value.trim();
    if (userInput === "") return;

    addMessageToChat(userInput, 'user');
    chatInput.value = ""; // Clear input field

    let botResponseKey = fallbackAnswerKey; // Default to fallback key
    let bestMatchScore = 0;

    const userLower = userInput.toLowerCase();

    qaPairs.forEach(pair => {
        let currentScore = 0;
        pair.keywords.forEach(keyword => {
            if (userLower.includes(keyword.toLowerCase())) {
                currentScore++;
            }
        });

        if (currentScore > bestMatchScore) {
            bestMatchScore = currentScore;
            botResponseKey = pair.answerKey;
        } else if (currentScore > 0 && currentScore === bestMatchScore) {
            // Simple overwrite with the last equally good match. Could be improved.
            botResponseKey = pair.answerKey;
        }
    });

    // Simple keyword check for direct question match (less robust than keyword scoring but can be a quick win)
    // This part might be redundant if keywords are well-defined or could be improved.
    // For now, let's ensure it also sets the key.
     qaPairs.forEach(pair => {
        if (userLower === pair.question.toLowerCase()) { // Exact match of the question itself
            botResponseKey = pair.answerKey;
            bestMatchScore = Infinity; // Prioritize direct question match
        }
    });

    const botResponseText = getChatbotTranslation(botResponseKey);

    setTimeout(() => { // Simulate bot thinking
        addMessageToChat(botResponseText, 'bot');
    }, 500);
}
