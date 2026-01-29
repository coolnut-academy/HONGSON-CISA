import type { Metadata } from "next";
import { Sarabun, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext";
import DevRoleSwitcher from "@/components/DevRoleSwitcher";

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hongson-CISA | ระบบวัดและประเมินผลสมรรถนะ",
  description: "Competency Integrated Skills Assessment Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${sarabun.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthContextProvider>
          {children}
          <DevRoleSwitcher />
        </AuthContextProvider>
      </body>
    </html>
  );
}
