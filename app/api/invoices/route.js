import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase.js';
import Invoice from '../../../models/Invoice.js';
import { requireAuth } from '../../../lib/auth.js';

function errorMessage(error) {
  if (!error) return '';
  return error.message || error.details || String(error);
}

export async function GET(request) {
  try {
    const userId = await requireAuth();

    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ error: 'دیتابیس پیکربندی نشده است' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerPhone = searchParams.get('customerPhone');

    const invoices = await Invoice.find({
      ...(status ? { paymentStatus: status } : {}),
      ...(customerPhone ? { customerPhone } : {}),
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت فاکتورها', details: errorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await requireAuth();

    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ error: 'دیتابیس پیکربندی نشده است' }, { status: 500 });
    }

    const { customerName, customerPhone, items } = await request.json();

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر است' },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupErr } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', customerPhone)
      .maybeSingle();
    if (lookupErr) throw lookupErr;

    let customer = existing;
    if (!customer) {
      const nameParts = String(customerName).trim().split(/\s+/);
      const firstName = nameParts[0] || customerName;
      const lastName = nameParts.slice(1).join(' ') || '-';
      const { data: created, error: cErr } = await supabase
        .from('customers')
        .insert({ first_name: firstName, last_name: lastName, phone: customerPhone })
        .select()
        .single();
      if (cErr) {
        if (cErr.code === '23505') {
          const { data: dup } = await supabase.from('customers').select('*').eq('phone', customerPhone).maybeSingle();
          customer = dup;
          if (!customer) throw cErr;
        } else {
          throw cErr;
        }
      } else {
        customer = created;
      }
    }

    let totalAmount = 0;
    const populatedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity) || 1;
      if (item.type === 'product') {
        const productId = item.productId || item.itemId;
        const { data: product, error: pErr } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
        if (pErr || !product) {
          return NextResponse.json(
            { error: `محصول با شناسه ${productId} یافت نشد` },
            { status: 404 }
          );
        }
        const price = Number(product.price) || 0;
        totalAmount += price * quantity;
        populatedItems.push({
          productId: product.id,
          type: 'product',
          quantity,
          price,
        });
      } else if (item.type === 'service') {
        const serviceId = item.serviceId || item.itemId;
        const { data: service, error: sErr } = await supabase.from('services').select('*').eq('id', serviceId).maybeSingle();
        if (sErr || !service) {
          return NextResponse.json(
            { error: `خدمت با شناسه ${serviceId} یافت نشد` },
            { status: 404 }
          );
        }
        const price = Number(service.price) || 0;
        totalAmount += price * quantity;
        populatedItems.push({
          serviceId: service.id,
          type: 'service',
          quantity,
          price,
        });
      }
    }

    if (populatedItems.length === 0) {
      return NextResponse.json(
        { error: 'هیچ آیتم معتبری برای فاکتور وجود ندارد' },
        { status: 400 }
      );
    }

    const invoice = await Invoice.create({
      customerName,
      customerPhone,
      totalAmount,
      paymentStatus: 'pending',
      items: populatedItems,
    });

    return NextResponse.json({ success: true, invoice, customer }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد فاکتور', details: errorMessage(error) },
      { status: 500 }
    );
  }
}
