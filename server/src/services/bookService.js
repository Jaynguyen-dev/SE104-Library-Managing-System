import prisma from "../config/db.js";
import { paginate } from "../utils/paginate.js";

const OPEN_LIB_COVERS = "https://covers.openlibrary.org/b/isbn";

export async function listBooks(search, page, limit, available, category) {
  const where = { is_deleted: false };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { isbn: { contains: search } },
      { author: { contains: search } },
    ];
  }
  if (available === "true") {
    where.available_quantity = { gt: 0 };
  } else if (available === "false") {
    where.available_quantity = 0;
  }
  if (category) {
    where.category = category;
  }
  return paginate(prisma.book, {
    where,
    include: { metadata: true },
    orderBy: { created_at: "desc" },
  }, page, limit);
}

export async function getBook(id) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: { metadata: true },
  });
  if (!book || book.is_deleted) throw Object.assign(new Error("Book not found"), { statusCode: 404 });
  return book;
}

export async function createBook(data) {
  const existing = await prisma.book.findUnique({ where: { isbn: data.isbn } });
  if (existing) throw Object.assign(new Error("ISBN already exists"), { statusCode: 400 });

  return prisma.$transaction(async (tx) => {
    const book = await tx.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        category: data.category,
        total_quantity: data.total_quantity || 1,
        available_quantity: data.total_quantity || 1,
      },
    });

    await tx.bookMetadata.upsert({
      where: { book_id: book.id },
      create: { book_id: book.id, cover_image_url: null },
      update: { cover_image_url: null },
    });

    return tx.book.findUnique({
      where: { id: book.id },
      include: { metadata: true },
    });
  });
}

export async function updateBook(id, data) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || book.is_deleted) throw Object.assign(new Error("Book not found"), { statusCode: 404 });

  if (data.isbn && data.isbn !== book.isbn) {
    const dup = await prisma.book.findUnique({ where: { isbn: data.isbn } });
    if (dup) throw Object.assign(new Error("ISBN already exists"), { statusCode: 400 });
  }

  const { available_quantity, ...safeData } = data;

  return prisma.book.update({
    where: { id },
    data: safeData,
    include: { metadata: true },
  });
}

export async function softDeleteBook(id) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw Object.assign(new Error("Book not found"), { statusCode: 404 });

  return prisma.book.update({
    where: { id },
    data: { is_deleted: true },
  });
}
