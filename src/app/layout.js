import { Geist } from 'next/font/google';
import './globals.css';
import './tokens.css';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'TempoRead — 200 pages. 1 hour. Let\u2019s go.',
  description: 'RSVP speed reading for university students. Paste a PDF, DOCX, URL or text and read 2\u20133\u00d7 faster with the focal letter centred on the page. Built for law, medicine, business and humanities.',
  keywords: ['speed reading', 'RSVP', 'study tool', 'PDF reader', 'university', 'law student', 'medical student', 'temporead'],
  authors: [{ name: 'TempoRead' }],
  openGraph: {
    title: 'TempoRead — 200 pages. 1 hour.',
    description: 'RSVP speed reading for university students. 200 pages in 1 hour.',
    siteName: 'TempoRead',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TempoRead — 200 pages. 1 hour.',
    description: 'RSVP speed reading for university students.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
