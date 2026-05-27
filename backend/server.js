require("dotenv").config();

const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const analyzeJD = require('./services/jdAnalyzer');

const app = express();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const plans = {
  pro: {
    amount: 199,
    durationDays: 30,
    label: "Pro Plan"
  },
  pro_plus: {
    amount: 499,
    durationDays: 90,
    label: "Pro Plus"
  }
};

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
      "http://localhost:4200/modern-resume-print",
      {
        waitUntil: "domcontentloaded"
      }
    );

    await page.waitForFunction(
      () => document.body.dataset.resumeReady === "true",
      { timeout: 15000 }
    );

    await page.evaluateHandle("document.fonts.ready");

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

app.get("/generate-premium-pdf", async (req, res) => {
  let browser;

  const theme = req.query.theme || "default";

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ]
    });

    const page = await browser.newPage();

    /*
    A4 at 96dpi = 794px wide. Setting this viewport means
    Puppeteer renders at the same width as the PDF page,
    so layout matches the browser preview exactly.
    */
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1
    });

    await page.goto(
      `http://localhost:4200/executive-left-rail-resume-print?theme=${theme}`,
      { waitUntil: "domcontentloaded" }
    );

    /*
    CRITICAL — Wait for Angular to signal render complete.
    The component sets document.body.dataset.resumeReady = "true"
    in ngAfterViewChecked once all data is loaded and rendered.
    This is the only reliable signal — blind timeouts and
    networkidle0 both fire before Angular finishes its
    change detection + *ngFor rendering cycles.
    */
    await page.waitForFunction(
      () => document.body.dataset.resumeReady === "true",
      { timeout: 15000 }
    );

    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf",
      "Content-Length": pdf.length
    });

    res.send(pdf);

  } catch (error) {
    console.error("PDF generation failed:", error);
    if (browser) await browser.close();
    res.status(500).send("PDF generation failed");
  }
});


/*
CREATE RAZORPAY ORDER
*/
app.post("/create-order", async (req, res) => {
  try {
    const { planType } = req.body;

    const plan = plans[planType];

    if (!plan) {
      return res.status(400).send({
        success: false,
        message: "Invalid plan selected"
      });
    }

    const options = {
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        planType,
        planLabel: plan.label
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).send({
      success: true,
      order,
      planType,
      amount: plan.amount
    });

  } catch (error) {
    console.error("Order creation failed:", error);

    res.status(500).send({
      success: false,
      message: "Failed to create order"
    });
  }
});

/*
VERIFY RAZORPAY PAYMENT
*/
app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).send({
        success: false,
        message: "Missing payment verification details"
      });
    }

    const payload =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature =
      crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Payment signature verification failed"
      });
    }

    const order =
      await razorpay.orders.fetch(razorpay_order_id);

    const planType =
      order.notes?.planType;

    const plan =
      plans[planType];

    if (!plan) {
      return res.status(400).send({
        success: false,
        message: "Invalid plan on verified order"
      });
    }

    const planStartDate =
      new Date();

    const planExpiryDate =
      new Date(planStartDate);

    planExpiryDate.setDate(
      planStartDate.getDate() + plan.durationDays
    );

    res.status(200).send({
      success: true,
      planType,
      paymentStatus: "active",
      planStartDate: planStartDate.toISOString(),
      planExpiryDate: planExpiryDate.toISOString(),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

  } catch (error) {
    console.error("Payment verification failed:", error);

    res.status(500).send({
      success: false,
      message: "Payment verification failed"
    });
  }
});

app.post(
  "/analyze-jd",
  (req, res) => {

    try {

      const {
        resumeData,
        jobDescription
      } = req.body;

      const analysis =
        analyzeJD(
          resumeData,
          jobDescription
        );

      res.send(analysis);

    } catch (error) {

      console.error(
        "JD Analysis Failed:",
        error
      );

      res.status(500).send({
        success: false,
        message: "JD analysis failed"
      });

    }

  }
);

/*
START SERVER
*/
app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});
