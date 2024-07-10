export const metadata = {
  title: "Next.js - With Zones",
  description: "Next.js example for Multi Zones",
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
