import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Options as SMTPOptions } from "nodemailer/lib/smtp-transport";

export async function POST(req: Request) {
  try {
    const { to, subject, html, attachments, verticalName } = await req.json();

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
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000,   // 5 seconds
      socketTimeout: 10000,    // 10 seconds
      debug: true,
      logger: true,
    } as SMTPOptions);

    const mailOptions = {
      from: process.env.SMTP_FROM || '"IIMP - Eventos" <postmast@iimp.org.pe>',
      to,
      subject,
      html,
      attachments: attachments || [],
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
      const info: any = await Promise.race([
        transporter.sendMail(mailOptions),
        timeoutPromise
      ]);

      console.log(`[SMTP] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
      return NextResponse.json({ 
        success: true, 
        message: "Email sent successfully",
        messageId: info.messageId 
      });
    } catch (smtpError: any) {
      console.error("[SMTP] Error during verification or sending:", smtpError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Error enviando el correo", 
          error: smtpError.message,
          code: smtpError.code 
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: "Failed to send email", error: errorMessage },
      { status: 500 },
    );
  }
}
