export interface BaseTemplateData {
  vertical: string;
  currentYear: number;
  logoUrl?: string;
}

export interface PasswordRecoveryData extends BaseTemplateData {
  password: string;
}

const getStyles = (vertical: string) => {
  const colors = {
    proexplo: "#ea6c15",
    gess: "#1c8740",
    wmc: "#00b7db",
    perumin: "#b97822",
  };
  return colors[vertical as keyof typeof colors] || colors.perumin;
};

const layout = (
  content: string,
  { vertical, currentYear, logoUrl }: BaseTemplateData,
) => {
  const primaryColor = getStyles(vertical);
  const verticalName = vertical.toUpperCase();

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: white;">
      <div style="background-color: ${primaryColor}; padding: 40px 20px; text-align: center; color: white;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${verticalName}" style="max-height: 60px; margin-bottom: 15px;" />` : `<h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -1px;">SISTEMA INSTITUCIONAL IIMP</h1>`}
        <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">${verticalName} ${currentYear}</p>
      </div>
      
      <div style="padding: 40px;">
        ${content}
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
        &copy; ${currentYear} Instituto de Ingenieros de Minas del Perú. Todos los derechos reservados.
      </div>
    </div>
  `;
};

export const emailTemplates = {
  passwordRecovery: ({
    vertical,
    currentYear,
    password,
    logoUrl,
  }: {
    vertical: string;
    currentYear: number;
    password: string;
    logoUrl: string;
  }) => {
    const colors = {
      gess: "#1c8740",
      proexplo: "#ea6c15",
      wmc: "#00b7db",
      perumin: "#b97822",
      default: "#b97822",
    };

    const brandColor =
      colors[vertical as keyof typeof colors] || colors.default;
    const verticalName = vertical.toUpperCase();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background-color: #f1f5f9; padding: 20px; text-align: center; }
            .logo { max-width: 180px; height: auto; }
            .content { padding: 40px; text-align: center; }
            .title { color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px; }
            .description { color: #64748b; font-size: 16px; margin-bottom: 32px; }
            .password-box { background-color: #f1f5f9; border: 2px dashed ${brandColor}40; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
            .password-label { color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
            .password-value { color: ${brandColor}; font-size: 32px; font-weight: 800; letter-spacing: 0.05em; margin: 0; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer-text { color: #94a3b8; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="${verticalName} Logo" class="logo">
            </div>
            <div class="content">
              <h1 class="title">Recuperación de Contraseña</h1>
              <p class="description">Has solicitado recuperar tu acceso al sistema <strong>Multiperfil IIMP</strong> para el evento <strong>${verticalName}</strong>.</p>
              
              <div class="password-box">
                <div class="password-label">Tu contraseña actual es</div>
                <p class="password-value">${password}</p>
              </div>
              
              <p class="description" style="font-size: 14px;">Te recomendamos cambiar tu contraseña una vez hayas ingresado al sistema por seguridad.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© ${currentYear} Instituto de Ingenieros de Minas del Perú - IIMP</p>
              <p class="footer-text" style="margin-top: 8px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  welcome: (data: BaseTemplateData & { name: string }) => {
    const content = `
      <h2 style="color: #0f172a; font-size: 20px;">¡Bienvenido, ${data.name}!</h2>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Estamos encantados de tenerte en nuestra plataforma exclusiva para asociados del IIMP.</p>
    `;
    return layout(content, data);
  },
};
