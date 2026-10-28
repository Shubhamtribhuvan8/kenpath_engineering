const BELOW_100 = [
  "शून्य",
  "एक",
  "दोन",
  "तीन",
  "चार",
  "पाच",
  "सहा",
  "सात",
  "आठ",
  "नऊ",
  "दहा",
  "अकरा",
  "बारा",
  "तेरा",
  "चौदा",
  "पंधरा",
  "सोळा",
  "सतरा",
  "अठरा",
  "एकोणीस",
  "वीस",
  "एकवीस",
  "बावीस",
  "तेवीस",
  "चोवीस",
  "पंचवीस",
  "सव्वीस",
  "सत्तावीस",
  "अठ्ठावीस",
  "एकोणतीस",
  "तीस",
  "एकतीस",
  "बत्तीस",
  "तेहेतीस",
  "चौतीस",
  "पस्तीस",
  "छत्तीस",
  "सदतीस",
  "अडतीस",
  "एकोणचाळीस",
  "चाळीस",
  "एकेचाळीस",
  "बेचाळीस",
  "त्रेचाळीस",
  "चव्वेचाळीस",
  "पंचेचाळीस",
  "शेहेचाळीस",
  "सत्तेचाळीस",
  "अठ्ठेचाळीस",
  "एकोणपन्नास",
  "पन्नास",
  "एकावन्न",
  "बावन्न",
  "त्रेपन्न",
  "चोपन्न",
  "पंचावन्न",
  "छप्पन्न",
  "सत्तावन्न",
  "अठ्ठावन्न",
  "एकोणसाठ",
  "साठ",
  "एकसष्ट",
  "बासष्ट",
  "त्रेसष्ट",
  "चौसष्ट",
  "पासष्ट",
  "सहासष्ट",
  "सदुसष्ट",
  "अडुसष्ट",
  "एकोणसत्तर",
  "सत्तर",
  "एकाहत्तर",
  "बाहत्तर",
  "त्र्याहत्तर",
  "चौऱ्याहत्तर",
  "पंच्याहत्तर",
  "शहात्तर",
  "सत्त्याहत्तर",
  "अठ्ठ्याहत्तर",
  "एकोणऐंशी",
  "ऐंशी",
  "एक्याऐंशी",
  "ब्याऐंशी",
  "त्र्याऐंशी",
  "चौऱ्याऐंशी",
  "पंच्याऐंशी",
  "शहाऐंशी",
  "सत्त्याऐंशी",
  "अठ्ठ्याऐंशी",
  "एकोणनव्वद",
  "नव्वद",
  "एक्याण्णव",
  "ब्याण्णव",
  "त्र्याण्णव",
  "चौऱ्याण्णव",
  "पंच्याण्णव",
  "शहाण्णव",
  "सत्त्याण्णव",
  "अठ्ठ्याण्णव",
  "नव्व्याण्णव",
];

function below100(n: number): string {
  if (n < 0 || n > 99 || !Number.isInteger(n)) {
    throw new Error(`unsupported number ${n}`);
  }
  return BELOW_100[n];
}

/** Indian grouping, up to 99,99,999. Enough for a certificate amount. */
export function inrWords(amount: number): string {
  if (!Number.isInteger(amount) || amount < 0 || amount > 99_99_999) {
    throw new Error(`unsupported amount ${amount}`);
  }
  if (amount === 0) return "शून्य रुपये";
  const parts: string[] = [];
  const lakh = Math.floor(amount / 1_00_000);
  const thousand = Math.floor((amount % 1_00_000) / 1_000);
  const rest = amount % 1_000;
  if (lakh) parts.push(`${below100(lakh)} लाख`);
  if (thousand) parts.push(`${below100(thousand)} हजार`);
  if (rest) {
    const hundreds = Math.floor(rest / 100);
    const ones = rest % 100;
    if (hundreds && ones) parts.push(`${below100(hundreds)}शे ${below100(ones)}`);
    else if (hundreds === 1) parts.push("शंभर");
    else if (hundreds) parts.push(`${below100(hundreds)}शे`);
    else parts.push(below100(ones));
  }
  return `${parts.join(" ")} रुपये`;
}
