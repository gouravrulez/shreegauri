"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountry, canUsePhonePe, INTERNATIONAL_PAYMENT_MESSAGE } from "./lib/global-commerce";
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  Gem,
  Minus,
  Plus,
  Share2,
  UserRound,
  MessageCircle,
  Mail,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa6";

type C = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  collection_type: "category" | "purpose" | "planet";
};
type ProductVariant = { id: string; product_id: string; label: string; price_inr: number; stock_quantity: number; is_active: boolean; sort_order: number };
type P = {
  id: string;
  category_id: string | null;
  category_ids: string[];
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_inr: number;
  compare_at_price_inr: number | null;
  primary_image_url: string;
  image_urls: string[];
  stock_quantity: number;
  is_featured: boolean;
  badge: string | null;
  abhimantrit_available?: boolean;
  abhimantrit_selected?: boolean;
  certificate_available?: boolean;
  certificate_price_inr?: number;
  certificate_selected?: boolean;
  has_size_options?: boolean;
  custom_shipping_enabled?: boolean;
 ¶»§q«^