const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();

/*
TEMP STORAGE
Stores latest resume data from frontend
(MVP version — later move to DB)
*/
let latestResumeData = {};

app.use(cors());
app.use(express.json());

/*
ROOT CHECK
*/
app.get("/", (req, res) => {
  res.send("Resume PDF Server Running");
});

/*
SAVE LATEST RESUME DATA
Frontend sends latest resume JSON here
*/
app.post("/save-resume-data", (req, res) => {
  latestResumeData = req.body;
  debugger
  console.log("Latest Resume Saved:");
  console.log(latestResumeData);

  res.send({
    message: "Resume data saved successfully"
  });
});

/*
GET LATEST RESUME DATA
Used by /resume-print route
to fetch exact latest data
*/
app.get("/resume-data", (req, res) => {
  res.send(latestResumeData);
});

/*
GENERATE FINAL PDF
Puppeteer opens Angular print route
and creates exact styled PDF
*/
app.get("/generate-pdf", async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    /*
    Open Angular print route
    */
    await page.goto(
      "http://localhost:4200/resume-print",
      {
        waitUntil: "networkidle0"
      }
    );

    /*
    Wait until print component loads
    */
    await page.waitForSelector(
      ".print-resume"
    );

    /*
    Extra wait for API fetch + Angular render
    */
    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    /*
    Generate final PDF
    */
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition":
        "attachment; filename=resume.pdf",
      "Content-Length": pdf.length
    });

    res.send(pdf);

  } catch (error) {
    console.error(
      "PDF generation failed:",
      error
    );

    if (browser) {
      await browser.close();
    }

    res
      .status(500)
      .send("PDF generation failed");
  }
});

/*
START SERVER
*/
app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});