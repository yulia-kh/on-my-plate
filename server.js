import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (req, res) => {
  console.log("Gemini key exists:", process.env.GEMINI_API_KEY);
  console.log("Gemini model:", process.env.GEMINI_MODEL);

  const send = (status, data, type = "application/json") => {
    res.writeHead(status, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(type === "application/json" ? JSON.stringify(data) : data);
  };
  if (req.method === "POST" && req.url === "/api/identify") {
    if (!process.env.GEMINI_API_KEY)
      return send(503, {
        error: "AI is not configured. Add GEMINI_API_KEY to Cloud Run.",
      });
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 5_000_000)
          return send(413, { error: "Photo too large." });
      }
      const { image } = JSON.parse(raw);
      const match =
        typeof image === "string" &&
        image.match(
          /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/,
        );
      if (!match || image.length > 4_500_000)
        return send(400, {
          error: "Please choose a smaller JPEG, PNG, or WebP image.",
        });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL || "gemini-3.8-flash")}:generateContent`,
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: 'Identify only foods visibly present in this meal photo. Return only valid JSON: {"foods":["food name"]}. Use short plain-English names. Do not guess hidden ingredients or estimate carbs, insulin, or nutrition.',
                    },
                    { inline_data: { mime_type: match[1], data: match[2] } },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 350,
              },
            }),
          },
        );
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini HTTP API error:", response.status, errorBody);
        return send(502, {
          error:
            "AI recognition unavailable. You can enter food names manually.",
        });
      }
      const result = await response.json();
      const output = (result.candidates?.[0]?.content?.parts || [])
        .map((x) => x.text || "")
        .join("");
      const parsed = JSON.parse(output);
      const foods = Array.isArray(parsed.foods)
        ? parsed.foods
            .filter((x) => typeof x === "string")
            .map((x) => x.trim().slice(0, 70))
            .filter(Boolean)
            .slice(0, 12)
        : [];
      return send(200, { name: foods.join(", ") || "Unknown food", foods });
    } catch (err) {
      console.error("Recognition failed:", err.message);
      return send(500, {
        error: "Could not analyze photo. Enter food names manually.",
      });
    }
  }
  if (
    req.method !== "GET" ||
    !["/", "/index.html", "/app.js", "/style.css"].includes(req.url)
  )
    return send(404, { error: "Not found" });
  const filename = req.url === "/" ? "index.html" : req.url.slice(1);
  try {
    send(
      200,
      await fs.readFile(path.join(root, filename)),
      types[path.extname(filename)],
    );
  } catch {
    send(404, { error: "Not found" });
  }
});
server.listen(port, () =>
  console.log(`On My Plate running at http://localhost:${port}`),
);
