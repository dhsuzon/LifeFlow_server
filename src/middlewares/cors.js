const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = [
  clientUrl,
  "http://localhost:3000",
  "http://localhost:3001",
];

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "stripe-signature",
  ],
};
