const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/createPlan', (req, res) => {
  const { Code, HTML, Title, Url, ZipCode } = req.body;

  // Create HTML file
  const htmlFileName = `plan-${Code}.html`;
  const htmlFilePath = path.join(__dirname, 'public', 'html-plans', htmlFileName);
  fs.writeFileSync(htmlFilePath, HTML, 'utf-8');

  // Update output-format.json
const jsonFilePath = path.join(__dirname, 'public', 'html-plans', 'output-format.json');

  let jsonData = {};

  try {
    const jsonDataString = fs.readFileSync(jsonFilePath, 'utf-8');
    jsonData = JSON.parse(jsonDataString);
  } catch (error) {
    console.error('Error reading output-format.json:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  const newPlan = {
    Code,
    HTML: htmlFileName,
    Title,
    Url,
    ZipCode: ZipCode.split(',').map(zip => zip.trim()),
  };

  jsonData.plans.push(newPlan);

  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');

  res.json({ message: 'Plan created successfully', newPlan });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
