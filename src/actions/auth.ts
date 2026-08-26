"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminSession, destroyAdminSession } from "@/lib/session";
import { LoginSchema } from "@/lib/validation";

export type LoginState = {
  error?: string;
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "יש להזין סיסמה" };
  }

  const { password } = parsed.data;

  // Password-only login — there is exactly one admin account, so we look it
  // up without a username field.
  const admin = await prisma.adminUser.findFirst();
  if (!admin) {
    await bcrypt.compare(password, "$2b$10$invalidsaltinvalidsaltinvalidsal");
    return { error: "סיסמה שגויה" };
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const minutes = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `יותר מדי ניסיונות כושלים. נסו שוב בעוד כ-${minutes} דקות` };
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedAttempts + 1;
    const LOCK_THRESHOLD = 5;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedAttempts: attempts,
        lockedUntil:
          attempts >= LOCK_THRESHOLD
            ? new Date(Date.now() + 15 * 60 * 1000)
            : admin.lockedUntil,
      },
    });
    return { error: "סיסמה שגויה" };
  }

  if (admin.failedAttempts > 0 || admin.lockedUntil) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  await createAdminSession({ adminId: admin.id, username: admin.username });
  redirect("/admin");
}

export async function logout() {
  await destroyAdminSession();
  redirect("/admin/login");
}
