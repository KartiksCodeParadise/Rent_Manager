"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { get, run } from "../db";
import { endSession, requireUser, startSession } from "../auth";
import { str } from "../format";

const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export async function register(fd: FormData) {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone");
  const password = str(fd, "password");
  const role = str(fd, "role") === "owner" ? "owner" : "tenant";
  const next = safeNext(str(fd, "next"));
  const back = (error: string) => redirect(`/register?role=${role}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(error)}`);

  if (!name || !email || !password) back("Please fill name, email and password.");
  if (password.length < 6) back("Password must be at least 6 characters.");
  if (phone.replace(/\D/g, "").length < 10) back("Enter a valid mobile number for SMS updates.");
  if (await get("SELECT id FROM users WHERE email = ?", [email])) back("An account with this email already exists.");

  const hash = await bcrypt.hash(password, 10);
  const { id } = await run(
    "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [name, email, phone, hash, role],
  );
  await startSession(id);
  redirect(next);
}

export async function login(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const next = safeNext(str(fd, "next"));
  const user = await get<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    [email],
  );
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    redirect(`/login?error=${encodeURIComponent("Wrong email or password.")}&next=${encodeURIComponent(next)}`);
  }
  await startSession(user.id);
  redirect(next);
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function updateProfile(fd: FormData) {
  const user = await requireUser();
  const name = str(fd, "name") || user.name;
  const phone = str(fd, "phone");
  const upi = str(fd, "upi_id");
  const smsOptIn = fd.get("sms_opt_in") ? 1 : 0;
  await run("UPDATE users SET name = ?, phone = ?, upi_id = ?, sms_opt_in = ? WHERE id = ?", [
    name,
    phone,
    upi,
    smsOptIn,
    user.id,
  ]);

  const newPassword = str(fd, "new_password");
  if (newPassword) {
    if (newPassword.length < 6) redirect("/dashboard/settings?error=" + encodeURIComponent("Password too short."));
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [await bcrypt.hash(newPassword, 10), user.id]);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/settings?msg=" + encodeURIComponent("Profile saved."));
}
