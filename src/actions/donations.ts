"use server";

import { prisma } from "@/lib/prisma";
import { DonationFormSchema } from "@/lib/validation";
import { verifyAdminSession } from "@/lib/dal";
import { revalidatePath } from "next/cache";

export type DonationActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  amount?: number;
};

export async function createDonation(
  _prevState: DonationActionState,
  formData: FormData
): Promise<DonationActionState> {
  const raw = {
    hiddurLevel: formData.get("hiddurLevel"),
    dedicationType: formData.get("dedicationType"),
    dedicationName: formData.get("dedicationName"),
    donorName: formData.get("donorName"),
    donorPhone: formData.get("donorPhone"),
    paidConfirmed: formData.get("paidConfirmed") === "on" ? true : undefined,
  };

  const parsed = DonationFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;

  // Snapshot the current רגיל price for the chosen hiddur level — donations
  // aren't tied to a specific ProductSet or its stock.
  const referenceSet = await prisma.productSet.findFirst({
    where: { kind: "REGULAR", etrogType: "רגיל", hiddurLevel: data.hiddurLevel, active: true },
  });
  if (!referenceSet) {
    return { message: "לא ניתן לתרום סט ברמת הידור זו כרגע, נסו שוב." };
  }

  const donation = await prisma.donation.create({
    data: {
      hiddurLevel: data.hiddurLevel,
      dedicationType: data.dedicationType,
      dedicationName: data.dedicationName,
      donorName: data.donorName,
      donorPhone: data.donorPhone,
      amount: referenceSet.price,
    },
  });

  revalidatePath("/admin/donations");

  return { success: true, amount: donation.amount };
}

export async function markDonationPaid(donationId: string) {
  await verifyAdminSession();
  await prisma.donation.update({
    where: { id: donationId },
    data: { paidConfirmed: true, paidConfirmedAt: new Date() },
  });
  revalidatePath("/admin/donations");
}

export async function unmarkDonationPaid(donationId: string) {
  await verifyAdminSession();
  await prisma.donation.update({
    where: { id: donationId },
    data: { paidConfirmed: false, paidConfirmedAt: null },
  });
  revalidatePath("/admin/donations");
}
