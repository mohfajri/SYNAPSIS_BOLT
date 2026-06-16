import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");
const lines = content.split("\n");

console.log(`Analyzing DIV hierarchy in ClientsView.tsx...`);

const stack = [];

for (let i = 0; i < lines.length; i++) {
  const lineText = lines[i];
  const lineNum = i + 1;

  let pos = 0;
  while (pos < lineText.length) {
    if (lineText[pos] === "<") {
      if (lineText[pos + 1] === "/") {
        // Tag close
        const match = lineText.slice(pos + 2).match(/^([a-zA-Z0-9:-]+)>/);
        if (match) {
          const tagName = match[1];
          if (tagName === "div") {
            if (stack.length > 0) {
              const top = stack.pop();
              // Log close
            } else {
              console.log(`[DIV_EXTRA_CLOSE] Line ${lineNum}: Closing </div> but stack is empty!`);
            }
          }
          pos += 2 + tagName.length + 1;
          continue;
        }
      } else {
        // Tag open
        const match = lineText.slice(pos + 1).match(/^([a-zA-Z0-9:-_$]+)/);
        if (match) {
          const tagName = match[1];
          if (tagName === "div") {
            // Check self-closing
            let tagEnd = pos;
            while (tagEnd < lineText.length && lineText[tagEnd] !== ">") {
              tagEnd++;
            }
            const fullTag = lineText.slice(pos, tagEnd + 1);
            const isSelfClosing = fullTag.endsWith("/>");

            if (!isSelfClosing) {
              stack.push({ line: lineNum });
            }
            pos = tagEnd + 1;
            continue;
          }
        }
      }
    }
    pos++;
  }
}

console.log("\nUnclosed DIV stack at the end of the file:");
stack.forEach(s => {
  console.log(`- <div> from line ${s.line}`);
});
