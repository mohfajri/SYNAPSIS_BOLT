import fs from "fs";
import { execSync } from "child_process";

// Read current file
let code = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

// Try to rewrite to classic ternary
// Replace:
// 1. {isEditing ? (
//    <form ...
// 2. </form>
//    ) : null}
//    {!isEditing ? (
//    <div>
// 3. </div>
//    ) : null}
//    </div>

code = code.replace(
  `                  {isEditing ? (
                    <form onSubmit={handleEditSubmit}`,
  `                  {isEditing ? (
                    <form onSubmit={handleEditSubmit}`
);

// We want to replace the middle part
code = code.replace(
  `                    </form>
                  ) : null}
                  {!isEditing ? (
                    <div>`,
  `                    </form>
                  ) : (
                    <div>`
);

// We want to replace the end part
code = code.replace(
  `                    </div>
                  ) : null}
                </div>`,
  `                    </div>
                  )}
                </div>`
);

fs.writeFileSync("./src/components/ClientsView.tsx", code, "utf8");
console.log("Applied classic ternary pattern.");

try {
  const out = execSync("npx tsc --noEmit", { encoding: "utf8" });
  console.log("SUCCESS! Linter compiled with no errors:");
  console.log(out);
} catch (err) {
  console.log("Compile failed:");
  console.log(err.stdout || err.message);
}
