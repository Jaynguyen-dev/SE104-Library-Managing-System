import prisma from "../src/config/db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import * as openLib from "../src/crawlers/openLibraryCrawler.js";
import * as googleBooks from "../src/crawlers/googleBooksCrawler.js";
import { delay } from "../src/crawlers/crawlerUtils.js";

dotenv.config();

const OPEN_LIB_COVERS = "https://covers.openlibrary.org/b/isbn";

async function seedUsers() {
  // ── 1. Delete all existing users (child records first) ──
  console.log("Deleting all existing users...");
  await prisma.finePayment.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.borrowItem.deleteMany();
  await prisma.borrowRecord.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  console.log("All existing users deleted");

  // ── 2. Insert new users ──
  const hash = (pwd) => bcrypt.hash(pwd, 10);

  const users = [
    { email: "nvhoang050506@demo.com", full_name: "Hoàng Nguyễn", password: await hash("hoang123"), role: "user" },
    { email: "ktnhu2006@demo.com", full_name: "Thanh Như", password: await hash("nhu123"), role: "user" },
    { email: "librarian@demo.com", full_name: "Librarian", password: await hash("librarian123"), role: "librarian" },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        full_name: u.full_name,
        email: u.email,
        password_hash: u.password,
        role: u.role,
      },
    });
    console.log(`  Created: ${u.full_name} (${u.email})`);
  }

  console.log("Users seeded");
}

async function seedBooks() {
  const books = [
    { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Engineering", total_quantity: 3 },
    { title: "The Pragmatic Programmer", author: "Hunt & Thomas", isbn: "9780135957059", category: "Engineering", total_quantity: 2 },
    { title: "Design Patterns", author: "Gang of Four", isbn: "9780201633610", category: "Engineering", total_quantity: 2 },
    { title: "Introduction to Algorithms", author: "Cormen et al.", isbn: "9780262033848", category: "Computer Science", total_quantity: 2 },
    { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "9780316769488", category: "Fiction", total_quantity: 3 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "Fiction", total_quantity: 2 },
    { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "Science", total_quantity: 2 },
    { title: "The Art of Computer Programming", author: "Donald Knuth", isbn: "9780201896831", category: "Computer Science", total_quantity: 1 },
    { title: "Database System Concepts", author: "Silberschatz et al.", isbn: "9780073523323", category: "Computer Science", total_quantity: 3 },
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316110", category: "History", total_quantity: 3 },
    // ── Education ──
    { title: "Pedagogy of the Oppressed", author: "Paulo Freire", isbn: "9780826412768", category: "Education", total_quantity: 2 },
    { title: "The Elements of Style", author: "Strunk & White", isbn: "9780205309023", category: "Education", total_quantity: 2 },
    { title: "Mindset", author: "Carol Dweck", isbn: "9780345472328", category: "Education", total_quantity: 3 },
    // ── Literature ──
    { title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", category: "Literature", total_quantity: 3 },
    { title: "1984", author: "George Orwell", isbn: "9780451524935", category: "Literature", total_quantity: 3 },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Literature", total_quantity: 2 },
    // ── Romance ──
    { title: "The Notebook", author: "Nicholas Sparks", isbn: "9781455582877", category: "Romance", total_quantity: 2 },
    { title: "Outlander", author: "Diana Gabaldon", isbn: "9780440212560", category: "Romance", total_quantity: 2 },
    { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "9780141441146", category: "Romance", total_quantity: 3 },
    // ── Technology ──
    { title: "The Mythical Man-Month", author: "Frederick Brooks", isbn: "9780201835953", category: "Technology", total_quantity: 2 },
    { title: "Structure and Interpretation of Computer Programs", author: "Sussman & Abelson", isbn: "9780262510875", category: "Technology", total_quantity: 2 },
    { title: "Code Complete", author: "Steve McConnell", isbn: "9780735619678", category: "Technology", total_quantity: 2 },
    // ── Fantasy ──
    { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", category: "Fantasy", total_quantity: 3 },
    { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "9780590353427", category: "Fantasy", total_quantity: 3 },
    { title: "A Game of Thrones", author: "George R.R. Martin", isbn: "9780553593716", category: "Fantasy", total_quantity: 2 },
    // ── Supplement existing categories ──
    { title: "The Selfish Gene", author: "Richard Dawkins", isbn: "9780199291151", category: "Science", total_quantity: 2 },
    { title: "Cosmos", author: "Carl Sagan", isbn: "9780345539434", category: "Science", total_quantity: 2 },
    { title: "Guns, Germs, and Steel", author: "Jared Diamond", isbn: "9780393317558", category: "History", total_quantity: 2 },
    { title: "The Diary of a Young Girl", author: "Anne Frank", isbn: "9780553577129", category: "History", total_quantity: 2 },
    { title: "Brave New World", author: "Aldous Huxley", isbn: "9780060850524", category: "Fiction", total_quantity: 2 },
    { title: "The Lord of the Rings", author: "J.R.R. Tolkien", isbn: "9780544003415", category: "Fantasy", total_quantity: 2 },
    // ── Education (supplement) ──
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "9780374533557", category: "Education", total_quantity: 3 },
    { title: "The Power of Habit", author: "Charles Duhigg", isbn: "9780812981605", category: "Education", total_quantity: 2 },
    { title: "Make It Stick", author: "Peter C. Brown", isbn: "9780674729018", category: "Education", total_quantity: 2 },
    { title: "Educated", author: "Tara Westover", isbn: "9780399590504", category: "Education", total_quantity: 3 },
    // ── Literature (supplement) ──
    { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", isbn: "9780060883287", category: "Literature", total_quantity: 3 },
    { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", isbn: "9780374528379", category: "Literature", total_quantity: 2 },
    { title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "9780486415871", category: "Literature", total_quantity: 2 },
    { title: "Moby-Dick", author: "Herman Melville", isbn: "9780142437247", category: "Literature", total_quantity: 2 },
    // ── Romance (supplement) ──
    { title: "The Fault in Our Stars", author: "John Green", isbn: "9780142424179", category: "Romance", total_quantity: 3 },
    { title: "The Hating Game", author: "Sally Thorne", isbn: "9780062439598", category: "Romance", total_quantity: 2 },
    { title: "The Time Traveler's Wife", author: "Audrey Niffenegger", isbn: "9780965818679", category: "Romance", total_quantity: 2 },
    { title: "It Ends With Us", author: "Colleen Hoover", isbn: "9781501110368", category: "Romance", total_quantity: 2 },
    // ── Science (supplement) ──
    { title: "The Gene", author: "Siddhartha Mukherjee", isbn: "9781476733524", category: "Science", total_quantity: 2 },
    { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", isbn: "9781400052189", category: "Science", total_quantity: 3 },
    { title: "Astrophysics for People in a Hurry", author: "Neil deGrasse Tyson", isbn: "9780393609394", category: "Science", total_quantity: 2 },
    // ── Technology (supplement) ──
    { title: "The Lean Startup", author: "Eric Ries", isbn: "9780307887894", category: "Technology", total_quantity: 2 },
    { title: "Clean Architecture", author: "Robert C. Martin", isbn: "9780134494166", category: "Technology", total_quantity: 2 },
    { title: "Refactoring", author: "Martin Fowler", isbn: "9780134757599", category: "Technology", total_quantity: 2 },
    { title: "Site Reliability Engineering", author: "Beyer et al.", isbn: "9781491929124", category: "Technology", total_quantity: 2 },
    // ── Fantasy (supplement) ──
    { title: "The Name of the Wind", author: "Patrick Rothfuss", isbn: "9780756404741", category: "Fantasy", total_quantity: 3 },
    { title: "The Way of Kings", author: "Brandon Sanderson", isbn: "9780765326355", category: "Fantasy", total_quantity: 3 },
    { title: "American Gods", author: "Neil Gaiman", isbn: "9780062567584", category: "Fantasy", total_quantity: 2 },
    { title: "Assassin's Apprentice", author: "Robin Hobb", isbn: "9780553573398", category: "Fantasy", total_quantity: 2 },
    // ── History (supplement) ──
    { title: "The Silk Roads", author: "Peter Frankopan", isbn: "9781101946329", category: "History", total_quantity: 2 },
    { title: "SPQR", author: "Mary Beard", isbn: "9781631492228", category: "History", total_quantity: 2 },
    { title: "A People's History of the United States", author: "Howard Zinn", isbn: "9780062397348", category: "History", total_quantity: 2 },
    { title: "The Wright Brothers", author: "David McCullough", isbn: "9781476728759", category: "History", total_quantity: 2 },
    // ── Mystery / Thriller ──
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn: "9780307454540", category: "Mystery / Thriller", total_quantity: 3 },
    { title: "Gone Girl", author: "Gillian Flynn", isbn: "9780307588371", category: "Mystery / Thriller", total_quantity: 3 },
    { title: "The Da Vinci Code", author: "Dan Brown", isbn: "9780307474278", category: "Mystery / Thriller", total_quantity: 3 },
    { title: "The Silence of the Lambs", author: "Thomas Harris", isbn: "9780312924584", category: "Mystery / Thriller", total_quantity: 2 },
    { title: "The Girl on the Train", author: "Paula Hawkins", isbn: "9781594634024", category: "Mystery / Thriller", total_quantity: 2 },
    { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", isbn: "9780140437867", category: "Mystery / Thriller", total_quantity: 2 },
    // ── Self-development ──
    { title: "Grit", author: "Angela Duckworth", isbn: "9781501111129", category: "Self-development", total_quantity: 4 },
    { title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", isbn: "9781982137274", category: "Self-development", total_quantity: 3 },
    { title: "Think and Grow Rich", author: "Napoleon Hill", isbn: "9781585424337", category: "Self-development", total_quantity: 2 },
    { title: "The Power of Now", author: "Eckhart Tolle", isbn: "9781577314806", category: "Self-development", total_quantity: 3 },
    { title: "Awaken the Giant Within", author: "Tony Robbins", isbn: "9780671791544", category: "Self-development", total_quantity: 2 },
    { title: "Man's Search for Meaning", author: "Viktor Frankl", isbn: "9780807014295", category: "Self-development", total_quantity: 2 },
    // ── Fiction (supplement) ──
    { title: "The Alchemist", author: "Paulo Coelho", isbn: "9780062315007", category: "Fiction", total_quantity: 3 },
    { title: "Fahrenheit 451", author: "Ray Bradbury", isbn: "9781451673319", category: "Fiction", total_quantity: 2 },
    // ── Engineering (supplement) ──
    { title: "The Design of Everyday Things", author: "Don Norman", isbn: "9780465050659", category: "Engineering", total_quantity: 2 },
    // ── Computer Science (supplement) ──
    { title: "The Clean Coder", author: "Robert C. Martin", isbn: "9780137081073", category: "Computer Science", total_quantity: 2 },
    // ── AI / ML ──
    { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell & Peter Norvig", isbn: "9780134610993", category: "AI / ML", total_quantity: 3 },
    { title: "Deep Learning", author: "Ian Goodfellow", isbn: "9780262035613", category: "AI / ML", total_quantity: 2 },
    { title: "Pattern Recognition and Machine Learning", author: "Christopher Bishop", isbn: "9780387310732", category: "AI / ML", total_quantity: 2 },
    // ── Networking ──
    { title: "Data Communications and Networking", author: "Behrouz Forouzan", isbn: "9780073376226", category: "Networking", total_quantity: 3 },
    { title: "TCP/IP Illustrated", author: "W. Richard Stevens", isbn: "9780321336316", category: "Networking", total_quantity: 2 },
    { title: "Computer Networks", author: "Andrew S. Tanenbaum", isbn: "9780132126953", category: "Networking", total_quantity: 2 },
    // ── Databases ──
    { title: "Database Systems: The Complete Book", author: "Ullman et al.", isbn: "9780131873254", category: "Databases", total_quantity: 2 },
    { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", isbn: "9781449373320", category: "Databases", total_quantity: 3 },
    { title: "SQL in 10 Minutes", author: "Ben Forta", isbn: "9780135182796", category: "Databases", total_quantity: 3 },
    // ── Software Engineering ──
    { title: "Software Engineering", author: "Ian Sommerville", isbn: "9780133943030", category: "Software Engineering", total_quantity: 2 },
    { title: "Head First Design Patterns", author: "Freeman & Robson", isbn: "9781492078005", category: "Software Engineering", total_quantity: 2 },
    { title: "Working Effectively with Legacy Code", author: "Michael Feathers", isbn: "9780131177055", category: "Software Engineering", total_quantity: 2 },
    // ── Mathematics ──
    { title: "Calculus", author: "James Stewart", isbn: "9781285740621", category: "Mathematics", total_quantity: 3 },
    { title: "Linear Algebra Done Right", author: "Sheldon Axler", isbn: "9783319110790", category: "Mathematics", total_quantity: 2 },
    { title: "Discrete Mathematics", author: "Kenneth Rosen", isbn: "9781260091991", category: "Mathematics", total_quantity: 2 },
    // ── English ──
    { title: "On Writing Well", author: "William Zinsser", isbn: "9780060891541", category: "English", total_quantity: 2 },
    { title: "Oxford Modern English Grammar", author: "Bas Aarts", isbn: "9780199658237", category: "English", total_quantity: 2 },
    { title: "The Oxford Dictionary of English", author: "Angus Stevenson", isbn: "9780199571123", category: "English", total_quantity: 2 },
    // ── UI / UX ──
    { title: "Don't Make Me Think", author: "Steve Krug", isbn: "9780321965516", category: "UI / UX", total_quantity: 3 },
    { title: "About Face: The Essentials of Interaction Design", author: "Alan Cooper", isbn: "9781118766576", category: "UI / UX", total_quantity: 2 },
    { title: "Hooked: How to Build Habit-Forming Products", author: "Nir Eyal", isbn: "9781591847786", category: "UI / UX", total_quantity: 2 },
    // ── Cybersecurity ──
    { title: "The Web Application Hacker's Handbook", author: "Dafydd Stuttard", isbn: "9781118026472", category: "Cybersecurity", total_quantity: 2 },
    { title: "Data and Goliath", author: "Bruce Schneier", isbn: "9780393352177", category: "Cybersecurity", total_quantity: 2 },
    // ── Data Science ──
    { title: "Python Data Science Handbook", author: "Jake VanderPlas", isbn: "9781098121228", category: "Data Science", total_quantity: 3 },
    { title: "Storytelling with Data", author: "Cole Nussbaumer Knaflic", isbn: "9781119002253", category: "Data Science", total_quantity: 2 },
    { title: "Naked Statistics", author: "Charles Wheelan", isbn: "9780393347777", category: "Data Science", total_quantity: 2 },
  ];

  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {
        title: b.title,
        author: b.author,
        category: b.category,
        total_quantity: b.total_quantity,
        available_quantity: b.total_quantity,
      },
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: b.category,
        total_quantity: b.total_quantity,
        available_quantity: b.total_quantity,
      },
    });
  }

  console.log("Books seeded (idempotent upsert)");
}

async function seedMetadata() {
  const books = await prisma.book.findMany({
    where: {
      is_deleted: false,
      OR: [
        { metadata: null },
        { metadata: { cover_image_url: null } },
      ],
    },
  });
  if (books.length === 0) {
    console.log("All books already have covers — skipping");
    return;
  }

  for (const book of books) {
    let olData = null;
    try {
      olData = await openLib.fetchByIsbn(book.isbn);
      await delay(350);
    } catch {
      console.log(`  [ISBN ${book.isbn}] Open Library crawl failed, using default cover`);
    }

    const subjectsRaw = olData?.subjects || null;
    const subjectsSafe = subjectsRaw && subjectsRaw.length > 500 ? subjectsRaw.slice(0, 497) + "..." : subjectsRaw;

    let coverUrl = olData?.cover_image_url || `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    let coverSource = olData?.cover_image_url ? "Open Library" : null;
    let meta = olData;

    if (!coverSource) {
      try {
        const gbData = await googleBooks.fetchByIsbn(book.isbn);
        if (gbData?.cover_image_url) {
          coverUrl = gbData.cover_image_url;
          coverSource = "Google Books";
          meta = gbData;
        }
        await delay(350);
      } catch {
        console.log(`  [${book.isbn}] Google Books crawl failed`);
      }
    }

    await prisma.bookMetadata.upsert({
      where: { book_id: book.id },
      create: {
        book_id: book.id,
        cover_image_url: coverUrl,
        description: meta?.description || null,
        publisher: meta?.publisher || null,
        publish_year: meta?.publish_year || null,
        subjects: subjectsSafe,
        page_count: meta?.page_count || null,
        source_url: meta?.source_url || null,
        crawled_at: new Date(),
      },
      update: {
        cover_image_url: coverUrl,
        description: meta?.description || null,
        publisher: meta?.publisher || null,
        publish_year: meta?.publish_year || null,
        subjects: subjectsSafe,
        page_count: meta?.page_count || null,
        source_url: meta?.source_url || null,
        crawled_at: new Date(),
      },
    });

    console.log(`  [${book.isbn}] ${book.title}: ${coverSource || "client cascade (ISBN -L/-M, Google Books, fallback SVG)"}`);
  }

  console.log(`BookMetadata seeded for ${books.length} books`);
}

async function seedBorrowRecords() {
  const existingCount = await prisma.borrowRecord.count();
  if (existingCount > 0) {
    console.log("Borrow records already exist — skipping to preserve data integrity");
    return;
  }

  const student = await prisma.user.findFirst({ where: { role: "user" } });
  const books = await prisma.book.findMany();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const borrow1 = await prisma.borrowRecord.create({
    data: {
      user_id: student.id,
      borrow_date: thirtyDaysAgo,
      due_date: thirtyDaysFromNow,
      return_date: now,
      status: "returned",
      items: {
        create: [{ book_id: books[3].id, quantity: 1 }],
      },
    },
  });

  console.log("On-time borrow record created");

  const pastDate3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const borrow2 = await prisma.borrowRecord.create({
    data: {
      user_id: student.id,
      borrow_date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      due_date: thirtyDaysAgo,
      return_date: pastDate3,
      status: "returned",
      items: {
        create: [{ book_id: books[0].id, quantity: 1 }],
      },
    },
  });

  await prisma.fine.create({
    data: {
      borrow_record_id: borrow2.id,
      user_id: student.id,
      amount: 14000,
      reason: "Overdue return",
      is_paid: false,
    },
  });

  console.log("Overdue borrow record (returned) + fine created");
}

async function main() {
  console.log("Seeding database...");

  await seedUsers();
  await seedBooks();
  await seedMetadata();
  await seedBorrowRecords();

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
