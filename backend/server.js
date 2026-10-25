const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ message: "Sanjeevani backend is running" });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Sanjeevani server running on port ${PORT}`);
});