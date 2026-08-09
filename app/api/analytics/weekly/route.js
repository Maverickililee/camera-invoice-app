import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Invoice from '../../../../models/Invoice.js';
import { requireAuth } from '../../../../lib/auth.js';

export async function GET(request) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const invoices = await Invoice.find({
      createdAt: { $gte: weekAgo }
    }).sort({ createdAt: -1 });

    const totalRevenue = invoices.reduce((sum, invoice) => {
      return invoice.paymentStatus === 'paid' ? sum + invoice.totalAmount : sum;
    }, 0);

    const pendingRevenue = invoices.reduce((sum, invoice) => {
      return invoice.paymentStatus === 'pending' ? sum + invoice.totalAmount : sum;
    }, 0);

    const paidCount = invoices.filter(i => i.paymentStatus === 'paid').length;
    const pendingCount = invoices.filter(i => i.paymentStatus === 'pending').length;
    const failedCount = invoices.filter(i => i.paymentStatus === 'failed').length;

    // Daily revenue for the week
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= dayStart && invoiceDate <= dayEnd && invoice.paymentStatus === 'paid';
      });

      const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      dailyRevenue.push({
        date: date.toLocaleDateString('fa-IR'),
        revenue: dayTotal,
      });
    }

    return NextResponse.json({
      totalRevenue,
      pendingRevenue,
      paidCount,
      pendingCount,
      failedCount,
      totalInvoices: invoices.length,
      dailyRevenue,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آنالیز' },
      { status: 500 }
    );
  }
}
