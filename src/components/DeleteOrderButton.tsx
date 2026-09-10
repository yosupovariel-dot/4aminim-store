"use client";

export function DeleteOrderButton({ orderNumber }: { orderNumber: number }) {
  return (
    <button
      type="submit"
      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      onClick={(e) => {
        if (!confirm(`למחוק לצמיתות את הזמנה #${orderNumber}? המלאי יוחזר אוטומטית. פעולה זו בלתי הפיכה.`)) {
          e.preventDefault();
        }
      }}
    >
      מחיקת ההזמנה לצמיתות
    </button>
  );
}
