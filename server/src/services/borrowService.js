import prisma from "../config/db.js";
import { Prisma } from "@prisma/client";
import { calculateFine } from "../utils/fineCalculator.js";
import { paginate } from "../utils/paginate.js";
import * as reservationService from "./reservationService.js";

function addOverdueFlag(record) {
  if (!record) return record;
  const now = new Date();
  const due = new Date(record.due_date);
  const activeStatuses = ["active", "return_pending"];
  if (activeStatuses.includes(record.status) && now > due) {
    const daysOverdue = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
    return { ...record, is_overdue: true, days_overdue: daysOverdue, due_in_days: 0 };
  }
  if (activeStatuses.includes(record.status) && due > now) {
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return { ...record, is_overdue: false, days_overdue: 0, due_in_days: daysUntilDue };
  }
  return { ...record, is_overdue: false, days_overdue: 0, due_in_days: 0 };
}

export async function createBorrow(userId, items) {
  if (!items || items.length === 0) throw Object.assign(new Error("At least one book is required"), { statusCode: 400 });
  if (items.length > 3) throw Object.assign(new Error("Maximum 3 books per borrow"), { statusCode: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.is_active) throw Object.assign(new Error("User not found or inactive"), { statusCode: 400 });
  if (user.role === "librarian") throw Object.assign(new Error("Librarians cannot borrow books"), { statusCode: 403 });

  const bookIds = items.map((i) => i.book_id);
  const books = await prisma.book.findMany({ where: { id: { in: bookIds }, is_deleted: false } });

  for (const item of items) {
    const book = books.find((b) => b.id === item.book_id);
    if (!book) throw Object.assign(new Error(`Book id ${item.book_id} not found`), { statusCode: 400 });
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return prisma.$transaction(async (tx) => {
    const txnBooks = await tx.book.findMany({
      where: { id: { in: bookIds }, is_deleted: false },
    });

    for (const item of items) {
      const book = txnBooks.find((b) => b.id === item.book_id);
      if (book.available_quantity < (item.quantity || 1)) {
        throw Object.assign(new Error(`"${book.title}" is not available`), { statusCode: 400 });
      }
      if (book.reserved_for_user_id && book.reserved_for_user_id !== userId) {
        throw Object.assign(new Error(`"${book.title}" is reserved for another user`), { statusCode: 400 });
      }
    }

    const borrow = await tx.borrowRecord.create({
      data: {
        user_id: userId,
        due_date: dueDate,
        status: "active",
        items: {
          create: items.map((i) => ({ book_id: i.book_id, quantity: i.quantity || 1 })),
        },
      },
      include: { items: { include: { book: true } }, user: { select: { id: true, full_name: true, email: true } } },
    });

    for (const item of items) {
      const book = txnBooks.find((b) => b.id === item.book_id);
      await tx.book.update({
        where: { id: item.book_id },
        data: {
          available_quantity: { decrement: item.quantity || 1 },
          reserved_for_user_id: book?.reserved_for_user_id === userId ? null : undefined,
          reservation_expires_at: book?.reserved_for_user_id === userId ? null : undefined,
        },
      });

      if (book?.reserved_for_user_id === userId) {
        const reservation = await tx.reservation.findFirst({
          where: { user_id: userId, book_id: item.book_id, status: "notified" },
        });
        if (reservation) {
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "completed", completed_at: new Date() },
          });
        }
      }
    }

    return borrow;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function listBorrows(status, page, limit) {
  const where = {};
  if (status === "overdue") {
    where.status = "active";
    where.due_date = { lt: new Date() };
  } else if (status) {
    where.status = status;
  }

  const result = await paginate(prisma.borrowRecord, {
    where,
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      items: { include: { book: { select: { id: true, title: true, isbn: true, metadata: { select: { cover_image_url: true } } } } } },
      fines: true,
    },
    orderBy: { borrow_date: "desc" },
  }, page, limit);

  return { ...result, data: result.data.map(addOverdueFlag) };
}

export async function getBorrowById(id) {
  const borrow = await prisma.borrowRecord.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      items: { include: { book: { select: { id: true, title: true, isbn: true, metadata: { select: { cover_image_url: true } } } } } },
      fines: true,
    },
  });
  if (!borrow) throw Object.assign(new Error("Borrow record not found"), { statusCode: 404 });
  return addOverdueFlag(borrow);
}

export async function listMyBorrows(userId, status) {
  const where = { user_id: userId };
  if (status === "active") {
    where.status = { in: ["active", "return_pending"] };
  } else if (status === "returned") {
    where.status = "returned";
  } else if (status === "overdue") {
    where.status = { in: ["active", "return_pending"] };
    where.due_date = { lt: new Date() };
  }

  const records = await prisma.borrowRecord.findMany({
    where,
    include: {
      items: { include: { book: { select: { id: true, title: true, isbn: true, metadata: { select: { cover_image_url: true } } } } } },
      fines: true,
    },
    orderBy: { borrow_date: "desc" },
  });
  return records.map(addOverdueFlag);
}

export async function requestReturn(borrowId, userId) {
  const borrow = await prisma.borrowRecord.findUnique({
    where: { id: borrowId },
    include: { items: { include: { book: true } } },
  });

  if (!borrow) throw Object.assign(new Error("Borrow record not found"), { statusCode: 404 });
  if (borrow.user_id !== userId) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  if (borrow.status === "returned") throw Object.assign(new Error("Already returned"), { statusCode: 400 });
  if (borrow.status === "return_pending") throw Object.assign(new Error("Return already requested"), { statusCode: 400 });

  await prisma.borrowRecord.update({
    where: { id: borrowId },
    data: { status: "return_pending", return_requested_at: new Date() },
  });

  return prisma.borrowRecord.findUnique({
    where: { id: borrowId },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      items: { include: { book: { select: { id: true, title: true, isbn: true, metadata: { select: { cover_image_url: true } } } } } },
      fines: true,
    },
  });
}

export async function confirmReturn(borrowId, librarianId) {
  const borrow = await prisma.borrowRecord.findUnique({
    where: { id: borrowId },
    include: { items: true },
  });

  if (!borrow) throw Object.assign(new Error("Borrow record not found"), { statusCode: 404 });
  if (borrow.status === "returned") throw Object.assign(new Error("Already returned"), { statusCode: 400 });
  if (borrow.status !== "return_pending") throw Object.assign(new Error("Reader has not requested a return"), { statusCode: 400 });

  const now = new Date();
  const isOverdue = now > borrow.due_date;
  const fineAmount = isOverdue ? calculateFine(borrow.due_date, now) : 0;

  await prisma.$transaction(async (tx) => {
    await tx.borrowRecord.update({
      where: { id: borrowId },
      data: { status: "returned", return_date: now, confirmed_by: librarianId },
    });

    for (const item of borrow.items) {
      await tx.book.update({
        where: { id: item.book_id },
        data: { available_quantity: { increment: item.quantity } },
      });
    }

    for (const item of borrow.items) {
      await reservationService.processReturnAndPromoteQueue(item.book_id, tx);
    }

    const overdueDays = Math.ceil((now - borrow.due_date) / (1000 * 60 * 60 * 24));
    const existingFines = await tx.fine.count({ where: { borrow_record_id: borrowId } });

    if (fineAmount > 0 && existingFines === 0) {
      await tx.fine.create({
        data: {
          borrow_record_id: borrowId,
          user_id: borrow.user_id,
          amount: fineAmount,
          reason: `Overdue return — ${overdueDays} days late`,
          overdue_days: overdueDays,
        },
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return prisma.borrowRecord.findUnique({
    where: { id: borrowId },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      items: { include: { book: { select: { id: true, title: true, isbn: true, metadata: { select: { cover_image_url: true } } } } } },
      fines: true,
    },
  });
}
