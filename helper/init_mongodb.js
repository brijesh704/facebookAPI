const mongoose = require("mongoose");
const mongo = "mongodb://127.0.0.1:27017/facebookAPI";

//--------connect_mongodb-------------
main()
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((err) => {
    console.error(err.message);
  });
async function main() {
  mongoose.connect(mongo);
}

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to db");
});

mongoose.connection.on("error", (err) => {
  console.log(err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose is disconnected from the database");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
