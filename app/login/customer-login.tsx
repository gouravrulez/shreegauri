"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  UserRound, Package, MapPin, LogOut, ShoppingBag, Truck, Home,
  Plus, Trash2, CheckCircle2, Heart, Headphones, ChevronRight, CreditCard
} from "lucide-react";

type Profile = {
  id?: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  profile_image_url: string;
};

type Address = {
  id: string;
  customer_id: string;
  label: string;
  recipient_name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  certificate_selected?: boolean;
  certificate_price_inr?: number;
  abhimantrit_selected?: boolean;
  quantity: number;
  line_total_inr: number;
};

type Order = {
  id: string;
  order_number: string;
  total_inr: number;
  payment_status: string;
  order_status: string;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  dispatch_date?: string | null;
  expected_delivery_date?: string | null;
  courier_charge_inr?: number;
  created_at: string;
  order_items: OrderItem[];
};

const blankProfile: Profile = {
  full_name: "", email: "", phone: "", date_of_birth: "", profile_image_url: ""
};

const blankAddress = {
  label: "Home",
  recipien¶»§q«^