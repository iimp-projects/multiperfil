import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export type AuditAction = 
  | "LOGIN" 
  | "LOGOUT" 
  | "CREATE_USER" 
  | "UPDATE_USER" 
  | "DELETE_USER" 
  | "SEND_EMAIL"
  | "CREATE_MESSAGE"
  | "UPDATE_MESSAGE"
  | "DELETE_MESSAGE"
  | "CREATE_ALERT"
  | "UPDATE_ALERT"
  | "DELETE_ALERT"
  | "CREATE_STREAMING"
  | "UPDATE_STREAMING"
  | "DELETE_STREAMING"
  | "CREATE_SPONSOR"
  | "UPDATE_SPONSOR"
  | "DELETE_SPONSOR"
  | "CREATE_SPONSOR_CATEGORY"
  | "UPDATE_SPONSOR_CATEGORY"
  | "DELETE_SPONSOR_CATEGORY"
  | "CREATE_PROGRAM"
  | "UPDATE_PROGRAM"
  | "DELETE_PROGRAM"
  | "CREATE_TAB"
  | "UPDATE_TAB"
  | "DELETE_TAB"
  | "CREATE_SESSION"
  | "UPDATE_SESSION"
  | "DELETE_SESSION"
  | "GENERIC_ACTION";

export type AuditModule = 
  | "AUTH" 
  | "ADMIN_USERS" 
  | "MESSAGES" 
  | "ALERTS" 
  | "PORTAL_MESSAGES" 
  | "PORTAL_ALERTS"
  | "STREAMING" 
  | "RECIPIENTS"
  | "SPONSORS"
  | "PROGRAMS"
  | "SYSTEM"
  | "ROLES";

interface AuditParams {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: AuditAction;
  module: AuditModule;
  details?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Registra una acción en el log de auditoría de forma asíncrona.
 * No bloquea la ejecución principal.
 */
export async function logActivity(params: AuditParams) {
  try {
    const data: Prisma.AuditLogCreateInput = {
      action: params.action,
      module: params.module,
      details: params.details,
      ip: params.ip || "unknown",
      userAgent: params.userAgent || "unknown",
    };

    // Validar que userId sea un ObjectId válido (24 caracteres hex)
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    if (params.userId && isValidObjectId(params.userId)) {
      data.userId = params.userId;
    }

    if (params.userEmail) {
      data.userEmail = params.userEmail;
    }

    if (params.userName) {
      data.userName = params.userName;
    }

    await prisma.auditLog.create({
      data,
    });
  } catch (error) {
    // Error silencioso para no afectar el flujo principal
    console.error("[AUDIT_ERROR]", error);
  }
}
