const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userKey = 'P0000000525';
  const event = 'PROEXPLO26';

  const testAlerts = [
    {
      event,
      type: 'standard',
      variant: 'info',
      category: 'sistema',
      title: 'Notificación Estándar (Cápsula)',
      description: 'Esta es una notificación tipo cápsula estándar. Es ideal para mensajes breves y directos.',
      recipients: [userKey],
    },
    {
      event,
      type: 'expandable',
      variant: 'success',
      category: 'eventos',
      title: 'Notificación Expandible (Con detalles)',
      description: 'Haz clic aquí para ver más detalles sobre este evento importante.',
      longDescription: `
        <div class="space-y-4">
          <p>Este es el contenido expandido de la notificación. Permite incluir <strong>HTML</strong> enriquecido.</p>
          <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop" alt="Evento" />
          <p>Las imágenes se centran automáticamente gracias a los nuevos estilos aplicados.</p>
        </div>
      `,
      recipients: [userKey],
    },
    {
      event,
      type: 'modal',
      variant: 'warning',
      category: 'networking',
      title: 'Notificación Modal (Emergente central)',
      description: 'Esta notificación abrirá un modal central con información detallada.',
      longDescription: `
        <div class="space-y-4">
          <h3 class="text-xl font-bold">Aviso Importante</h3>
          <p>El modal permite captar toda la atención del usuario. Es ideal para anuncios críticos o promociones especiales.</p>
          <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1911&auto=format&fit=crop" alt="Facturación" />
          <p>Puedes incluir listas, imágenes y enlaces.</p>
        </div>
      `,
      recipients: [userKey],
    },
    {
      event,
      type: 'accordion',
      variant: 'default',
      category: 'sistema',
      title: 'Notificación Acordeón (Contenido oculto)',
      description: 'Similar a la expandible, pero con un diseño enfocado en colapsar contenido.',
      longDescription: `
        <div class="space-y-3">
          <p>El contenido de acordeón es útil para FAQs o información secundaria que el usuario puede elegir ver.</p>
          <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop" alt="FAQ" />
          <p>Todo el contenido multimedia se verá centrado y responsivo.</p>
        </div>
      `,
      recipients: [userKey],
    },
    {
      event,
      type: 'image_only',
      variant: 'info',
      category: 'eventos',
      title: 'Notificación Solo Imagen',
      description: 'Este tipo de notificación prioriza la visualización de una imagen destacada.',
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop',
      recipients: [userKey],
    },
    {
      event,
      title: "Promoción Especial: Convención Minera",
      description: "Haz clic aquí para ver los detalles de la nueva preventa.",
      longDescription: "<p>Aprovecha los descuentos exclusivos para miembros del IIMP.</p>",
      category: "ventas",
      variant: "info",
      type: "image_only",
      actionText: "Ver Preventa",
      actionUrl: "/dashboard/eventos",
      imageUrl: "https://images.unsplash.com/photo-1579546678181-7f47c3c4b7a8?auto=format&fit=crop&q=80&w=1000",
      target: "_self",
      recipients: [userKey],
    }
  ];

  console.log('Generando alertas de prueba para hoy...');
  
  // Opcional: Eliminar alertas de prueba previas para no saturar
  await prisma.portalAlert.deleteMany({
    where: {
      recipients: { has: userKey },
      title: { startsWith: 'Notificación' }
    }
  });

  for (const alert of testAlerts) {
    await prisma.portalAlert.create({ data: alert });
  }
  console.log('¡Alertas creadas exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
