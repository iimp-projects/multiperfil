import axios from "axios";
import { ApiResponse, SaveDataRequest, User } from "../types/auth";
import api from "./api";

export const userService = {
  saveData: async (data: SaveDataRequest): Promise<ApiResponse<User>> => {
    try {
      console.log("🚀 Payload enviado a la API (SaveData):", data);

      const response = await api.post<ApiResponse<User>>("/savedata", data);
      console.log("📥 Respuesta de la API (SaveData):", response.data);

      return response.data;
    } catch (error: unknown) {
      console.error("SaveData Error:", error);

      let errorMessage = "Error al guardar los datos";

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
