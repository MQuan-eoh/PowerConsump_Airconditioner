import { create } from "zustand";

export const useMqttStore = create((set) => ({
  acLiveStates: {},
  isConnected: false,
  setAcLiveState: (acId, attributeKey, value) =>
    set((state) => ({
      acLiveStates: {
        ...state.acLiveStates,
        [acId]: {
          ...(state.acLiveStates[acId] || {}),
          [attributeKey]: value,
          lastUpdated: Date.now(),
        },
      },
    })),
  setIsConnected: (status) => set({ isConnected: status }),
}));
