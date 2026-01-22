import express from "express";
import upload from "../middleware/upload.middleware.js";
import {
  labelMaker,
  fbaLabelMaker,
  labelCrop,
  labelSort,
  labelSplit,
  multiLabelMaker,
  pdfMerge,
  captureMissingPayments,
  emptyBoxClaim,
  downloadPdf,
  filterAndDownloadPdf,
  meeshoProfitAnalysis,
  amazonProfitCalculator
} from "../controllers/tools.controller.js";

const router = express.Router();

router.post("/label-maker", upload.single("file"), labelMaker);
router.post("/fba-label-maker", fbaLabelMaker);

router.post("/label-crop", upload.single("file"), labelCrop);
router.post("/label-sort", upload.single("file"), labelSort);
router.post("/label-split", upload.single("file"), labelSplit);
router.post("/multi-label-maker", upload.array("files"), multiLabelMaker);
router.post("/pdf-merge", upload.array("files"), pdfMerge);
router.post("/capture-missing-payments", upload.fields([
  { name: 'orderFile', maxCount: 1 },
  { name: 'payment1File', maxCount: 1 },
  { name: 'payment2File', maxCount: 1 }
]), captureMissingPayments);
router.post("/empty-box-claim", upload.single("file"), emptyBoxClaim);
router.get("/download-pdf", downloadPdf);
router.post("/filter-and-download-pdf", filterAndDownloadPdf);
router.post("/amazon-profit-calculator", amazonProfitCalculator);

export default router;
