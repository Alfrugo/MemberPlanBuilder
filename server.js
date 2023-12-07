const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

const SECRET_KEY = process.env.SECRET_KEY;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Add the following line for parsing urlencoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Use express-session middleware for session management
app.use(
  session({
    secret: SECRET_KEY, // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);

console.log('updated server.js');

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.username) {
    // User is authenticated
    next();
  } else {
    // Redirect to login page if not authenticated
    res.redirect("/login");
  }
};

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  console.log('Received credentials:', username, password);

  // Check if the provided username and password match your authentication logic
  if (username === USERNAME && password === PASSWORD) {
    // Set the username in the session to mark the user as authenticated
    req.session.username = username;
    res.redirect("/loggedin");
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/loggedin", isAuthenticated, (req, res) => {
  res.render("loggedin");
});

app.get("/createPlan", isAuthenticated, (req, res) => {
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

app.post("/deletePlan", isAuthenticated, (req, res) => {
  const { codeToDelete } = req.body;

  // Update output-format.json to remove the plan with the specified code
  const jsonFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "output-format.json"
  );

  try {
    let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    // Find the plan to delete
    const deletedPlan = jsonData.plans.find((plan) => plan.Code === codeToDelete);

    if (!deletedPlan) {
      return res.status(404).json({ error: `Plan with code ${codeToDelete} not found` });
    }

    // Filter out the plan to delete
    jsonData.plans = jsonData.plans.filter((plan) => plan.Code !== codeToDelete);

    // Delete the HTML file
    const htmlFilePath = path.join(
      __dirname,
      "public",
      "html-plans",
      `plan-${codeToDelete}.html`
    );

    fs.unlink(htmlFilePath, (unlinkError) => {
      if (unlinkError) {
        console.error("Error deleting HTML file:", unlinkError);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Write the updated JSON data back to the file
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf-8");

      res.json({ message: `Plan with code ${codeToDelete} deleted successfully` });
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/displayPlans", isAuthenticated, (req, res) => {
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
