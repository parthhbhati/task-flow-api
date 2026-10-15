import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { app } = await import("./app.js");
const { default: connectDB } = await import("./db/index.js");

const PORT = process.env.PORT || 7000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
      console.log("CORS origin:", process.env.CORS_ORIGIN);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed!!", error);
  });