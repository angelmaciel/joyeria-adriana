"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  deleteUploadedImage,
  saveUploadedImages,
  saveRequestImage,
} from "@/lib/uploads";
import { buildWhatsAppLink, buildRequestWhatsAppMessage } from "@/lib/whatsapp";
import { CLIENT_MODE_COOKIE } from "@/lib/client-mode";
import { encrypt, encryptOptional, blindIndex } from "@/lib/crypto";
import { checkRateLimit, FORM_LIMIT } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import {
  goldPurchaseRequestSchema,
  serviceRequestSchema,
  requestUpdateSchema,
  productFieldsSchema,
} from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");
  return session.user.email;
}

async function limitPublicForm(key: string, redirectTo: string) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(
    `${key}:${ip}`,
    FORM_LIMIT.limit,
    FORM_LIMIT.windowMs
  );
  if (!allowed) redirect(redirectTo);
}

async function writeAuditLog(entry: {
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}) {
  await prisma.adminAuditLog.create({ data: entry });
}

export async function logoutAdmin() {
  await signOut({ redirectTo: "/admin/login" });
}

export async function enterClientMode() {
  const store = await cookies();
  store.set(CLIENT_MODE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/inicio");
}

export async function exitClientMode() {
  const store = await cookies();
  store.delete(CLIENT_MODE_COOKIE);
  redirect("/");
}

export async function createServiceRequest(formData: FormData) {
  const slug = formData.get("serviceTypeSlug");
  await limitPublicForm(
    "service-request",
    `/servicios/solicitar/${slug}?error=rate`
  );

  const parsed = serviceRequestSchema.safeParse({
    serviceTypeId: formData.get("serviceTypeId"),
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(`/servicios/solicitar/${slug}?error=1`);
  }

  const photo = formData.get("referenceImage");
  const image = await saveRequestImage(photo instanceof File ? photo : null);
  if (!image.ok) {
    redirect(`/servicios/solicitar/${slug}?error=${image.reason}`);
  }
  const referenceImageUrl = image.url;

  const serviceType = await prisma.serviceType.findUnique({
    where: { id: parsed.data.serviceTypeId },
  });
  if (!serviceType) redirect(`/servicios/solicitar/${slug}?error=1`);

  // Todo dato del cliente va cifrado: nombre, teléfono y el texto del mensaje.
  await prisma.serviceRequest.create({
    data: {
      serviceTypeId: parsed.data.serviceTypeId,
      referenceImageUrl,
      clientName: encrypt(parsed.data.clientName),
      clientPhone: encrypt(parsed.data.clientPhone),
      clientPhoneIndex: blindIndex(parsed.data.clientPhone),
      description: encrypt(parsed.data.description),
    },
  });

  // Se manda al WhatsApp del negocio con todos los campos ya cargados.
  redirect(
    buildWhatsAppLink(
      buildRequestWhatsAppMessage({
        titulo: serviceType.name,
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone,
        description: parsed.data.description,
        imageUrl: referenceImageUrl,
      })
    )
  );
}

export async function createGoldPurchaseRequest(formData: FormData) {
  await limitPublicForm("gold-request", "/vender-oro?error=rate");

  const parsed = goldPurchaseRequestSchema.safeParse({
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect("/vender-oro?error=1");
  }

  const photo = formData.get("referenceImage");
  const image = await saveRequestImage(photo instanceof File ? photo : null);
  if (!image.ok) {
    redirect(`/vender-oro?error=${image.reason}`);
  }
  const referenceImageUrl = image.url;

  await prisma.goldPurchaseRequest.create({
    data: {
      referenceImageUrl,
      clientName: encrypt(parsed.data.clientName),
      clientPhone: encrypt(parsed.data.clientPhone),
      clientPhoneIndex: blindIndex(parsed.data.clientPhone),
      description: encrypt(parsed.data.description),
    },
  });

  redirect(
    buildWhatsAppLink(
      buildRequestWhatsAppMessage({
        titulo: "Venta de oro",
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone,
        description: parsed.data.description,
        imageUrl: referenceImageUrl,
      })
    )
  );
}

export async function updateServiceRequest(formData: FormData) {
  const actorEmail = await requireAdmin();

  const id = String(formData.get("id"));
  const parsed = requestUpdateSchema.safeParse({
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes"),
    price: formData.get("quotedPrice"),
  });
  if (!parsed.success) redirect(`/admin/solicitudes/${id}?error=1`);

  await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNotes: encryptOptional(parsed.data.adminNotes),
      quotedPrice: parsed.data.price,
    },
  });

  await writeAuditLog({
    actorEmail,
    action: "update",
    entityType: "ServiceRequest",
    entityId: id,
    details: `status=${parsed.data.status}${parsed.data.price != null ? ` price=${parsed.data.price}` : ""}`,
  });

  revalidatePath(`/admin/solicitudes/${id}`);
  revalidatePath("/admin/solicitudes");
  redirect("/admin/solicitudes?ok=solicitud_actualizada");
}

export async function updateGoldPurchaseRequest(formData: FormData) {
  const actorEmail = await requireAdmin();

  const id = String(formData.get("id"));
  const parsed = requestUpdateSchema.safeParse({
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes"),
    price: formData.get("offeredPrice"),
  });
  if (!parsed.success) redirect(`/admin/compra-oro/${id}?error=1`);

  await prisma.goldPurchaseRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNotes: encryptOptional(parsed.data.adminNotes),
      offeredPrice: parsed.data.price,
    },
  });

  await writeAuditLog({
    actorEmail,
    action: "update",
    entityType: "GoldPurchaseRequest",
    entityId: id,
    details: `status=${parsed.data.status}${parsed.data.price != null ? ` price=${parsed.data.price}` : ""}`,
  });

  revalidatePath(`/admin/compra-oro/${id}`);
  revalidatePath("/admin/compra-oro");
  redirect("/admin/compra-oro?ok=solicitud_actualizada");
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productFieldsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    priceVisible: formData.get("priceVisible"),
  });
  if (!parsed.success) redirect("/admin/productos/nuevo?error=1");

  const uploaded = formData.getAll("images").filter((f) => f instanceof File) as File[];
  const imageUrls = await saveUploadedImages(uploaded);

  const slug = await uniqueSlug(parsed.data.name);

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      slug,
      images: { create: imageUrls.map((url, order) => ({ url, order })) },
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  redirect("/admin/productos?ok=producto_creado");
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const parsed = productFieldsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    priceVisible: formData.get("priceVisible"),
  });
  if (!parsed.success) redirect(`/admin/productos/${id}?error=1`);

  const removeIds = formData.getAll("removeImageIds").map(String);
  const uploaded = formData.getAll("newImages").filter((f) => f instanceof File) as File[];
  const newImageUrls = await saveUploadedImages(uploaded);

  const [existingCount, toRemove] = await Promise.all([
    prisma.productImage.count({ where: { productId: id, id: { notIn: removeIds } } }),
    prisma.productImage.findMany({ where: { productId: id, id: { in: removeIds } } }),
  ]);

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id, id: { in: removeIds } } }),
    prisma.productImage.createMany({
      data: newImageUrls.map((url, i) => ({
        url,
        order: existingCount + i,
        productId: id,
      })),
    }),
    prisma.product.update({ where: { id }, data: parsed.data }),
  ]);

  await Promise.all(toRemove.map((img) => deleteUploadedImage(img.url)));

  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  redirect("/admin/productos?ok=producto_actualizado");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) redirect("/admin/productos");

  const ahoraActivo = !product.isActive;
  await prisma.product.update({
    where: { id },
    data: { isActive: ahoraActivo },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  redirect(
    `/admin/productos?ok=${ahoraActivo ? "producto_activado" : "producto_desactivado"}`
  );
}
