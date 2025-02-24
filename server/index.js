import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import cors from "cors";

const app = express();
const port = 5000;

app.use(cors());


// Ensure necessary directories exist
const uploadDir = "uploads";
const mergedDir = "merged";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(mergedDir)) fs.mkdirSync(mergedDir);

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(mergedDir)) fs.mkdirSync(mergedDir);

// Multer for handling file uploads
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const filename = `chunk_${Date.now()}.webm`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

// Store uploaded chunks
let videoChunks = [];
let mergingInProgress = false;

// 📌 Handle incoming video chunks
app.post("/upload-chunk", upload.single("video_chunk"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const chunkPath = req.file.path;
    
    // **Check if the file is valid**
    if (!fs.existsSync(chunkPath) || fs.statSync(chunkPath).size === 0) {
        fs.unlinkSync(chunkPath); // Remove empty files
        return res.status(400).json({ error: "Invalid chunk received" });
    }

    videoChunks.push(chunkPath);
    console.log(`✅ Received chunk: ${chunkPath} | Total chunks: ${videoChunks.length}`);

    res.json({ message: "Chunk received successfully" });
});

// 📌 Merge video chunks correctly using FFmpeg
async function mergeVideoChunks() {
    if (mergingInProgress || videoChunks.length === 0) return;
    mergingInProgress = true;

    try {
        console.log("🔄 Merging video chunks...");

        const outputVideoPath = path.join(mergedDir, `merged_${Date.now()}.webm`);
        const fileListPath = path.join(uploadDir, "file_list.txt");

        // Write chunk paths to file
        fs.writeFileSync(fileListPath, videoChunks.map(chunk => `file '${chunk}'`).join("\n"));

        // 📌 Convert and merge WebM chunks properly
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(fileListPath)
                .inputOptions(["-f concat", "-safe 0"])
                .output(outputVideoPath)
                .outputOptions([
                    "-c:v libvpx-vp9", // VP9 codec for WebM
                    "-b:v 1M",
                    "-crf 23",
                    "-preset medium",
                    "-c:a libopus" // WebM audio codec
                ])
                .on("end", () => {
                    console.log(`✅ Merging complete: ${outputVideoPath}`);

                    // Cleanup
                    videoChunks.forEach(file => fs.unlinkSync(file));
                    fs.unlinkSync(fileListPath);
                    videoChunks = [];
                    mergingInProgress = false;
                    resolve();
                })
                .on("error", (err) => {
                    console.error(`❌ Error during merging: ${err}`);
                    mergingInProgress = false;
                    reject(err);
                })
                .run();
        });

        console.log("✅ Final merged video:", outputVideoPath);
    } catch (error) {
        console.error("❌ Error during merging:", error);
        mergingInProgress = false;
    }
}

// 📌 Periodically check and merge video chunks
// setInterval(mergeVideoChunks, 10000);

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
