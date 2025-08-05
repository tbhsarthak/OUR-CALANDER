const facts = [
  "During her period, hormone levels fluctuate and may cause mood swings, cramps, and fatigue.",
  "A typical menstrual cycle lasts about 28 days, but it can range from 21 to 35 days.",
  "Women lose about 30 to 40 ml of blood during menstruation on average.",
  "Painful periods are called dysmenorrhea, and they affect around 80% of women.",
  "Period symptoms are influenced by real hormonal changes — not just emotions.",
  "A woman can still get pregnant during her period, although it's less likely.",
  "Ovulation usually happens around the 14th day of a 28-day cycle."
];

const randomIndex = Math.floor(Math.random() * facts.length);
const selectedFact = facts[randomIndex];
document.getElementById("factText").innerText = selectedFact;
