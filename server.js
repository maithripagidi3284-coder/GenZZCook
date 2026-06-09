const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. CONNECT TO MONGOODATABASE ATLAS
// TODO: Replace with your actual connection string from Atlas (include your real password)
const MONGO_URI = "mongodb+srv://maithripagidi3284_db_user:maithri3284@cluster0.bikxqlm.mongodb.net/GenZZcookDB?retryWrites=true&w=majority"; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("🚀 Connected to MongoDB Atlas Cloud!"))
    .catch(err => console.error("Database connection error:", err));

// 2. DEFINE CHEF PROFILE BLUEPRINT (SCHEMA)
const ChefSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Saved as a secure hash string
    phone: String,
    cuisine: String,
    rate: Number,
    commitment: String
});
const Chef = mongoose.model('Chef', ChefSchema);

// ==========================================
// ROUTE A: USER REGISTRATION / SIGNUP ROUTE
// ==========================================
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, phone, cuisine, rate, commitment } = req.body;

        // Check if user already exists
        const existingChef = await Chef.findOne({ email: email.toLowerCase() });
        if (existingChef) {
            return res.status(400).json({ success: false, message: "Email already registered!" });
        }

        // HASH THE PASSWORD SCRIPT SECURELY
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newChef = new Chef({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            cuisine,
            rate: Number(rate),
            commitment
        });

        await newChef.save();
        res.status(201).json({ success: true, message: "Account registered successfully in Cloud!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// ROUTE B: SECURE CREDENTIAL VALIDATION LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Find chef by email
        const chefFound = await Chef.findOne({ email: identifier.toLowerCase() });
        if (!chefFound) {
            return res.status(400).json({ success: false, message: "Authentication Failed: User not found." });
        }

        // Compare input password against secure stored hash password block
        const isMatch = await bcrypt.compare(password, chefFound.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Authentication Failed: Invalid credentials." });
        }

        // Login passed! Pass back parameters safely to display inside workspace UI
        res.json({
            success: true,
            message: `Welcome Back, Chef ${chefFound.name}!`,
            chef: {
                name: chefFound.name,
                email: chefFound.email,
                phone: chefFound.phone,
                cuisine: chefFound.cuisine,
                commitment: chefFound.commitment
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`💻 Backend operational grid listening on port ${PORT}`));