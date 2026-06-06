"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceiptPDF = generateReceiptPDF;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const mustache_1 = __importDefault(require("mustache"));
const common_1 = require("../../common");
async function generateReceiptPDF(receipt) {
    // สร้าง PDF โดยใช้ข้อมูลจาก receipt
    const data = buildDataFromReceiptData(receipt);
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    await page.setContent(data.html);
    const pdfData = await page.pdf({ printBackground: true });
    await browser.close();
    return Buffer.from(pdfData);
}
function buildDataFromReceiptData(receipt) {
    const templatePath = path_1.default.join(__dirname, './template/template-receipt.html');
    const template = fs_1.default.readFileSync(templatePath, 'utf-8');
    const items = receipt.details.map((detail, index) => ({
        no: index + 1,
        description: detail.description,
        quantity: detail.quantity,
        quantityUnit: detail.quantityUnit,
        price: detail.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalPrice: detail.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    }));
    const subtotal = receipt.details.reduce((sum, detail) => sum + detail.totalPrice, 0);
    const taxAmount = receipt.taxAmount || 0;
    const withholdingTaxAmount = receipt.withholderTaxAmount || 0;
    const totalAmount = receipt.totalAmount; // ยอดสุดท้ายที่รับเงิน
    const receiptData = {
        logo: '', // สามารถเพิ่มโลโก้ได้
        receiptNumber: receipt.receiptNumber,
        receiptDate: (0, moment_1.default)(receipt.receiptDate).format('DD/MM/YYYY'),
        customerName: receipt.customerName,
        customerAddress: receipt.customerAddress,
        customerTaxId: receipt.customerTaxId,
        sellerName: receipt.sellerName,
        items,
        subtotal: subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vat: taxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withholdingTax: withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAmount: totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAmountInWords: (0, common_1.numberToThaiText)(totalAmount),
        paymentMethod: receipt.paymentMethod || '',
        referenceNumber: receipt.referenceNumber || '',
        remark: receipt.remarks || '',
    };
    const html = mustache_1.default.render(template, { pages: [receiptData] });
    return { html };
}
//# sourceMappingURL=generate-pdf-receipt.js.map