/**
 * Genera las capturas de pantalla de docs/capturas/.
 *
 *   npm run capturas
 *
 * Usa el Chrome o Edge que ya esta instalado en la maquina: no descarga ningun
 * navegador. La ruta al ejecutable sale de CHROME_PATH, para que este archivo
 * no tenga rutas de ninguna maquina en particular.
 *
 * Requiere el sitio corriendo. Por defecto apunta a http://localhost:3000;
 * se puede cambiar con CAPTURAS_URL.
 *
 * Las paginas publicas viven detras de la cookie de modo cliente, asi que el
 * script la pone antes de navegar. Las del panel necesitan sesion: solo se
 * capturan si se definen CAPTURAS_ADMIN_EMAIL y CAPTURAS_ADMIN_PASSWORD, y en
 * ese caso el email real se reemplaza en el DOM antes de la foto para que no
 * termine publicado en el README.
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.CAPTURAS_URL ?? "http://localhost:3000";
const SALIDA = "docs/capturas";
const EMAIL_FALSO = "administracion@ejemplo.com";

const CANDIDATOS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function buscarNavegador() {
  const encontrado = CANDIDATOS.find((p) => existsSync(p));
  if (!encontrado) {
    console.error(
      "No encontre Chrome ni Edge. Defini CHROME_PATH en .env apuntando al ejecutable."
    );
    process.exit(1);
  }
  return encontrado;
}

/** Espera a que las fuentes y las imagenes esten listas: si no, salen a medio pintar. */
async function esperarPintado(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((r) => { img.onload = img.onerror = r; }))
    );
  });
  // El revelado al scrollear y las entradas duran ~400ms.
  await new Promise((r) => setTimeout(r, 700));
}

/**
 * Reemplaza las fotos subidas por un marcador neutro.
 *
 * Las del catalogo de ejemplo vienen de placehold.co y se dejan como estan; las
 * demas son fotos reales cargadas por el negocio, y varias muestran personas.
 * Ya estan publicas en el sitio, pero un README es otra distribucion: quien
 * clona el repositorio se lleva las imagenes puestas.
 */
async function neutralizarFotos(page) {
  await page.evaluate(() => {
    const gris =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
          '<rect width="400" height="400" fill="#e4e0d8"/>' +
          '<text x="200" y="210" font-family="system-ui,sans-serif" font-size="26"' +
          ' fill="#a9a294" text-anchor="middle">Foto del producto</text></svg>'
      );
    for (const img of document.images) {
      if (!/placehold\.co/.test(img.currentSrc || img.src)) {
        img.srcset = "";
        img.src = gris;
      }
    }
  });
}

/** Reemplaza cualquier email visible por uno de ejemplo, antes de la foto. */
async function ocultarDatosPersonales(page) {
  await page.evaluate((falso) => {
    const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (it.nextNode()) nodos.push(it.currentNode);
    for (const n of nodos) {
      if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, falso);
    }
  }, EMAIL_FALSO);
}

const PUBLICAS = [
  { archivo: "01-portada",        ruta: "/",                   completa: false },
  { archivo: "02-inicio",         ruta: "/inicio",             completa: false },
  { archivo: "03-catalogo",       ruta: "/catalogo",           completa: true  },
  { archivo: "05-servicios",      ruta: "/servicios",          completa: false },
  { archivo: "06-solicitar",      ruta: null,                  completa: true  },
  { archivo: "07-vender-oro",     ruta: "/vender-oro",         completa: true  },
  { archivo: "08-sobre-nosotros", ruta: "/sobre-nosotros",     completa: true  },
  { archivo: "09-login",          ruta: "/admin/login",        completa: false },
];

const DEL_PANEL = [
  { archivo: "10-dashboard",   ruta: "/admin/dashboard" },
  { archivo: "11-productos",   ruta: "/admin/productos" },
  { archivo: "12-solicitudes", ruta: "/admin/solicitudes" },
];

async function capturar(page, archivo, completa) {
  await esperarPintado(page);
  await neutralizarFotos(page);
  await ocultarDatosPersonales(page);
  // Las imagenes cambiadas tardan un frame en pintarse.
  await new Promise((r) => setTimeout(r, 250));
  const destino = path.join(SALIDA, `${archivo}.png`);
  await page.screenshot({ path: destino, fullPage: completa });
  console.log(`  ${destino}`);
}

async function main() {
  const ejecutable = buscarNavegador();
  await mkdir(SALIDA, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: ejecutable,
    headless: true,
    args: ["--hide-scrollbars", "--force-device-scale-factor=2"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // La cookie de modo cliente: sin esto el proxy manda todo a la portada.
  const { hostname } = new URL(BASE);
  await browser.setCookie({
    name: "client_mode",
    value: "1",
    domain: hostname,
    path: "/",
  });

  console.log(`Capturando ${BASE}\n`);

  // El slug del primer producto y del primer servicio salen del sitio, para no
  // hardcodear contenido que puede cambiar.
  await page.goto(`${BASE}/catalogo`, { waitUntil: "networkidle2" });
  const slugProducto = await page.$eval('a[href^="/producto/"]', (a) =>
    a.getAttribute("href")
  ).catch(() => null);
  await page.goto(`${BASE}/servicios`, { waitUntil: "networkidle2" });
  const slugServicio = await page.$eval('a[href^="/servicios/solicitar/"]', (a) =>
    a.getAttribute("href")
  ).catch(() => null);

  for (const vista of PUBLICAS) {
    const ruta =
      vista.ruta ?? (vista.archivo === "06-solicitar" ? slugServicio : null);
    if (!ruta) {
      console.log(`  (salteada ${vista.archivo}: no hay contenido cargado)`);
      continue;
    }
    await page.goto(`${BASE}${ruta}`, { waitUntil: "networkidle2" });
    await capturar(page, vista.archivo, vista.completa);
  }

  if (slugProducto) {
    await page.goto(`${BASE}${slugProducto}`, { waitUntil: "networkidle2" });
    await capturar(page, "04-producto", true);
  }

  // Version movil de las dos vistas que mas cambian de forma.
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  for (const [archivo, ruta] of [["20-movil-inicio", "/inicio"], ["21-movil-catalogo", "/catalogo"]]) {
    await page.goto(`${BASE}${ruta}`, { waitUntil: "networkidle2" });
    await capturar(page, archivo, false);
  }
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // Panel: solo si hay credenciales en el entorno.
  const email = process.env.CAPTURAS_ADMIN_EMAIL;
  const password = process.env.CAPTURAS_ADMIN_PASSWORD;
  if (email && password) {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle2" });
    await page.type("#email", email);
    await page.type("#password", password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);
    if (page.url().includes("/admin/login")) {
      console.log("\n  No se pudo iniciar sesion: se saltean las del panel.");
    } else {
      console.log("");
      for (const v of DEL_PANEL) {
        await page.goto(`${BASE}${v.ruta}`, { waitUntil: "networkidle2" });
        await capturar(page, v.archivo, true);
      }
    }
  } else {
    console.log(
      "\n  Sin CAPTURAS_ADMIN_EMAIL / CAPTURAS_ADMIN_PASSWORD: se saltean las del panel."
    );
  }

  await browser.close();

  const archivos = await readdir(SALIDA);
  let total = 0;
  for (const a of archivos) total += (await stat(path.join(SALIDA, a))).size;
  console.log(`\n${archivos.length} capturas, ${(total / 1024 / 1024).toFixed(1)} MB en ${SALIDA}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
