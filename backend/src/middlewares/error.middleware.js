const errorHandler = (err, req, res, next) => {
  console.error(err); // log for debugging

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error"
  });
};

module.exports = errorHandler;