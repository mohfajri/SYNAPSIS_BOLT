const { execSync } = require('child_process');
try {
  console.log("Searching for zip or tar files...");
  const out = execSync('find / -name "*.zip" -o -name "*.tar.gz" -o -name "*.tgz" 2>/dev/null').toString();
  console.log(out);
} catch (e) {
  console.error("Search failed:", e.message);
}
