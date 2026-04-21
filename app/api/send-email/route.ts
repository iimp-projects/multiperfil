import { NextResponse } from "next/server";
import nodemailer, { type SendMailOptions, type SentMessageInfo } from "nodemailer";
import { Options as SMTPOptions } from "nodemailer/lib/smtp-transport";

type SendEmailBody = {
  to?: string;
  subject?: string;
  html?: string;
  attachments?: unknown;
};

export async function POST(req: Request) {
  try {
    const body: SendEmailBody = await req.json();
    const { to, subject, html } = body;
    const attachments: SendMailOptions["attachments"] = Array.isArray(body.attachments)
      ? (body.attachments as SendMailOptions["attachments"])
      : [];

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if credentials are missing
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP Error: Missing SMTP_USER or SMTP_PASS environment variables");
      return NextResponse.json(
        { 
          success: false, 
          message: "Email configuration error", 
          error: "Missing SMTP credentials in environment variables. Please set SMTP_USER and SMTP_PASS." 
        },
        { status: 500 },
      );
    }

    // Configure transporter with SMTP settings from environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.sendinblue.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 20000,    // 20 seconds
      debug: true,
      logger: true,
    } as SMTPOptions);

    const mailOptions = {
      from: process.env.SMTP_FROM || '"IIMP - Eventos" <postmast@iimp.org.pe>',
      to,
      subject,
      html,
      attachments,
    };

    const email = to;
    console.log(`[SMTP] Attempting to send email to ${email} via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    
    // Create a timeout promise to prevent hanging forever
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Internal SMTP Timeout")), 25000)
    );

    try {
      // Verify connection configuration
      console.log("[SMTP] Verifying connection...");
      await transporter.verify();
      console.log("[SMTP] Connection verified successfully.");

      // Send email with timeout race
      const info = (await Promise.race([
        transporter.sendMail(mailOptions),
        timeoutPromise
      ])) as SentMessageInfo;

      console.log(`[SMTP] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
      return NextResponse.json({ 
        success: true, 
        message: "Email sent successfully",
        messageId: info.messageId 
      });
    } catch (smtpError: unknown) {
      const error = smtpError as { message?: string; code?: string };
      console.error("[SMTP] Error during verification or sending:", error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Error enviando el correo", 
          error: error.message || "Unknown SMTP error",
          code: error.code 
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error processing email request:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: "Failed to process email request", error: errorMessage },
      { status: 500 },
    );
  }
}
