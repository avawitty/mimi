import express from "express";
import Stripe from "stripe";
import path from "path";
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (lazy or try/catch)
let db: FirebaseFirestore.Firestore | null = null;
try {
  // If FIREBASE_SERVICE_ACCOUNT is provided, use it. Otherwise do not initialize.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
    db = getFirestore();
    console.log('Firebase Admin initialized successfully.');
  } else {
    console.log('FIREBASE_SERVICE_ACCOUNT not provided. Firebase Admin will not be initialized.');
  }
} catch (e) {
  console.log('Firebase Admin not initialized. Webhooks will not update Firestore automatically unless configured.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Lazy initialize Stripe to prevent crashing if key is missing
  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  }

  // Webhook must be before express.json() to get raw body
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = getStripe();
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      if (!endpointSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`MIMI // Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id; 
      const customerId = session.customer as string;
      
      if (userId && db) {
        try {
          // Retrieve the line items to get the price ID
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          
          let plan = "free";
          let interval = "month";
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
            plan = price.metadata.plan || "free";
            interval = price.recurring?.interval || "month";
          }

          await db.collection("users").doc(userId).set({
            planStatus: plan,
            plan,
            stripeCustomerId: customerId,
            subscriptionStatus: "active",
            subscriptionInterval: interval,
          }, { merge: true });
          
          await db.collection("profiles_public").doc(userId).set({
            planStatus: plan,
            plan,
            subscriptionStatus: "active",
          }, { merge: true });

          await db.collection("memberships").doc(userId).set({
            plan,
            stripeCustomerId: customerId,
            status: "active",
            interval,
          }, { merge: true });
          console.log(`Successfully updated user ${userId} to plan ${plan}`);
        } catch (dbErr) {
          console.error('MIMI // Error updating user in Firestore:', dbErr);
        }
      } else {
        console.log('No userId found in session or DB not initialized', { userId, dbInitialized: !!db });
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      
      if (customerId && db) {
        try {
          // Find user by customer ID
          const usersRef = db.collection("users");
          const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
          
          if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const lines = invoice.lines.data;
            const priceId = (lines[0] as any)?.price?.id;
            
            let plan = "free";
            let interval = "month";
            if (priceId) {
              const price = await stripe.prices.retrieve(priceId);
              plan = price.metadata.plan || "free";
              interval = price.recurring?.interval || "month";
            }

            await db.collection("users").doc(userId).set({
              planStatus: plan,
              plan,
              subscriptionStatus: "active",
              subscriptionInterval: interval,
            }, { merge: true });
            
            await db.collection("profiles_public").doc(userId).set({
              planStatus: plan,
              plan,
              subscriptionStatus: "active",
            }, { merge: true });

            await db.collection("memberships").doc(userId).set({
              plan,
              status: "active",
              interval,
            }, { merge: true });
            console.log(`Successfully updated user ${userId} to plan ${plan}`);
          }
        } catch (dbErr) {
          console.error('MIMI // Error updating user in Firestore from invoice:', dbErr);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      if (customerId && db) {
        try {
          const usersRef = db.collection("users");
          const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
          
          if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            await db.collection("users").doc(userId).set({
              plan: "free",
              subscriptionStatus: "inactive",
            }, { merge: true });
            
            await db.collection("profiles_public").doc(userId).set({
              plan: "free",
              subscriptionStatus: "inactive",
            }, { merge: true });

            await db.collection("memberships").doc(userId).set({
              plan: "free",
              status: "inactive",
            }, { merge: true });
            console.log(`Successfully downgraded user ${userId} to free plan`);
          }
        } catch (dbErr) {
          console.error('MIMI // Error downgrading user in Firestore:', dbErr);
        }
      }
    }
    res.json({received: true});
  });

  // Middleware to parse JSON bodies for all other routes
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, userId, email, plan } = req.body;
      const stripe = getStripe();

      // Create a Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: email, // Pre-fill the email from Google Auth
        client_reference_id: userId, // Link the user ID to the Stripe session
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.get("host")}/?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/?checkout=canceled`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("MIMI // Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/apply-promo", async (req, res) => {
    try {
      const { userId, code } = req.body;
      
      if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
      }

      if (code.toUpperCase() === 'MIMIMUSE') {
        const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
        
        // Update user profile
        await db.collection("users").doc(userId).set({
          planStatus: "lab",
          plan: "lab",
          subscriptionStatus: "active",
          subscriptionInterval: "year",
        }, { merge: true });
        
        await db.collection("profiles_public").doc(userId).set({
          planStatus: "lab",
          plan: "lab",
          subscriptionStatus: "active",
        }, { merge: true });

        // Update memberships collection securely
        await db.collection("memberships").doc(userId).set({
          plan: "lab",
          status: "active",
          currentPeriodEnd: oneYearFromNow,
          stripeCustomerId: "promo_code",
          interval: "year"
        }, { merge: true });

        return res.json({ success: true, message: "1-Year Lab Access Granted." });
      }

      return res.status(400).json({ error: "Invalid cipher." });
    } catch (error: any) {
      console.error("MIMI // Promo Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/metadata", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch URL" });
      }

      const html = await response.text();
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';

      res.json({ title, description, image, url });
    } catch (error: any) {
      console.error("MIMI // Metadata Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  const distPath = path.join(process.cwd(), 'dist');
  
  let viteAvailable = false;
  try {
    if (typeof require !== 'undefined') {
      require.resolve('vite');
    } else {
      await import.meta.resolve('vite');
    }
    viteAvailable = true;
  } catch (e) {
    viteAvailable = false;
  }

  if (process.env.NODE_ENV !== "production" && viteAvailable) {
    try {
      // Use dynamic import with a variable to prevent esbuild from trying to bundle it
      const viteModuleName = 'vite';
      const { createServer: createViteServer } = await import(viteModuleName);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (error) {
      console.log("Vite not found, serving static files from dist");
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
