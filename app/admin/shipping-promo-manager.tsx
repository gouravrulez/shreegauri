"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ShippingPromoManager() {
  const [settings,setSettings]=useState<any>({id:1,default_shipping_charge_inr:0,free_shipping_enabled:false,free_shipping_threshold_inr:0,default_min_delivery_days:3,default_max_delivery_days:7});
  const [companies,setCompanies]=useState<any[]>([]); const [coupons,setCoupons]=useState<any[]>([]); const [notice,setNotice]=useState(""); const [editingCouponId,setEditingCouponId]=useState<string|null>(null);
  const [company,setCompany]=useState<any>({name:"",tracking_url_template:"",default_charge_inr:0,estimated_min_days:3,estimated_max_days:7,is_active:true});
  const [coupon,setCoupon]=useState<any>({code:"",discount_type:"percentage",discount_value:10,min_order_inr:0,max_discount_inr:"",max_uses:"",per_customer_limit:"",starts_at:"",ends_at:"",is_active:true,is_public:true,show_on_dashboard:true,applies_to:"all",product_ids:"",category_ids:""});
  async function load(){const [s,c,p]=await Promise.all([supabase.from("shipping_settings").select("*").eq("id",1).maybeSingle(),supabase.from("shipping_companies").select("*").order("name"),supabase.from("promo_codes").select("*").order("created_at",{ascending:false})]);if(s.data)setSettings(s.data);if(c.data)setCompanies(c.data);if(p.data)setCoupons(p.data);if(s.error||c.error||p.error)setNotice([s.error?.message,c.error?.message,p.error?.message].filter(Boolean).join(" Â· "));}¶»§q«^