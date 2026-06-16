import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

let countOpen = 0;
let countClose = 0;

let i = 0;
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

  if (content[i] === "<" && content.slice(i, i + 4) === "<div" && !(/[a-zA-Z]/.test(content[i + 4]))) {
    countOpen++;
  } else if (content[i] === "<" && content.slice(i, i + 5) === "</div") {
    countClose++;
  }
  i++;
}

console.log("Total standard open <div:", countOpen);
console.log("Total standard close </div:", countClose);
