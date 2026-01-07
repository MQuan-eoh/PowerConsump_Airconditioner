import mqtt from "mqtt";

// Shared Credentials
export const MQTT_TOKEN = "4d7a31dd-03cf-4d3c-ada4-0326fb60421c";

// Client instance
let client = null;

export const connectMqtt = (onMessage, onConnect) => {
  if (client) return client;
  const username = MQTT_TOKEN;
  const password = MQTT_TOKEN;
  const clientId = `mqtt_web_${Math.random().toString(16).slice(3)}`;
  const host = "mqtt1.eoh.io";
  const protocol = "wss";
  const port = 8084;

  const connectUrl = `${protocol}://${host}:${port}`;
  console.log(
    `[MQTT] Connecting to ${connectUrl} (Protocol: ${window.location.protocol})`
  );

  // Connect using the imported library
  client = mqtt.connect(connectUrl, {
    clientId,
    username,
    password,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 2000,
  });
  client.on("connect", () => {
    console.log("Connected to MQTT Broker");
    if (onConnect) onConnect();
  });

  client.on("message", (topic, payload) => {
    try {
      const message = payload.toString();
      onMessage(topic, message);
    } catch (err) {
      console.error("Failed to process MQTT message:", err);
    }
  });

  client.on("error", (err) => {
    console.error("Connection error: ", err);
    client.end();
  });

  return client;
};

export const subscribeToTopic = (topic) => {
  if (client) {
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Subscribe to ${topic} error:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  }
};

export const unsubscribeFromTopic = (topic) => {
  if (client) {
    client.unsubscribe(topic);
  }
};

export const disconnectMqtt = () => {
  if (client) {
    client.end();
    client = null;
  }
};
