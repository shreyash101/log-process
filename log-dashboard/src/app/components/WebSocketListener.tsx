"use client"
import { useEffect } from "react";

export default function WebSocketListener() {
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:4000");

    socket.onopen = () => {
      console.log("✅ WebSocket connected!");
    };

    socket.onerror = (error) => {
      console.error("⚠️ WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WebSocket Message:", data);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket disconnected!");
    };

    return () => {
      socket.close();
    };
  }, []);

  return null;
}