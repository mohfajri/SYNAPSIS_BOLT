import fs from "fs";

const content = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

const tags = [];
let i = 0;

function getLine(index) {
  return content.slice(0, index).split("\n").length;
}

const HTML_TAGS = new Set([
  "a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", 
  "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", 
  "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", 
  "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", 
  "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", 
  "mark", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", 
  "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", 
  "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", 
  "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", 
  "var", "video", "wbr", "svg", "path", "rect", "circle", "g", "line", "polyline", "polygon", "text",
  "option"
]);

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

  // Skip string literals
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

  // Check possible JSX tag
  if (content[i] === "<") {
    const isClosing = content[i + 1] === "/";
    const startIdx = isClosing ? i + 2 : i + 1;
    
    // JSX tag names must be a valid JS identifier (possibly with dots, colons, or dashes)
    const matchName = content.slice(startIdx).match(/^[a-zA-Z_$][a-zA-Z0-9_$:-]*/);

    if (matchName) {
      const tagName = matchName[0];
      const isCapitalized = /^[A-Z_]/.test(tagName);
      const isHtml = HTML_TAGS.has(tagName.toLowerCase());

      // If it's a valid JSX tag name (either an HTML tag or a Capitalized element tag)
      if (isHtml || isCapitalized) {
        // Let's ensure it's not some generic parameter or comparison (e.g. `x < y`)
        // To do this, let's scan until the end of the tag
        let tagEnd = i;
        let inBraces = 0;
        let inQuote = null;
        let foundClosingAngle = false;

        while (tagEnd < content.length) {
          const c = content[tagEnd];
          if (inQuote) {
            if (c === inQuote) {
              inQuote = null;
            } else if (c === "\\") {
              tagEnd++;
            }
          } else if (c === '"' || c === "'" || c === "`") {
            inQuote = c;
          } else if (c === "{") {
            inBraces++;
          } else if (c === "}") {
            inBraces--;
          } else if (inBraces === 0) {
            if (c === ">") {
              foundClosingAngle = true;
              break;
            }
          }
          tagEnd++;
        }

        if (foundClosingAngle) {
          const fullTag = content.slice(i, tagEnd + 1);
          const isSelfClosing = fullTag.trim().endsWith("/>") || /^(br|hr|img|input|link|meta)$/i.test(tagName);

          tags.push({
            name: tagName,
            line: getLine(i),
            isClosing,
            isSelfClosing,
            text: fullTag
          });

          i = tagEnd + 1;
          continue;
        }
      }
    }
  }

  i++;
}

// Check balance
const stack = [];
for (const tag of tags) {
  if (tag.isSelfClosing) continue;

  if (tag.isClosing) {
    if (stack.length > 0 && stack[stack.length - 1].name === tag.name) {
      stack.pop();
    } else {
      console.log(`[MISMATCH] </${tag.name}> on line ${tag.line} closed but stack top is:`, stack[stack.length - 1] ? `${stack[stack.length - 1].name} (from line ${stack[stack.length - 1].line})` : "EMPTY");
    }
  } else {
    stack.push(tag);
  }
}

console.log("\nUnclosed tags remaining in stack:");
stack.forEach(s => {
  console.log(`- <${s.name}> at line ${s.line}. Text: "${s.text.replace(/\s+/g, ' ').slice(0, 100)}..."`);
});
