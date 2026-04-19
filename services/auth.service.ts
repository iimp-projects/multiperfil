import axios from "axios";
import { ApiResponse, LoginRequest, User, RecoveryResponse } from "../types/auth";
import api from "./api";
import { getDynamicEventCode } from "@/lib/utils/event";
import { ResetPasswordRequest } from "@/types/auth";

export const authService = {
  login: async (request: LoginRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = (await response.json()) as ApiResponse<User>;
      return data;
    } catch (error: unknown) {
      console.error("Login Error:", error);

      let errorMessage = "Error al conectar con el servidor";

      if (axios.isAxiosError(error)) {
        if (
          error.code === "ERR_NAME_NOT_RESOLVED" ||
          error.message?.includes("Network Error")
        ) {
          errorMessage =
            "Error de conexión: El servidor no está disponible en este momento.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  recoveryPassword: async (
    email: string,
    vertical: string,
  ): Promise<RecoveryResponse> => {
    try {
      const eventCode = getDynamicEventCode(vertical);

      const payload = {
        event: eventCode,
        email: email,
      };

      console.log("🚀 Payload enviado a la API (Recovery):", payload);

      const response = await api.post<RecoveryResponse>(
        "/recoverypass",
        payload,
      );
      console.log("📥 Respuesta de la API (Recovery):", response.data);

      return response.data;
    } catch (error: unknown) {
      console.error("Recovery Error:", error);

      let errorMessage = "Error al procesar la solicitud";

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  resetPassword: async (
    request: ResetPasswordRequest,
  ): Promise<ApiResponse<unknown>> => {
    try {
      console.log("🚀 Payload enviado a la API (Reset Password):", request);

      const response = await api.post<ApiResponse<unknown>>(
        "/resetpassword",
        request,
      );
      console.log("📥 Respuesta de la API (Reset Password):", response.data);

      return response.data;
    } catch (error: unknown) {
      console.error("Reset Password Error:", error);

      let errorMessage = "Error al cambiar la contraseña";

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },
};
