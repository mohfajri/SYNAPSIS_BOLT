import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

// A simple HTML/JSX tag balancer
const tagRegex = /<\/?[a-zA-Z0-9-:]+(?:\s+[a-zA-Z0-9-:]+(?:=(?:"[^"]*"|'[^']*'|{[^}]*}|[^>\s]+))?)*\s*\/?>/g;
let match;
const stack = [];

// Track line numbers
const lines = content.split("\n");
function getLineNumber(index) {
  let chars = 0;
  for (let i = 0; i < lines.length; i++) {
    chars += lines[i].length + 1; // +1 for newline
    if (chars >= index) return i + 1;
  }
  return lines.length;
}

const selfClosing = new Set(["input", "img", "br", "hr", "link", "meta"]);

// Custom parser to handle lines and track tags precisely
let inComment = false;
let inString = false;
let stringChar = "";

console.log("Analyzing JSX tags nested hierarchy...");

// Let's just parse the TSX file and find unmatched tags
// Since it is React TSX, we only care about HTML tags that are not self-closing and are outside strings/brackets.
// Let us use tsc or a simple loop that scans the file for <tag> and </tag>
const matches = [];
let idx = 0;
while ((match = tagRegex.exec(content)) !== null) {
  const tag = match[0];
  const isClosing = tag.startsWith("</");
  const isSelfClosing = tag.endsWith("/>") || selfClosing.has(tag.match(/<([a-zA-Z0-9-:]+)/)?.[1]);
  const tagName = tag.match(/<\/?([a-zA-Z0-9-:]+)/)?.[1];

  if (!tagName) continue;
  
  // Skip lowercase tags that are not standard or are component-like, or skip if self-closing
  if (isSelfClosing) continue;

  const lineNum = getLineNumber(match.index);
  
  // We only track standard lower-case HTML tags to avoid complex generic TS components
  if (tagName[0] === tagName[0].toLowerCase()) {
    if (isClosing) {
      if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
        stack.pop();
      } else {
        console.log(`Unmatched closing tag </${tagName}> at line ${lineNum}. Stack top is:`, stack[stack.length - 1]);
      }
    } else {
      stack.push({ name: tagName, line: lineNum, full: tag });
    }
  }
}

console.log("Remaining unclosed tags at end of file:");
console.log(stack);
