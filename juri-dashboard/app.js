// Konfigurasi MQTT
const broker = "broker.hivemq.com";
const port = 8000;
const clientId = "juri_" + Math.random().toString(16).substr(2, 8);
const topic = "kalananti/hs/timer/room1";

let client = new Paho.MQTT.Client(broker, port, clientId);

const statusEl = document.getElementById("connection-status");

client.onConnectionLost = onConnectionLost;

function connectMQTT() {
    client.connect({
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
    sendMessage({ action: "hide" });
}

function onConnectionLost(responseObject) {
    statusEl.textContent = "Disconnected";
    statusEl.className = "status disconnected";
    if (responseObject.errorCode !== 0) {
        setTimeout(connectMQTT, 2000);
    }
}

function sendMessage(payloadObj) {
    if (client.isConnected()) {
        const message = new Paho.MQTT.Message(JSON.stringify(payloadObj));
        message.destinationName = topic;
        client.send(message);
    }
}

// State Timer
let presentInterval = null;
let presentTime = 180;

let qnaInterval = null;
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

inputPTime.addEventListener("change", () => {
    if (!presentInterval) {
        presentTime = parseInt(inputPTime.value) * 60;
        presentDisplay.textContent = formatTime(presentTime);
    }
});

inputQTime.addEventListener("change", () => {
    if (!qnaInterval) {
        qnaTime = parseInt(inputQTime.value) * 60;
        qnaDisplay.textContent = formatTime(qnaTime);
    }
});

// Init on load
presentDisplay.textContent = formatTime(parseInt(inputPTime.value) * 60);
qnaDisplay.textContent = formatTime(parseInt(inputQTime.value) * 60);

// ===== LOGIKA PRESENTASI =====
const btnPStart = document.getElementById("btn-present-start");
const btnPPause = document.getElementById("btn-present-pause");
const btnPReset = document.getElementById("btn-present-reset");

function tickPresent() {
    if (presentTime > 0) {
        presentTime--;
        presentDisplay.textContent = formatTime(presentTime);
        sendMessage({ action: "tick", seconds: presentTime });
    } else {
        clearInterval(presentInterval);
        presentInterval = null;
        btnPStart.disabled = false;
        btnPPause.disabled = true;
        inputPTime.disabled = false;
        sendMessage({ action: "timesup" });
    }
}

btnPStart.addEventListener("click", () => {
    if (!presentInterval) {
        if (qnaInterval) btnQReset.click();

        // Update target presentTime jika belum mulai
        if (presentTime === parseInt(inputPTime.value) * 60 || presentDisplay.textContent === formatTime(parseInt(inputPTime.value) * 60)) {
            presentTime = parseInt(inputPTime.value) * 60;
        }

        sendMessage({ action: "show" });
        
        presentInterval = setInterval(tickPresent, 1000);
        btnPStart.disabled = true;
        btnPPause.disabled = false;
        inputPTime.disabled = true;
    }
});

btnPPause.addEventListener("click", () => {
    if (presentInterval) {
        clearInterval(presentInterval);
        presentInterval = null;
        btnPStart.disabled = false;
        btnPPause.disabled = true;
        inputPTime.disabled = false;
        sendMessage({ action: "pause", seconds: presentTime });
    }
});

btnPReset.addEventListener("click", () => {
    clearInterval(presentInterval);
    presentInterval = null;
    presentTime = parseInt(inputPTime.value) * 60;
    presentDisplay.textContent = formatTime(presentTime);
    btnPStart.disabled = false;
    btnPPause.disabled = true;
    inputPTime.disabled = false;
    sendMessage({ action: "hide" });
});


// ===== LOGIKA QnA =====
const btnQStart = document.getElementById("btn-qna-start");
const btnQPause = document.getElementById("btn-qna-pause");
const btnQReset = document.getElementById("btn-qna-reset");

function tickQnA() {
    if (qnaTime > 0) {
        qnaTime--;
        qnaDisplay.textContent = formatTime(qnaTime);
    } else {
        clearInterval(qnaInterval);
        qnaInterval = null;
        btnQStart.disabled = false;
        btnQPause.disabled = true;
        inputQTime.disabled = false;
        alert("Waktu Q&A Habis!");
    }
}

btnQStart.addEventListener("click", () => {
    if (!qnaInterval) {
        if (presentInterval) btnPReset.click();
        sendMessage({ action: "hide" });

        if (qnaTime === parseInt(inputQTime.value) * 60 || qnaDisplay.textContent === formatTime(parseInt(inputQTime.value) * 60)) {
            qnaTime = parseInt(inputQTime.value) * 60;
        }

        qnaInterval = setInterval(tickQnA, 1000);
        btnQStart.disabled = true;
        btnQPause.disabled = false;
        inputQTime.disabled = true;
    }
});

btnQPause.addEventListener("click", () => {
    if (qnaInterval) {
        clearInterval(qnaInterval);
        qnaInterval = null;
        btnQStart.disabled = false;
        btnQPause.disabled = true;
        inputQTime.disabled = false;
    }
});

btnQReset.addEventListener("click", () => {
    clearInterval(qnaInterval);
    qnaInterval = null;
    qnaTime = parseInt(inputQTime.value) * 60;
    qnaDisplay.textContent = formatTime(qnaTime);
    btnQStart.disabled = false;
    btnQPause.disabled = true;
    inputQTime.disabled = false;
});

connectMQTT();
