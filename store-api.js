
window.SGStore = (()=>{
  const db=window.sgSupabase;
  const fallback=window.SG_PRODUCTS||[];
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  function mapProduct(p){
    return {
      id:p.id,name:p.name,slug:p.slug,category:p.categories?.name||p.product_type||'Collection',
      categorySlug:p.categories?.slug||'',price:Number(p.price_inr||0),old:p.compare_at_price_inr?Number(p.compare_at_price_inr):null,
      badge:p.badge||'',image:p.primary_image_url||'',images:Array.isArray(p.image_urls)?p.image_urls:[],
      desc:p.description||p.short_description||'',shortDesc:p.short_description||'',material:p.material||p.product_type||'',
      weight:p.weight_grams?`${p.weight_grams} g`:'—',weight_grams:p.weight_grams,stock:Number(p.stock_quantity||0),
      isOneOfOne:!!p.is_one_of_one,isFeatured:!!p.is_featured,active:!!p.is_active,
      gemstone_name:p.gemstone_name||'',natural_lab_status:p.natural_lab_status||'',origin:p.origin||'',treatment:p.treatment||'',certification:p.certification||'',shape:p.shape||'',color:p.color||'',
      variants:(p.product_variants||[]).filter(v=>v.is_active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(v=>({...v,price_inr:Number(v.price_inr||0),carat:v.carat==null?null:Number(v.carat),ratti:v.ratti==null?null:Number(v.ratti),weight_grams:v.weight_grams==null?null:Number(v.weight_grams),stock_quantity:Number(v.stock_quantity||0)}))
    };
  }
  async function loadProducts({includeInactive=false}={}){
    try{
      let q=db.from('products').select('*,categories(name,slug),product_variants(*)').order('created_at',{ascending:false});
      if(!includeInactive) q=q.eq('is_active',true);
      const {data,error}=await q;
      if(error) throw error;
      return (data||[]).map(mapProduct);
    }catch(e){ console.error('Product load failed',e); return fallback; }
  }
  async function loadCategories(){
    const {data,error}=await db.from('categories').select('*').eq('is_active',true).order('sort_order');
    if(error){console.error(error);return []} return data||[];
  }
  return {db,money,mapProduct,loadProducts,loadCategories};
})();
