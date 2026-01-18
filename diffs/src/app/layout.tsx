import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = {
  title: "Diffs | See what changed",
  description:
    "Compare text, structured data, and still images locally.",
  icons: { icon: "/Diffs.svg" },
};
export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
