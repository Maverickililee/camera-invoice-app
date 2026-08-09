import './globals.css';

export const metadata = {
  title: 'سیستم فاکتور فروشگاه دوربین',
  description: 'سیستم مدیریت فاکتور و پرداخت',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
