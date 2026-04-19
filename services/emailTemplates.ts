export interface BaseTemplateData {
  vertical: string;
  currentYear: number;
}

export interface PasswordRecoveryData extends BaseTemplateData {
  password: string;
}

const getStyles = (vertical: string) => {
  const colors = {
    proexplo: "#f26522",
    gess: "#1c8740",
    wmc: "#002b57",
  };
  return colors[vertical as keyof typeof colors] || colors.wmc;
};

const layout = (
  content: string,
  { vertical, currentYear }: BaseTemplateData,
) => {
  const primaryColor = getStyles(vertical);
  const verticalName = vertical.toUpperCase();

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: white;">
      <div style="background-color: ${primaryColor}; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -1px;">SISTEMA INSTITUCIONAL IIMP</h1>
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
  passwordRecovery: (data: PasswordRecoveryData) => {
    const content = `
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hola,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hemos recibido una solicitud para recuperar tu contraseña de acceso al portal institucional del IIMP.</p>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; border: 1px dashed #cbd5e1;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Tu contraseña actual es:</p>
        <p style="margin: 10px 0 0 0; font-size: 28px; color: #0f172a; font-weight: 900; font-family: monospace; letter-spacing: 2px;">${data.password}</p>
      </div>
      
      <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Por razones de seguridad, te recomendamos cambiar tu contraseña una vez hayas ingresado al sistema.</p>
      
    `;
    return layout(content, data);
  },

  welcome: (data: BaseTemplateData & { name: string }) => {
    const content = `
      <h2 style="color: #0f172a; font-size: 20px;">¡Bienvenido, ${data.name}!</h2>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Estamos encantados de tenerte en nuestra plataforma exclusiva para asociados del IIMP.</p>
    `;
    return layout(content, data);
  },
};
