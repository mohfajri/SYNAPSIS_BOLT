import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");
const lines = content.split("\n");

const rangeLines = lines.slice(1492, 1735); // lines 1493 to 1735

const stack = [];

for (let i = 0; i < rangeLines.length; i++) {
  const lineText = rangeLines[i];
  const lineNum = 1493 + i;

  let pos = 0;
  while (pos < lineText.length) {
    if (lineText[pos] === "<") {
      if (lineText[pos + 1] === "/") {
        // Close tag
        const match = lineText.slice(pos + 2).match(/^([a-zA-Z0-9:-]+)>/);
        if (match) {
          const name = match[1];
          if (/^[a-zA-Z]/.test(name)) {
            if (stack.length > 0) {
              const top = stack.pop();
              console.log(`[TAG_CLOSE] Line ${lineNum}: </${name}> closes <${top.tag}> from line ${top.line}`);
            } else {
              console.log(`[TAG_EXTRA_CLOSE] Line ${lineNum}: </${name}> closed but STACK IS EMPTY!`);
            }
          }
          pos += 2 + name.length + 1;
          continue;
        }
      } else {
        // Open tag or self-closing
        const match = lineText.slice(pos + 1).match(/^([a-zA-Z0-9:-_$]+)/);
        if (match) {
          const name = match[1];
          if (/^[a-zA-Z]/.test(name)) {
            // Find end of tag
            let tagEnd = pos;
            while (tagEnd < lineText.length && lineText[tagEnd] !== ">") {
              tagEnd++;
            }
            const fullTag = lineText.slice(pos, tagEnd + 1);
            const isSelfClosing = fullTag.endsWith("/>") || /^(input|img|br|hr)$/i.test(name);

            if (!isSelfClosing) {
              stack.push({ tag: name, line: lineNum });
              console.log(`[TAG_OPEN] Line ${lineNum}: <${name}> (stack depth now: ${stack.length})`);
            } else {
              console.log(`[TAG_SELF_CLOSE] Line ${lineNum}: <${name} />`);
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

console.log("\nUnclosed tags inside range:");
stack.forEach(s => {
  console.log(`- <${s.tag}> from line ${s.line}`);
});
