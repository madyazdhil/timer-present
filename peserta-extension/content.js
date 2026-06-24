// --- DOM Elements Injection ---
const timerContainer = document.createElement("div");
timerContainer.id = "kalananti-timer-container";
timerContainer.innerHTML = `
    <span class="label">SISA WAKTU</span>
    <span id="kalananti-timer-val">03:00</span>
`;

const timesUpOverlay = document.createElement("div");
timesUpOverlay.id = "kalananti-timesup-overlay";
timesUpOverlay.innerHTML = `
    <h1>Waktu Habis!</h1>
    <p>Silakan akhiri presentasi Anda.</p>
`;

// Inject iframe MQTT yang kebal terhadap CSP web tujuan
const iframe = document.createElement("iframe");
iframe.src = chrome.runtime.getURL("mqtt_client.html");
iframe.style.display = "none"; // Sembunyikan iframe

document.body.appendChild(timerContainer);
document.body.appendChild(timesUpOverlay);
document.body.appendChild(iframe);

const timerVal = document.getElementById("kalananti-timer-val");

// Format seconds to mm:ss
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

window.timerInterval = null;

// Dengarkan pesan dari iframe MQTT
window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "KALANANTI_TIMER") {
        const payload = event.data.payload;
        
        switch (payload.action) {
            case "show":
                timerContainer.classList.add("show");
                timesUpOverlay.classList.remove("show");
                break;
            case "hide":
                if (window.timerInterval) clearInterval(window.timerInterval);
                timerContainer.classList.remove("show");
                timesUpOverlay.classList.remove("show");
                break;
            case "start":
                timerContainer.classList.add("show");
                timesUpOverlay.classList.remove("show");
                
                let targetEndTime = Date.now() + (payload.seconds * 1000);
                if (window.timerInterval) clearInterval(window.timerInterval);
                
                timerVal.textContent = formatTime(payload.seconds);
                window.timerInterval = setInterval(() => {
                    let remain = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
                    timerVal.textContent = formatTime(remain);
                    if (remain <= 0) {
                        clearInterval(window.timerInterval);
                        timerContainer.classList.remove("show");
                        timesUpOverlay.classList.add("show");
                    }
                }, 200);
                break;
            case "pause":
                if (window.timerInterval) clearInterval(window.timerInterval);
                timerContainer.classList.add("show");
                timerVal.textContent = formatTime(payload.seconds);
                break;
            case "timesup":
                if (window.timerInterval) clearInterval(window.timerInterval);
                timerContainer.classList.remove("show");
                timesUpOverlay.classList.add("show");
                break;
        }
    }
});
