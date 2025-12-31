import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie as generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

// Signup
export const signup = async (req, res) => {
	console.log("1. Signup process started."); // Debug log
	try {
		const { email, fullName, password } = req.body;
		console.log("2. Received data:", { email, fullName }); // Debug log

		if (!email || !fullName || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}
		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}

		console.log("3. Checking if user exists in the database..."); // Debug log
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}

		console.log("4. Hashing the password..."); // Debug log
		const hashedPassword = await bcrypt.hash(password, 10);

		console.log("5. Creating the new user in the database..."); // Debug log
		const newUser = await User.create({
			email,
			fullName,
			password: hashedPassword,
		});

		console.log("6. Generating authentication token..."); // Debug log
		generateToken(newUser._id, res);

		console.log("7. Signup successful. Sending response."); // Debug log
		res.status(201).json({
			_id: newUser._id,
			email: newUser.email,
			fullName: newUser.fullName,
			profilePic: newUser.profilePic || null,
		});
	} catch (error) {
		// This will catch any unexpected errors from the database or token generation
		console.error("!!! SIGNUP FAILED AT THIS STEP. ERROR:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Login
export const login = async (req, res) => {
	const { email, password } = req.body;
	console.log("Login attempt for:", email); // Debug

	try {
		const user = await User.findOne({ email });
		if (!user) {
			console.log("User not found"); // Debug
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			console.log("Incorrect password"); // Debug
			return res.status(400).json({ message: "Invalid credentials" });
		}

		generateToken(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			email: user.email,
			profilePic: user.profilePic || null,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Logout
export const logout = (req, res) => {
	res.cookie("jwt", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	res.status(200).json({ message: "Logged out successfully" });
};

// Update Profile Picture and Profile Info
export const updateProfile = async (req, res) => {
	try {
		const { profilePic, fullName, email } = req.body;
		const userId = req.user._id;

		// Prepare update object
		const updateData = {};

		// Handle profile picture upload if provided
		if (profilePic) {
			const upload = await cloudinary.uploader.upload(profilePic, {
				folder: "profile_pics",
			});
			updateData.profilePic = upload.secure_url;
		}

		// Handle fullName update
		if (fullName) {
			updateData.fullName = fullName.trim();
		}

		// Handle email update
		if (email) {
			// Check if email already exists (excluding current user)
			const existingEmail = await User.findOne({ 
				email: email.toLowerCase(), 
				_id: { $ne: userId } 
			});
			if (existingEmail) {
				return res.status(400).json({ message: "Email is already in use" });
			}
			updateData.email = email.toLowerCase();
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({ message: "No data to update" });
		}

		const updatedUser = await User.findByIdAndUpdate(
			userId, 
			updateData, 
			{ new: true }
		).select("-password");

		res.status(200).json({
			_id: updatedUser._id,
			fullName: updatedUser.fullName,
			email: updatedUser.email,
			profilePic: updatedUser.profilePic,
		});
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Check Auth
export const checkAuth = (req, res) => {
	try {
		res.status(200).json(req.user);
	} catch (error) {
		console.error("Auth check error:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

