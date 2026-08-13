import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

// Versión del formato del dato guardado. Si alguna vez cambia el esquema de
// cifrado, esto permite reconocer lo viejo en vez de romperlo.
const VERSION = "v1";

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "Falta ENCRYPTION_KEY. Generar con: openssl rand -base64 32"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY debe ser 32 bytes en base64 (AES-256).");
  }
  return key;
}

/**
 * Huella de la clave: 8 caracteres derivados por HMAC.
 *
 * Va guardada junto a cada dato cifrado. Es una función de una vía, así que no
 * permite reconstruir la clave: se puede loguear y mostrar sin riesgo.
 *
 * Existe por una razón concreta. Antes, si ENCRYPTION_KEY cambiaba, el
 * descifrado fallaba sin decir por qué y el panel terminaba mostrando base64 en
 * el lugar del nombre del cliente. Con la huella, el sistema sabe distinguir
 * "cifrado con otra clave" de "dato corrupto", y lo dice.
 */
export function keyFingerprint() {
  return createHmac("sha256", getKey())
    .update("huella-de-clave")
    .digest("hex")
    .slice(0, 8);
}

export function encrypt(plaintext: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // base64 nunca contiene un punto, así que el punto es un separador seguro.
  return [
    VERSION,
    keyFingerprint(),
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

// Lo que devuelve decrypt() cuando el dato no se puede abrir. Usar esIlegible()
// para detectarlo, no comparar contra el texto: así se puede cambiar el mensaje
// sin romper a quien lo consulta.
export const ILEGIBLE = "[no se pudo descifrar]";

export function esIlegible(valor: string | null | undefined) {
  return valor === ILEGIBLE;
}

function abrir(ivB64: string, tagB64: string, dataB64: string) {
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    console.error(
      "[crypto] Un valor cifrado no pasó la verificación de integridad de AES-GCM."
    );
    return ILEGIBLE;
  }
}

export function decrypt(payload: string) {
  const partes = payload.split(".");

  // Formato actual: v1.huella.iv.tag.dato
  if (partes.length === 5 && partes[0] === VERSION) {
    const [, huella, iv, tag, dato] = partes;
    const actual = keyFingerprint();
    if (huella !== actual) {
      // Este es el caso que antes pasaba desapercibido. Ahora dice exactamente
      // qué pasó, y las huellas se pueden mostrar porque no revelan la clave.
      console.error(
        `[crypto] Dato cifrado con la clave de huella "${huella}", pero la ` +
          `ENCRYPTION_KEY actual tiene huella "${actual}". Es otra clave: ` +
          `revisar que .env y el entorno de despliegue tengan la misma.`
      );
      return ILEGIBLE;
    }
    return abrir(iv, tag, dato);
  }

  // Formato anterior, sin huella: iv.tag.dato. No queda nada así en la base,
  // pero se sigue soportando para poder restaurar un respaldo viejo.
  if (partes.length === 3) {
    return abrir(partes[0], partes[1], partes[2]);
  }

  // Sin formato reconocible el valor nunca estuvo cifrado (por ejemplo, una
  // fila anterior a que existiera el cifrado). Devolverlo tal cual es correcto.
  return payload;
}

export function encryptOptional(value: string | null | undefined) {
  return value ? encrypt(value) : null;
}

export function decryptOptional(value: string | null | undefined) {
  return value ? decrypt(value) : null;
}

// Índice ciego: permite buscar por valor exacto sin descifrar toda la tabla.
// Determinístico a propósito — misma entrada, mismo hash.
//
// OJO: depende de la clave igual que el cifrado. Si ENCRYPTION_KEY cambia,
// estos índices dejan de coincidir y las búsquedas por teléfono o email no
// encuentran nada — en silencio, sin error. Es la razón de fondo por la que la
// clave no se toca sin migrar.
export function blindIndex(value: string) {
  return createHmac("sha256", getKey())
    .update(value.trim().toLowerCase())
    .digest("hex");
}
