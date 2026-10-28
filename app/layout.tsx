import type { Metadata } from "next";
import { IBM_Plex_Sans, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "निवाडा — उत्पन्नाचा दाखला",
  description: "छत्रपती संभाजीनगर तहसीलच्या नायब तहसीलदारांसाठी उत्पन्नाच्या दाखल्याची पंक्ती.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mr" className={`${sans.variable} ${serif.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
