const express = require("express");
const os = require("os");
const { createServer } = require("http");
const app = express();
app.use(express.static(__dirname + "/Public"));
app.set("views", __dirname + "/Views");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const httpServer = createServer(app);
httpServer.listen(1999);
console.log("server running");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const uploadsFolder = path.join(__dirname, "/Public/uploads");
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsFolder);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.get("/", async (request, response) => {
  response.json("Server running");
});

app.get("/client", async (request, response) => {
  response.render("client/client");
});

app.get("/uploader", async (request, response) => {
  response.render("client/uploader");
});

app.get("/download/:filename", async (request, response) => {
  const fileName = request.params.filename;
  const filePath = path.join(uploadsFolder, fileName);

  if (fs.existsSync(filePath)) {
    response.download(filePath, fileName);
  } else {
    response.status(404).send("File not found");
  }
});

app.post("/upload", upload.single("file"), (req, res) => {
  const fileName = req.file.originalname;

  console.log(`${fileName} uploaded successfully`);

  // Return the uploaded file names as the response
  res.json({ fileName });
});

app.get("/files", (req, res) => {
  fs.readdir(uploadsFolder, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Error reading files" });
    } else {
      const fileData = files.map(file => {
        const filePath = path.join(uploadsFolder, file);
        const fileStats = fs.statSync(filePath);
        return {
          name: file,
          size: fileStats.size,
          url: path.join("/uploads", file),
        };
      });
      res.json(fileData);
    }
  });
});
