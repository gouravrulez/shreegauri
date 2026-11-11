import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop Gemstones Online in India | Shree Gauri",
  description: "Explore gemstones at Shree Gauri, including Blue Sapphire (Neelam), Yellow Sapphire (Pukhraj), Emerald (Panna), Ruby (Manik), Amethyst and more. Browse available gemstone products online.",
  alternates: { canonical: "https://shreegauri.in/gemstones" },
  openGraph: { title: "Shop Gemstones Online | Shree Gauri", description: "Explore gemstone collections and individual gemstone buying guides at Shree Gauri.", url: "https://shreegauri.in/gemstones", type: "website" },
};

const gemstones = [
  ["blue-sapphire","Blue Sapphire (Neelam)","Blue sapphire gemstone buying guide and available Neelam products."],
  ["yellow-sapphire","Yellow Sapphire (Pukhraj)","Explore yellow sapphire gemstones and Pukhraj products."],
  ["emerald","Emerald (Panna)","Explore emerald gemstones, also known as Panna."],
  ["ruby","Ruby (Manik)","Explore ruby gemstones, also known as Manik."],
  ["red-coral","Red Coral (Moonga)","Explore red coral gemstones and Moonga products."],
  ["pearl","Pearl (Moti)","Explore pearl gemstones and Moti products."],
  ["hessonite","Hessonite (Gomed)","Explore hessonite gemstones, also known as Gomed."],
  ["cats-eye","Cat's Eye (Lehsunia)","Explore cat's eye gemstones, also known as Lehsunia."],
  ["amethyst","Amethyst","Explore amethyst gemstones and available products."],
  ["rose-quartz","Rose Quartz","Explore rose quartz gemstones and jewellery."],
  ["citrine","Citrine","Explore citrine gemstones and jewellery."],
  ["tiger-eye","Tiger Eye","Explore tiger eye gemstones and bracelets."],
  ["pyrite","Pyrite","Explore pyrite stones and bracelets."],
  ["seven-chakra","Seven Chakra","Explore seven chakra gemstone products."],
];

export default function GemstonesPage() {
  const jsonLd = { "@context":"https://schema.org", "@type":"CollectionPage", name:"Gemstones Online - Shree Gauri", url:"https://shreegauri.in/gemstones", description:"Explore gemstone buying guides and gemstone products at Shree Gauri.", mainEntity:{ "@type":"ItemList", itemListElement:gemstones.map(([slug,name],i)=>({ "@type":"ListItem",position:i+1,name,url:`https://shreegauri.in/gemstones/${slug}` })) } };
  return <main style={{background:"#fffdf8",color:"#302321",minHeight:"100vh"}}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
    <header style={{padding:"18px clamp(18px,5vw,72px)",borderBottom:"1px solid #eadfce",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
      <Link href="/" style={{fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:".12em",color:"#741923",textDecoration:"none"}}>SHREE GAURI</Link>
      <nav style={{display:"flex",gap:18,fontSize:14,flexWrap:"wrap"}}><Link href="/" style={{color:"#493936"}}>Home</Link><Link href="/astrology" style={{color:"#493936"}}>Astrology</Link><Link href="/contact" style={{color:"#493936"}}>Contact</Link></nav>
    </header>
    <section style={{padding:"clamp(44px,8vw,92px) 20px 52px",textAlign:"center",background:"linear-gradient(135deg,#fff9ed,#f5ead8)"}}>
      <p style={{color:"#8a641e",letterSpacing:".2em",fontSize:12,fontWeight:700}}>THE SHREE GAURI GEMSTONE COLLECTION</p>
      <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(34px,6vw,60px)",lineHeight:1.08,maxWidth:900,margin:"16px auto",color:"#3c171b"}}>Explore Gemstones Online</h1>
      <p style={{maxWidth:720,margin:"0 auto",lineHeight:1.8,fontSize:17,color:"#5d4a42"}}>Discover gemstone names, traditional associations and available selections. Explore individual gemstone pages to find relevant products and detailed buying information.</p>
      <Link href="/?view=shop" style={{display:"inline-block",marginTop:26,padding:"13px 24px",background:"#741923",color:"#fff",borderRadius:5,textDecoration:"none",fontWeight:700}}>SHOP ALL PRODUCTS</Link>
    </section>
    <section style={{maxWidth:1180,margin:"0 auto",padding:"54px 20px 70px"}}>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:32,textAlign:"center",color:"#3c171b"}}>Browse by Gemstone</h2>
      <p style={{textAlign:"center",color:"#6a5a52",margin:"10px 0 30px"}}>Choose a gemstone to explore its dedicated page and matching Shree Gauri products.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,230px),1fr))",gap:16}}>
        {gemstones.map(([slug,name,desc])=><Link key={slug} href={`/gemstones/${slug}`} style={{padding:22,border:"1px solid #e8ddcc",borderRadius:10,background:"#fff",textDecoration:"none",color:"#382b27",boxShadow:"0 5px 18px rgba(55,30,20,.04)"}}>
          <span style={{fontSize:11,letterSpacing:".14em",color:"#99743b",fontWeight:700}}>GEMSTONE GUIDE</span>
          <h3 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"10px 0 7px",color:"#741923"}}>{name}</h3>
          <p style={{fontSize:14,lineHeight:1.65,color:"#6a5a52",margin:0}}>{desc}</p>
          <span style={{display:"inline-block",marginTop:16,fontSize:13,fontWeight:700,color:"#741923"}}>EXPLORE GEMSTONE →</span>
        </Link>)}
      </div>
    </section>
    <footer style={{padding:26,textAlign:"center",borderTop:"1px solid #eadfce",color:"#6a5a52",fontSize:13}}>© {new Date().getFullYear()} Shree Gauri · <Link href="/" style={{color:"#741923"}}>Visit Store</Link></footer>
  </main>;
}
