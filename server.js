const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
        new URL(req.url, `http://${req.headers.host}`).pathname
    );

    if (pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ status: "Rotterdam Life online" }));
    }

    const requested = pathname === "/" ? "index.html" : pathname.slice(1);
    const file = path.resolve(__dirname, requested);

    if (!file.startsWith(path.resolve(__dirname) + path.sep) &&
        file !== path.resolve(__dirname, "index.html")) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    fs.readFile(file, (error, data) => {
        if (error) {
            res.writeHead(404);
            return res.end("Bestand niet gevonden");
        }

        const ext = path.extname(file);
        const types = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg"
        };

        res.writeHead(200, {
            "Content-Type": types[ext] || "application/octet-stream"
        });

        res.end(data);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Rotterdam Life draait op poort ${PORT}`);
});