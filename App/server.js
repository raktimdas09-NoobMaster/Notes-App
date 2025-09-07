const express = require("express");
const app = express();
const session = require("express-session");
const bcrypt = require("bcrypt");
const MongoClient = require("mongodb").MongoClient;
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 5050;
const MONGO_URL = process.env.MONGO_URL || "mongodb://admin:qwerty@mongod9b:27017";
const DB_NAME = process.env.DB_NAME || "notesDB";

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false
}));

// MongoDB connection
const client = new MongoClient(MONGO_URL);
let db;
async function connectDB() {
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
}
connectDB();

// Routes

// Register
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await db.collection("users").findOne({ username });
    if (existingUser) return res.status(400).send("User already exists");
    await db.collection("users").insertOne({ username, password: hashedPassword });
    res.send("User registered successfully");
});

// Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection("users").findOne({ username });
    if (!user) return res.status(400).send("Invalid credentials");
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Invalid credentials");
    req.session.user = { id: user._id, username: user.username };
    res.send("Login successful");
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.send("Logged out");
});

// Add note
app.post("/notes", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    const { content } = req.body;
    await db.collection("notes").insertOne({
        userId: req.session.user.id,
        content,
        createdAt: new Date()
    });
    res.send("Note added");
});

// Get notes
app.get("/notes", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    const notes = await db.collection("notes").find({ userId: req.session.user.id }).toArray();
    res.json(notes);
});

// Serve frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
