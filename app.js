// --- INICIO DEL ARCHIVO app.js ---

// Datos de los módulos (REDiseñados para cumplir las especificaciones)
const modules = {
    luces: {
        id: "luces",
        name: "Modulo_Luces.js",
        icon: "💡",
        // Código de 7 líneas con 2 errores (comillas y punto y coma)
        corruptCode: `// Protocolo de iluminación de la nave.
function activarLuces() {

  reportar(Estado de luces: Activado)
  
  verificarBateria()

}`,
        correctCode: `// Protocolo de iluminación de la nave.
function activarLuces() {

  reportar("Estado de luces: Activado");
  
  verificarBateria();

}`,
        errors: ["Revisa las 'burbujas de texto' (comillas)", "Falta un 'punto final' (;)"]
    },
    motores: {
        id: "motores", 
        name: "Modulo_Motores.js",
        icon: "⚙️",
        // Código de 8 líneas con 2 errores (paréntesis y punto y coma)
        corruptCode: `// Sistema de propulsión principal.
function encenderMotores() {

  console.log("Iniciando secuencia...");

  ajustarPotencia 100)

  revisarInyectores()

}`,
        correctCode: `// Sistema de propulsión principal.
function encenderMotores() {

  console.log("Iniciando secuencia...");

  ajustarPotencia(100);

  revisarInyectores();

}`,
        errors: ["Revisa los 'contenedores' de la función ()", "No olvides el 'punto final' (;)"]
    },
    giroscopio: {
        id: "giroscopio",
        name: "Modulo_Giroscopio.js", 
        icon: "⚖️",
        // Código de 8 líneas con 1 error (llave de cierre)
        corruptCode: `// Módulo de estabilización.
function estabilizar() {

  if (naveInestable == true) {
    console.log("¡Corrigiendo trayectoria!");
    activarEstabilizadores();
  
  console.log("Sistema estable.");`,
        correctCode: `// Módulo de estabilización.
function estabilizar() {

  if (naveInestable == true) {
    console.log("¡Corrigiendo trayectoria!");
    activarEstabilizadores();
  }
  
  console.log("Sistema estable.");
}`,
        errors: ["Asegúrate de cerrar todos los 'abrazos de grupo' {}"]
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
    typingTimer: null,
    timerInterval: null,
    startTime: null,
    generatedPassword: null
};

document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
    Object.keys(modules).forEach(moduleId => {
        gameState.moduleStates[moduleId] = modules[moduleId].corruptCode;
    });
    
    setupEventListeners();
    initializeAudio();
    showTutorial();
}

function setupEventListeners() {
    document.getElementById('tutorialNext').addEventListener('click', () => { playSound('menu'); nextTutorialStep(); });
    document.getElementById('tutorialPrev').addEventListener('click', () => { playSound('menu'); prevTutorialStep(); });
    document.getElementById('tutorialStart').addEventListener('click', () => { playSound('success'); closeTutorial(); });
    document.querySelectorAll('.dot').forEach(dot => dot.addEventListener('click', () => { playSound('menu'); goToTutorialStep(parseInt(dot.dataset.step)); }));
    document.querySelectorAll('.module-button').forEach(button => button.addEventListener('click', function() { playSound('menu'); selectModule(this.dataset.module); }));
    document.getElementById('testButton').addEventListener('click', () => { playSound('menu'); testProtocol(); });
    document.getElementById('copyPasswordBtn').addEventListener('click', () => { playSound('menu'); copyPassword(); });
    document.getElementById('returnBtn').addEventListener('click', () => { playSound('menu'); window.open('https://gnius-club.github.io/AURORA', '_blank'); });
    document.getElementById('feedbackMessage').addEventListener('click', hideFeedback);

    const editor = document.getElementById('codeEditor');
    editor.addEventListener('input', function() {
        if (gameState.selectedModule) {
            gameState.moduleStates[gameState.selectedModule] = editor.value;
        }
        if (!gameState.isTyping) {
            gameState.isTyping = true;
            playSound('typing');
            clearTimeout(gameState.typingTimer);
            gameState.typingTimer = setTimeout(() => { gameState.isTyping = false; }, 100);
        }
    });
}

// --- LÓGICA DEL TUTORIAL ---
function showTutorial() { document.getElementById('tutorialOverlay').style.display = 'flex'; updateTutorialDisplay(); }
function closeTutorial() { document.getElementById('tutorialOverlay').style.display = 'none'; showWelcomeMessage(); startTimer(); }
function nextTutorialStep() { if (gameState.tutorialStep < 3) { gameState.tutorialStep++; updateTutorialDisplay(); } }
function prevTutorialStep() { if (gameState.tutorialStep > 0) { gameState.tutorialStep--; updateTutorialDisplay(); } }
function goToTutorialStep(step) { gameState.tutorialStep = step; updateTutorialDisplay(); }
function updateTutorialDisplay() {
    document.querySelectorAll('.tutorial-step').forEach((step, i) => step.classList.toggle('active', i === gameState.tutorialStep));
    document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === gameState.tutorialStep));
    document.getElementById('tutorialPrev').disabled = gameState.tutorialStep === 0;
    document.getElementById('tutorialNext').style.display = gameState.tutorialStep === 3 ? 'none' : 'block';
    document.getElementById('tutorialStart').classList.toggle('hidden', gameState.tutorialStep !== 3);
}

// --- LÓGICA DEL CRONÓMETRO ---
function startTimer() {
    if (gameState.timerInterval) return;
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 47);
}
function stopTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    const timerEl = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-container');
    if (timerEl && timerContainer) {
        timerEl.style.animation = 'none';
        timerEl.style.color = '#00ff00';
        timerEl.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
        timerContainer.style.borderColor = 'rgba(0, 255, 0, 0.5)';
        timerContainer.style.background = 'rgba(0, 255, 0, 0.1)';
    }
}
function updateTimer() {
    const timerEl = document.getElementById('timer');
    if (!timerEl || !gameState.startTime) return;
    const elapsed = Date.now() - gameState.startTime;
    const mins = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    const ms = String(Math.floor((elapsed % 1000) / 10)).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}:${ms}`;
}

// --- LÓGICA PRINCIPAL DEL JUEGO ---
function initializeAudio() { try { gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.log('Web Audio API no disponible'); } }
function showWelcomeMessage() {
    const editor = document.getElementById('codeEditor');
    editor.value = `// BIENVENIDO A A.U.R.O.R.A., CADETE
//
// Los sistemas están dañados. Repara los 3 módulos.
// Selecciona un módulo para empezar. ¡Suerte!`;
    editor.disabled = true;
}
function selectModule(moduleId) {
    if (!modules[moduleId]) return;
    if (gameState.selectedModule) {
        gameState.moduleStates[gameState.selectedModule] = document.getElementById('codeEditor').value;
    }
    gameState.selectedModule = moduleId;
    updateModuleSelection(moduleId);
    loadModuleCode(modules[moduleId]);
}
function updateModuleSelection(moduleId) {
    document.querySelectorAll('.module-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`module-${moduleId}`).classList.add('active');
}
function loadModuleCode(module) {
    const editor = document.getElementById('codeEditor');
    editor.value = gameState.moduleStates[module.id];
    editor.disabled = false;
    editor.style.opacity = '0.5';
    setTimeout(() => { editor.style.opacity = '1'; editor.focus(); }, 200);
}

function testProtocol() {
    if (!gameState.selectedModule) {
        return showFeedback('¡Primero selecciona un módulo!', 'error');
    }
    const userCode = document.getElementById('codeEditor').value;
    const module = modules[gameState.selectedModule];
    if (normalizeCode(userCode) === normalizeCode(module.correctCode)) {
        handleSuccess(module);
    } else {
        handleError(module);
    }
}

function normalizeCode(code) { return code.replace(/\s/g, ''); }

function handleSuccess(module) {
    gameState.completedModules.add(module.id);
    const statusIndicator = document.getElementById(`status-${module.id}`);
    statusIndicator.textContent = '🟢';
    statusIndicator.classList.remove('pulse');
    const icon = document.querySelector(`#module-${module.id} .module-icon`);
    icon.style.transform = 'scale(1.5)';
    icon.style.textShadow = '0 0 20px #00ff00';
    setTimeout(() => { icon.style.transform = 'scale(1)'; icon.style.textShadow = 'none'; }, 1000);
    playSound('success');
    showFeedback(`¡Protocolo ${module.name} estabilizado!`, 'success');
    gameState.moduleStates[module.id] = module.correctCode;
    setTimeout(checkMissionComplete, 1500);
}
function handleError(module) {
    const testButton = document.getElementById('testButton');
    testButton.classList.add('shake');
    setTimeout(() => testButton.classList.remove('shake'), 500);
    playSound('error');
    const hint = module.errors.join('. ');
    showFeedback(`Error en protocolo. ${hint}`, 'error');
}

function checkMissionComplete() {
    if (gameState.completedModules.size === Object.keys(modules).length) {
        setTimeout(showMissionComplete, 1000);
    }
}
function showMissionComplete() {
    stopTimer();
    const password = generatePassword();
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('missionComplete').classList.remove('hidden');
    const passwordEl = document.getElementById('passwordText');
    passwordEl.textContent = '';
    let i = 0;
    const type = () => {
        if (i < password.length) {
            passwordEl.textContent += password[i++];
            playSound('typing');
            setTimeout(type, 100);
        } else {
            gameState.generatedPassword = password;
        }
    };
    playSound('victory');
    setTimeout(type, 1000);
}
function generatePassword() {
    return "AURORA_M_I_S_I_O_N_2".split('').map(c => c === '_' ? passwordChars[Math.floor(Math.random() * passwordChars.length)] : c).join('');
}
function copyPassword() {
    if (!gameState.generatedPassword) return;
    navigator.clipboard.writeText(gameState.generatedPassword).then(() => showFeedback('¡Contraseña copiada!', 'success'));
}
function showFeedback(message, type = 'info') {
    const fb = document.getElementById('feedbackMessage');
    document.getElementById('feedbackText').textContent = message;
    fb.className = `feedback-message ${type}`;
    fb.classList.remove('hidden');
    setTimeout(hideFeedback, 3000);
}
function hideFeedback() { document.getElementById('feedbackMessage').classList.add('hidden'); }

// --- SISTEMA DE AUDIO (Sin cambios, puedes usar la versión completa anterior) ---
function playSound(type) { if (!gameState.audioContext) return; if(gameState.audioContext.state === 'suspended') gameState.audioContext.resume(); let osc = gameState.audioContext.createOscillator(); let gain = gameState.audioContext.createGain(); osc.connect(gain); gain.connect(gameState.audioContext.destination); switch(type) { case 'menu': osc.frequency.value = 800; gain.gain.exponentialRampToValueAtTime(0.00001, gameState.audioContext.currentTime + 0.1); break; case 'success': osc.frequency.value = 600; setTimeout(() => { osc.frequency.value = 800; }, 100); gain.gain.exponentialRampToValueAtTime(0.00001, gameState.audioContext.currentTime + 0.2); break; case 'error': osc.type = 'sawtooth'; osc.frequency.value = 100; gain.gain.exponentialRampToValueAtTime(0.00001, gameState.audioContext.currentTime + 0.3); break; case 'typing': gain.gain.setValueAtTime(0.1, 0); osc.frequency.value = 1200 + Math.random() * 200; gain.gain.exponentialRampToValueAtTime(0.00001, gameState.audioContext.currentTime + 0.05); break; case 'victory': osc.frequency.value = 523; setTimeout(() => { osc.frequency.value = 659; }, 150); setTimeout(() => { osc.frequency.value = 784; }, 300); setTimeout(() => { osc.frequency.value = 1047; }, 450); gain.gain.exponentialRampToValueAtTime(0.00001, gameState.audioContext.currentTime + 0.6); break;} osc.start(); osc.stop(gameState.audioContext.currentTime + 1); }

// --- MANEJO DE ERRORES Y SALIDA ---
window.addEventListener('error', e => console.error('Error en A.U.R.O.R.A.:', e.error));
window.addEventListener('beforeunload', e => { if (gameState.completedModules.size > 0 && gameState.completedModules.size < Object.keys(modules).length) { e.preventDefault(); e.returnValue = ''; }});

console.log('🚀 A.U.R.O.R.A. Sistema inicializado correctamente');
