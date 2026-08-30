
window.addEventListener('sg-products-ready',e=>{
 const P=e.detail||[],q=new URLSearchParams(location.search),cat=q.get('cat')||'Jewellery',money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
 document.title=cat+' | Shree Gauri';document.querySelector('#catName').textContent=cat;document.querySelector('#crumb').textContent=cat;document.querySelector('#catIntro').textContent=`Explore the Shree Gauri ${cat.toLowerCase()} edit — presented with clear details, refined styling and limited availability.`;
 let list=P.filter(p=>p.category===cat);if(cat==='Jewellery')list=P.filter(p=>['Jewellery','Rings','Bracelets','Necklaces','Pendants','Earrings','Mangalsutra','Anklets'].includes(p.category));
 document.querySelector('#categoryProducts').innerHTML=list.map(p=>`<article class="product"><a href="product.html?id=${p.id}" style="text-decoration:none;color:inherit"><div class="productImage" style="background-image:url('${p.image||''}')"><span class="badge">${p.badge||''}</span></div><div class="productMeta"><small>${p.category}</small><span class="price">${money(p.price)}</span></div><h3>${p.name}</h3></a></article>`).join('')||'<p>No products added yet.</p>';
});
