import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");
const lines = content.split("\n");

// lines 1219 to 1491 (0-indexed 1218 to 1490)
const range = lines.slice(1218, 1491);

let opens = 0;
let closes = 0;

for (let i = 0; i < range.length; i++) {
  const lineNum = 1219 + i;
  const text = range[i];

  // count opens
  const openMatches = text.match(/<div(\s|>)/gi);
  if (openMatches) {
    opens += openMatches.length;
    console.log(`Line ${lineNum}: opened ${openMatches.length} div(s). Text: "${text.trim()}"`);
  }

  // count closes
  const closeMatches = text.match(/<\/div>/gi);
  if (closeMatches) {
    closes += closeMatches.length;
    console.log(`Line ${lineNum}: closed ${closeMatches.length} div(s). Text: "${text.trim()}"`);
  }
}

console.log(`\nTotal opens: ${opens}`);
console.log(`Total closes: ${closes}`);
console.log(`Net change: ${opens - closes}`);
