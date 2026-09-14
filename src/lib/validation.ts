import { z } from "zod";

export const NEIGHBORHOODS = ["נחלת יהודה", "אברמוביץ"] as const;

export const CartItemSchema = z.object({
  setId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const OrderFormSchema = z
  .object({
    items: z.array(CartItemSchema).min(1, { error: "הסל ריק" }),
    customerName: z.string().trim().min(2, { error: "יש להזין שם מלא" }),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{8,9}$/, { error: "מספר טלפון לא תקין (לדוגמה: 0501234567)" }),
    neighborhood: z.enum(NEIGHBORHOODS, {
      message: "יש לבחור שכונה",
    }),
    address: z.string().trim().min(3, "יש להזין כתובת מלאה"),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    payFullInCash: z.boolean(),
    depositMarkedPaid: z.boolean(),
    termsAccepted: z.literal(true, {
      error: "יש לאשר את התקנון ומדיניות הפרטיות",
    }),
  })
  .refine((data) => data.payFullInCash || data.depositMarkedPaid, {
    error: "יש לסמן שהעברת את המקדמה, או לבחור לשלם הכל במזומן במסירה",
    path: ["depositMarkedPaid"],
  });

export type OrderFormValues = z.infer<typeof OrderFormSchema>;

export const LoginSchema = z.object({
  password: z.string().min(1),
});

export const DEDICATION_TYPES = ["REFUAH", "ILUY_NESHAMA", "HATZLACHA"] as const;

export const DonationFormSchema = z.object({
  hiddurLevel: z.enum(["KOSHER", "MEHADRIN", "MEHADRIN_MIN_HAMEHADRIN", "DIAMOND"], {
    message: "יש לבחור רמת הידור",
  }),
  dedicationType: z.enum(DEDICATION_TYPES, { message: "יש לבחור סוג הקדשה" }),
  dedicationName: z.string().trim().min(2, { error: "יש להזין שם" }),
  donorName: z.string().trim().min(2, { error: "יש להזין שם מלא" }),
  donorPhone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, { error: "מספר טלפון לא תקין (לדוגמה: 0501234567)" }),
  paidConfirmed: z.literal(true, {
    error: "יש לאשר שההעברה בוצעה בפועל",
  }),
});

export type DonationFormValues = z.infer<typeof DonationFormSchema>;
