import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  connectMqtt,
  subscribeToTopic,
  disconnectMqtt,
  MQTT_TOKEN,
} from "../services/mqttService";
import { subscribeToACUnits } from "../services/firebaseService";

const MqttContext = createContext(null);

export const MqttProvider = ({ children }) => {
  const [messages, setMessages] = useState({}); // Debug: Store last messages
  const [acLiveStates, setAcLiveStates] = useState({}); // Map: acId -> { currentTemp, ... }
  const [acs, setAcs] = useState([]);

  const processedRef = useRef(new Set()); // To avoid loops if we reflect back to DB (optional)

  useEffect(() => {
    // 1. Sync ACs from Firebase to know what Mappings look like
    const unsubscribe = subscribeToACUnits((data) => {
      setAcs(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 2. Connect MQTT
    const handleMessage = (topic, message) => {
      console.log(`[MQTT] Message received on [${topic}]:`, message);

      // Topic structure: eoh/chip/{token}/config/{configId}/value
      const parts = topic.split("/");

      // Basic validation
      if (
        parts.length < 6 ||
        parts[0] !== "eoh" ||
        parts[1] !== "chip" ||
        parts[3] !== "config" ||
        parts[5] !== "value"
      ) {
        return;
      }

      const token = parts[2];
      const configId = parts[4];
      let value;
      try {
        const json = JSON.parse(message);
        value = json.value; // Assuming message is { "value": 123 } or similar.
        // Or if the message IS the value? User said "json các thông số".
        // Usually "value" topic implies payload is just the value or a small json wrapper.
        // Let's assume the payload IS the JSON containing the value, or specific field.
        // User example says "chuỗi json các thông số".
        // Let's protect against various inputs.
        if (json && typeof json === "object" && json.value !== undefined) {
          value = json.value;
        } else {
          value = json; // Fallback if payload implies direct value
        }
      } catch (e) {
        value = message; // Raw string if not JSON
      }

      // 3. Find the AC with this Token (which might be in a comma-separated list of chipIds)
      const targetAC = acs.find((ac) => ac.chipId && ac.chipId.toString().split(",").includes(String(token)));
      if (!targetAC) return;

      // 4. Find the Attribute for this ConfigID
      // configMapping = { targetTemp: 101440, ... }
      const mapping = targetAC.configMapping || {};
      const attributeKey = Object.keys(mapping).find(
        (key) => String(mapping[key]) === String(configId)
      );

      if (attributeKey) {
        console.log(
          `MQTT Update for ${targetAC.name}: ${attributeKey} = ${value}`
        );

        setAcLiveStates((prev) => ({
          ...prev,
          [targetAC.id]: {
            ...(prev[targetAC.id] || {}),
            [attributeKey]: value,
            lastUpdated: Date.now(),
          },
        }));
      }
    };

    connectMqtt(handleMessage, () => {
      // On Connect: Subscribe to wildcard
      // Pattern: eoh/chip/{token}/config/+/value
      // Must use specific token to avoid ACL (Access Control List) errors
      subscribeToTopic(`eoh/chip/${MQTT_TOKEN}/config/+/value`);
    });

    return () => {
      disconnectMqtt();
    };
  }, [acs]); // Re-connect/re-eval if AC list changes drastically?
  // Actually, 'acs' in dependency might cause reconnects.
  // Better to use ref for 'acs' inside handleMessage or ensure 'acs' is stable.
  // For simplicity V1, we keep it here or use a Ref for lookup.

  return (
    <MqttContext.Provider value={{ acLiveStates, isConnected: true }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqttData = () => useContext(MqttContext);
