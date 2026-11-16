for(const b of document.querySelectorAll('button'))b.addEventListener('click',()=>{const f=document.querySelector('iframe');f.width=b.dataset.width;f.height=b.dataset.width==='390'?'844':'800';});
