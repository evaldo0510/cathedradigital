import{r as i}from"./vendor-react-C7QBJBbo.js";import{G as e}from"./index-BPjEQjYp.js";const l=()=>i.useCallback(async({title:r,text:a,url:t})=>{const o=t||window.location.href;if(navigator.share)try{await navigator.share({title:r,text:a,url:o});return}catch(c){if(c.name==="AbortError")return}const s=`${r}

${a}

${o}`;try{await navigator.clipboard.writeText(s),e.success("Copiado para a área de transferência!")}catch{e.error("Não foi possível compartilhar.")}},[]);export{l as u};
//# sourceMappingURL=useShare-BorlJqSk.js.map
