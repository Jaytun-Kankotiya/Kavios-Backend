// export const verifyToken = (req, res, next) => {
//   const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
//   console.log("Token received in header:", token);

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(403).json({ message: "Invalid or expired token" });
//   }
// };


import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ success: false, message: "Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ success: false, message: "Invalid token" });
    } else {
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

