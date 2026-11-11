import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate=1800;
type Product={id:string;name:string;slug:string;short_description:string|null;description:string|null;price_inr:number;compare_at_price_inr:number|null;primary_image_url:string|null;image_urls:string[]|null;stock_quantity:number|null;brand:string|null};
async function findProduct(slug:string){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data}=await db.from("products").select("id,name,slug,short_description,description,price_inr,compare_at_price_inr,primary_image_url,image_urls,stock_quantity,brand").eq("brand","Shree Gauri").eq("is_active",true).eq("slug",slug).maybeSingle();
 return data as Product|null;
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params,p=await findProduct(slug);if(!p)return {};
 const desc=(p.short_description||p.description||`Explore ${p.name} at Shree Gauri. View product details, images, price and availability.`).replace(/\s+/g," ").slice(0,155);
 return {title:`Buy ${p.name} Online | Price & Details | Shree Gauri`,description:desc,alternates:{canonical:`https://shreegauri.in/product/${slug}`},openGraph:{title:`${p.name} | Shree Gauri`,description:desc,url:`https://shreegauri.in/product/${slug}`,images:p.primary_image_url?[p.primary_image_url]:[],type:"website"}};
}
export default async function ProductSeoPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,p=await findProduct(slug);if(!p)notFound();
 const description=p.description||p.short_description||`Explore ${p.name} from Shree Gauri. Review the product images, price and availability before ordering.`;
 const images=[p.primary_image_url,...(p.image_urls||[])].filter(Boolean);
 const jsonLd={"@context":"https://schema.org","@type":"Product","name":p.name,"description":description,"image":images,"sku":p.id,"brand":{"@type":"Brand","name":"Shree Gauri"},"offers":{"@type":"Offer","url":`https://shreegauri.in/product/${slug}`,"priceCurrency":"INR","price":Number(p.price_inr).toFixed(2),"availability":Number(p.stock_quantity||0)>0?"https://schema.org/InStock":"https://schema.org/OutOfStock","itemCondition":"https://schema.org/NewCondition"}};
 const buyUrl=`/?product=${encodeURIComponent(p.slug||p.id)}`;
 return <main style={{background:"#fffdf8",color:"#302321",minHeight:"100vh"}}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
  <header style={{padding:"18px clamp(18px,5vw,72px)",borderBottom:"1px solid #eadfce",display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" style={{fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:".12em",color:"#741923",textDecoration:"none"}}>SHREE GAURI</Link><Link href="/gemstones" style={{color:"#493936"}}>Explore Gemstones</Link></header>
  <nav aria-label="Breadcrumb" style={{maxWidth:1120,margin:"18px auto",padding:"0 20px",fontSize:13,color:"#796a61"}}><Link href="/" style={{color:"#741923"}}>Home</Link> / <Link href="/gemstones" style={{color:"#741923"}}>Gemstones</Link> / {p.name}</nav>
  <section style={{maxWidth:1120,margin:"24px auto 70px",padding:"0 20px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))",gap:42,alignItems:"start"}}>
   <div style={{background:"#f7f2e9",borderRadius:12,overflow:"hidden"}}>{p.primary_image_url?<img src={p.primary_image_url} alt={p.name} style={{display:"block",width:"100%",aspectRatio:"1/1",objectFit:"contain"}}/>:<div style={{aspectRatio:"1/1",display:"grid",placeItems:"center"}}>Shree Gauri</div>}{images.length>1?<div style={{display:"flex",gap:8,padding:10,overflowX:"auto"}}>{images.slice(1).map((src,i)=><img key={i} src={src!} alt={p.name+" view "+(i+2)} style={{width:76,height:76,objectFit:"cover",borderRadius:6}}/>)}</div>:null}</div>
   <div style={{paddingTop:10}}><p style={{color:"#99743b",letterSpacing:".16em",fontSize:12,fontWeight:700}}>SHREE GAURI · PRODUCT DETAILS</p><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,48px)",lineHeight:1.15,color:"#3c171b",margin:"12px 0"}}>{p.name}</h1><p style={{fontSize:15,lineHeight:1.8,color:"#5d4a42"}}>{p.short_description||description}</p><p style={{fontSize:30,fontWeight:700,margin:"22px 0",color:"#302321"}}>₹{Number(p.price_inr).toLocaleString("en-IN")}</p><p style={{fontSize:13,color:Number(p.stock_quantity||0)>0?"#287344":"#9a4b35"}}>{Number(p.stock_quantity||0)>0?"In stock":"Currently unavailable"}</p><Link href={buyUrl} style={{display:"inline-block",marginTop:16,padding:"14px 28px",background:"#741923",color:"#fff",borderRadius:5,textDecoration:"none",fontWeight:700}}>VIEW IN STORE & BUY</Link><p style={{fontSize:13,lineHeight:1.8,color:"#796a61",marginTop:22}}>Please review the full product description, material details, images, availability, shipping and return information before placing an order.</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,color:"#3c171b",marginTop:34}}>Product Description</h2><div style={{whiteSpace:"pre-line",lineHeight:1.9,color:"#594a44"}}>{description}</div><div style={{marginTop:28,display:"flex",gap:18,flexWrap:"wrap",fontSize:13}}><Link href="/shipping-returns" style={{color:"#741923"}}>Shipping & Returns</Link><Link href="/contact" style={{color:"#741923"}}>Contact Shree Gauri</Link><Link href="/gemstones" style={{color:"#741923"}}>Gemstone Collection</Link></div></div>
  </section>
  <footer style={{padding:26,textAlign:"center",borderTop:"1px solid #eadfce",color:"#6a5a52",fontSize:13}}>© {new Date().getFullYear()} Shree Gauri</footer>
 </main>;
}
