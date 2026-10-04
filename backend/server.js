require("dotenv").config();

const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const admin = require("firebase-admin");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { extractResumeTextFromPdf } = require("./services/pdfLayoutExtractor");
const analyzeJD = require("./services/jdAnalyzer");
const { parseResumeText } = require("./services/resumeImporter");

/*
Import server-side HTML template builders.
Add a new import here for each new template — no Puppeteer changes needed.
*/
const { buildCompactGridHTML } = require("./templates/compact-grid.template");

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const INTERNAL_RENDER_TOKEN = process.env.INTERNAL_RENDER_TOKEN || crypto.randomBytes(32).toString('hex');

const app = express();
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    callback(isPdf ? null : new Error("Only PDF files are supported"), isPdf);
  },
});
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

/*
AUTHENTICATION MIDDLEWARE

All protected API requests must send:
Authorization: Bearer <Firebase ID token>
*/
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    const idToken = authHeader.substring("Bearer ".length).trim();

    if (!idToken) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Authentication failed:", error);

    return res.status(401).send({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

/*
PREMIUM ACCESS MIDDLEWARE

The frontend can hide premium features, but the backend must also enforce
subscription expiry so a user cannot bypass the plan by calling the API
directly.

The Firebase ID token is sent as:
Authorization: Bearer <token>
*/
async function requireActivePremium(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    const idToken = authHeader.substring("Bearer ".length).trim();

    if (!idToken) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = req.user || await admin.auth().verifyIdToken(idToken);
    const userRef = admin.firestore().collection("users").doc(decodedToken.uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res.status(403).send({
        success: false,
        message: "No active subscription found",
      });
    }

    const userData = userSnapshot.data() || {};
    const expiryDate = parseExistingExpiryDate(userData.planExpiryDate);
    const isPremiumPlan = ["pro", "pro_plus"].includes(userData.userPlan);
    const isActive = userData.paymentStatus === "active";
    const hasNotExpired = expiryDate && expiryDate > new Date();

    if (!isPremiumPlan || !isActive || !hasNotExpired) {
      if (isPremiumPlan || isActive) {
        await userRef.set(
          {
            userPlan: "free",
            paymentStatus: "inactive",
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }

      return res.status(403).send({
        success: false,
        message: "Your premium plan has expired. Please choose a plan to continue.",
        expired: true,
      });
    }

    req.user = decodedToken;
    req.userData = userData;
    next();
  } catch (error) {
    console.error("Premium access check failed:", error);

    return res.status(401).send({
      success: false,
      message: "Authentication or subscription verification failed",
    });
  }
}

app.get("/", (req, res) => {
  res.send("Resume PDF Server Running");
});


async function setupPrintPageResumeData(page, resumeData) {
  await page.setRequestInterception(true);

  page.on("console", (message) => {
    console.log("[PDF page console]", message.type(), message.text());
  });

  page.on("pageerror", (error) => {
    console.error("[PDF page error]", error);
  });

  page.on("requestfailed", (request) => {
    console.error(
      "[PDF request failed]",
      request.method(),
      request.url(),
      request.failure()?.errorText || "unknown",
    );
  });

  page.on("request", async (request) => {
    try {
      const requestUrl = new URL(request.url());

      if (
        request.method() === "GET" &&
        requestUrl.pathname === "/resume-data"
      ) {
        console.log("[PDF] Serving resume data directly to print page");

        await request.respond({
          status: 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": FRONTEND_URL,
          },
          body: JSON.stringify(resumeData),
        });

        return;
      }

      await request.continue();
    } catch (error) {
      console.error("[PDF] Request interception failed:", error);
      try {
        await request.continue();
      } catch (_) {
        // Request may already have been handled.
      }
    }
  });
}

async function requireResumeDataAuth(req, res, next) {
  const renderToken = req.headers["x-internal-render-token"];
  const renderUserId = req.headers["x-render-user-id"];

  if (
    renderToken &&
    renderUserId &&
    renderToken === INTERNAL_RENDER_TOKEN &&
    typeof renderUserId === "string" &&
    renderUserId.length > 0
  ) {
    req.user = { uid: renderUserId };
    return next();
  }

  return requireAuth(req, res, next);
}

app.post("/save-resume-data", requireAuth, async (req, res) => {
  try {
    await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .collection("privateData")
      .doc("currentResume")
      .set(
        {
          resumeData: req.body || {},
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

    res.send({ message: "Resume data saved successfully" });
  } catch (error) {
    console.error("Saving resume data failed:", error);
    res.status(500).send({
      success: false,
      message: "Failed to save resume data",
    });
  }
});

app.get("/resume-data", requireResumeDataAuth, async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .collection("privateData")
      .doc("currentResume")
      .get();

    if (!snapshot.exists) {
      return res.status(404).send({
        success: false,
        message: "No resume data found",
      });
    }

    res.send(snapshot.data().resumeData || {});
  } catch (error) {
    console.error("Loading resume data failed:", error);
    res.status(500).send({
      success: false,
      message: "Failed to load resume data",
    });
  }
});

app.post("/api/resume/import", requireAuth, (req, res) => {
  resumeUpload.single("resume")(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        return res.status(400).send({
          success: false,
          message: uploadError.message || "Only PDF files are supported",
        });
      }

      if (!req.file) {
        return res
          .status(400)
          .send({ success: false, message: "Please upload a PDF resume" });
      }

      /*
       * Use the layout-aware renderer first. It reconstructs PDF text
       * using x/y coordinates so two-column resumes are not fed to the
       * parser in the PDF's arbitrary internal object order.
       *
       * Fall back to the original pdf-parse text if the custom renderer
       * cannot extract useful text. A bad layout heuristic must never make
       * a valid PDF fail to import.
       */
      let extracted;

      try {
        extracted = await extractResumeTextFromPdf(req.file.buffer);
      } catch (layoutError) {
        console.error("Layout-aware PDF extraction failed:", layoutError);
        const fallback = await pdfParse(req.file.buffer);

        extracted = {
          text: fallback.text || "",
          pages: fallback.numpages || 0,
          textLength: fallback.text?.length || 0,
        };
      }

      const rawText = extracted.text || "";

      if (!rawText.trim()) {
        return res.status(422).send({
          success: false,
          message:
            "We could not read text from this PDF. Please upload a text-based PDF.",
        });
      }

      console.log("============== RESUME TEXT START ==============");
      console.log(rawText.substring(0, 3000));
      console.log("============== RESUME TEXT END ==============");

      const resumeData = parseResumeText(rawText);

      /*
       * Import is intentionally successful when the PDF was readable even
       * if some optional fields could not be detected. The form is designed
       * for user review/editing after import.
       */
      res.status(200).send({
        success: true,
        resumeData,
        metadata: {
          pages: extracted.pages,
          textLength: extracted.textLength,
        },
      });
    } catch (error) {
      console.error("Resume import failed:", error);
      res.status(500).send({
        success: false,
        message: error.message || "Resume import failed",
      });
    }
  });
});

/*
GENERATE FREE PDF (Modern template)
*/
app.get("/generate-pdf", requireAuth, async (req, res) => {
  let browser;

  const resumeSnapshot = await admin
    .firestore()
    .collection("users")
    .doc(req.user.uid)
    .collection("privateData")
    .doc("currentResume")
    .get();

  if (!resumeSnapshot.exists) {
    return res.status(404).send({
      success: false,
      message: "No resume data found. Please save your resume first.",
    });
  }

  const resumeData = resumeSnapshot.data()?.resumeData || {};

  try {
    console.log("[PDF] user:", req.user.uid, "| template: modern");
    console.log("Chrome Path:", puppeteer.executablePath());

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await setupPrintPageResumeData(page, resumeData);

    await page.goto(`${FRONTEND_URL}/modern-resume-print`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
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
});;

/*
GENERATE PREMIUM PDF

Architecture:
- compact-grid → server-side HTML builder (no Angular route needed)
- executive-left-rail, others → still use Angular print route
*/
app.get("/generate-premium-pdf", requireActivePremium, async (req, res) => {
  let browser;

  const resumeSnapshot = await admin
    .firestore()
    .collection("users")
    .doc(req.user.uid)
    .collection("privateData")
    .doc("currentResume")
    .get();

  if (!resumeSnapshot.exists) {
    return res.status(404).send({
      success: false,
      message: "No resume data found. Please save your resume first.",
    });
  }

  const resumeData = resumeSnapshot.data()?.resumeData || {};
  const theme = resumeData.selectedTheme || "indigo";
  const template = resumeData.selectedTemplate || "executive-left-rail";
  console.log("[PDF] user:", req.user.uid, "| theme:", theme, "| template:", template);

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

    await setupPrintPageResumeData(page, resumeData);

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    if (template === "compact") {
      const html = buildCompactGridHTML(resumeData);

      await page.setContent(html, { waitUntil: "networkidle0" });
      await new Promise((resolve) => setTimeout(resolve, 300));
    } else {
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
app.post("/create-order", requireAuth, async (req, res) => {
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
      notes: {
        planType,
        planLabel: plan.label,
        firebaseUid: req.user.uid,
      },
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
app.post("/verify-payment", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Missing payment verification details",
      });
    }

    /*
    Verify the Razorpay signature first so the order/payment IDs cannot be
    trusted until Razorpay has cryptographically confirmed the checkout data.
    */
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
      return res.status(400).send({
        success: false,
        message: "Invalid plan on verified order",
      });
    }

    /*
    Orders created after this hardening include the Firebase UID in their
    private Razorpay notes. If present, make sure the order belongs to the
    authenticated user.
    */
    if (order.notes?.firebaseUid && order.notes.firebaseUid !== req.user.uid) {
      return res.status(403).send({
        success: false,
        message: "Payment order does not belong to this user",
      });
    }

    const expectedAmount = plan.amount * 100;

    if (order.amount !== expectedAmount || order.currency !== "INR") {
      return res.status(400).send({
        success: false,
        message: "Payment order amount or currency is invalid",
      });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).send({
        success: false,
        message: "Payment does not belong to the verified order",
      });
    }

    if (payment.amount !== expectedAmount || payment.currency !== "INR") {
      return res.status(400).send({
        success: false,
        message: "Payment amount or currency is invalid",
      });
    }

    if (payment.status !== "captured") {
      return res.status(400).send({
        success: false,
        message: "Payment has not been captured",
      });
    }

    const uid = req.user.uid;
    const userRef = admin.firestore().collection("users").doc(uid);
    const userSnapshot = await userRef.get();
    const existingUserData = userSnapshot.exists
      ? userSnapshot.data()
      : {};

    /*
    Idempotency: a previously processed payment must not extend the user's
    subscription again if the frontend retries the verification request.
    */
    if (
      existingUserData.paymentId === razorpay_payment_id &&
      existingUserData.orderId === razorpay_order_id &&
      existingUserData.paymentStatus === "active"
    ) {
      return res.status(200).send({
        success: true,
        planType: existingUserData.userPlan || planType,
        paymentStatus: "active",
        planStartDate: existingUserData.planStartDate,
        planExpiryDate: existingUserData.planExpiryDate,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        alreadyProcessed: true,
      });
    }

    const {
      planStartDate,
      planExpiryDate,
    } = calculatePlanDates(
      existingUserData,
      plan,
    );

    await userRef.set(
      {
        userPlan: planType,
        paymentStatus: "active",
        planStartDate: planStartDate.toISOString(),
        planExpiryDate: planExpiryDate.toISOString(),
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        updatedAt: new Date().toISOString(),
      },
      {
        merge: true,
      },
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
    res.status(500).send({
      success: false,
      message: "Payment verification failed",
    });
  }
});

app.post("/analyze-jd", requireActivePremium, (req, res) => {
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
