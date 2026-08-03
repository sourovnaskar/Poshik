const validation = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join("</br>");
      req.flash("error", errorMessage);
      const previousPage = req.get("Referer") || "/register";
      return res.redirect(previousPage);
    }
    next();
  };
};

module.exports = validation;
