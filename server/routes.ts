import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertQrCodeSchema } from "@shared/schema";
import QRCode from "qrcode";
import sharp from "sharp";

// Helper function to apply QR code styling
async function applyQrStyle(qrBuffer: Buffer, style: string): Promise<Buffer> {
  try {
    const image = sharp(qrBuffer);
    
    if (style === "rounded") {
      // Apply rounded corners
      const metadata = await image.metadata();
      const size = metadata.width || 400;
      const cornerRadius = Math.floor(size * 0.05); // 5% of image size
      
      const roundedCornerSvg = `<svg width="${size}" height="${size}">
        <defs>
          <clipPath id="rounded">
            <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
          </clipPath>
        </defs>
        <image width="${size}" height="${size}" clip-path="url(#rounded)" href="data:image/png;base64,${qrBuffer.toString('base64')}"/>
      </svg>`;
      
      return await sharp(Buffer.from(roundedCornerSvg))
        .png()
        .toBuffer();
    }
    
    return qrBuffer;
  } catch (error) {
    console.error("Error applying QR style:", error);
    return qrBuffer;
  }
}

// Helper function to add logo to QR code
async function addLogoToQr(qrBuffer: Buffer, logoUrl: string, qrSize: number): Promise<Buffer> {
  try {
    // For demo purposes, we'll create a simple centered placeholder
    // In production, you'd want to fetch the actual logo from the URL
    const logoSize = Math.floor(qrSize * 0.2); // Logo is 20% of QR size
    const position = Math.floor((qrSize - logoSize) / 2);
    
    // Create a white background for the logo area
    const logoBackground = await sharp({
      create: {
        width: logoSize + 20,
        height: logoSize + 20,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    // Composite the logo background onto the QR code
    return await sharp(qrBuffer)
      .composite([{
        input: logoBackground,
        top: position - 10,
        left: position - 10
      }])
      .png()
      .toBuffer();
      
  } catch (error) {
    console.error("Error adding logo to QR:", error);
    return qrBuffer;
  }
}

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Create QR Code
  app.post("/api/qr-codes", requireAuth, async (req: any, res) => {
    try {
      const qrCodeData = insertQrCodeSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const qrCode = await storage.createQrCode(qrCodeData);
      res.status(201).json(qrCode);
    } catch (error: any) {
      console.error("Error creating QR code:", error);
      res.status(400).json({ message: error.message || "Failed to create QR code" });
    }
  });

  // Get user's QR codes
  app.get("/api/qr-codes", requireAuth, async (req: any, res) => {
    try {
      const qrCodes = await storage.getUserQrCodes(req.user.id);
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  // Get QR code image
  app.get("/api/qr-codes/:id/image", async (req, res) => {
    try {
      const qrCode = await storage.getQrCode(req.params.id);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }

      let qrContent = qrCode.content;
      
      // Format content based on type
      switch (qrCode.type) {
        case "email":
          qrContent = `mailto:${qrCode.content}`;
          break;
        case "phone":
          qrContent = `tel:${qrCode.content}`;
          break;
        case "sms":
          qrContent = `sms:${qrCode.content}`;
          break;
        case "url":
          if (!qrCode.content.startsWith("http://") && !qrCode.content.startsWith("https://")) {
            qrContent = `https://${qrCode.content}`;
          }
          break;
        case "wifi":
          // WiFi format: WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
          // Input format expected: "NetworkName:Password:Security"
          const wifiParts = qrCode.content.split(':');
          if (wifiParts.length >= 2) {
            const networkName = wifiParts[0];
            const password = wifiParts[1];
            const security = wifiParts[2] || 'WPA';
            qrContent = `WIFI:T:${security};S:${networkName};P:${password};H:false;;`;
          }
          break;
        case "vcard":
          // vCard format - if not already formatted, wrap in VCARD structure
          if (!qrCode.content.includes('BEGIN:VCARD')) {
            qrContent = `BEGIN:VCARD\nVERSION:3.0\nFN:${qrCode.content}\nEND:VCARD`;
          }
          break;
        case "text":
          // Plain text - use as-is
          qrContent = qrCode.content;
          break;
      }

      // Generate QR code with customization options
      const qrOptions = {
        type: "png" as const,
        width: qrCode.size || 400,
        margin: qrCode.margin || 2,
        color: {
          dark: qrCode.foregroundColor || "#000000",
          light: qrCode.backgroundColor || "#ffffff"
        },
        errorCorrectionLevel: (qrCode.errorCorrection || "M") as "L" | "M" | "Q" | "H"
      };

      let qrImage: Buffer = await QRCode.toBuffer(qrContent, qrOptions);

      // Apply style modifications if needed
      if (qrCode.style === "rounded" || qrCode.style === "dots") {
        qrImage = await applyQrStyle(qrImage, qrCode.style);
      }

      // Add logo if specified
      if (qrCode.logoUrl) {
        qrImage = await addLogoToQr(qrImage, qrCode.logoUrl, qrCode.size || 400);
      }

      res.set({
        "Content-Type": "image/png",
        "Content-Length": qrImage.length,
      });
      res.send(qrImage);
    } catch (error) {
      console.error("Error generating QR code image:", error);
      res.status(500).json({ message: "Failed to generate QR code image" });
    }
  });

  // QR code redirect with analytics
  app.get("/api/r/:shortCode", async (req, res) => {
    try {
      const qrCode = await storage.getQrCodeByShortCode(req.params.shortCode);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }

      // Update click count
      await storage.updateQrCodeClickCount(qrCode.id);

      // Redirect based on type
      let redirectUrl = qrCode.content;
      switch (qrCode.type) {
        case "url":
          if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
            redirectUrl = `https://${redirectUrl}`;
          }
          break;
        case "email":
          redirectUrl = `mailto:${qrCode.content}`;
          break;
        case "phone":
          redirectUrl = `tel:${qrCode.content}`;
          break;
        case "sms":
          redirectUrl = `sms:${qrCode.content}`;
          break;
        case "wifi":
          // WiFi QR codes should show instructions
          const wifiParts = qrCode.content.split(':');
          const networkName = wifiParts[0] || 'Unknown Network';
          const password = wifiParts[1] || '';
          return res.send(`<html><body><h1>WiFi Network</h1><p><strong>Network:</strong> ${networkName}</p><p><strong>Password:</strong> ${password}</p><p>Scan this QR code with your device to connect automatically.</p></body></html>`);
        case "vcard":
          // vCard content should be displayed
          return res.send(`<html><body><h1>Contact Information</h1><pre>${qrCode.content}</pre></body></html>`);
        case "text":
        default:
          // For text and other types, show the content
          return res.send(`<html><body><h1>QR Code Content</h1><p>${qrCode.content}</p></body></html>`);
      }

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error handling QR code redirect:", error);
      res.status(500).json({ message: "Failed to process QR code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
