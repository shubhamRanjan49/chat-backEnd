import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	// Debugging log to check if the JWT_SECRET is loaded
	console.log("JWT_SECRET used for signing:", process.env.JWT_SECRET);

	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("jwt", token, {
		httpOnly: true, // Prevents XSS attacks
		secure: process.env.NODE_ENV === "production", // Use secure cookies in production
		sameSite: "Strict", // Prevents CSRF attacks
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
	});
};

