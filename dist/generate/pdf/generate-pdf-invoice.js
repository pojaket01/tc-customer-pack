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
    const items = invoice.details.map((detail, index) => ({
        no: index + 1,
        description: detail.description,
        quantity: detail.quantity,
        quantityUnit: detail.quantityUnit,
        price: detail.price,
        totalPrice: detail.totalPrice
    }));
    const totalPrice = invoice.totalAmount;
    const vat = invoice.taxAmount || 0;
    const netTotalPrice = totalPrice + vat;
    const netTotalPriceInWords = convertNumberToThaiWords(netTotalPrice);
    const withholdingTax = invoice.isPaymentTerm ? (invoice.paymentTermsAmount || 0) * (invoice.paymentTermsPercentage || 0) / 100 : 0;
    const remark = invoice.remarks || '';
    const invoiceTypeOptions = ['ต้นฉบับ', 'สำเนา'];
    const result = invoiceTypeOptions.map((f, index) => ({
        logo: __dirname + '/images/YIZU_LOGO.jpg', // ใส่ path หรือ URL ของโลโก้บริษัท
        invoiceType: f,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: (0, moment_1.default)(invoice.invoiceDate).format('DD/MM/YYYY'),
        // reference: invoice.reference || '',
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerTaxId: invoice.customerTaxId,
        sellerName: invoice.sellerName,
        items,
        totalPrice,
        vat,
        netTotalPrice,
        netTotalPriceInWords,
        withholdingTax,
        remark,
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
function convertNumberToThaiWords(num) {
    // ฟังก์ชันนี้จะทำการแปลงตัวเลขเป็นคำภาษาไทย
    // ตัวอย่างเช่น 1000 จะถูกแปลงเป็น "หนึ่งพันบาทถ้วน"
    const thaiDigits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const thaiTens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
    if (num === 0)
        return 'ศูนย์บาทถ้วน';
    let result = '';
    let million = Math.floor(num / 1000000);
    let hundred_thousand = Math.floor((num % 1000000) / 100000);
    let ten_thousand = Math.floor((num % 100000) / 10000);
    let thousand = Math.floor((num % 10000) / 1000);
    let hundred = Math.floor((num % 1000) / 100);
    let ten = Math.floor((num % 100) / 10);
    let digit = Math.floor(num % 10);
    // ล้าน (millions)
    if (million > 0) {
        if (million === 1) {
            result += 'หนึ่งล้าน';
        }
        else {
            result += thaiDigits[million] + 'ล้าน';
        }
    }
    // แสน (hundred thousands)
    if (hundred_thousand > 0) {
        if (hundred_thousand === 1) {
            result += 'หนึ่งแสน';
        }
        else {
            result += thaiDigits[hundred_thousand] + 'แสน';
        }
    }
    // หมื่น (ten thousands)
    if (ten_thousand > 0) {
        if (ten_thousand === 1) {
            result += 'หนึ่งหมื่น';
        }
        else {
            result += thaiDigits[ten_thousand] + 'หมื่น';
        }
    }
    // พัน (thousands)
    if (thousand > 0) {
        if (thousand === 1) {
            result += 'หนึ่งพัน';
        }
        else {
            result += thaiDigits[thousand] + 'พัน';
        }
    }
    // ร้อย (hundreds)
    if (hundred > 0) {
        if (hundred === 1) {
            result += 'หนึ่งร้อย';
        }
        else {
            result += thaiDigits[hundred] + 'ร้อย';
        }
    }
    // สิบและหน่วย (tens and ones)
    if (ten > 0) {
        if (ten === 1) {
            result += 'สิบ';
            if (digit === 1) {
                result += 'เอ็ด';
            }
            else if (digit > 0) {
                result += thaiDigits[digit];
            }
        }
        else {
            result += thaiTens[ten];
            if (digit === 1) {
                result += 'เอ็ด';
            }
            else if (digit > 0) {
                result += thaiDigits[digit];
            }
        }
    }
    else if (digit > 0) {
        result += thaiDigits[digit];
    }
    return result + 'บาทถ้วน';
}
//# sourceMappingURL=generate-pdf-invoice.js.map