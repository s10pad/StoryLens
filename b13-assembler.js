require("dotenv").config();
const { spawn } = require("child_process");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function downloadFile(url, destPath) {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
  fs.writeFileSync(destPath, Buffer.from(response.data));
  return destPath;
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", ...args]);
    let stderr = "";
    proc.stderr.on("data", d => {
      stderr += d.toString();
      const line = d.toString();
      const match = line.match(/time=(\d+:\d+:\d+)/);
      if (match) process.stdout.write(`\r  time=${match[1]}`);
    });
    proc.on("close", code => {
      process.stdout.write("\n");
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited ${code}:\n${stderr.slice(-500)}`));
    });
    proc.on("error", reject);
  });
}

function writeConcatList(clipPaths, listPath) {
  const lines = clipPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(listPath, lines, "ascii");
}

async function assembleTrailer({ sceneVideoUrls = [], narrationPath, scorePath, projectId }) {
  const workDir = path.join(os.tmpdir(), projectId || `storylens-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });
  console.log(`\nAssembling trailer in: ${workDir}`);

  // Step 1 — download / copy video clips
  const clipPaths = [];
  for (let i = 0; i < sceneVideoUrls.length; i++) {
    const url = sceneVideoUrls[i];
    const clipPath = path.join(workDir, `clip_${i + 1}.mp4`);
    if (url.startsWith("http")) {
      console.log(`Downloading clip ${i + 1}/${sceneVideoUrls.length}...`);
      await downloadFile(url, clipPath);
    } else {
      fs.copyFileSync(url, clipPath);
    }
    clipPaths.push(clipPath);
  }

  // Step 2 — concatenate clips
  const concatList = path.join(workDir, "concat.txt");
  const rawConcatPath = path.join(workDir, "raw_concat.mp4");
  writeConcatList(clipPaths, concatList);

  console.log("Concatenating clips...");
  await runFFmpeg([
    "-f", "concat", "-safe", "0",
    "-i", concatList,
    "-c", "copy",
    rawConcatPath,
  ]);
  console.log("Concat done.");

  // Step 3 — mix audio + fade out
  const outputPath = path.join(workDir, "trailer.mp4");
  const hasNarration = narrationPath && fs.existsSync(narrationPath);
  const hasScore = scorePath && fs.existsSync(scorePath);

  // Probe the concat video duration
  const duration = await probeDuration(rawConcatPath);
  const fadeStart = Math.max(duration - 2, 0).toFixed(2);

  console.log(`Mixing audio (narration: ${hasNarration}, music: ${hasScore}, duration: ${duration}s)...`);

  let args;

  if (hasNarration && hasScore) {
    args = [
      "-i", rawConcatPath,
      "-i", narrationPath,
      "-i", scorePath,
      "-filter_complex",
      `[2:a]atrim=duration=${duration},aloop=loop=-1:size=2000000000,volume=0.25[music];` +
      `[1:a][music]amix=inputs=2:duration=first[mixed];` +
      `[0:v]fade=t=out:st=${fadeStart}:d=2[vf];` +
      `[mixed]afade=t=out:st=${fadeStart}:d=2[af]`,
      "-map", "[vf]", "-map", "[af]",
      "-c:v", "libx264", "-c:a", "aac", "-shortest",
      outputPath,
    ];
  } else if (hasScore) {
    args = [
      "-i", rawConcatPath,
      "-i", scorePath,
      "-filter_complex",
      `[1:a]atrim=duration=${duration},aloop=loop=-1:size=2000000000,volume=0.25[music];` +
      `[0:v]fade=t=out:st=${fadeStart}:d=2[vf];` +
      `[music]afade=t=out:st=${fadeStart}:d=2[af]`,
      "-map", "[vf]", "-map", "[af]",
      "-c:v", "libx264", "-c:a", "aac", "-shortest",
      outputPath,
    ];
  } else {
    // Video only with fade
    args = [
      "-i", rawConcatPath,
      "-vf", `fade=t=out:st=${fadeStart}:d=2`,
      "-c:v", "libx264", "-an",
      outputPath,
    ];
  }

  await runFFmpeg(args);

  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`\nTrailer complete: ${outputPath} (${sizeMB} MB)`);
  return outputPath;
}

function probeDuration(filePath) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let out = "";
    proc.stdout.on("data", d => (out += d.toString()));
    proc.on("close", code => {
      if (code === 0) resolve(parseFloat(out.trim()) || 50);
      else reject(new Error("ffprobe failed"));
    });
    proc.on("error", reject);
  });
}

module.exports = { assembleTrailer };
