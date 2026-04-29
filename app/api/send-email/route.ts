import { NextResponse } from "next/server";
import { Resend } from "resend";

type AttachmentRequest = {
  filename: string;
  content: string;
  encoding?: string;
  cid?: string;
};

type SendEmailBody = {
  to?: string;
  subject?: string;
  html?: string;
  attachments?: AttachmentRequest[];
};

export async function POST(req: Request) {
  try {
    const body: SendEmailBody = await req.json();
    const { to, subject, html } = body;
    
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Resend Error: Missing RESEND_API_KEY environment variable");
      return NextResponse.json(
        { 
          success: false, 
          message: "Email configuration error", 
          error: "Missing Resend API Key. Please set RESEND_API_KEY." 
        },
        { status: 500 },
      );
    }

    const resend = new Resend(apiKey);

    // Map attachments for Resend SDK
    // If incoming attachment has encoding: 'base64', we convert content to Buffer
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.map((att: AttachmentRequest) => ({
          filename: att.filename,
          content: att.encoding === "base64" ? Buffer.from(att.content, "base64") : att.content,
          // Note: Resend currently doesn't support CID for inline images in the same way as nodemailer.
          // However, we pass the content and filename as standard attachments.
        }))
      : [];

    const fromEmail = process.env.SMTP_FROM || "no-reply@sistemasiimp.org.pe";
    
    console.log(`[Resend] Attempting to send email to ${to} from ${fromEmail}`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Error enviando el correo", 
          error: error.message || "Unknown Resend error",
          name: error.name
        },
        { status: 500 }
      );
    }

    console.log(`[Resend] Email sent successfully to ${to}. ID: ${data?.id}`);
    return NextResponse.json({ 
      success: true, 
      message: "Email sent successfully",
      messageId: data?.id 
    });

  } catch (error: unknown) {
    console.error("Error processing email request:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: "Failed to process email request", error: errorMessage },
      { status: 500 },
    );
  }
}
