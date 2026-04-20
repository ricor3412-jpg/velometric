import './globals.css';

export const metadata = {
  title: 'VeloMetric | AI Performance Infrastructure',
  description: 'High-performance reporting and intelligence for AI agents and developer workflows.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
