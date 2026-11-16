"use client";
import { FormEvent, Fragment, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ShippingPromoManager from "./shipping-promo-manager";
import {
  LogOut,
  Trash2,
  Save,
  Store,
  Layers,
  Package,
  Settings,
  Star,
  ClipboardList,
  Users,
  ShieldCheck,
  UserPlus,
  UserX,
  Globe,
} from "lucide-react";
type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  collection_type: "category" | "purpose" | "planet";
};
type Prod = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_inr: number;
  compare_at_price_inr: number | null;
  stock_quantity: number;
  category_id: string | null;
  category_ids: string[];
  sku: string | null;
  product_type: string | null;
  material: string | null;
  gemstone_name: string | null;
  natural_lab_status: string | null;
  origin: string | null;
  treatment: string | null;
  certification: string | null;
  shape: string | null;
  color: string | null;
  weight_grams: number | null;
  carat_weight: number | null;
  chakras: string[];
  zodiac_signs: string[];
  seo_title: string | null;
  seo_description: string | null;
  primary_image_url: string;
  image_urls: string[];
  badge: string | null;
  is_active: boolean;
  is_featured: boolean;
  certificate_available?: boolean;
  certificate_price_inr?: number;
  a¶»§q«^