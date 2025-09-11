// Datos de los módulos
const modules = {
    luces: {
        id: "luces",
        name: "Modulo_Luces.js",
        icon: "💡",
        corruptCode: `function encenderFaro() {
  console.log(Faro delantero encendido);
  verificarEnergia()
}`,
        correctCode: `function encenderFaro() {
  console.log("Faro delantero encendido");
  verificarEnergia();
}`,
        errors: ["Faltan comillas", "Falta punto y coma"]
    },
    motores: {
        id: "motores", 
        name: "Modulo_Motores.js",
        icon: "⚙️",
        corruptCode: `function activarMotores() {
  avanzar 3);
}`,
        correctCode: `function activarMotores() {
  avanzar(3);
}`,
        errors: ["Falta paréntesis de apertura"]
    },
    giroscopio: {
        id: "giroscopio",
        name: "Modulo_Giroscopio.js", 
        icon: "⚖️",
        corruptCode: `function estabilizar() {
  if (todoBien == true) {
    console.log("¡Estoy estable!");
  `,
        correctCode: `function estabilizar() {
  if (todoBien == true) {
    console.log("¡Estoy estable!");
  }
}`,
        errors: ["Falta llave de cierre"]
    }
};

// Caracteres para generar contraseña
const passwordChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#-&/@!";

// Estado del juego
let gameState = {
    selectedModule: null,
    completedModules: new Set(),
    audioContext: null,
    moduleStates: {},
    tutorialStep: 0,
    isTyping: false,
    typingTimer: null
};

// Inicializar el juego
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    // Inicializar estado de módulos
    Object.keys(modules).forEach(moduleId => {
        gameState.moduleStates[moduleId] = modules[moduleId].corruptCode;
    });
    
    setupEventListeners();
    initializeAudio();
    showTutorial();
}

function setupEventListeners() {
    // Tutorial
    document.getElementById('tutorialNext').addEventListener('click', () => {
        playSound('menu');
        nextTutorialStep();
    });
    
    document.getElementById('tutorialPrev').addEventListener('click', () => {
        playSound('menu');
        prevTutorialStep();
    });
    
    document.getElementById('tutorialStart').addEventListener('click', () => {
        playSound('success');
        closeTutorial();
    });
    
    // Dots navigation
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            playSound('menu');
            goToTutorialStep(parseInt(dot.dataset.step));
        });
    });

    // Botones de módulos
    document.querySelectorAll('.module-button').forEach(button => {
        button.addEventListener('click', function() {
            playSound('menu');
            const moduleId = this.getAttribute('data-module');
            selectModule(moduleId);
        });
    });

    // Botón de prueba
    document.getElementById('testButton').addEventListener('click', () => {
        playSound('menu');
        testProtocol();
    });
    
    // Botón de copiar contraseña
    document.getElementById('copyPasswordBtn').addEventListener('click', () => {
        playSound('menu');
        copyPassword();
    });
    
    // Botón de regresar
    document.getElementById('returnBtn').addEventListener('click', () => {
        playSound('menu');
        window.open('https://gnius-club.github.io/AURORA', '_blank');
    });

    // Cerrar mensaje de feedback al hacer clic
    document.getElementById('feedbackMessage').addEventListener('click', hideFeedback);

    // Guardar cambios en el editor y reproducir sonido de tecleo
    const editor = document.getElementById('codeEditor');
    editor.addEventListener('input', function() {
        if (gameState.selectedModule) {
            gameState.moduleStates[gameState.selectedModule] = editor.value;
        }
        
        // Sonido de tecleo (throttled)
        if (!gameState.isTyping) {
            gameState.isTyping = true;
            playSound('typing');
            
            clearTimeout(gameState.typingTimer);
            gameState.typingTimer = setTimeout(() => {
                gameState.isTyping = false;
            }, 100);
        }
    });
}

// Tutorial Functions
function showTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'flex';
    updateTutorialDisplay();
}

function closeTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'none';
    showWelcomeMessage();
}

function nextTutorialStep() {
    if (gameState.tutorialStep < 3) {
        gameState.tutorialStep++;
        updateTutorialDisplay();
    }
}

function prevTutorialStep() {
    if (gameState.tutorialStep > 0) {
        gameState.tutorialStep--;
        updateTutorialDisplay();
    }
}

function goToTutorialStep(step) {
    gameState.tutorialStep = step;
    updateTutorialDisplay();
}

function updateTutorialDisplay() {
    // Update steps
    document.querySelectorAll('.tutorial-step').forEach((step, index) => {
        step.classList.toggle('active', index === gameState.tutorialStep);
    });
    
    // Update dots
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === gameState.tutorialStep);
    });
    
    // Update navigation buttons
    document.getElementById('tutorialPrev').disabled = gameState.tutorialStep === 0;
    document.getElementById('tutorialNext').style.display = gameState.tutorialStep === 3 ? 'none' : 'block';
    document.getElementById('tutorialStart').classList.toggle('hidden', gameState.tutorialStep !== 3);
}

function initializeAudio() {
    try {
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.log('Web Audio API no disponible');
    }
}

function showWelcomeMessage() {
    const editor = document.getElementById('codeEditor');
    editor.value = `// BIENVENIDO A A.U.R.O.R.A., CADETE
// 
// Los sistemas están dañados y necesitan reparación.
// Selecciona un módulo de la izquierda para comenzar.
// 
// Usa tu Caja de Herramientas para corregir los errores.
// ¡Buena suerte!`;
    editor.disabled = true;
}

function selectModule(moduleId) {
    const module = modules[moduleId];
    if (!module) return;

    // Guardar el código actual del editor si hay un módulo seleccionado
    if (gameState.selectedModule) {
        const editor = document.getElementById('codeEditor');
        gameState.moduleStates[gameState.selectedModule] = editor.value;
    }

    // Actualizar estado
    gameState.selectedModule = moduleId;

    // Actualizar UI
    updateModuleSelection(moduleId);
    loadModuleCode(module);
}

function updateModuleSelection(moduleId) {
    // Remover selección anterior
    document.querySelectorAll('.module-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Agregar selección actual
    const selectedButton = document.getElementById(`module-${moduleId}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

function loadModuleCode(module) {
    const editor = document.getElementById('codeEditor');
    
    // Cargar el código desde el estado guardado
    editor.value = gameState.moduleStates[module.id];
    editor.disabled = false;
    
    // Efecto de carga
    editor.style.opacity = '0.5';
    setTimeout(() => {
        editor.style.opacity = '1';
        editor.focus();
    }, 200);
}

function testProtocol() {
    if (!gameState.selectedModule) {
        showFeedback('¡Primero selecciona un módulo, Cadete!', 'error');
        return;
    }

    const editor = document.getElementById('codeEditor');
    const userCode = editor.value.trim();
    const module = modules[gameState.selectedModule];
    
    // Normalizar ambos códigos para una comparación más flexible
    const normalizedUserCode = normalizeCode(userCode);
    const normalizedExpectedCode = normalizeCode(module.correctCode);

    console.log('=== VERIFICACIÓN DE CÓDIGO ===');
    console.log('Módulo:', module.name);
    console.log('Usuario (original):', userCode);
    console.log('Usuario (normalizado):', normalizedUserCode);
    console.log('Esperado (normalizado):', normalizedExpectedCode);
    console.log('Coincide:', normalizedUserCode === normalizedExpectedCode);

    // Verificar si el código es correcto
    if (normalizedUserCode === normalizedExpectedCode) {
        handleSuccess(module);
    } else {
        handleError(module);
    }
}

function normalizeCode(code) {
    return code
        // Normalizar saltos de línea
        .replace(/\r\n/g, '\n')
        // Eliminar comentarios de línea
        .replace(/\/\/.*$/gm, '')
        // Eliminar espacios en blanco al inicio y final de cada línea
        .split('\n')
        .map(line => line.trim())
        // Filtrar líneas vacías
        .filter(line => line.length > 0)
        // Rejoin y normalizar espacios
        .join('\n')
        // Normalizar espacios múltiples a uno solo
        .replace(/\s+/g, ' ')
        // Eliminar espacios alrededor de símbolos importantes
        .replace(/\s*([{}();,])\s*/g, '$1')
        // Eliminar espacios alrededor de operadores
        .replace(/\s*(==|!=|<=|>=|<|>|=|\+|\-|\*|\/)\s*/g, '$1')
        // Limpiar espacios alrededor de saltos de línea
        .replace(/\s*\n\s*/g, '\n')
        .trim();
}

function handleSuccess(module) {
    // Marcar módulo como completado
    gameState.completedModules.add(module.id);
    
    // Actualizar indicador visual
    const statusIndicator = document.getElementById(`status-${module.id}`);
    if (statusIndicator) {
        statusIndicator.textContent = '🟢';
        statusIndicator.classList.remove('pulse');
        statusIndicator.classList.add('success');
    }

    // Animación de éxito en el icono
    const moduleButton = document.getElementById(`module-${module.id}`);
    const icon = moduleButton.querySelector('.module-icon');
    icon.style.transform = 'scale(1.5)';
    icon.style.textShadow = '0 0 20px #00ff00';
    
    setTimeout(() => {
        icon.style.transform = 'scale(1)';
        icon.style.textShadow = 'none';
    }, 1000);

    // Reproducir sonido de éxito
    playSound('success');
    
    // Mostrar mensaje de éxito
    showFeedback(`¡Protocolo ${module.name} estabilizado! ¡Buen trabajo, Cadete!`, 'success');

    // Actualizar el estado guardado con el código correcto
    gameState.moduleStates[module.id] = module.correctCode;

    // Verificar si la misión está completa
    setTimeout(checkMissionComplete, 1500);
}

function handleError(module) {
    // Animación de error en el botón de prueba
    const testButton = document.getElementById('testButton');
    testButton.classList.add('shake');
    
    setTimeout(() => {
        testButton.classList.remove('shake');
    }, 500);

    // Reproducir sonido de error
    playSound('error');
    
    // Mostrar mensaje de error con pistas específicas
    const hints = {
        luces: 'Pista: Revisa las comillas alrededor del texto y el punto y coma al final',
        motores: 'Pista: Falta un paréntesis de apertura en la función avanzar',
        giroscopio: 'Pista: Faltan llaves de cierre para el if y la función'
    };
    
    const hint = hints[module.id] || '';
    showFeedback(`¡Casi, Cadete! Todavía hay errores en este protocolo. ${hint}`, 'error');
}

function checkMissionComplete() {
    if (gameState.completedModules.size === Object.keys(modules).length) {
        // Todos los módulos completados
        setTimeout(() => {
            showMissionComplete();
        }, 1000);
    }
}

function generatePassword() {
    // Formato: AURORAxMxIxSxIxOxNx2
    const template = "AURORA_M_I_S_I_O_N_2";
    let password = "";
    
    for (let i = 0; i < template.length; i++) {
        if (template[i] === '_') {
            // Reemplazar con carácter aleatorio
            const randomChar = passwordChars[Math.floor(Math.random() * passwordChars.length)];
            password += randomChar;
        } else {
            password += template[i];
        }
    }
    
    return password;
}

function showMissionComplete() {
    // Generar contraseña
    const password = generatePassword();
    
    // Ocultar interfaz del juego
    document.getElementById('gameContainer').style.display = 'none';
    
    // Mostrar pantalla de misión cumplida
    document.getElementById('missionComplete').classList.remove('hidden');
    
    // Mostrar contraseña con efecto de escritura
    const passwordElement = document.getElementById('passwordText');
    passwordElement.textContent = '';
    
    let i = 0;
    const typePassword = () => {
        if (i < password.length) {
            passwordElement.textContent += password[i];
            i++;
            playSound('typing');
            setTimeout(typePassword, 100);
        } else {
            // Guardar contraseña para copiar
            gameState.generatedPassword = password;
        }
    };
    
    // Reproducir sonido de victoria
    playSound('victory');
    
    // Comenzar a escribir la contraseña después de un momento
    setTimeout(typePassword, 1000);
    
    // Animación de A.U.R.O.R.A. despertando
    const auroraEye = document.querySelector('.aurora-eye');
    setTimeout(() => {
        auroraEye.style.animation = 'aurora-pulse 1s infinite';
    }, 500);
}

function copyPassword() {
    if (!gameState.generatedPassword) {
        showFeedback('Error: No hay contraseña para copiar', 'error');
        return;
    }
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(gameState.generatedPassword).then(() => {
        showFeedback('¡Contraseña copiada al portapapeles!', 'success');
    }).catch(() => {
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = gameState.generatedPassword;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showFeedback('¡Contraseña copiada al portapapeles!', 'success');
    });
}

function showFeedback(message, type = 'info') {
    const feedbackElement = document.getElementById('feedbackMessage');
    const feedbackText = document.getElementById('feedbackText');
    
    feedbackText.textContent = message;
    feedbackElement.className = `feedback-message ${type}`;
    feedbackElement.classList.remove('hidden');
    
    // Auto-ocultar después de 3 segundos
    setTimeout(hideFeedback, 3000);
}

function hideFeedback() {
    const feedbackElement = document.getElementById('feedbackMessage');
    feedbackElement.classList.add('hidden');
}

// Sistema de audio mejorado usando Web Audio API
function playSound(type) {
    if (!gameState.audioContext) return;

    const audioContext = gameState.audioContext;
    
    // Asegurar que el contexto esté en estado running
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    let frequency, duration, waveType;
    
    switch (type) {
        case 'menu':
            frequency = 800;
            duration = 0.1;
            waveType = 'sine';
            break;
        case 'typing':
            // Sonido sutil de tecleo
            playTypingSound();
            return;
        case 'success':
            // Sonido de éxito (acorde ascendente)
            playChord([523.25, 659.25, 783.99], 0.5); // C-E-G
            return;
        case 'error':
            // Sonido de error (tono bajo y distorsionado)
            playErrorSound();
            return;
        case 'victory':
            // Sonido de victoria (melodía triunfal)
            playMelody([523, 659, 784, 1047], [0.2, 0.2, 0.2, 0.4]);
            return;
        default:
            return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = waveType;
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playTypingSound() {
    if (!gameState.audioContext) return;

    const audioContext = gameState.audioContext;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sonido de tecleo más sutil y variado
    const baseFreq = 1200;
    const variation = Math.random() * 200 - 100;
    oscillator.frequency.setValueAtTime(baseFreq + variation, audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

function playErrorSound() {
    if (!gameState.audioContext) return;

    const audioContext = gameState.audioContext;
    
    // Sonido de error con múltiples tonos disonantes
    [200, 150, 180].forEach((freq, index) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }, index * 50);
    });
}

function playChord(frequencies, duration) {
    if (!gameState.audioContext) return;

    const audioContext = gameState.audioContext;
    
    frequencies.forEach((freq, index) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        }, index * 100);
    });
}

function playMelody(frequencies, durations) {
    if (!gameState.audioContext) return;

    const audioContext = gameState.audioContext;
    let currentTime = audioContext.currentTime;
    
    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, currentTime);
        oscillator.type = 'square';
        
        const duration = durations[index] || 0.2;
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
        
        currentTime += duration + 0.05;
    });
}

// Manejo de errores globales
window.addEventListener('error', function(e) {
    console.error('Error en A.U.R.O.R.A.:', e.error);
    showFeedback('Error del sistema detectado. Reiniciando protocolos...', 'error');
});

// Prevenir que el usuario salga accidentalmente
window.addEventListener('beforeunload', function(e) {
    if (gameState.completedModules.size > 0 && gameState.completedModules.size < Object.keys(modules).length) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres abandonar la misión?';
    }
});

console.log('🚀 A.U.R.O.R.A. Sistema inicializado correctamente');
console.log('📡 Listos para Misión 1: Inspección de Protocolos');
console.log('🔊 Sistema de audio mejorado activado');
console.log('📚 Tutorial interactivo disponible');
console.log('🔧 Validación de código mejorada');
