import './globals.css';

export const metadata = {
  title: 'سیستم فاکتور فروشگاه دوربین ۶۹۹۱۰۲۱۳',
  description: 'سیستم مدیریت فاکتور و پرداخت',
  other: {
    enamad: '۶۹۹۱۰۲۱۳',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
