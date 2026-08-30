window.addEventListener('sg-products-ready',e=>{
 const P=e.detail||[],q=new URLSearchParams(location.search),p=P.find(x=>x.id===q.get('id')),money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
 if(!p){document.querySelector('.productInfo').innerHTML='<h1>Product not found</h1><p>This product may be unavailable or removed.</p>';return}
 document.title=p.name+' | Shree Gauri';document.querySelector('#pImage').style.backgroundImage=`url('${p.image||''}')`;document.querySelector('#pCat').textContent=p.category;document.querySelector('#pName').textContent=p.name;document.querySelector('#pPrice').innerHTML=`${money(p.price)} ${p.old?`<s>${money(p.old)}</s>`:''}`;document.querySelector('#pDesc').textContent=p.desc||p.shortDesc;document.querySelector('#pMaterial').textContent=p.material||'—';document.querySelector('#pWeight').textContent=p.weight||'—';document.querySelector('#pStock').textContent=p.stock===1?'Only 1 Available':p.stock>1?`${p.stock} Available`:'Sold Out';
 const variantWrap=document.querySelector('#variantWrap'),variantSelect=document.querySelector('#variantSelect'),qty=document.querySelector('#pQty'),add=document.querySelector('#addProduct'),buy=document.querySelector('#buyNow');
 function selectedVariant(){return p.variants?.find(x=>x.id===variantSelect.value)||null}
 function syncState(){let v=selectedVariant(),stock=p.variants?.length?Number(v?.stock_quantity||0):Number(p.stock||0);qty.max=Math.max(1,stock);document.querySelector('#pStock').textContent=stock===1?'Only 1 Available':stock>1?`${stock} Available`:'Sold Out';add.disabled=stock<1;buy.disabled=stock<1;add.textContent=stock<1?'SOLD OUT':'ADD TO BAG';buy.textContent=stock<1?'SOLD OUT':'BUY NOW';if(v)document.querySelector('#pPrice').textContent=money(v.price_inr||p.price)}
 if(p.variants?.length){variantWrap.style.display='block';variantSelect.innerHTML=p.variants.map(v=>`<option value="${v.id}" ${v.stock_quantity<1?'disabled':''}>${v.label||[v.carat&&v.carat+' ct',v.ratti&&v.ratti+' ratti'].filter(Boolean).join(' · ')||'Option'} — ${money(v.price_inr||p.price)} (${v.stock_quantity} available)</option>`).join('');let first=p.variants.find(v=>v.stock_quantity>0);if(first)variantSelect.value=first.id;variantSelect.onchange=syncState}
 document.querySelector('#pWhats').href='https://wa.me/917400617601?text='+encodeURIComponent('Hello Shree Gauri, I want to enquire about '+p.name);

 add.onclick=(ev)=>{
   ev.preventDefault();
   ev.stopPropagation();
   if(add.disabled)return;
   let v=selectedVariant();
   if(p.variants?.length&&!v)return;
   window.SGCart.add(p.id,v?.id||null,Number(qty.value||1));
 };

 buy.onclick=(ev)=>{
   ev.preventDefault();
   ev.stopPropagation();
   if(buy.disabled)return false;
   let v=selectedVariant();
   if(p.variants?.length&&!v)return false;
   window.SGCart.add(p.id,v?.id||null,Number(qty.value||1),{open:false});
   window.location.assign('/checkout.html');
   return false;
 };

 syncState();
 document.querySelector('#related').innerHTML=P.filter(x=>x.id!==p.id&&x.category===p.category).slice(0,4).map(x=>`<article class="product"><a href="product.html?id=${x.id}" style="text-decoration:none;color:inherit"><div class="productImage" style="background-image:url('${x.image||''}')"></div><h3>${x.name}</h3><span class="price">${money(x.price)}</span></a></article>`).join('');
});
