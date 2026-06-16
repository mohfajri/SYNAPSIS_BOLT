import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

let i = 0;
const stack = [];

function getLine(index) {
  return content.slice(0, index).split("\n").length;
}

const stateStack = ['normal'];

while (i < content.length) {
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

  const state = stateStack[stateStack.length - 1];

  if (state === 'normal') {
    if (content[i] === '"' || content[i] === "'") {
      const char = content[i];
      i++;
      while (i < content.length && content[i] !== char) {
        if (content[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }

    if (content[i] === '`') {
      stateStack.push('template');
      i++;
      continue;
    }

    const char = content[i];
    const line = getLine(i);

    if (char === "{" || char === "(" || char === "[") {
      stack.push({ char, line, isTemplate: false });
    } else if (char === "}" || char === ")" || char === "]") {
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (
          (char === "}" && top.char === "{") ||
          (char === ")" && top.char === "(") ||
          (char === "]" && top.char === "[")
        ) {
          stack.pop();
          if (top.isTemplate) {
            stateStack.pop(); // Pop 'normal', going back to 'template'
          }
        } else {
          console.log(`[MISMATCH] Line ${line}: tried to close '${char}' but stack top is '${top.char}' from line ${top.line}`);
          stack.pop();
        }
      } else {
        console.log(`[EXTRA CLOSE] Line ${line}: found '${char}' but stack is empty`);
      }
    }
  } else if (state === 'template') {
    if (content[i] === '`') {
      stateStack.pop();
      i++;
      continue;
    }
    if (content[i] === "$" && content[i + 1] === "{") {
      stateStack.push('normal');
      const line = getLine(i);
      stack.push({ char: "{", line, isTemplate: true });
      i += 2;
      continue;
    }
    if (content[i] === '\\') {
      i++;
    }
  }

  i++;
}

console.log("\nUnclosed brackets remaining in stack:");
stack.forEach(s => {
  console.log(`- '${s.char}' from line ${s.line} ${s.isTemplate ? '(template expression)' : ''}`);
});
