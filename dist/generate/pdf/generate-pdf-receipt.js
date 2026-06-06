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
async function generateReceiptPDF(receipt) {
    // สร้าง PDF โดยใช้ข้อมูลจาก receipt
    const data = buildDataFromReceiptData(receipt);
    const browser = await puppeteer_1.default.launch();
    try {
        const page = await browser.newPage();
        await page.setContent(data.html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4' });
        return pdf;
    }
    finally {
        await browser.close();
    }
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
    const totalAmount = receipt.totalAmount;
    const receiptData = {
        logo: '', // สามารถเพิ่มโลโก้ได้
        receiptNumber: receipt.receiptNumber,
        receiptDate: (0, moment_1.default)(receipt.receiptDate).format('DD/MM/YYYY'),
        customerName: receipt.customerName,
        customerAddress: receipt.customerAddress,
        customerTaxId: receipt.customerTaxId,
        sellerName: receipt.sellerName,
        items,
        totalPrice: subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vat: taxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netTotalPrice: (subtotal + taxAmount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netTotalPriceInWords: numberToThaiText(subtotal + taxAmount),
        withholdingTax: withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAmount: totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        paymentMethod: receipt.paymentMethod || '',
        referenceNumber: receipt.referenceNumber || '',
        remark: receipt.remarks || '',
    };
    const html = mustache_1.default.render(template, { pages: [receiptData] });
    return { html };
}
function numberToThaiText(num) {
    // Helper function to convert number to Thai text
    // This is a simplified version - you may want to use a library for more complex cases
    const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const tens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
    const scales = ['', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    if (num === 0)
        return 'ศูนย์บาท';
    let result = '';
    let scaleIndex = 0;
    const numStr = Math.floor(num).toString().padStart(6, '0');
    for (let i = 0; i < numStr.length; i += 3) {
        const group = parseInt(numStr.substring(i, i + 3));
        if (group !== 0) {
            const hundred = Math.floor(group / 100);
            const ten = Math.floor((group % 100) / 10);
            const unit = group % 10;
            if (hundred > 0) {
                result += units[hundred] + 'ร้อย';
            }
            if (ten > 0) {
                result += tens[ten];
            }
            if (unit > 0) {
                if (ten === 0 && unit === 1) {
                    result += 'หนึ่ง';
                }
                else {
                    result += units[unit];
                }
            }
            if (scaleIndex > 0) {
                result += scales[3 - scaleIndex];
            }
        }
        scaleIndex++;
    }
    // Handle decimal part (satang)
    const decimalPart = Math.round((num % 1) * 100);
    if (decimalPart > 0) {
        result += 'บาท' + numberToThaiText(decimalPart) + 'สตางค์';
    }
    else {
        result += 'บาทถ้วน';
    }
    return result;
}
//# sourceMappingURL=generate-pdf-receipt.js.map