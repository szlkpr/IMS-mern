import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "MERN connected" });
});

export default router;