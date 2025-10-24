export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // allow either explicit admin claim or role === "admin"
    if (req.user.admin === true || req.user.role === "admin") {
      return next();
    }

    return res.status(403).json({ success: false, error: "Forbidden: Admins only" });
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(500).json({ success: false, error: "Something went wrong in admin check" });
  }
};
