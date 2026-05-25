/**
 * Malayalam Number to Words Converter
 * Supports up to Crores
 * Deterministic implementation for technical financial reports.
 */
export function numberToMalayalamWords(num: number): string {
  if (num === 0) return "പൂജ്യം";

  const ones: string[] = [
    "",
    "ഒന്ന്",
    "രണ്ട്",
    "മൂന്ന്",
    "നാല്",
    "അഞ്ച്",
    "ആറ്",
    "ഏഴ്",
    "എട്ട്",
    "ഒൻപത്",
    "പത്ത്",
    "പതിനൊന്ന്",
    "പന്ത്രണ്ട്",
    "പതിമൂന്ന്",
    "പതിനാല്",
    "പതിനഞ്ച്",
    "പതിനാറ്",
    "പതിനേഴ്",
    "പതിനട്ട്",
    "പത്തൊൻപത്",
  ];

  const tens: { [key: number]: string } = {
    20: "ഇരുപത്",
    30: "മുപ്പത്",
    40: "നാല്പത്",
    50: "അമ്പത്",
    60: "അറുപത്",
    70: "എഴുപത്",
    80: "എൺപത്",
    90: "തൊണ്ണൂറ്",
  };

  const specialTens: { [key: number]: string } = {
    21: "ഇരുപത്തിയൊന്ന്", 22: "ഇരുപത്തിരണ്ട്", 23: "ഇരുപത്തിമൂന്ന്", 24: "ഇരുപത്തിനാല്", 25: "ഇരുപത്തിയഞ്ച്",
    26: "ഇരുപത്തിയാറ്", 27: "ഇരുപത്തിയേഴ്", 28: "ഇരുപത്തിയെട്ട്", 29: "ഇരുപത്തിയൊൻപത്",
    31: "മുപ്പത്തിയൊന്ന്", 32: "മുപ്പത്തിരണ്ട്", 33: "മുപ്പത്തിമൂന്ന്", 34: "മുപ്പത്തിനാല്", 35: "മുപ്പത്തിയഞ്ച്",
    36: "മുപ്പത്തിയാറ്", 37: "മുപ്പത്തിയേഴ്", 38: "മുപ്പത്തിയെട്ട്", 39: "മുപ്പത്തിയൊൻപത്",
    41: "നാല്പത്തിയൊന്ന്", 42: "നാല്പത്തിരണ്ട്", 43: "നാല്പത്തിമൂന്ന്", 44: "നാല്പത്തിനാല്", 45: "നാല്പത്തിയഞ്ച്",
    46: "നാല്പത്തിയാറ്", 47: "നാല്പത്തിയേഴ്", 48: "നാല്പത്തിയെട്ട്", 49: "നാല്പത്തിയൊൻപത്",
    51: "അമ്പത്തിയൊന്ന്", 52: "അമ്പത്തിരണ്ട്", 53: "അമ്പത്തിമൂന്ന്", 54: "അമ്പത്തിനാല്", 55: "അമ്പത്തിയഞ്ച്",
    56: "അമ്പത്തിയാറ്", 57: "അമ്പത്തിയേഴ്", 58: "അമ്പത്തിയെട്ട്", 59: "അമ്പത്തിയൊൻപത്",
    61: "അറുപത്തിയൊന്ന്", 62: "അറുപത്തിരണ്ട്", 63: "അറുപത്തിമൂന്ന്", 64: "അറുപത്തിനാല്", 65: "അറുപത്തിയഞ്ച്",
    66: "അറുപത്തിയാറ്", 67: "അറുപത്തിയേഴ്", 68: "അറുപത്തിയെട്ട്", 69: "അറുപത്തിയൊൻപത്",
    71: "എഴുപത്തിയൊന്ന്", 72: "എഴുപത്തിരണ്ട്", 73: "എഴുപത്തിമൂന്ന്", 74: "എഴുപത്തിനാല്", 75: "എഴുപത്തിയഞ്ച്",
    76: "എഴുപത്തിയാറ്", 77: "എഴുപത്തിയേഴ്", 78: "എഴുപത്തിയെട്ട്", 79: "എഴുപത്തിയൊൻപത്",
    81: "എൺപത്തിയൊന്ന്", 82: "എൺപത്തിരണ്ട്", 83: "എൺപത്തിമൂന്ന്", 84: "എൺപത്തിനാല്", 85: "എൺപത്തിയഞ്ച്",
    86: "എൺപത്തിയാറ്", 87: "എൺപത്തിയേഴ്", 88: "എൺപത്തിയെട്ട്", 89: "എൺപത്തിയൊൻപത്",
    91: "തൊണ്ണൂറ്റിയൊന്ന്", 92: "തൊണ്ണൂറ്റിരണ്ട്", 93: "തൊണ്ണൂറ്റിമൂന്ന്", 94: "തൊണ്ണൂറ്റിനാല്", 95: "തൊണ്ണൂറ്റിയഞ്ച്",
    96: "തൊണ്ണൂറ്റിയാറ്", 97: "തൊണ്ണൂറ്റിയേഴ്", 98: "തൊണ്ണൂറ്റിയെട്ട്", 99: "തൊണ്ണൂറ്റിയൊൻപത്",
  };

  function convertBelow100(n: number): string {
    if (n < 20) return ones[n];
    if (specialTens[n]) return specialTens[n];
    const ten = Math.floor(n / 10) * 10;
    return tens[ten];
  }

  function convertBelow1000(n: number): string {
    if (n < 100) return convertBelow100(n);
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let result = `${ones[hundred]} നൂറ്റി`;
    if (remainder > 0) {
      result += ` ${convertBelow100(remainder)}`;
    }
    return result;
  }

  function convert(n: number): string {
    let result = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const remainder = n;

    if (crore > 0) result += `${convertBelow1000(crore)} കോടി `;
    if (lakh > 0) result += `${convertBelow1000(lakh)} ലക്ഷം `;
    if (thousand > 0) result += `${convertBelow1000(thousand)} ആയിരം `;
    if (remainder > 0) result += convertBelow1000(remainder);
    
    return result.trim();
  }

  return convert(num)
    .replace(/ആയിരം\s+/g, " ആയിരത്തി ")
    .replace(/ലക്ഷം\s+/g, " ലക്ഷത്തി ")
    .replace(/കോടി\s+/g, " കോടി ");
}

/**
 * Standardizes any date input string to DD/MM/YYYY
 */
export function formatToTechnicalDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '--/--/----';
  const trimmed = dateStr.trim();
  
  // Handle ISO strings or YYYY-MM-DD
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    // Assume DD-MM-YYYY or DD/MM/YYYY
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return dateStr;
}
