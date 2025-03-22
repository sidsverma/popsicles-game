// Colors for the game
const colors = [
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Green', value: '#00FF00' },
    { name: 'Yellow', value: '#FFD700' },
    { name: 'Purple', value: '#800080' },
    { name: 'Orange', value: '#FF8C00' },
    { name: 'Pink', value: '#FFC0CB' },
    { name: 'Brown', value: '#A52A2A' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' }
];

// Sound effects
const sounds = {
    correct: new Audio('sounds/correct.mp3'),
    incorrect: new Audio('sounds/incorrect.mp3'),
    hover: new Audio('sounds/hover.mp3'),
    start: new Audio('sounds/start.mp3')
};

// Set volume for all sounds
Object.values(sounds).forEach(sound => {
    sound.volume = 0.5;
});

let currentColor;
let score = 0;
let options = [];
let currentLevel = 1;
let correctAnswersInLevel = 0;
const ANSWERS_PER_LEVEL = 3;
const TOTAL_LEVELS = 3;

// Timer variables
const MIN_TIME = 20; // Minimum time in seconds
const MAX_TIME = 30; // Maximum time in seconds
let timeLeft = MAX_TIME;
let timerInterval;
let timerCircle;
let recognition;
let isListening = false;
let gameMode = 'speaking'; // Default mode

// Meme templates for failure screen
const memeTemplates = [
    {
        template: 'doge',
        topText: 'such_learning',
        bottomText: 'very_practice'
    },
    {
        template: 'doge',
        topText: 'much_try_again',
        bottomText: 'very_learning'
    },
    {
        template: 'success',
        topText: 'keep_trying',
        bottomText: 'you_got_this'
    },
    {
        template: 'grumpycat',
        topText: 'learning_is_hard',
        bottomText: 'but_worth_it'
    },
    {
        template: 'doge',
        topText: 'wow_such_colors',
        bottomText: 'very_learning'
    },
    {
        template: 'success',
        topText: 'practice_makes',
        bottomText: 'perfect'
    },
    {
        template: 'grumpycat',
        topText: 'colors_are_hard',
        bottomText: 'but_you_can_do_it'
    },
    {
        template: 'doge',
        topText: 'much_fun',
        bottomText: 'very_learning'
    },
    {
        template: 'success',
        topText: 'learning_colors',
        bottomText: 'is_fun'
    },
    {
        template: 'grumpycat',
        topText: 'try_again',
        bottomText: 'you_almost_got_it'
    }
];

// Function to select game mode
function selectMode(mode) {
    gameMode = mode;
    document.getElementById('mode-screen').classList.remove('active');
    document.getElementById('explainer-screen').classList.add('active');
    
    // Update instructions based on mode
    const modeInstruction = document.getElementById('mode-specific-instruction');
    const modeExample = document.getElementById('mode-specific-example');
    
    if (mode === 'speaking') {
        modeInstruction.textContent = 'Speak the name of the color';
        modeExample.textContent = 'If you see a blue popsicle, say "Blue"!';
    } else {
        modeInstruction.textContent = 'Click the button that matches the color';
        modeExample.textContent = 'If you see a blue popsicle, click the "Blue" button!';
    }
}

// Initialize speech recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.toLowerCase().trim();
            
            // Only process final results
            if (result.isFinal) {
                handleVoiceInput(transcript);
            }
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            
            // Only switch modes for specific errors
            if (event.error === 'not-allowed') {
                alert('Please allow microphone access to use the speaking mode!');
                selectMode('clicking');
            } else if (event.error === 'no-speech') {
                // Don't switch modes for no-speech error, just try again
                if (isListening && gameMode === 'speaking') {
                    setTimeout(() => {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error restarting recognition:', e);
                        }
                    }, 1000);
                }
            } else {
                // For other errors, try to restart recognition
                if (isListening && gameMode === 'speaking') {
                    setTimeout(() => {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error restarting recognition:', e);
                        }
                    }, 1000);
                }
            }
        };

        recognition.onend = function() {
            // Only restart if we're still in speaking mode and should be listening
            if (isListening && gameMode === 'speaking') {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Error restarting recognition:', e);
                    // Don't switch modes, just try again
                    setTimeout(() => {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error restarting recognition:', e);
                        }
                    }, 1000);
                }
            }
        };
    } else {
        console.error('Speech recognition not supported');
        alert('Speech recognition is not supported in your browser. Switching to clicking mode.');
        selectMode('clicking');
    }
}

// Function to start listening
function startListening() {
    if (recognition && gameMode === 'speaking') {
        try {
            isListening = true;
            recognition.start();
            const micButton = document.querySelector('.mic-button');
            if (micButton) {
                micButton.classList.add('listening');
                micButton.title = 'Click to stop listening';
            }
        } catch (e) {
            console.error('Error starting recognition:', e);
            // Don't switch modes immediately, try again
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Error starting recognition:', e);
                }
            }, 1000);
        }
    }
}

// Function to stop listening
function stopListening() {
    if (recognition) {
        isListening = false;
        try {
            recognition.stop();
        } catch (e) {
            console.error('Error stopping recognition:', e);
        }
        const micButton = document.querySelector('.mic-button');
        if (micButton) {
            micButton.classList.remove('listening');
            micButton.title = 'Click to start speaking';
        }
    }
}

// Function to handle voice input
function handleVoiceInput(result) {
    if (gameMode !== 'speaking') return;
    
    // Clean up the transcript
    const cleanResult = result.toLowerCase().trim();
    
    // Find matching color
    const selectedColor = options.find(option => 
        option.name.toLowerCase() === cleanResult
    );

    if (selectedColor) {
        checkAnswer(selectedColor);
    }
}

// Get DOM elements
const gameContainer = document.querySelector('.game-container');
const explainerScreen = document.getElementById('explainer-screen');
const popsicle = document.getElementById('popsicle');
const optionsContainer = document.getElementById('options');
const scoreElement = document.getElementById('score');
const progressElement = document.getElementById('progress');
const currentLevelElement = document.getElementById('current-level');
const successScreen = document.getElementById('success-screen');
const failureScreen = document.getElementById('failure-screen');
const finalScoreElement = document.getElementById('final-score');
const timerElement = document.getElementById('timer');
const timerContainer = document.querySelector('.timer-circle');

// Initialize timer circle
function initTimerCircle() {
    timerCircle = document.querySelector('.timer-circle-progress');
    const radius = timerCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    timerCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    timerCircle.style.strokeDashoffset = circumference;
}

// Update timer display
function updateTimerDisplay() {
    const timerText = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-circle');
    const radius = timerCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (timeLeft / MAX_TIME) * circumference;
    timerCircle.style.strokeDashoffset = offset;
    timerText.textContent = timeLeft;

    // Update timer color based on time remaining
    timerContainer.classList.remove('timer-warning', 'timer-danger');
    if (timeLeft <= 10) {
        timerContainer.classList.add('timer-danger');
    } else if (timeLeft <= 20) {
        timerContainer.classList.add('timer-warning');
    }
}

// Start timer
function startTimer() {
    // Reset to maximum time
    timeLeft = MAX_TIME;
    updateTimerDisplay();
    
    // Clear any existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            stopTimer();
            showFailureScreen();
        }
    }, 1000);
}

// Function to stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Add keyboard event listener for Enter key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && explainerScreen.classList.contains('active')) {
        startGame();
    }
});

// Function to start the game
function startGame() {
    explainerScreen.classList.remove('active');
    gameContainer.style.display = 'block';
    initTimerCircle();
    initSpeechRecognition();
    startNewRound();
}

// Function to update progress bar
function updateProgress() {
    const progress = ((currentLevel - 1) * ANSWERS_PER_LEVEL + correctAnswersInLevel) / (TOTAL_LEVELS * ANSWERS_PER_LEVEL) * 100;
    progressElement.style.width = `${progress}%`;
    currentLevelElement.textContent = currentLevel;
}

// Function to get random color
function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Function to get random options including the correct one
function getRandomOptions(correctColor) {
    let availableColors = colors.filter(color => color.name !== correctColor.name);
    let randomOptions = [];
    
    // Add correct color
    randomOptions.push(correctColor);
    
    // Add two random incorrect colors
    for (let i = 0; i < 2; i++) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        randomOptions.push(availableColors[randomIndex]);
        availableColors.splice(randomIndex, 1);
    }
    
    // Shuffle options
    return randomOptions.sort(() => Math.random() - 0.5);
}

// Function to create option buttons
function createOptionButtons(options) {
    optionsContainer.innerHTML = '';
    
    // Add microphone button only in speaking mode
    if (gameMode === 'speaking') {
        const micButton = document.createElement('button');
        micButton.className = 'mic-button';
        micButton.innerHTML = '🎤';
        micButton.title = 'Click to speak the color';
        micButton.onclick = () => {
            if (isListening) {
                stopListening();
            } else {
                startListening();
            }
        };
        optionsContainer.appendChild(micButton);
    }

    // Add color buttons
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option.name;
        button.addEventListener('click', () => checkAnswer(option));
        optionsContainer.appendChild(button);
    });
}

// Function to get random meme
function getRandomMeme() {
    const meme = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
    return `https://api.memegen.link/images/${meme.template}/${meme.topText}/${meme.bottomText}.png`;
}

// Function to show success screen
function showSuccessScreen() {
    stopTimer();
    stopListening();
    finalScoreElement.textContent = score;
    successScreen.classList.add('active');
}

// Function to show failure screen
function showFailureScreen() {
    stopTimer();
    stopListening();
    const memeContainer = document.querySelector('.meme-container img');
    memeContainer.src = getRandomMeme();
    failureScreen.classList.add('active');
}

// Function to check answer
function checkAnswer(selectedColor) {
    const buttons = document.querySelectorAll('.option-button');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === currentColor.name) {
            button.classList.add('correct');
        }
    });
    
    if (selectedColor.name === currentColor.name) {
        score++;
        scoreElement.textContent = score;
        sounds.correct.currentTime = 0;
        sounds.correct.play();
        correctAnswersInLevel++;
        updateProgress();
        
        // Check if level is complete
        if (correctAnswersInLevel >= ANSWERS_PER_LEVEL) {
            if (currentLevel >= TOTAL_LEVELS) {
                setTimeout(showSuccessScreen, 1500);
                return;
            }
            currentLevel++;
            correctAnswersInLevel = 0;
        }
    } else {
        const correctButton = Array.from(buttons).find(button => button.textContent === currentColor.name);
        correctButton.classList.add('correct');
        selectedColor.element.classList.add('incorrect');
        sounds.incorrect.currentTime = 0;
        sounds.incorrect.play();
        setTimeout(showFailureScreen, 1500);
        return;
    }
    
    // Wait for 1.5 seconds before showing next question
    setTimeout(() => {
        startNewRound();
    }, 1500);
}

// Function to start new round
function startNewRound() {
    currentColor = getRandomColor();
    popsicle.style.backgroundColor = currentColor.value;
    options = getRandomOptions(currentColor);
    createOptionButtons(options);
    sounds.start.currentTime = 0;
    sounds.start.play();
    startTimer();
    
    // Start listening only in speaking mode
    if (gameMode === 'speaking') {
        startListening();
    }
}

// Function to restart game
function restartGame() {
    currentLevel = 1;
    score = 0;
    correctAnswersInLevel = 0;
    scoreElement.textContent = score;
    updateProgress();
    successScreen.classList.remove('active');
    failureScreen.classList.remove('active');
    document.getElementById('mode-screen').classList.add('active');
    document.getElementById('explainer-screen').classList.remove('active');
} 