const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Serve React static files from the correct frontend build directory
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

// API routes
//FFB Reupload
const ffbRoutes = require("./routes/ffb.routes"); // <-- update path if needed
app.use("/api/ffb-reupload", ffbRoutes);

// Split SO
const splitSORoutes = require("./routes/split.routes"); // <-- update path if needed
app.use("/api/split-so", splitSORoutes);

// CP-Update WB_IN and WB_OUT
const cpUpdateRoutes = require("./routes/cpupdate.routes"); // <-- update path if needed
app.use("/api/cp-update", cpUpdateRoutes);

// Barge 
const bargeRoutes = require("./routes/barge.routes"); // <-- update path if needed
app.use("/api/barge-update", bargeRoutes);


// Catch-all: send React index.html for any other route
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
