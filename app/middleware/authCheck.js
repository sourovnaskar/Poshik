const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authCheck = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (accessToken) {
    try {
      const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
      req.user = decodedAccess;
      return next();
    } catch (error) {
      console.log("Access token expired , creating new access token");
    }
  }
  if (!refreshToken) {
    req.flash("error", "Token is expired or invalid . Please login again");
    return res.redirect("/auth/login");
  }
  try {
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
    );
    const userId = decodedRefresh.id;
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error("User no longer exists");
    }
    const newAcesstoken = jwt.sign(
      {
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        kycStatus: currentUser.kycStatus,
        image: currentUser.profileImage,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "15m",
      },
    );
    res.cookie("accessToken", newAcesstoken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    req.user = jwt.verify(newAcesstoken, process.env.JWT_SECRET_KEY);
    return next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    req.flash("error", "Token is expired or invalid . Please login again");
    return res.redirect("/auth/login");
  }
};
module.exports = authCheck;
