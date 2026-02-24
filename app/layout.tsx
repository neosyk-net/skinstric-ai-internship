import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const roobert = localFont({
  src: "./fonts/Roobert-TRIAL-Light.woff2",
  weight: "300",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skinstric AI",
  description: "Skinstric AI Internship Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roobert.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}