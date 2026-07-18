import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';
import { asNonNegativeNumber } from '@/lib/product-nutrition';
import type { Product } from '@/types';

type ProductRow = {
  id: string;
  name: string;
  energy_100g: number;
  proteins_100g: number;
  fat_100g: number;
  carbs_100g: number;
  source: 'manual' | 'ai';
  base_product_id: string | null;
};

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    barcode: null,
    name: row.name,
    calories: asNonNegativeNumber(row.energy_100g),
    protein: asNonNegativeNumber(row.proteins_100g),
    fat: asNonNegativeNumber(row.fat_100g),
    carbs: asNonNegativeNumber(row.carbs_100g),
    source: row.source === 'ai' ? 'ai' : 'manual',
    baseProductId: row.base_product_id,
    isPersonal: true,
  };
}

async function currentUser() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase
    .from('user_products')
    .select('id,name,energy_100g,proteins_100g,fat_100g,carbs_100g,source,base_product_id')
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load products' }, { status: 500 });
  return NextResponse.json(((data ?? []) as ProductRow[]).map(mapRow));
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 200) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });

  const payload = {
    user_id: user.id,
    base_product_id: typeof body?.baseProductId === 'string' ? body.baseProductId : null,
    name,
    energy_100g: asNonNegativeNumber(body?.calories),
    proteins_100g: asNonNegativeNumber(body?.protein),
    fat_100g: asNonNegativeNumber(body?.fat),
    carbs_100g: asNonNegativeNumber(body?.carbs),
    source: body?.source === 'ai' ? 'ai' : 'manual',
    updated_at: new Date().toISOString(),
  };

  const id = typeof body?.id === 'string' ? body.id : null;
  const query = id
    ? supabase.from('user_products').update(payload).eq('id', id)
    : supabase.from('user_products').insert(payload);
  const { data, error } = await query
    .select('id,name,energy_100g,proteins_100g,fat_100g,carbs_100g,source,base_product_id')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Unable to save product' }, { status: 500 });
  return NextResponse.json(mapRow(data as ProductRow));
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await supabase.from('user_products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Unable to delete product' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
