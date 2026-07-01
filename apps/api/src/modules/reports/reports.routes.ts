import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { authenticate, authorize, requirePermission } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { scopedWhere } from "../../utils/scoped-where.js";
import { financialService } from "../financial/financial.service.js";
import { getReportRange } from "../../utils/date-range.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate, requirePermission("reports:read"));

reportRoutes.get("/daily", asyncHandler(async (req, res) => res.json(await financialService.report("daily", req.query.date as string, scopedWhere(req)))));
reportRoutes.get("/monthly", asyncHandler(async (req, res) => res.json(await financialService.report("monthly", req.query.date as string, scopedWhere(req)))));
reportRoutes.get("/profit-loss", asyncHandler(async (req, res) => res.json(await financialService.report(req.query.period as string, req.query.date as string, scopedWhere(req)))));
reportRoutes.get("/payment-summary", asyncHandler(async (req, res) => res.json(await financialService.paymentSummary(req.query, scopedWhere(req)))));
reportRoutes.get("/detailed", asyncHandler(async (req, res) => res.json(await financialService.detailedReport(req.query, scopedWhere(req)))));
reportRoutes.get("/by-store", asyncHandler(async (req, res) => res.json(await financialService.storeReport(req.query, scopedWhere(req)))));

reportRoutes.get(
  "/detailed/export/pdf",
  asyncHandler(async (req, res) => {
    const rows = await financialService.detailedReport(req.query, scopedWhere(req));
    const totals = rows.reduce(
      (acc, row) => ({
        revenue: acc.revenue + row.revenue,
        expenses: acc.expenses + row.expenses,
        purchases: acc.purchases + row.purchases,
        taxes: acc.taxes + row.taxes,
      }),
      { revenue: 0, expenses: 0, purchases: 0, taxes: 0 },
    );
    const doc = new PDFDocument({ margin: 48 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=detailed-report.pdf");
    doc.pipe(res);
    doc.fontSize(18).text("Detailed Day-wise Report");
    doc.moveDown();
    doc.fontSize(10).text(`From: ${req.query.from || ""}    To: ${req.query.to || ""}`);
    doc.moveDown();
    let y = doc.y;
    doc.fontSize(10).text("Date", 48, y);
    doc.text("Revenue", 140, y);
    doc.text("Expenses", 230, y);
    doc.text("Purchases", 320, y);
    doc.text("Taxes", 410, y);
    doc.text("Net", 500, y);
    y += 16;
    for (const row of rows) {
      doc.text(row.date, 48, y);
      doc.text(String(row.revenue), 140, y);
      doc.text(String(row.expenses), 230, y);
      doc.text(String(row.purchases), 320, y);
      doc.text(String(row.taxes), 410, y);
      doc.text(String(row.revenue - row.expenses - row.purchases - row.taxes), 500, y);
      y += 14;
    }
    doc.font("Helvetica-Bold");
    doc.text("Total", 48, y);
    doc.text(String(totals.revenue), 140, y);
    doc.text(String(totals.expenses), 230, y);
    doc.text(String(totals.purchases), 320, y);
    doc.text(String(totals.taxes), 410, y);
    doc.text(String(totals.revenue - totals.expenses - totals.purchases - totals.taxes), 500, y);
    doc.end();
  }),
);

reportRoutes.get(
  "/detailed/export/excel",
  asyncHandler(async (req, res) => {
    const rows = await financialService.detailedReport(req.query, scopedWhere(req));
    const totals = rows.reduce(
      (acc, row) => ({
        revenue: acc.revenue + row.revenue,
        expenses: acc.expenses + row.expenses,
        purchases: acc.purchases + row.purchases,
        taxes: acc.taxes + row.taxes,
      }),
      { revenue: 0, expenses: 0, purchases: 0, taxes: 0 },
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Detailed Report");
    sheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Revenue", key: "revenue", width: 14 },
      { header: "Expenses", key: "expenses", width: 14 },
      { header: "Purchases", key: "purchases", width: 14 },
      { header: "Taxes", key: "taxes", width: 14 },
      { header: "Net", key: "net", width: 14 },
    ];
    for (const row of rows) {
      sheet.addRow({
        date: row.date,
        revenue: row.revenue,
        expenses: row.expenses,
        purchases: row.purchases,
        taxes: row.taxes,
        net: row.revenue - row.expenses - row.purchases - row.taxes,
      });
    }
    sheet.addRow({
      date: "Total",
      revenue: totals.revenue,
      expenses: totals.expenses,
      purchases: totals.purchases,
      taxes: totals.taxes,
      net: totals.revenue - totals.expenses - totals.purchases - totals.taxes,
    }).font = { bold: true };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=detailed-report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  }),
);

reportRoutes.get(
  "/companies",
  authorize("PLATFORM_ADMIN"),
  asyncHandler(async (req, res) => {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stores: true, users: true } } },
    });
    const range = getReportRange(req.query.period as string, req.query.date as string);
    const rows = await Promise.all(
      companies.map(async (company) => ({
        ...company,
        summary: await financialService.report(req.query.period as string, req.query.date as string, { companyId: company.id }),
      })),
    );
    res.json({ period: req.query.period || "daily", from: range.from, to: range.to, companies: rows });
  }),
);

reportRoutes.get("/export/pdf", asyncHandler(async (req, res) => {
  const report = await financialService.report(req.query.period as string, req.query.date as string, scopedWhere(req));
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
  const report = await financialService.report(req.query.period as string, req.query.date as string, scopedWhere(req));
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Financial Report");
  sheet.columns = [{ header: "Metric", key: "metric", width: 24 }, { header: "Amount", key: "amount", width: 16 }];
  Object.entries(report).forEach(([metric, amount]) => sheet.addRow({ metric, amount }));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=financial-report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
}));
