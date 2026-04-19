import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Options as SMTPOptions } from "nodemailer/lib/smtp-transport";

export async function POST(req: Request) {
  try {
    const { to, subject, html, attachments } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
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
      authMethod: "PLAIN", // Force PLAIN auth if server is picky
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

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
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
