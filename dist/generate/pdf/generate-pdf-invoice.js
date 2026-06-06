"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = generateInvoicePDF;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const mustache_1 = __importDefault(require("mustache"));
const common_1 = require("../../common");
async function generateInvoicePDF(invoice) {
    // สร้าง PDF โดยใช้ข้อมูลจาก invoice
    const data = buildDataFromInvoiceData(invoice);
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    // สร้าง HTML ทั้ง 2 หน้า (ต้นฉบับ/สำเนา) พร้อมกัน
    let fullHTML = '';
    fullHTML += renderInvoiceHTML(data);
    // for (let i = 0; i < data.length; i++) {
    //     fullHTML += renderInvoiceHTML(data[i]!)
    // }
    await page.setContent(fullHTML);
    const pdfData = await page.pdf({ printBackground: true });
    await browser.close();
    return Buffer.from(pdfData);
}
function buildDataFromInvoiceData(invoice) {
    // Helper function to convert logo to base64 data URL
    const getLogoAsDataUrl = () => {
        try {
            // อ่าน logo จากหลาย path เป็นความพยายาม
            const possiblePaths = [
                // Development (source)
                path_1.default.join(__dirname, 'images', 'YIZU_LOGO.jpg'),
                // Production (dist)
                path_1.default.join(__dirname, '..', 'images', 'YIZU_LOGO.jpg'),
                // From tc-customer-pack source
                path_1.default.join(__dirname, '../../../images/YIZU_LOGO.jpg'),
            ];
            let imageBuffer = null;
            for (const logoPath of possiblePaths) {
                try {
                    imageBuffer = fs_1.default.readFileSync(logoPath);
                    break;
                }
                catch (e) {
                    // Continue to next path
                }
            }
            if (!imageBuffer) {
                console.warn('Logo file not found in any of the expected paths');
                return '';
            }
            const base64 = imageBuffer.toString('base64');
            return `data:image/jpeg;base64,${base64}`;
        }
        catch (error) {
            console.error('Error reading logo:', error);
            return '';
        }
    };
    const items = invoice.details.map((detail, index) => ({
        no: index + 1,
        description: detail.description,
        quantity: detail.quantity,
        quantityUnit: detail.quantityUnit,
        price: currencySymbol(detail.price),
        totalPrice: currencySymbol(detail.totalPrice)
    }));
    // คำนวณฐาน = totalAmount - VAT (เพราะ totalAmount แล้วรวม VAT)
    const vat = invoice.taxAmount || 0;
    const baseAmount = invoice.totalAmount - vat;
    const paymentTermDetails = invoice.paymentTermDetails ? invoice.paymentTermDetails.map((term, index) => ({
        no: index + 1,
        percentage: term.percentage,
        amount: currencySymbol((invoice.amountDue * term.percentage) / 100)
    })) : [];
    const totalPrice = baseAmount; // รวมเป็นเงิน = ฐาน (ก่อน VAT)
    const netTotalPrice = invoice.totalAmount; // รวมทั้งสิ้น = ฐาน + VAT = totalAmount
    const withholdingTax = invoice.withholderTaxAmount || 0;
    const totalAmount = invoice.amountDue;
    const netTotalPriceInWords = (0, common_1.numberToThaiText)(totalAmount);
    const remark = invoice.remarks || '';
    const invoiceTypeOptions = ['ต้นฉบับ', 'สำเนา'];
    const result = invoiceTypeOptions.map((f, index) => ({
        logo: getLogoAsDataUrl(),
        invoiceType: f,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: (0, moment_1.default)(invoice.invoiceDate).format('DD/MM/YYYY'),
        // reference: invoice.reference || '',
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerTaxId: invoice.customerTaxId,
        sellerName: invoice.sellerName,
        items,
        totalPrice: currencySymbol(totalPrice),
        vat: currencySymbol(vat),
        netTotalPrice: currencySymbol(netTotalPrice),
        netTotalPriceInWords,
        withholdingTax: currencySymbol(withholdingTax),
        totalAmount: currencySymbol(totalAmount),
        remark,
        isPaymentTerm: invoice.isPaymentTerm,
        paymentTermDetails: paymentTermDetails,
        // needsPageBreak: index < invoiceTypeOptions.length - 1 // Add page break for all except last
    }));
    return result;
}
function renderInvoiceHTML(data) {
    const templatePath = path_1.default.join(__dirname, 'template', 'template-invoice.html');
    const template = fs_1.default.readFileSync(templatePath, 'utf-8');
    let html = mustache_1.default.render(template, { pages: data });
    // Add page break BEFORE invoice if flag is set (for all except first page)
    // if (data.needsPageBreak) {
    //     html = '<div style="page-break-before: always;"></div>' + html
    // }
    return html;
}
function formatCurrency(amount, digits = 2) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function currencySymbol(amount, symbol = 'บาท') {
    return `${formatCurrency(amount)} ${symbol}`;
}
//# sourceMappingURL=generate-pdf-invoice.js.map