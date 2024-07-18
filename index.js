require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const validUrl = require("valid-url");
const validator = require("validator");
const shortId = require("shortid");

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose
  .connect(
    "mongodb+srv://gajonetronics:KCpZLmrWDMwi3ROg@freecodecamplearning.9gmqu0i.mongodb.net/?retryWrites=true&w=majority&appName=freecodecampLearning",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connexion à MongoDB réussie !!!"))
  .catch((err) =>
    console.log("Connexion à MongoDB échouée !! Raison : " + err.toString())
  );

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model("Url", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const original_url = req.body.url;
  console.log(original_url);

  const isValidURL = (url) => {
    if (
      url.startsWith("http://localhost") ||
      url.startsWith("https://localhost")
    ) {
      return true;
    }
    return validator.isURL(url, {
      protocols: ["http", "https"],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: true,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      allow_localhost: true,
    });
  };

  const urlCode = shortId.generate();
  console.log(isValidURL(original_url));
  // console.log(!validUrl.isUri(original_url))

  if (isValidURL(original_url)) {
    try {
      let url = await Url.findOne({ original_url });
      if (url) {
        res.json(url);
      } else {
        const short_url = urlCode;

        url = new Url({
          original_url,
          short_url,
        });

        await url.save();
        res.json(url);
      }
    } catch (err) {
      console.log(err);
      res.status(500).json("Internal Server Error");
    }
  } else {
    return res.status(200).json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ short_url: req.params.code });

    if (url) {
      return res.redirect(url.original_url);
    } else {
      return res.status(404).json("No URL found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
