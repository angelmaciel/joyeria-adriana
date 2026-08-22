import { imagenOptimizada } from "@/lib/cloudinary";
import { siteUrl } from "@/lib/site-url";
export function buildWhatsAppLink(message: string) {
  const number = process.env.WHATSAPP_NUMBER;
  const text = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${text}`;
}

export function buildProductWhatsAppMessage(productName: string, productUrl: string) {
  return `Hola! Me interesa este producto: ${productName}\n${productUrl}`;
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
    // Se manda la versión transformada, no el original: además de pesar mucho
    // menos, Cloudinary le quita los metadatos EXIF. Las fotos sacadas con el
    // celular suelen traer las coordenadas GPS de donde se tomaron —la casa del
    // cliente— y esa URL termina compartida en un chat.
    const url = input.imageUrl.startsWith("http")
      ? imagenOptimizada(input.imageUrl, 1200)
      : `${siteUrl()}${input.imageUrl}`;
    // Va última y sola: WhatsApp arma la previsualización con el último enlace
    // del mensaje, así la foto se ve como miniatura en el chat.
    lines.push("", url);
  }
  return lines.join("\n");
}
