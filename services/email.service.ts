import axios from "axios";

interface EmailParams {
  to: string;
  title: string;
  vertical: string;
  content: string;
  attachments?: {
    filename: string;
    content: string; // Base64 content
    encoding?: string;
  }[];
}

class EmailService {
  private apiPath = "/api/send-email";

  /**
   * Sends an email with a dynamic subject: {titulo} - {vertical} {year}
   */
  async sendEmail({ to, title, vertical, content, attachments }: EmailParams) {
    const currentYear = new Date().getFullYear();
    const subject = `${title} - ${vertical.toUpperCase()} ${currentYear}`;

    try {
      const response = await axios.post(this.apiPath, {
        to,
        subject,
        html: content,
        attachments
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const apiMessage =
          typeof error.response?.data === "object" &&
          error.response?.data !== null &&
          "message" in error.response.data
            ? (error.response.data as { message?: string }).message
            : undefined;

        console.error(
          "EmailService error:",
          error.response?.data || error.message,
        );
        throw new Error(apiMessage || error.message || "Error sending email");
      }

      if (error instanceof Error) {
        console.error("EmailService error:", error.message);
        throw new Error(error.message);
      }

      console.error("EmailService error:", error);
      throw new Error("Error sending email");
    }
  }
}

export const emailService = new EmailService();
