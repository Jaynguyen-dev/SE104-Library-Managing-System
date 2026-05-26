import cron from "node-cron";
import prisma from "../config/db.js";
import * as notificationService from "./notificationService.js";
import * as reservationService from "./reservationService.js";
import { FINE_PER_DAY } from "../utils/fineCalculator.js";

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== date.getDate()) {
    d.setDate(0);
  }
  return d;
}

async function sendReminders() {
  const now = new Date();
  const in7Days = addMonths(now, 0);
  in7Days.setDate(in7Days.getDate() + 7);

  const dueSoon = await prisma.borrowRecord.findMany({
    where: {
      status: "active",
      reminder_sent: false,
      due_date: { lte: in7Days, gte: now },
    },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      items: { include: { book: { select: { title: true } } } },
    },
  });

  for (const record of dueSoon) {
    const daysRemaining = Math.ceil((new Date(record.due_date) - now) / (1000 * 60 * 60 * 24));
    const bookTitles = record.items.map((i) => i.book.title).join(", ");
    const title = "Book Due Soon";
    const message = `Your borrowed book "${bookTitles}" is due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}. Due date: ${record.due_date.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })}. Please return or renew it in time.`;

    await notificationService.createNotification(record.user_id, title, message, "reminder", `borrow_${record.id}`);

    await prisma.borrowRecord.update({
      where: { id: record.id },
      data: { reminder_sent: true, reminder_sent_at: now },
    });
  }

  if (dueSoon.length > 0) {
    console.log(`[Scheduler] Sent ${dueSoon.length} due-date reminder(s)`);
  }
}

async function processOverdueFines() {
  const now = new Date();

  const overdueRecords = await prisma.borrowRecord.findMany({
    where: {
      status: "active",
      due_date: { lt: now },
    },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      items: { include: { book: { select: { title: true } } } },
      fines: { where: { is_paid: false } },
    },
  });

  for (const record of overdueRecords) {
    const overdueDays = Math.ceil((now - new Date(record.due_date)) / (1000 * 60 * 60 * 24));
    const fineAmount = Math.max(0, overdueDays * FINE_PER_DAY);

    const existingUnpaidFine = record.fines.find((f) => !f.is_paid);

    if (existingUnpaidFine) {
      if (existingUnpaidFine.amount !== fineAmount) {
        await prisma.fine.update({
          where: { id: existingUnpaidFine.id },
          data: { amount: fineAmount, overdue_days: overdueDays },
        });
      }
    } else {
      const bookTitles = record.items.map((i) => i.book.title).join(", ");
      await prisma.fine.create({
        data: {
          borrow_record_id: record.id,
          user_id: record.user_id,
          amount: fineAmount,
          reason: `Overdue — ${overdueDays} day${overdueDays > 1 ? "s" : ""} late for "${bookTitles}"`,
          overdue_days: overdueDays,
        },
      });

      await notificationService.createNotification(
        record.user_id,
        "Overdue Book",
        `"${bookTitles}" is overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}. A fine of ${(fineAmount).toLocaleString("vi-VN")} VND has been applied.`,
        "overdue",
        `borrow_${record.id}`,
      );
    }
  }

  if (overdueRecords.length > 0) {
    const updated = overdueRecords.filter((r) => {
      const existing = r.fines.find((f) => !f.is_paid);
      if (existing) {
        const newAmount = Math.max(0, Math.ceil((now - new Date(r.due_date)) / (1000 * 60 * 60 * 24)) * FINE_PER_DAY);
        return existing.amount !== newAmount;
      }
      return true;
    });
    console.log(`[Scheduler] Processed ${overdueRecords.length} overdue record(s) (${updated.length} updated)`);
  }
}

async function autoDeductFines() {
  const now = new Date();

  const walletsWithFines = await prisma.wallet.findMany({
    where: {
      balance: { gt: 0 },
      user: {
        fines: {
          some: { is_paid: false },
        },
      },
    },
    include: {
      user: {
        include: {
          fines: { where: { is_paid: false } },
        },
      },
    },
  });

  let totalDeducted = 0;

  for (const wallet of walletsWithFines) {
    const unpaidFines = wallet.user.fines;
    const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

    if (totalUnpaid <= 0) continue;
    if (wallet.balance <= 0) continue;

    const toDeduct = Math.min(wallet.balance, totalUnpaid);

    try {
      await prisma.$transaction(async (tx) => {
        const freshWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
        if (!freshWallet || freshWallet.balance < 1) return;

        const actualDeduct = Math.min(freshWallet.balance, totalUnpaid);
        let remaining = actualDeduct;

        for (const fine of unpaidFines) {
          if (remaining <= 0) break;
          const fineDeduct = Math.min(remaining, fine.amount);

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: fineDeduct } },
          });

          await tx.walletTransaction.create({
            data: {
              wallet_id: wallet.id,
              amount: -fineDeduct,
              balance_before: freshWallet.balance,
              balance_after: freshWallet.balance - fineDeduct,
              type: "fine_payment",
              status: "completed",
              payment_method: "system",
              reference: `fine_${fine.id}`,
              description: `Auto-payment for fine #${fine.id}: ${fine.reason}`,
            },
          });

          await tx.finePayment.create({
            data: {
              fine_id: fine.id,
              wallet_id: wallet.id,
              amount: fineDeduct,
            },
          });

          const remainingFine = fineDeduct >= fine.amount ? 0 : fine.amount - fineDeduct;
          if (remainingFine === 0) {
            await tx.fine.update({
              where: { id: fine.id },
              data: { is_paid: true, paid_at: now, paid_by: wallet.user_id, payment_method: "wallet" },
            });
          } else {
            await tx.fine.update({
              where: { id: fine.id },
              data: { amount: remainingFine },
            });
          }

          remaining -= fineDeduct;
          totalDeducted += fineDeduct;

          await notificationService.createNotification(
            wallet.user_id,
            "Fine Paid Automatically",
            `A fine of ${fineDeduct.toLocaleString("vi-VN")} VND has been automatically deducted from your wallet.`,
            "payment",
            `fine_${fine.id}`,
          );
        }
      });
    } catch (err) {
      console.error(`[Scheduler] Auto-deduct failed for user ${wallet.user_id}: ${err.message}`);
    }
  }

  if (totalDeducted > 0) {
    console.log(`[Scheduler] Auto-deducted ${totalDeducted.toLocaleString("vi-VN")} VND total from wallets`);
  }
}

async function safeRun(fn, name) {
  try {
    await fn();
  } catch (err) {
    console.error(`[Scheduler] ${name} failed:`, err.message);
  }
}

export function startScheduler() {
  safeRun(sendReminders, "initial reminders");
  safeRun(processOverdueFines, "initial overdue");
  safeRun(reservationService.processExpiredReservations, "initial reservations");

  cron.schedule("0 8 * * *", () => {
    console.log("[Scheduler] Running due-date reminder check...");
    safeRun(sendReminders, "reminders");
  });

  cron.schedule("0 0 * * *", () => {
    console.log("[Scheduler] Running overdue fine check...");
    safeRun(processOverdueFines, "overdue");
  });

  cron.schedule("30 2 * * *", () => {
    console.log("[Scheduler] Running auto-deduction check...");
    safeRun(autoDeductFines, "auto-deduct");
  });

  cron.schedule("*/30 * * * *", () => {
    console.log("[Scheduler] Running reservation expiration check...");
    safeRun(reservationService.processExpiredReservations, "reservation expiration");
  });

  console.log("[Scheduler] Started — reminders (8:00), overdue (0:00), auto-deduct (2:30), reservations (every 30m)");
}
