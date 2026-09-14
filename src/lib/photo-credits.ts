// Photo credits for externally-sourced (non-staff-taken) images used on the
// site, pulled from Wikimedia Commons. Public-domain images don't legally
// require attribution but are listed anyway for transparency. Displayed on
// /photo-credits and linked quietly from the footer.
export type PhotoCredit = {
  subject: string;
  photographer?: string;
  license: string;
  sourceUrl: string;
};

export const PHOTO_CREDITS: PhotoCredit[] = [
  { subject: "אתרוג (Naxos citron)", photographer: "Johnbrewe", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:Naxos_citron.jpg" },
  { subject: "אתרוג מרוקאי עם זרעים", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:MoroccanWSeeds.jpg" },
  { subject: "אתרוג בפושקע", photographer: "Yankelowitz", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:Pushka2.JPG" },
  { subject: "אתרוג עם פיטם", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:Etrog_with_Pitom.jpg" },
  { subject: "אתרוג בלדי (זן Braverman)", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:Balady_citron_(Braverman_cultivar).jpg" },
  { subject: "אתרוג מרוקאי", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:MoroccanEtrog.jpg" },
  { subject: "שלושה אתרוגים", photographer: "Yankelowitz", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:3_etrog.JPG" },
  { subject: "אתרוג (Citrus medica)", photographer: "DRosenbach", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Citrus_medica_fruit.jpg" },
  { subject: "אתרוג (הודו)", photographer: "Dinesh Valke", license: "CC BY-SA 2.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Citron_(819330933).jpg" },
  { subject: "אתרוג (Cedro)", photographer: "Angelo Adduci61", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cedro_(CItrus_medica).jpg" },
  { subject: "אתרוג פרוס, ללא זרעים", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Halved_seedless_Moroccan_citron.jpg" },
  { subject: "הדסים", photographer: "DRosenbach", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hadassim2.JPG" },
  { subject: "הדסים בתקריב", photographer: "DRosenbach", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hadassim_closeup.JPG" },
  { subject: "הדסים", photographer: "DRosenbach", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hadassim.JPG" },
  { subject: "הדסים", photographer: "יאיר דב", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:הדסים.jpg" },
  { subject: "הדס", photographer: "Aviad2001", license: "CC BY 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hadas1.jpg" },
  { subject: "הדס", photographer: "Aviad2001", license: "CC BY 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hadas2.jpg" },
  { subject: "ערבה בתקריב", photographer: "Bachrach44", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Arava_closeup.JPG" },
  { subject: "ערבות", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Aravot.JPG" },
  { subject: "ערבות", photographer: "DRosenbach", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Aravos.JPG" },
  { subject: "ערבות", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:ערבות.jpg" },
  { subject: "לולבים", photographer: "Daniel Ventura", license: "CC BY-SA 2.5", sourceUrl: "https://commons.wikimedia.org/wiki/File:Lulavim.jpg" },
  { subject: "סט ארבעת המינים", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Arbaat_haminim-new.jpg" },
  { subject: "סט ארבעת המינים", photographer: "יאיר דב", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:סט_ארבעת_המינים.jpg" },
  { subject: "כל ארבעת המינים", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:כל_ארבעת_המינים.jpg" },
  { subject: "ארבעת המינים", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:Arbaat_haminim-2.jpg" },
  { subject: "ארבעת המינים", photographer: "Yonidebest", license: "נחלת הכלל (Public Domain)", sourceUrl: "https://commons.wikimedia.org/wiki/File:Arbaat_haminim.jpg" },
  { subject: "אתרוג, לולב והדס", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Etrog_Lulav_and_Hadas.jpg" },
];
