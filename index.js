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
const { AccessToken, Role } = require('@huddle01/server-sdk/auth');
const http = require('http'); // Add this for WebSocket support
const { Server } = require('socket.io'); // Add Socket.io

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Adjust to your client URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Successfully Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

  
// Migration for adding eth_publickey to existing users
const migrateEthPublicKey = async () => {
  try {
    const result = await UserModel.updateMany(
      { eth_publickey: { $exists: false } }, // Find users missing eth_publickey
      { $set: { eth_publickey: "" } } // Set default to empty string
    );
    if (result.modifiedCount > 0) {
      console.log(`Migrated ${result.modifiedCount} users to include eth_publickey`);
    } else {
      console.log("No users needed eth_publickey migration");
    }
  } catch (error) {
    console.error("Eth_publickey migration error:", error);
  }
};

// Run migration on successful MongoDB connection
mongoose.connection.once("open", () => {
  console.log("MongoDB connection opened");
  migrateEthPublicKey();
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));


io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Forum-specific events
  socket.on('joinForum', (forumId) => {
    socket.join(forumId);
    console.log(`User joined forum: ${forumId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);


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


app.post('/api/create-room', async (req, res) => {
  try {
    console.log('Creating Huddle01 room...');
    const response = await fetch('https://api.huddle01.com/api/v2/sdk/rooms/create-room', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Huddle01 Room',
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HUDDLE01_API_KEY,
      },
      cache: 'no-cache',
    });
    console.log('Huddle01 response status:', response.status);
    const data = await response.json();
    console.log('Huddle01 response data:', data);
    const roomId = data.data.roomId;
    res.json({ roomId });
  } catch (error) {
    console.error('Huddle01 error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/api/token', async (req, res) => {
    const { roomId } = req.query;
  
    if (!roomId) {
      return res.status(400).json({ error: 'Missing roomId' });
    }
  
    const { AccessToken, Role } = require('@huddle01/server-sdk/auth');
  
    const accessToken = new AccessToken({
      apiKey: process.env.HUDDLE01_API_KEY,
      roomId: roomId,
      role: Role.HOST,
      permissions: {
        admin: true,
        canConsume: true,
        canProduce: true,
        canProduceSources: {
          cam: true,
          mic: true,
          screen: true,
        },
        canRecvData: true,
        canSendData: true,
        canUpdateMetadata: true,
      },
    });
  
    const token = await accessToken.toJwt();
    res.json({ token });
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
app.use("/", require("./routes/forumRoutes"));
app.use("/", require("./routes/huddleRoute"));
app.use('/articles', require('./routes/articleRoutes')); 
app.use('/backdropUploads', express.static('backdropUploads'))

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server is running on port ${port}`));
