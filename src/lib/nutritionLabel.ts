/** Tentative first-column values. The UI must show the raw OCR and confirm basis. */
export function nutritionLabelDraft(text:string) {
  const number=(value:string|undefined)=>value?Number(value.replace(',','.')):null;
  const lines=text.split(/[\r\n]+/);
  const nutrient=(pattern:RegExp)=>{
    const line=lines.find(l=>pattern.test(l));
    return number(line?.match(/(\d+(?:[.,]\d+)?)\s*g\b/i)?.[1]);
  };
  return {calories:number(text.match(/(\d+(?:[.,]\d+)?)\s*kcal\b/i)?.[1]),
    protein:nutrient(/protein|prot[eé]ine/i),carbs:nutrient(/carbohydrate|glucide/i),fat:nutrient(/^(?:total\s+)?fat\b|mati[eè]res grasses|lipides/i),fiber:nutrient(/fiber|fibre/i)};
}
