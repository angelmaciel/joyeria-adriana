export function buildWhatsAppLink(message: string) {
  const number = process.env.WHATSAPP_NUMBER;
  const text = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${text}`;
}

export function buildProductWhatsAppMessage(productName: string, productUrl: string) {
  return `Hola! Me interesa este producto: ${productName}\n${productUrl}`;
}

export function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

// wa.me solo transporta texto: no se puede adjuntar la foto al chat desde la web.
// Por eso se manda su URL pública — WhatsApp genera la previsualización de la imagen.
export function buildRequestWhatsAppMessage(input: {
  titulo: string;
  clientName: string;
  clientPhone: string;
  description: string;
  imageUrl?: string | null;
}) {
  const lines = [
    `Hola! Quiero solicitar: ${input.titulo}`,
    "",
    `Nombre: ${input.clientName}`,
    `Teléfono: ${input.clientPhone}`,
    `Detalle: ${input.description}`,
  ];
  if (input.imageUrl) {
    lines.push("", `Foto de referencia: ${siteUrl()}${input.imageUrl}`);
  }
  return lines.join("\n");
}
