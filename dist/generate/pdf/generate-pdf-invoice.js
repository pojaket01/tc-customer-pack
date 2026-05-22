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
    // ตัวอย่างการใช้ puppeteer
    // ในที่นี้จะเป็นเพียงตัวอย่างโครงสร้างเท่านั้น
    // โครงสร้าง Mustache
    /**
     * {
     *  forWho: string; // ใบแจ้งหนี้สำหรับใคร ex ต้นฉบับ/สำเนา
     *  items: {
     *      no: number; // ลำดับ
     *      description: string; // รายละเอียดสินค้า/บริการ
     *      quantity: number; // จำนวน
     *      quantityUnit: string; // หน่วยนับ
     *      price: number; // ราคาต่อหน่วย
     *      totalPrice: number; // ราคารวม (quantity * price)
     * },
     * totalPrice: number; // ราคารวมทั้งสิน
     * vat: number; // ภาษีมูลค่าเพิ่ม
     * netTotalPrice: number; // ราคารวมทั้งสิน + ภาษี
     * netTotalPriceInWords: string; // ราคารวมทั้งสินเป็นตัวอักษร ex "หนึ่งพันบาทถ้วน"
     * withholdingTax: number; // ภาษีหัก ณ ที่จ่าย
     * remark: string; // หมายเหตุ
     * }
     */
    const data = buildDataFromInvoiceData(invoice);
    const browser = await puppeteer_1.default.launch();
    // สร้าง PDF 2 หน้าตามจำนวน forWho (ต้นฉบับ/สำเนา)
    const pdfBuffers = [];
    for (const d of data) {
        const page = await browser.newPage();
        // สร้าง HTML จาก Mustache template และ data
        const renderedHTML = renderInvoiceHTML(d);
        await page.setContent(renderedHTML);
        const pdfBuffer = await page.pdf();
        pdfBuffers.push(Buffer.from(pdfBuffer));
    }
    await browser.close();
    const timestamp = (0, moment_1.default)().format('DDMMYYYYHHmmss');
    const filePath = path_1.default.join('E:/Storage/Invoice', `${timestamp}.pdf`);
    // เช็คว่าโฟลเดอร์ E:/Storage/Invoice มีอยู่หรือไม่ ถ้าไม่มีให้สร้างขึ้นมา
    if (!fs_1.default.existsSync('E:/Storage/Invoice')) {
        fs_1.default.mkdirSync('E:/Storage/Invoice', { recursive: true });
    }
    fs_1.default.writeFileSync(filePath, Buffer.concat(pdfBuffers));
    return filePath;
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
    const forWhoOptions = ['ต้นฉบับ', 'สำเนา'];
    const result = forWhoOptions.map(f => ({
        forWho: f,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: (0, moment_1.default)(invoice.invoiceDate).format('DD/MM/YYYY'),
        reference: invoice.reference || '',
        customerName: invoice.customerName,
        sellerName: invoice.sellerName,
        items,
        totalPrice,
        vat,
        netTotalPrice,
        netTotalPriceInWords,
        withholdingTax,
        remark
    }));
    return result;
}
function renderInvoiceHTML(data) {
    // ลองหา template ในตำแหน่งต่างๆ
    const possiblePaths = [
        // สำหรับเมื่อ run จากไฟล์ TypeScript
        path_1.default.join(__dirname, 'template', 'template-invoice.html'),
        // สำหรับเมื่อ build เป็น JavaScript ใน dist
        path_1.default.join(__dirname, '..', '..', 'template', 'template-invoice.html'),
        // สำหรับเมื่อ install เป็น package ใน node_modules
        path_1.default.resolve(__dirname, '../../..', 'template/pdf/template-invoice.html'),
    ];
    let template = '';
    for (const templatePath of possiblePaths) {
        try {
            if (fs_1.default.existsSync(templatePath)) {
                template = fs_1.default.readFileSync(templatePath, 'utf-8');
                break;
            }
        }
        catch (err) {
            continue;
        }
    }
    if (!template) {
        throw new Error(`Template file not found. Tried: ${possiblePaths.join(', ')}`);
    }
    return mustache_1.default.render(template, data);
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