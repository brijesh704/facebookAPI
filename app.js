const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
const app = express();
const apiRoutes = require("./routes/apiRoutes");
require("./helper/init_mongodb");
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

//error handling
app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = 8080;

app.listen(PORT, () => console.log(`🚀 on port ${PORT}`));
