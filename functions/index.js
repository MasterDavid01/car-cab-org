const { onRequest } = require("firebase-functions/v2/https");
const twilio = require("twilio");

const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioVerify = process.env.TWILIO_VERIFY;

const twilioClient = twilio(twilioSid, twilioToken);

exports.sendVerification = onRequest(
  {
    invoker: "public",
    secrets: ["TWILIO_SID", "TWILIO_TOKEN", "TWILIO_VERIFY"]
  },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { phone } = req.body;

      const result = await twilioClient.verify.v2
        .services(twilioVerify)
        .verifications.create({ to: phone, channel: "sms" });

      res.json({ success: true, sid: result.sid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

exports.checkVerification = onRequest(
  {
    invoker: "public",
    secrets: ["TWILIO_SID", "TWILIO_TOKEN", "TWILIO_VERIFY"]
  },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { phone, code } = req.body;

      const result = await twilioClient.verify.v2
        .services(twilioVerify)
        .verificationChecks.create({ to: phone, code });

      res.json({ success: result.status === "approved" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
