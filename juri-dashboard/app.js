// Konfigurasi MQTT
const broker = "broker.emqx.io";
const port = 8084;
const clientId = "juri_" + Math.random().toString(16).substr(2, 8);
const topic = "kalananti/hs/timer/room1";

let client = new Paho.MQTT.Client(broker, port, clientId);

const statusEl = document.getElementById("connection-status");

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

function connectMQTT() {
    client.connect({
        useSSL: true,
        onSuccess: onConnect,
        onFailure: (err) => {
            console.error("MQTT Connect failed", err);
            setTimeout(connectMQTT, 3000);
        }
    });
}

function onConnect() {
    statusEl.textContent = "Connected";
    statusEl.className = "status connected";
    client.subscribe(topic); // Subscribe to sync across multiple juri dashboards
    // REMOVED sendMessage({ action: "hide" }); to prevent resetting timer on refresh
}

function onConnectionLost(responseObject) {
    statusEl.textContent = "Disconnected";
    statusEl.className = "status disconnected";
    if (responseObject.errorCode !== 0) {
        setTimeout(connectMQTT, 2000);
    }
}

function sendMessage(payload) {
    if (client && client.isConnected()) {
        payload.senderId = clientId;
        const message = new Paho.MQTT.Message(JSON.stringify(payload));
        message.destinationName = topic;
        // Removed retained=true as public brokers often drop them silently!
        client.send(message);
    }
}

function onMessageArrived(message) {
    try {
        const payload = JSON.parse(message.payloadString);
        if (payload.senderId === clientId) return; // Abaikan pesan dari diri sendiri

        if (payload.action === "tick" || payload.action === "start") {
            presentTime = payload.seconds;
            presentDisplay.textContent = formatTime(presentTime);
            presentInterval = true;
            updateFocusState();
            btnPStart.disabled = true;
            btnPPause.disabled = false;
            inputPTime.disabled = true;
            
            if (payload.senderId !== clientId) {
                lastPresentTick = Date.now();
                timerWorker.postMessage('stop'); // Yield to the active master
            } else {
                lastPresentTick = Date.now(); // I am the master
            }
        } else if (payload.action === "pause") {
            timerWorker.postMessage('stop');
            presentInterval = false;
            updateFocusState();
            presentTime = payload.seconds;
            presentDisplay.textContent = formatTime(presentTime);
            btnPStart.disabled = false;
            btnPPause.disabled = true;
            inputPTime.disabled = false;
        } else if (payload.action === "timesup") {
            timerWorker.postMessage('stop');
            presentInterval = false;
            updateFocusState();
            presentTime = 0;
            presentDisplay.textContent = formatTime(presentTime);
            btnPStart.disabled = false;
            btnPPause.disabled = true;
            inputPTime.disabled = false;
            flashOverlay?.classList.add('show');
            presentModal?.classList.add('show'); // Tampilkan pop up
        } else if (payload.action === "hide") {
            timerWorker.postMessage('stop');
            presentInterval = false;
            updateFocusState();
            btnPStart.disabled = false;
            btnPPause.disabled = true;
            inputPTime.disabled = false;
        } else if (payload.action === "qna_tick" || payload.action === "qna_start") {
            qnaTime = payload.seconds;
            qnaDisplay.textContent = formatTime(qnaTime);
            qnaInterval = true;
            updateFocusState();
            btnQStart.disabled = true;
            btnQPause.disabled = false;
            inputQTime.disabled = true;
            
            if (payload.senderId !== clientId) {
                lastQnaTick = Date.now();
                timerWorker.postMessage('qna_stop');
            } else {
                lastQnaTick = Date.now();
            }
        } else if (payload.action === "qna_pause") {
            timerWorker.postMessage('qna_stop');
            qnaInterval = false;
            updateFocusState();
            qnaTime = payload.seconds;
            qnaDisplay.textContent = formatTime(qnaTime);
            btnQStart.disabled = false;
            btnQPause.disabled = true;
            inputQTime.disabled = false;
        } else if (payload.action === "qna_reset") {
            timerWorker.postMessage('qna_stop');
            qnaInterval = false;
            updateFocusState();
            qnaTime = payload.seconds;
            qnaDisplay.textContent = formatTime(qnaTime);
            btnQStart.disabled = false;
            btnQPause.disabled = true;
            inputQTime.disabled = false;
        } else if (payload.action === "qna_timesup") {
            timerWorker.postMessage('qna_stop');
            qnaInterval = false;
            updateFocusState();
            qnaTime = 0;
            qnaDisplay.textContent = formatTime(qnaTime);
            btnQStart.disabled = false;
            btnQPause.disabled = true;
            inputQTime.disabled = false;
            qnaModal?.classList.add('show');
            flashOverlay?.classList.add('show'); // Nyalakan flash merah
        }
    } catch (e) {
        console.error("Parse error", e);
    }
}

// State Timer
let presentInterval = false;
let presentTime = 180;

let qnaInterval = false;
let qnaTime = 180;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Update initial display values based on inputs
const inputPTime = document.getElementById("input-present-time");
const inputQTime = document.getElementById("input-qna-time");
const presentDisplay = document.getElementById("present-display");
const qnaDisplay = document.getElementById("qna-display");
const panelsContainer = document.querySelector('.panels');
const presentPanel = document.getElementById('present-panel');
const qnaPanel = document.getElementById('qna-panel');
const qnaModal = document.getElementById('qna-modal');
const presentModal = document.getElementById('present-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnClosePresentModal = document.getElementById('btn-close-present-modal');
const flashOverlay = document.getElementById('flash-overlay');

let lastPresentTick = Date.now();
let lastQnaTick = Date.now();

// Leader election fallback
setInterval(() => {
    if (presentInterval && (Date.now() - lastPresentTick) > 2500) {
        // Master mati / ter-refresh, ambil alih!
        timerWorker.postMessage('start');
        lastPresentTick = Date.now();
    }
    if (qnaInterval && (Date.now() - lastQnaTick) > 2500) {
        timerWorker.postMessage('qna_start');
        lastQnaTick = Date.now();
    }
}, 1000);

// Fungsi untuk menutup modal
btnCloseModal?.addEventListener('click', () => {
    qnaModal?.classList.remove('show');
    flashOverlay?.classList.remove('show');
});

btnClosePresentModal?.addEventListener('click', () => {
    presentModal?.classList.remove('show');
    flashOverlay?.classList.remove('show');
});

function updateFocusState() {
    if (presentInterval) {
        panelsContainer.classList.add('has-focus');
        presentPanel.classList.add('focused');
        qnaPanel.classList.remove('focused');
    } else if (qnaInterval) {
        panelsContainer.classList.add('has-focus');
        qnaPanel.classList.add('focused');
        presentPanel.classList.remove('focused');
    } else {
        // Jika keduanya mati, hapus fokus otomatis (kembali sejajar)
        panelsContainer.classList.remove('has-focus');
        presentPanel.classList.remove('focused');
        qnaPanel.classList.remove('focused');
    }
}

// Fokus manual jika di-klik
presentPanel.addEventListener('click', () => {
    if (!presentInterval && !qnaInterval) {
        panelsContainer.classList.add('has-focus');
        presentPanel.classList.add('focused');
        qnaPanel.classList.remove('focused');
    }
});

qnaPanel.addEventListener('click', () => {
    if (!presentInterval && !qnaInterval) {
        panelsContainer.classList.add('has-focus');
        qnaPanel.classList.add('focused');
        presentPanel.classList.remove('focused');
    }
});

// Tutup fokus jika klik di luar panel (di container)
document.body.addEventListener('click', (e) => {
    if (!presentInterval && !qnaInterval && !e.target.closest('.panel') && !e.target.closest('.controls')) {
        updateFocusState(); // Akan me-reset karena keduanya mati
    }
});

inputPTime.addEventListener('change', () => {
    const val = parseInt(inputPTime.value, 10) || 0;
    presentTime = val * 60;
    presentDisplay.textContent = formatTime(presentTime);
    localStorage.setItem('kalananti_pTime', presentTime);
});

inputQTime.addEventListener('change', () => {
    const val = parseInt(inputQTime.value, 10) || 0;
    qnaTime = val * 60;
    qnaDisplay.textContent = formatTime(qnaTime);
    localStorage.setItem('kalananti_qTime', qnaTime);
});

// INIT: Coba load dari localStorage jika baru refresh
window.addEventListener('load', () => {
    const savedPTime = localStorage.getItem('kalananti_pTime');
    const savedPRunning = localStorage.getItem('kalananti_pRunning');
    const savedQTime = localStorage.getItem('kalananti_qTime');
    const savedQRunning = localStorage.getItem('kalananti_qRunning');

    if (savedPTime) {
        presentTime = parseInt(savedPTime, 10);
        presentDisplay.textContent = formatTime(presentTime);
        if (savedPRunning === 'true' && presentTime > 0) {
            btnPStart.click(); // Auto-resume
        }
    }
    
    if (savedQTime) {
        qnaTime = parseInt(savedQTime, 10);
        qnaDisplay.textContent = formatTime(qnaTime);
        if (savedQRunning === 'true' && qnaTime > 0) {
            btnQStart.click(); // Auto-resume
        }
    }
});

// ===== Web Worker untuk Timer (Anti Throttling di Background) =====
const workerCode = `
    let interval = null;
    let qna_interval = null;
    self.onmessage = function(e) {
        if (e.data === 'start') {
            if (interval) clearInterval(interval);
            interval = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
            if (interval) clearInterval(interval);
            interval = null;
        } else if (e.data === 'qna_start') {
            if (qna_interval) clearInterval(qna_interval);
            qna_interval = setInterval(() => self.postMessage('qna_tick'), 1000);
        } else if (e.data === 'qna_stop') {
            if (qna_interval) clearInterval(qna_interval);
            qna_interval = null;
        }
    };
`;
const blob = new Blob([workerCode], {type: 'application/javascript'});
const timerWorker = new Worker(URL.createObjectURL(blob));

timerWorker.onmessage = function(e) {
    if (e.data === 'tick') {
        tickPresent();
    } else if (e.data === 'qna_tick') {
        tickQnA();
    }
};

// ===== LOGIKA PRESENTASI =====
const btnPStart = document.getElementById("btn-present-start");
const btnPPause = document.getElementById("btn-present-pause");
const btnPReset = document.getElementById("btn-present-reset");

function tickPresent() {
    if (presentTime > 0) {
        presentTime--;
        presentDisplay.textContent = formatTime(presentTime);
        sendMessage({ action: "tick", seconds: presentTime });
        localStorage.setItem('kalananti_pTime', presentTime);
        localStorage.setItem('kalananti_pRunning', 'true');
    } else {
            timerWorker.postMessage('stop');
            presentInterval = false;
            updateFocusState();
            btnPStart.disabled = false;
            btnPPause.disabled = true;
            inputPTime.disabled = false;
            sendMessage({ action: "timesup" });
            flashOverlay?.classList.add('show'); // Nyalakan flash merah
            localStorage.setItem('kalananti_pRunning', 'false');
        }
    }

btnPStart.addEventListener("click", (e) => {
    e.stopPropagation();
    flashOverlay?.classList.remove('show'); // Matikan flash jika mulai lagi
    if (!presentInterval) {
        if (qnaInterval) btnQReset.click();

        // Update target presentTime jika belum mulai atau sudah di-reset
        if (presentTime === parseInt(inputPTime.value) * 60 || presentDisplay.textContent === formatTime(parseInt(inputPTime.value) * 60)) {
            presentTime = parseInt(inputPTime.value) * 60;
        }

        presentInterval = true;
        updateFocusState();
        sendMessage({ action: "tick", seconds: presentTime });
        
        timerWorker.postMessage('start');
        btnPStart.disabled = true;
        btnPPause.disabled = false;
        inputPTime.disabled = true;
        localStorage.setItem('kalananti_pRunning', 'true');
    }
});

btnPPause.addEventListener("click", (e) => {
    e.stopPropagation();
    timerWorker.postMessage('stop');
    presentInterval = false;
    updateFocusState();
    btnPStart.disabled = false;
    btnPPause.disabled = true;
    inputPTime.disabled = false;
    sendMessage({ action: "pause", seconds: presentTime });
    localStorage.setItem('kalananti_pRunning', 'false');
});

btnPReset.addEventListener("click", (e) => {
    e.stopPropagation();
    flashOverlay?.classList.remove('show'); // Matikan flash jika direset
    timerWorker.postMessage('stop');
    presentInterval = false;
    updateFocusState();
    const val = parseInt(inputPTime.value, 10) || 0;
    presentTime = val * 60;
    presentDisplay.textContent = formatTime(presentTime);
    btnPStart.disabled = false;
    btnPPause.disabled = true;
    inputPTime.disabled = false;
    sendMessage({ action: "hide" });
    localStorage.setItem('kalananti_pTime', presentTime);
    localStorage.setItem('kalananti_pRunning', 'false');
});


// ===== LOGIKA QnA =====
const btnQStart = document.getElementById("btn-qna-start");
const btnQPause = document.getElementById("btn-qna-pause");
const btnQReset = document.getElementById("btn-qna-reset");

function tickQnA() {
    if (qnaTime > 0) {
        qnaTime--;
        qnaDisplay.textContent = formatTime(qnaTime);
        sendMessage({ action: "qna_tick", seconds: qnaTime });
        localStorage.setItem('kalananti_qTime', qnaTime);
        localStorage.setItem('kalananti_qRunning', 'true');
    } else {
            timerWorker.postMessage('qna_stop');
            qnaInterval = false;
            updateFocusState();
            btnQStart.disabled = false;
            btnQPause.disabled = true;
            inputQTime.disabled = false;
            sendMessage({ action: "qna_timesup" });
            qnaModal?.classList.add('show');
            flashOverlay?.classList.add('show'); // Nyalakan flash merah
            localStorage.setItem('kalananti_qRunning', 'false');
        }
    }

btnQStart.addEventListener("click", (e) => {
    e.stopPropagation();
    flashOverlay?.classList.remove('show'); // Matikan flash jika mulai lagi
    if (!qnaInterval) {
        if (presentInterval) btnPReset.click();

        if (qnaTime === parseInt(inputQTime.value) * 60 || qnaDisplay.textContent === formatTime(parseInt(inputQTime.value) * 60)) {
            qnaTime = parseInt(inputQTime.value) * 60;
        }

        qnaInterval = true;
        updateFocusState();
        sendMessage({ action: "qna_tick", seconds: qnaTime });
        
        timerWorker.postMessage('qna_start');
        btnQStart.disabled = true;
        btnQPause.disabled = false;
        inputQTime.disabled = true;
        localStorage.setItem('kalananti_qRunning', 'true');
    }
});

btnQPause.addEventListener("click", (e) => {
    e.stopPropagation();
    timerWorker.postMessage('qna_stop');
    qnaInterval = false;
    updateFocusState();
    btnQStart.disabled = false;
    btnQPause.disabled = true;
    inputQTime.disabled = false;
    sendMessage({ action: "qna_pause", seconds: qnaTime });
    localStorage.setItem('kalananti_qRunning', 'false');
});

btnQReset.addEventListener("click", (e) => {
    e.stopPropagation();
    flashOverlay?.classList.remove('show'); // Matikan flash jika direset
    timerWorker.postMessage('qna_stop');
    qnaInterval = false;
    updateFocusState();
    const val = parseInt(inputQTime.value, 10) || 0;
    qnaTime = val * 60;
    qnaDisplay.textContent = formatTime(qnaTime);
    btnQStart.disabled = false;
    btnQPause.disabled = true;
    inputQTime.disabled = false;
    sendMessage({ action: "qna_reset", seconds: qnaTime });
    localStorage.setItem('kalananti_qTime', qnaTime);
    localStorage.setItem('kalananti_qRunning', 'false');
});

connectMQTT();
