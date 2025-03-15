const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const { route } = require("./routes/serviceRoute");
const UserModel = require("./models/user"); 
const Job = require("./models/job");
const AdminModel = require("./models/admin");
const MarketingPitch = require("./models/markrtingPitch");
const Service = require('./models/service'); 

dotenv.config();

const app = express();
app.use(cors());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Successfully Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/getUsers", async (req, res) => {
  try {
    const users = await UserModel.find().select("-password"); // Exclude password field
    res.json({ users }); // Return users as JSON
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      message: "Failed to retrieve users",
      error: err.message,
    });
  }
});
app.get("/getUser/:id", async (req, res) => {
  try {
    const users = await UserModel.findById(req.params.id); // Fetch the user by ID
    if (!users) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ users }); // Return the user as JSON
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      message: "Failed to retrieve user",
      error: err.message,
    });
  }
});

app.get("/getJobs", async (req, res) => {
  try {
    // Fetch all jobs from the database
    const jobs = await Job.find();
    res.json({ jobs }); // Return jobs as JSON
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({
      message: "Failed to retrieve jobs",
      error: err.message,
    });
  }
});
app.get("/getJob/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id); // Fetch the job by ID
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ job }); // Return the job as JSON
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({
      message: "Failed to retrieve job",
      error: err.message,
    });
  }
});

app.get("/getServices", async (req, res) => {
  try {
    // Fetch all services from the database
    const services = await Service.find().select("-__v"); // Exclude the __v field
    res.json({ services }); // Return services as JSON
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({
      message: "Failed to retrieve services",
      error: err.message,
    });
  }
});

app.get("/getMarketingPitch", async (req, res) => {
  try {
    // Fetch the latest marketing pitch from the database
    const pitch = await MarketingPitch.findOne().sort({ createdAt: -1 }); // Get the latest pitch
    if (!pitch) {
      return res.status(404).json({ message: "No marketing pitch found" });
    }
    res.json({ pitch }); // Return the pitch as JSON
  } catch (err) {
    console.error("Error fetching marketing pitch:", err);
    res.status(500).json({
      message: "Failed to retrieve marketing pitch",
      error: err.message,
    });
  }
});
app.get("/getMarketingPitch/:id", async (req, res) => {
  try {
    const pitch = await MarketingPitch.findById(req.params.id); // Fetch the pitch by ID
    if (!pitch) {
      return res.status(404).json({ message: "Marketing pitch not found" });
    }
    res.json({ pitch }); // Return the pitch as JSON
  } catch (err) {
    console.error("Error fetching marketing pitch:", err);
    res.status(500).json({
      message: "Failed to retrieve marketing pitch",
      error: err.message,
    });
  }
});




app.get("/getAdmins", async (req, res) => {
  try {
    // Fetch all admins using AdminModel
    const admins = await AdminModel.find({});

    // Calculate counts based on roles
    const adminCount = admins.filter(admin => admin.role === "admin").length;
    const productCount = admins.filter(admin => admin.role === "product").length;
    const superAdminCount = admins.filter(admin => admin.role === "super admin").length;

    // Return both the list of admins and the role-based counts
    res.json({
      admins, // List of all admins
      counts: {
        adminCount,
        productCount,
        superAdminCount,
      },
    });
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({
      message: "Failed to retrieve admins",
      error: err.message,
    });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/authAdminRoutes"));
app.use("/", require("./routes/serviceRoute"));
app.use("/", require("./routes/jobRoutes"));
app.use("/", require("./routes/marketing"));
app.use("/", require("./routes/bountyRoutes"));
app.use("/", require("./routes/verify"));
app.use("/", require("./routes/sendsol"));

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
