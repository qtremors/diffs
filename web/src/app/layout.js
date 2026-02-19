import "./globals.css";

export const metadata = {
  title: "Side-by-Side Diff Viewer",
  description: "A premium tool to compare text and files side-by-side with synchronized scrolling.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-inter">
        {children}
      </body>
    </html>
  );
}
