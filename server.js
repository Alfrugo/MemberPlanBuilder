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

// Add this near the top of your server.js file
app.get("/", (req, res) => {
  res.render("home");
});

// Add this after the "/checkPlan" route
app.get("/searchByZipCode", (req, res) => {
  const { zipCode } = req.query;

  // Load existing data
  const jsonFilePath = path.join(__dirname, "public", "html-plans", "output-format.json");

  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    // Find plans with the matching zip code
    const matchingPlans = jsonData.plans.filter((plan) =>
      plan.ZipCode.includes(zipCode)
    );

    // Define notFoundContent
    const notFoundFilePath = path.join(
      __dirname,
      "public",
      "html-plans",
      "notfound.html"
    );
    const notFoundContent = fs.readFileSync(notFoundFilePath, "utf-8");

    if (matchingPlans.length === 0) {
      // No matching plans found, render notfound.html
      res.render("searchResults", { zipCode, matchingPlans: [], notFoundContent });
    } else {
      // Render the searchResults page with matching plans
      res.render("searchResults", { zipCode, matchingPlans });
    }
  } catch (error) {
    console.error("Error searching plans by zip code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/displayPlan/:code", (req, res) => {
  const codeToDisplay = req.params.code;

  // Fetch plan data based on the code from output-format.json
  const jsonFilePath = path.join(__dirname, "public", "html-plans", "output-format.json");

  try {
      const jsonDataString = fs.readFileSync(jsonFilePath, "utf-8");
      const jsonData = JSON.parse(jsonDataString);

      const planToDisplay = jsonData.plans.find(plan => plan.Code === codeToDisplay);

      if (!planToDisplay) {
          return res.status(404).json({ error: "Plan not found" });
      }

      // Read HTML content from the corresponding file
      const htmlFilePath = path.join(
          __dirname,
          "public",
          "html-plans",
          `plan-${codeToDisplay}.html`
      );

      const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

      // Render the displayPlan template with HTML content
      res.render("displayPlan", { plan: planToDisplay, htmlContent });
  } catch (error) {
      console.error("Error reading data:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/searchByZipCode", (req, res) => {
  const { zipCode } = req.query;

  // Load existing data
  const jsonFilePath = path.join(__dirname, "public", "html-plans", "output-format.json");

  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    // Find plans with the matching zip code
    const matchingPlans = jsonData.plans.filter((plan) =>
      plan.ZipCode.includes(zipCode)
    );

    if (matchingPlans.length === 0) {
      // No matching plans found, render notfound.html
      const notFoundFilePath = path.join(
        __dirname,
        "public",
        "html-plans",
        "notfound.html"
      );
      const notFoundContent = fs.readFileSync(notFoundFilePath, "utf-8");

      res.render("searchResults", { matchingPlans: [], notFoundContent });
    } else {
      // Render the searchResults page with matching plans
      res.render("searchResults", { matchingPlans });
    }
  } catch (error) {
    console.error("Error searching plans by zip code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



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

// Route to serve the styles.css dynamically
app.get('/styles.css', (req, res) => {
  const cssFilePath = path.join(__dirname, 'styles.css');

  fs.readFile(cssFilePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else {
      res.header('Content-Type', 'text/css');
      res.send(data);
    }
  });
});

app.get("/getHtmlContent", (req, res) => {
  const code = req.query.code;

  const htmlFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    `plan-${code}.html`
  );

  fs.readFile(htmlFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ htmlContent: data });
    }
  });
});

app.get("/createPlan", isAuthenticated, (req, res) => {
  res.render("createPlan");
});

app.post("/createPlan", (req, res) => {
  const { Code, Description, Title, Url, ZipCode } = req.body;  // Update to use Description

  // Create HTML file
  const htmlFileName = `plan-${Code}.html`;
  const htmlFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    htmlFileName
  );
  fs.writeFileSync(htmlFilePath, Description, "utf-8");  // Update to use Description

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
    Description: htmlFileName,  // Update to use Description
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

app.get("/checkPlan", (req, res) => {
  const { code } = req.query;

  const jsonFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "output-format.json"
  );

  try {
    const jsonDataString = fs.readFileSync(jsonFilePath, "utf-8");
    const jsonData = JSON.parse(jsonDataString);

    const exists = jsonData.plans.some((plan) => plan.Code === code);

    res.json({ exists });
  } catch (error) {
    console.error("Error checking plan code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/editPlan", isAuthenticated, (req, res) => {
  const codeToEdit = req.query.code;

  // Fetch plan data based on the code from output-format.json
  const jsonFilePath = path.join(__dirname, "public", "html-plans", "output-format.json");

  try {
      const jsonDataString = fs.readFileSync(jsonFilePath, "utf-8");
      const jsonData = JSON.parse(jsonDataString);

      const planToEdit = jsonData.plans.find(plan => plan.Code === codeToEdit);

      if (!planToEdit) {
          return res.status(404).json({ error: "Plan not found" });
      }

      res.render("editPlan", { plan: planToEdit });
  } catch (error) {
      console.error("Error reading output-format.json:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/updatePlan", isAuthenticated, (req, res) => {
  const { Code, Description, Title, Url, ZipCode } = req.body;

  // Load existing data
  const jsonFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "output-format.json"
  );

  try {
    let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    // Find the plan to update
    const planToUpdate = jsonData.plans.find((plan) => plan.Code === Code);

    if (!planToUpdate) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    // Update plan data
    planToUpdate.Description = `plan-${Code}.html`; // Include the correct path
    planToUpdate.Title = Title;
    planToUpdate.Url = Url;
    planToUpdate.ZipCode = ZipCode.split(",").map((zip) => zip.trim());

    // Update HTML file
    const htmlFilePath = path.join(
      __dirname,
      "public",
      "html-plans",
      `plan-${Code}.html` // Include the correct path
    );

    fs.writeFileSync(htmlFilePath, Description, "utf-8");

    // Save the updated JSON data
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf-8");

    res.json({ message: "Plan updated successfully", updatedPlan: planToUpdate });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Add this route definition before the app.listen()
app.get("/editNotFound", isAuthenticated, (req, res) => {
  const notFoundFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "notfound.html"
  );
  const notFoundContent = fs.readFileSync(notFoundFilePath, "utf-8");
  res.render("editNotFound", { notFoundContent });
});

app.post("/updateNotFound", isAuthenticated, (req, res) => {
  const { notFoundContent } = req.body;

  const notFoundFilePath = path.join(
    __dirname,
    "public",
    "html-plans",
    "notfound.html"
  );

  fs.writeFileSync(notFoundFilePath, notFoundContent, "utf-8");

  res.redirect("/editNotFound"); // Redirect back to the editing page
});



// Add this route definition before the app.listen()














app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});