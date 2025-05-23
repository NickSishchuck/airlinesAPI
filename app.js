// app.js - Express application setup
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
//const docsRouter = require('./routes/docs');
//FIXME

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount routers
app.use("/api/routes", require("./routes/routes"));
app.use("/api/crews", require("./routes/crews"));
app.use("/api/crew-members", require("./routes/crewMembers"));
app.use("/api/aircraft", require("./routes/aircraft"));
app.use("/api/flights", require("./routes/flights"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/flight-seats", require("./routes/flightSeats"));
app.use("/api/passengers", require("./routes/passengers"));
app.use("/api/flight-pricing", require("./routes/flightPricing"));
//app.use('/api', docsRouter);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Airline Transportation API",
    //documentation: '/api/docs'
    //FIXME
  });
});

// Error handler middleware
app.use(errorHandler);

module.exports = app;