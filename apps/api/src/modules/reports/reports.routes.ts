import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { financialService } from "../financial/financial.service.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate, requirePermission("reports:read"));

reportRoutes.get("/daily", asyncHandler(async (req, res) => res.json(await financialService.report("daily", req.query.date as string))));
reportRoutes.get("/monthly", asyncHandler(async (req, res) => res.json(await financialService.report("monthly", req.query.date as string))));
reportRoutes.get("/profit-loss", asyncHandler(async (req, res) => res.json(await financialService.report(req.query.period as string, req.query.date as string))));
reportRoutes.get("/payment-summary", asyncHandler(async (req, res) => res.json(await financialService.paymentSummary(req.query))));

reportRoutes.get("/export/pdf", asyncHandler(async (req, res) => {
  const report = await financialService.report(req.query.period as string, req.query.date as string);
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=financial-report.pdf");
  doc.pipe(res);
  doc.fontSize(18).text("Financial Report");
  doc.moveDown();
  for (const [key, value] of Object.entries(report)) doc.fontSize(11).text(`${key}: ${value}`);
  doc.end();
}));

reportRoutes.get("/export/excel", asyncHandler(async (req, res) => {
  const report = await financialService.report(req.query.period as string, req.query.date as string);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Financial Report");
  sheet.columns = [{ header: "Metric", key: "metric", width: 24 }, { header: "Amount", key: "amount", width: 16 }];
  Object.entries(report).forEach(([metric, amount]) => sheet.addRow({ metric, amount }));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=financial-report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
}));
