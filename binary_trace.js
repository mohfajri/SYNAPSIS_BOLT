import fs from "fs";
import { execSync } from "child_process";

const originalContent = fs.readFileSync("./src/components/ClientsView.tsx", "utf8");

function tryCompile(contentText, label) {
  fs.writeFileSync("./src/components/ClientsView.tsx", contentText, "utf8");
  try {
    execSync("npx tsc --noEmit", { encoding: "utf8" });
    console.log(`[PASS] ${label} compiled successfully!`);
    return true;
  } catch (err) {
    console.log(`[FAIL] ${label} failed compilation.`);
    // Get first error message in output
    const out = err.stdout || err.message;
    const firstError = out.split("\n").filter(l => l.includes("error")).slice(0, 2).join("\n");
    console.log(firstError);
    return false;
  }
}

// Restore original at the end
try {
  // Test case 1: Comment out Rooms Drawer (lines 1492 to 1730)
  const lines = originalContent.split("\n");
  // Replace rooms drawer content with a simple null/dummy
  const noRoomsLines = [
    ...lines.slice(0, 1491), // lines 1 to 1491 (index 0 to 1490)
    "                      {/* Rooms Drawer Removed */}",
    ...lines.slice(1730) // lines 1731 and onwards (index 1730 to end)
  ];
  tryCompile(noRoomsLines.join("\n"), "Rooms Drawer Removed");

  // Test case 2: Comment out Module Statuses Drawer (lines 1218 to 1490)
  const noModuleLines = [
    ...lines.slice(0, 1218),
    "                      {/* Module Drawer Removed */}",
    ...lines.slice(1491)
  ];
  tryCompile(noModuleLines.join("\n"), "Module Statuses Drawer Removed");

  // Test case 3: Comment out BOTH drawers
  const noDrawersLines = [
    ...lines.slice(0, 1218),
    "                      {/* Both Drawers Removed */}",
    ...lines.slice(1730)
  ];
  tryCompile(noDrawersLines.join("\n"), "Both Drawers Removed");

} finally {
  fs.writeFileSync("./src/components/ClientsView.tsx", originalContent, "utf8");
}
export {};
