import axios from "axios";

// Using Next.js rewrites to bypass CORS on the client
// Requests to /api/proxy/* will be redirected to the real Genexus API
const api = axios.create({
  baseURL: "/api/proxy",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
  },
});

export default api;
