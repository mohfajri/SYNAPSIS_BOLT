import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");
const lines = content.split("\n");

console.log(`Analyzing entire file (all ${lines.length} lines)...`);

const tagsStack = [];

for (let i = 0; i < lines.length; i++) {
  const lineText = lines[i];
  const lineNum = i + 1;

  let pos = 0;
  while (pos < lineText.length) {
    if (lineText[pos] === "<") {
      // Check for closing tag
      if (lineText[pos + 1] === "/") {
        // Closing tag
        const match = lineText.slice(pos + 2).match(/^([a-zA-Z0-9:-]+)>/);
        if (match) {
          const tagName = match[1];
          if (/^[a-zA-Z]/.test(tagName)) {
            if (tagsStack.length > 0) {
              const top = tagsStack[tagsStack.length - 1];
              if (top.tag === tagName) {
                tagsStack.pop();
              } else {
                console.log(`[MISMATCH] Line ${lineNum}: Closing </${tagName}> but stack top is <${top.tag}> from line ${top.line}`);
                // Try to find if it exists in the stack to recover
                const idx = tagsStack.map(t => t.tag).lastIndexOf(tagName);
                if (idx !== -1) {
                  tagsStack.splice(idx);
                }
              }
            } else {
              console.log(`[EXTRA CLOSE] Line ${lineNum}: Closing </${tagName}> but stack is empty`);
            }
            pos += 2 + tagName.length + 1;
            continue;
          }
        }
      } else {
        // Opening tag or self-closing
        const match = lineText.slice(pos + 1).match(/^([a-zA-Z0-9:-_$]+)/);
        if (match) {
          const tagName = match[1];
          // Skip if it is not a tag name
          if (/^[a-zA-Z]/.test(tagName)) {
            // Find end of tag
            let tagEnd = pos;
            while (tagEnd < lineText.length && lineText[tagEnd] !== ">") {
              tagEnd++;
            }
            const fullTagText = lineText.slice(pos, tagEnd + 1);
            const isSelfClosing = fullTagText.endsWith("/>") || /^(input|img|br|hr)$/i.test(tagName);

            if (!isSelfClosing) {
              tagsStack.push({ tag: tagName, line: lineNum });
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

console.log("\nUnclosed tags inside file:");
tagsStack.forEach(t => {
  console.log(`- <${t.tag}> from line ${t.line}`);
});
