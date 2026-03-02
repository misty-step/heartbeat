#!/usr/bin/env bash
# Generate all favicon sizes from public/logo.svg using sharp.
# Usage: bash scripts/gen-favicons.sh
set -euo pipefail

SVG="public/logo.svg"
if [ ! -f "$SVG" ]; then
  echo "Error: $SVG not found" >&2
  exit 1
fi

echo "Generating favicons from $SVG..."

node -e '
const sharp = require("sharp");
const fs = require("fs");

const SVG = "public/logo.svg";
const sizes = [
  { size: 16,  out: "public/favicon-16x16.png" },
  { size: 32,  out: "public/favicon-32x32.png" },
  { size: 180, out: "public/apple-touch-icon.png" },
  { size: 192, out: "public/android-chrome-192x192.png" },
  { size: 512, out: "public/android-chrome-512x512.png" },
];

(async () => {
  for (const { size, out } of sizes) {
    await sharp(SVG, { density: 300 }).resize(size, size).png().toFile(out);
    console.log("  " + out + " (" + size + "x" + size + ")");
  }

  // Generate favicon.ico (ICO header wrapping 32px PNG)
  const png = await sharp(SVG, { density: 300 }).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  fs.writeFileSync("public/favicon.ico", Buffer.concat([header, entry, png]));
  console.log("  public/favicon.ico (32x32 ICO)");

  console.log("Done.");
})();
'
