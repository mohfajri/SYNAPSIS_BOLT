import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

const tags = [];
let i = 0;

function getLine(index) {
  return content.slice(0, index).split("\n").length;
}

while (i < content.length) {
  // Skip comments
  if (content[i] === "/" && content[i + 1] === "/") {
    while (i < content.length && content[i] !== "\n") i++;
    continue;
  }
  if (content[i] === "/" && content[i + 1] === "*") {
    i += 2;
    while (i < content.length && !(content[i] === "*" && content[i + 1] === "/")) i++;
    i += 2;
    continue;
  }

  // Skip strings
  if (content[i] === '"' || content[i] === "'" || content[i] === "`") {
    const char = content[i];
    i++;
    while (i < content.length && content[i] !== char) {
      if (content[i] === "\\") i++;
      i++;
    }
    i++;
    continue;
  }

  if (content[i] === "<") {
    const isClosing = content[i + 1] === "/";
    const startIdx = isClosing ? i + 2 : i + 1;
    const matchName = content.slice(startIdx).match(/^[a-zA-Z_$][a-zA-Z0-9_$:-]*/);

    if (matchName) {
      const tagName = matchName[0];
      const line = getLine(i);

      // Check if it's a real tag
      if (/^(input|img|br|hr|link|meta)$/i.test(tagName) && !isClosing) {
        // Find tag end
        let tagEnd = i;
        let inBraces = 0;
        let inQuote = null;
        while (tagEnd < content.length) {
          const c = content[tagEnd];
          if (inQuote) {
            if (c === inQuote) inQuote = null;
            else if (c === "\\") tagEnd++;
          } else if (c === '"' || c === "'" || c === "`") {
            inQuote = c;
          } else if (c === "{") {
            inBraces++;
          } else if (c === "}") {
            inBraces--;
          } else if (inBraces === 0 && c === ">") {
            break;
          }
          tagEnd++;
        }

        const fullTag = content.slice(i, tagEnd + 1);
        if (!fullTag.trim().endsWith("/>")) {
          console.log(`[JSX VIOLATION] Line ${line}: Tag <${tagName}> is NOT self-closing! Code: "${fullTag.replace(/\s+/g, ' ')}"`);
        }
      }
    }
  }

  i++;
}
export {};
