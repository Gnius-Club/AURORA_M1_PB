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

// Estado del juego
let gameState = {
    selectedModule: null,
    completedModules: new Set(),
    audioContext: null,
    moduleStates: {} // Para guardar el código editado de cada módulo
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
    showWelcomeMessage();
}

function setupEventListeners() {
    // Botones de módulos
    document.querySelectorAll('.module-button').forEach(button => {
        button.addEventListener('click', function() {
            const moduleId = this.getAttribute('data-module');
            selectModule(moduleId);
        });
    });

    // Botón de prueba
    document.getElementById('testButton').addEventListener('click', testProtocol);
    
    // Botón de continuar
    document.getElementById('continueButton').addEventListener('click', function() {
        showFeedback('¡Preparándote para la Misión 2! 🚀', 'success');
        setTimeout(() => {
            location.reload(); // En una versión real, navegar a la siguiente misión
        }, 2000);
    });

    // Cerrar mensaje de feedback al hacer clic
    document.getElementById('feedbackMessage').addEventListener('click', hideFeedback);

    // Guardar cambios en el editor cuando se modifica el contenido
    const editor = document.getElementById('codeEditor');
    editor.addEventListener('input', function() {
        if (gameState.selectedModule) {
            gameState.moduleStates[gameState.selectedModule] = editor.value;
        }
    });
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
    
    // Reproducir sonido de selección
    playSound('select');
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

    console.log('Comparando códigos:');
    console.log('Usuario:', normalizedUserCode);
    console.log('Esperado:', normalizedExpectedCode);
    console.log('Coincide:', normalizedUserCode === normalizedExpectedCode);

    // Verificar si el código es correcto
    if (normalizedUserCode === normalizedExpectedCode) {
        handleSuccess(module);
    } else {
        handleError(module);
    }
}

function normalizeCode(code) {
    // Normalizar el código para comparación más flexible
    return code
        .replace(/\r\n/g, '\n') // Normalizar saltos de línea
        .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
        .replace(/\s*([{}();,])\s*/g, '$1') // Eliminar espacios alrededor de símbolos
        .replace(/\s*\n\s*/g, '\n') // Limpiar espacios alrededor de saltos de línea
        .trim(); // Eliminar espacios al inicio y final
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
    
    // Mostrar mensaje de error
    showFeedback('¡Casi, Cadete! Todavía hay errores en este plano. ¡Usa tu caja de herramientas y vuelve a intentarlo!', 'error');
}

function checkMissionComplete() {
    if (gameState.completedModules.size === Object.keys(modules).length) {
        // Todos los módulos completados
        setTimeout(() => {
            showMissionComplete();
        }, 1000);
    }
}

function showMissionComplete() {
    // Ocultar interfaz del juego
    document.getElementById('gameContainer').style.display = 'none';
    
    // Mostrar pantalla de misión cumplida
    document.getElementById('missionComplete').classList.remove('hidden');
    
    // Reproducir sonido de victoria
    playSound('victory');
    
    // Animación de A.U.R.O.R.A. despertando
    const auroraEye = document.querySelector('.aurora-eye');
    setTimeout(() => {
        auroraEye.style.animation = 'aurora-pulse 1s infinite';
    }, 500);
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

// Sistema de audio usando Web Audio API
function playSound(type) {
    if (!gameState.audioContext) return;

    const audioContext = gameState.audioContext;
    
    // Asegurar que el contexto esté en estado running
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    let frequency, duration, waveType;
    
    switch (type) {
        case 'select':
            frequency = 800;
            duration = 0.1;
            waveType = 'sine';
            break;
        case 'success':
            // Sonido de éxito (acorde ascendente)
            playChord([523.25, 659.25, 783.99], 0.5); // C-E-G
            return;
        case 'error':
            frequency = 200;
            duration = 0.3;
            waveType = 'sawtooth';
            break;
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