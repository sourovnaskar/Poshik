const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    return next();
  }
  req.flash("error", "Access denied. Admin resources only.");
  return res.redirect("/");
};

module.exports = adminCheck;
