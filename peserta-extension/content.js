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

// Fungsi untuk memutar suara "Time's Up" yang elegan menggunakan Web Audio API
function playChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        
        // Memainkan 3 nada berurutan (Arpeggio)
        const playTone = (freq, startTime, duration) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // Fade in cepat
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Fade out perlahan
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = audioCtx.currentTime;
        playTone(523.25, now, 1.5);       // C5
        playTone(659.25, now + 0.15, 1.5); // E5
        playTone(783.99, now + 0.3, 2.5);  // G5
        playTone(1046.50, now + 0.45, 3.0); // C6
    } catch (e) {
        console.warn('Audio playback failed', e);
    }
}

function playChimeRepeatedly(times) {
    let count = 0;
    function playAndSchedule() {
        if (count < times) {
            playChime();
            count++;
            if (count < times) {
                setTimeout(playAndSchedule, 4000); // Jeda 4 detik antar putaran
            }
        }
    }
    playAndSchedule();
}

// Fitur menghindar jika didekati mouse
timerContainer.addEventListener("mouseenter", () => {
    timerContainer.classList.toggle("left");
});

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
                timerContainer.classList.remove("show");
                timesUpOverlay.classList.remove("show");
                break;
            case "tick":
                timerContainer.classList.add("show");
                timesUpOverlay.classList.remove("show");
                timerVal.textContent = formatTime(payload.seconds);
                break;
            case "pause":
                timerContainer.classList.add("show");
                timerVal.textContent = formatTime(payload.seconds);
                break;
            case "timesup":
                timerContainer.classList.remove("show");
                
                // Cegah spam bunyi jika sudah muncul
                if (!timesUpOverlay.classList.contains("show")) {
                    timesUpOverlay.classList.add("show");
                    playChimeRepeatedly(5); // Putar musik penanda 5 kali
                }
                break;
        }
    }
});
