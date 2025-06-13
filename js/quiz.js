// js/quiz.js
// Ensure this is defined or accessible, e.g. by loading translations.js first.
// const siteTranslations = { ... };

const quizData = [
    {
        questionKey: "quiz-q1-text",
        answers: [
            { answerKey: "quiz-q1-ans1-text", score: 1 },
            { answerKey: "quiz-q1-ans2-text", score: 2 },
            { answerKey: "quiz-q1-ans3-text", score: 4 },
            { answerKey: "quiz-q1-ans4-text", score: 0 }
        ]
    },
    {
        questionKey: "quiz-q2-text",
        answers: [
            { answerKey: "quiz-q2-ans1-text", score: 1 },
            { answerKey: "quiz-q2-ans2-text", score: 2 },
            { answerKey: "quiz-q2-ans3-text", score: 3 },
            { answerKey: "quiz-q2-ans4-text", score: 4 }
        ]
    },
    {
        questionKey: "quiz-q3-text",
        answers: [
            { answerKey: "quiz-q3-ans1-text", score: 0 },
            { answerKey: "quiz-q3-ans2-text", score: 1 },
            { answerKey: "quiz-q3-ans3-text", score: 3 },
            { answerKey: "quiz-q3-ans4-text", score: 4 }
        ]
    },
    {
        questionKey: "quiz-q4-text",
        answers: [
            { answerKey: "quiz-q4-ans1-text", score: 0 },
            { answerKey: "quiz-q4-ans2-text", score: 1 },
            { answerKey: "quiz-q4-ans3-text", score: 3 },
            { answerKey: "quiz-q4-ans4-text", score: 4 }
        ]
    },
    {
        questionKey: "quiz-q5-text",
        answers: [
            { answerKey: "quiz-q5-ans1-text", score: 0 },
            { answerKey: "quiz-q5-ans2-text", score: 2 },
            { answerKey: "quiz-q5-ans3-text", score: 4 },
            { answerKey: "quiz-q5-ans4-text", score: 1 }
        ]
    }
];

const scoreCategories = [
    { threshold: 0, nameKey: "quiz-cat1-name", adviceKey: "quiz-cat1-advice" },
    { threshold: 5, nameKey: "quiz-cat2-name", adviceKey: "quiz-cat2-advice" },
    { threshold: 10, nameKey: "quiz-cat3-name", adviceKey: "quiz-cat3-advice" },
    { threshold: 15, nameKey: "quiz-cat4-name", adviceKey: "quiz-cat4-advice" }
];

let currentQuestionIndex = 0;
let userScore = 0;
let lastCalculatedScoreForResults = null; // To store score when results are first shown

// DOM Elements
let questionTextElement;
let answerButtonsElement;
let nextButtonElement;
let resultsAreaElement;
let resultCategoryElement;
let resultAdviceElement;
let totalScoreElement;
let restartButtonElement;
let quizContainerElement;
let currentLanguage = 'tr'; // Default, will be updated

function getTranslation(key) {
    return siteTranslations[currentLanguage][key] || `Missing key: ${key}`;
}

document.addEventListener('DOMContentLoaded', () => {
    questionTextElement = document.getElementById('question-text');
    answerButtonsElement = document.getElementById('answer-buttons');
    nextButtonElement = document.getElementById('next-btn');
    resultsAreaElement = document.getElementById('results-area');
    resultCategoryElement = document.getElementById('result-category');
    resultAdviceElement = document.getElementById('result-advice');
    totalScoreElement = document.getElementById('total-score');
    restartButtonElement = document.getElementById('restart-btn');
    quizContainerElement = document.getElementById('quiz-container');

    currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';

    if (nextButtonElement) {
        nextButtonElement.addEventListener('click', handleNextButton);
    }
    if (restartButtonElement) {
        restartButtonElement.addEventListener('click', restartQuiz);
    }

    startQuiz();

    // Listen for language changes
    document.addEventListener('languageChanged', function(event) {
        currentLanguage = event.detail.language;
        // Re-render current state of quiz
        if (resultsAreaElement.style.display !== 'none' && lastCalculatedScoreForResults !== null) {
            showResults(lastCalculatedScoreForResults); // Re-render results with new language
        } else if (currentQuestionIndex < quizData.length && quizContainerElement.style.display !== 'none') {
            displayQuestion(); // Re-display current question
        }
        // Also update static button texts if they are part of the quiz UI and not handled by global selector
        if (nextButtonElement.style.display !== 'none') {
             if (currentQuestionIndex === quizData.length -1 && resultsAreaElement.style.display === 'none'){
                nextButtonElement.innerHTML = getTranslation("quiz-view-results-btn");
            } else {
                 nextButtonElement.innerHTML = getTranslation("quiz-next-btn");
            }
        }
         if (restartButtonElement.style.display !== 'none') {
            restartButtonElement.innerHTML = getTranslation("quiz-retake-btn");
        }

    });
});

function startQuiz() {
    currentQuestionIndex = 0;
    userScore = 0;
    lastCalculatedScoreForResults = null;
    if(resultsAreaElement) resultsAreaElement.style.display = 'none';
    if(quizContainerElement) quizContainerElement.style.display = 'block';
    if(nextButtonElement) {
        nextButtonElement.innerHTML = getTranslation("quiz-next-btn");
        nextButtonElement.disabled = true;
    }
    displayQuestion();
}

function displayQuestion() {
    if (!quizData[currentQuestionIndex] || !questionTextElement || !answerButtonsElement) return;

    let currentQuestion = quizData[currentQuestionIndex];
    questionTextElement.innerHTML = getTranslation(currentQuestion.questionKey);
    answerButtonsElement.innerHTML = "";

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerHTML = getTranslation(answer.answerKey);
        // Remove old list classes, add new button quiz option class
        button.classList.remove('list-group-item', 'list-group-item-action');
        button.classList.add('btn-quiz-option');
        button.addEventListener('click', () => selectAnswer(answer.score, button));
        answerButtonsElement.appendChild(button);
    });
    if(nextButtonElement) nextButtonElement.disabled = true;
     if (currentQuestionIndex === quizData.length - 1) {
        nextButtonElement.innerHTML = getTranslation("quiz-view-results-btn");
    } else {
        nextButtonElement.innerHTML = getTranslation("quiz-next-btn");
    }
}

function selectAnswer(score, selectedButton) {
    userScore += score;
    Array.from(answerButtonsElement.children).forEach(button => {
        // button.classList.add('disabled'); // .btn-quiz-option.disabled will handle this
        if (button === selectedButton) {
            button.classList.add('selected');
        }
        // Add disabled directly to all buttons after selection to prevent re-clicking
        button.classList.add('disabled');
    });
    if(nextButtonElement) nextButtonElement.disabled = false;
}

function handleNextButton() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        displayQuestion();
    } else {
        showResults(userScore);
    }
}

function showResults(finalScore) {
    lastCalculatedScoreForResults = finalScore; // Store the score for re-translation
    if(quizContainerElement) quizContainerElement.style.display = 'none';
    if(resultsAreaElement) resultsAreaElement.style.display = 'block';

    let category = scoreCategories[scoreCategories.length - 1]; // Default to highest
    for (let i = 0; i < scoreCategories.length; i++) {
        if (finalScore <= scoreCategories[i].threshold) {
            category = scoreCategories[i];
            break;
        }
         // If score is higher than the last threshold, it belongs to the last category
        if (i === scoreCategories.length - 1 && finalScore > scoreCategories[i].threshold) {
             category = scoreCategories[i];
             break;
        }
         // Check if score falls between current and next threshold
        if (scoreCategories[i+1] && finalScore > scoreCategories[i].threshold && finalScore <= scoreCategories[i+1].threshold) {
            category = scoreCategories[i+1]; // Assign to the upper bound category for this logic
            break;
        }
    }

    // Simplified category finding logic
    let determinedCategory = scoreCategories[0]; // Default to the first category
    for (let i = scoreCategories.length - 1; i >= 0; i--) {
        if (finalScore >= scoreCategories[i].threshold) {
            determinedCategory = scoreCategories[i];
            break;
        }
    }

    resultCategoryElement.innerHTML = getTranslation(determinedCategory.nameKey);
    resultAdviceElement.innerHTML = getTranslation(determinedCategory.adviceKey);
    totalScoreElement.innerText = finalScore; // Score is a number, not a key
}

function restartQuiz() {
    startQuiz();
}
