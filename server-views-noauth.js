const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/login", (req, res) => {
  res.render("login");
});

// Remove the /login route for handling JWT and authentication

app.get("/createPlan", (req, res) => {
  res.render("createPlan");
});

app.post("/createPlan", (req, res) => {
  const { Code, HTML, Title, Url, ZipCode } = req.body;

  // Create HTML file
  const htmlFileName = `plan-${Code}.html`;
  const htmlFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    htmlFileName
  );
  fs.writeFileSync(htmlFilePath, HTML, "utf-8");

  // Update output-format.json
  const jsonFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "output-format.json"
  );

  let jsonData = {};

  try {
    const jsonDataString = fs.readFileSync(jsonFilePath, "utf-8");
    jsonData = JSON.parse(jsonDataString);
  } catch (error) {
    console.error("Error reading output-format.json:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }

  const newPlan = {
    Code,
    HTML: htmlFileName,
    Title,
    Url,
    ZipCode: ZipCode.split(",").map((zip) => zip.trim()),
  };

  jsonData.plans.push(newPlan);

  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf-8");

  res.json({ message: "Plan created successfully", newPlan });
});

app.get("/displayPlans", (req, res) => {
  const jsonFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "output-format.json"
  );

  try {
    const jsonDataString = fs.readFileSync(jsonFilePath, "utf-8");
    const jsonData = JSON.parse(jsonDataString);

    res.render("displayPlans", { plans: jsonData.plans });
  } catch (error) {
    console.error("Error reading output-format.json:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
