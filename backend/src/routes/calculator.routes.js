import express from "express";
import { profitCalculator } from "../controllers/calculator.controller.js";

const router = express.Router();

router.post("/profit", profitCalculator);

export default router;
