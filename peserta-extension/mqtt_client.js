const broker = "broker.hivemq.com";
const port = 8000;
const clientId = "peserta_" + Math.random().toString(16).substr(2, 8);
const topic = "kalananti/hs/timer/room1";

let client = null;

function connectMQTT() {
    if (typeof Paho === "undefined") {
        setTimeout(connectMQTT, 500);
        return;
    }

    client = new Paho.MQTT.Client(broker, port, clientId);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({
        onSuccess: () => {
            console.log("Kalananti Timer Iframe: Connected to Juri");
            client.subscribe(topic);
        },
        onFailure: (err) => {
            console.error("Kalananti Timer Iframe: MQTT Connect failed", err);
            setTimeout(connectMQTT, 3000);
        }
    });
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Kalananti Timer Iframe: Connection lost, reconnecting...");
        setTimeout(connectMQTT, 2000);
    }
}

function onMessageArrived(message) {
    try {
        const payload = JSON.parse(message.payloadString);
        // Teruskan data ke parent window (content.js)
        window.parent.postMessage({ type: "KALANANTI_TIMER", payload: payload }, "*");
    } catch (e) {
        console.error("Invalid message format", e);
    }
}

connectMQTT();
