require("dotenv").config();

const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const admin = require("firebase-admin");
const analyzeJD = require("./services/jdAnalyzer");

/*
Import server-side HTML template builders.
Add a new import here for each new template — no Puppeteer changes needed.
*/
const { buildCompactGridHTML } = require("./templates/compact-grid.template");

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

const app = express();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isProduction = process.env.NODE_ENV === "production";

let serviceAccount;

if (isProduction) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  serviceAccount = require("./resumepilot-ai-serviceAccountKey.json");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const plans = {
  pro: {
    amount: 99,
    durationDays: 30,
    label: "Pro Plan",
  },
  pro_plus: {
    amount: 199,
    durationDays: 90,
    label: "Pro Plus",
  },
};

let latestResumeData = {};

function parseExistingExpiryDate(planExpiryDate) {
  if (!planExpiryDate) return null;

  if (typeof planExpiryDate.toDate === "function") {
    const date = planExpiryDate.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (planExpiryDate instanceof Date) {
    return Number.isNaN(planExpiryDate.getTime()) ? null : planExpiryDate;
  }

  const date = new Date(planExpiryDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculatePlanDates(existingUserData, plan) {
  const now = new Date();
  const existingExpiryDate =
    existingUserData?.paymentStatus === "active" &&
    ["pro", "pro_plus"].includes(existingUserData?.userPlan)
      ? parseExistingExpiryDate(existingUserData.planExpiryDate)
      : null;

  const baseDate =
    existingExpiryDate && existingExpiryDate > now ? existingExpiryDate : now;

  const planStartDate = now;
  const planExpiryDate = new Date(baseDate);
  planExpiryDate.setDate(planExpiryDate.getDate() + plan.durationDays);

  return {
    planStartDate,
    planExpiryDate,
  };
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Resume PDF Server Running");
});

app.post("/save-resume-data", (req, res) => {
  latestResumeData = req.body;
  console.log("Latest Resume Saved:", latestResumeData);
  res.send({ message: "Resume data saved successfully" });
});

app.get("/resume-data", (req, res) => {
  res.send(latestResumeData);
});

/*
GENERATE FREE PDF (Modern template — unchanged)
*/
app.get("/generate-pdf", async (req, res) => {
  let browser;
  try {
    console.log("Chrome Path:", puppeteer.executablePath());
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(`${FRONTEND_URL}/modern-resume-print`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      () => document.body.dataset.resumeReady === "true",
      { timeout: 15000 },
    );
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await browser.close();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf",
      "Content-Length": pdf.length,
    });
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (browser) await browser.close();
    res.status(500).send("PDF generation failed");
  }
});

/*
GENERATE PREMIUM PDF

Architecture:
- compact-grid → server-side HTML builder (no Angular route needed)
- executive-left-rail, others → still use Angular print route (migrate later)

To add a new template:
  1. Create server/templates/your-template.template.js
  2. Import it at the top of this file
  3. Add an `if (template === 'your-template')` block below
  Done. No Puppeteer changes, no print component, no CSS fights.
*/
app.get("/generate-premium-pdf", async (req, res) => {
  let browser;
  const theme = latestResumeData.selectedTheme || "indigo";
  const template = latestResumeData.selectedTemplate || "executive-left-rail";
  console.log("[PDF] theme:", theme, "| template:", template);

  try {
    console.log("Chrome Path:", puppeteer.executablePath());
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=794,1123",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    /* -----------------------------------------------
       COMPACT GRID — server-side HTML, no Angular
    ----------------------------------------------- */
    if (template === "compact") {
      /*
      Merge the theme from the query param into resumeData
      so the builder picks up the correct accent colour.
      */

      const html = buildCompactGridHTML(latestResumeData);

      /*
      setContent() injects the complete HTML directly —
      no routing, no Angular bootstrap, no waitForFunction.
      networkidle0 just waits for any web fonts to load.
      */
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Small buffer for fonts to finish painting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } else {
      /* -----------------------------------------------
         OTHER TEMPLATES — still use Angular print route
         (migrate these one by one as you build them out)
      ----------------------------------------------- */
      let printRoute = "executive-left-rail-resume-print";

      if (template === "modern") {
        printRoute = "modern-resume-print";
      }

      await page.goto(`${FRONTEND_URL}/${printRoute}?theme=${theme}`, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      await page.waitForFunction(
        () => document.body.dataset.resumeReady === "true",
        { timeout: 15000 },
      );

      await page.evaluateHandle("document.fonts.ready");
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    /* -----------------------------------------------
       GENERATE PDF — same for all templates
    ----------------------------------------------- */
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf",
      "Content-Length": pdf.length,
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
      return res
        .status(400)
        .send({ success: false, message: "Invalid plan selected" });
    }
    const options = {
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { planType, planLabel: plan.label },
    };
    const order = await razorpay.orders.create(options);
    res
      .status(200)
      .send({ success: true, order, planType, amount: plan.amount });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).send({ success: false, message: "Failed to create order" });
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
      razorpay_signature,
      firebaseIdToken,
      userId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Missing payment verification details",
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Payment signature verification failed",
      });
    }
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const planType = order.notes?.planType;
    const plan = plans[planType];
    if (!plan) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid plan on verified order" });
    }

    if (!firebaseIdToken) {
      return res.status(400).send({
        success: false,
        message: "Missing authenticated user details",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);

    if (userId && userId !== decodedToken.uid) {
      return res
        .status(403)
        .send({ success: false, message: "Authenticated user mismatch" });
    }

    const userSnapshot = await admin
      .firestore()
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    const existingUserData = userSnapshot.exists ? userSnapshot.data() : {};
    const {
      userPlan,
      paymentStatus,
      planExpiryDate: existingPlanExpiryDate,
    } = existingUserData;
    const { planStartDate, planExpiryDate } = calculatePlanDates(
      {
        userPlan,
        paymentStatus,
        planExpiryDate: existingPlanExpiryDate,
      },
      plan,
    );

    res.status(200).send({
      success: true,
      planType,
      paymentStatus: "active",
      planStartDate: planStartDate.toISOString(),
      planExpiryDate: planExpiryDate.toISOString(),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    res
      .status(500)
      .send({ success: false, message: "Payment verification failed" });
  }
});

app.post("/analyze-jd", (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const analysis = analyzeJD(resumeData, jobDescription);
    res.send(analysis);
  } catch (error) {
    console.error("JD Analysis Failed:", error);
    res.status(500).send({ success: false, message: "JD analysis failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
