import puppeteer from "puppeteer"
import { IInvoice } from "../../types/invoice"
import fs from "fs"
import path from "path"
import moment from "moment"
import Mustache from "mustache"

type Items = {
    no: number // ลำดับ
    description: string // รายละเอียดสินค้า/บริการ
    quantity: number // จำนวน
    quantityUnit: string // หน่วยนับ
    price: number // ราคาต่อหน่วย
    totalPrice: number // ราคารวม (quantity * price)
}

type TGenerateInvoicePDF = {
    forWho: string // ใบแจ้งหนี้สำหรับใคร ex ต้นฉบับ/สำเนา
    invoiceNumber: string // เลขที่ใบแจ้งหนี้
    invoiceDate: string // วันที่ออกใบแจ้งหนี้
    reference: string // อ้างอิง (ถ้ามี)
    customerName: string // ชื่อลูกค้า
    sellerName: string // ชื่อผู้ขาย
    items: Items[],
    totalPrice: number // ราคารวมทั้งสิน
    vat: number // ภาษีมูลค่าเพิ่ม
    netTotalPrice: number // ราคารวมทั้งสิน + ภาษี
    netTotalPriceInWords: string // ราคารวมทั้งสินเป็นตัวอักษร ex "หนึ่งพันบาทถ้วน"
    withholdingTax: number // ภาษีหัก ณ ที่จ่าย
    remark: string // หมายเหตุ
}

async function generateInvoicePDF(invoice: IInvoice): Promise<Buffer> {
    // สร้าง PDF โดยใช้ข้อมูลจาก invoice
    const data = buildDataFromInvoiceData(invoice)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // สร้าง HTML ทั้ง 2 หน้า (ต้นฉบับ/สำเนา) พร้อมกัน
    let fullHTML = ''
    for (let i = 0; i < data.length; i++) {
        fullHTML += renderInvoiceHTML(data[i]!)
        // เพิ่ม page break ระหว่างหน้า ยกเว้นหน้าสุดท้าย
        if (i < data.length - 1) {
            fullHTML += '<div style="page-break-after: always;"></div>'
        }
    }

    await page.setContent(fullHTML)
    const pdfData = await page.pdf()
    await browser.close()

    return Buffer.from(pdfData)
}

function buildDataFromInvoiceData(invoice: IInvoice): TGenerateInvoicePDF[] {

    const items: Items[] = invoice.details.map((detail, index) => ({
        no: index + 1,
        description: detail.description,
        quantity: detail.quantity,
        quantityUnit: detail.quantityUnit,
        price: detail.price,
        totalPrice: detail.totalPrice
    }))

    const totalPrice = invoice.totalAmount
    const vat = invoice.taxAmount || 0
    const netTotalPrice = totalPrice + vat
    const netTotalPriceInWords = convertNumberToThaiWords(netTotalPrice)
    const withholdingTax = invoice.isPaymentTerm ? (invoice.paymentTermsAmount || 0) * (invoice.paymentTermsPercentage || 0) / 100 : 0
    const remark = invoice.remarks || ''

    const forWhoOptions: string[] = ['ต้นฉบับ', 'สำเนา']

    const result: TGenerateInvoicePDF[] = forWhoOptions.map(f => ({
        forWho: f,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: moment(invoice.invoiceDate).format('DD/MM/YYYY'),
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
    }))

    return result
}

function renderInvoiceHTML(data: TGenerateInvoicePDF): string {
    const templatePath = path.join(__dirname, 'template', 'template-invoice.html')
    const template = fs.readFileSync(templatePath, 'utf-8')

    return Mustache.render(template, data)
}

function convertNumberToThaiWords(num: number): string {
    // ฟังก์ชันนี้จะทำการแปลงตัวเลขเป็นคำภาษาไทย
    // ตัวอย่างเช่น 1000 จะถูกแปลงเป็น "หนึ่งพันบาทถ้วน"

    const thaiDigits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    const thaiTens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ']

    if (num === 0) return 'ศูนย์บาทถ้วน'

    let result = ''
    let million = Math.floor(num / 1000000)
    let hundred_thousand = Math.floor((num % 1000000) / 100000)
    let ten_thousand = Math.floor((num % 100000) / 10000)
    let thousand = Math.floor((num % 10000) / 1000)
    let hundred = Math.floor((num % 1000) / 100)
    let ten = Math.floor((num % 100) / 10)
    let digit = Math.floor(num % 10)

    // ล้าน (millions)
    if (million > 0) {
        if (million === 1) {
            result += 'หนึ่งล้าน'
        } else {
            result += thaiDigits[million] + 'ล้าน'
        }
    }

    // แสน (hundred thousands)
    if (hundred_thousand > 0) {
        if (hundred_thousand === 1) {
            result += 'หนึ่งแสน'
        } else {
            result += thaiDigits[hundred_thousand] + 'แสน'
        }
    }

    // หมื่น (ten thousands)
    if (ten_thousand > 0) {
        if (ten_thousand === 1) {
            result += 'หนึ่งหมื่น'
        } else {
            result += thaiDigits[ten_thousand] + 'หมื่น'
        }
    }

    // พัน (thousands)
    if (thousand > 0) {
        if (thousand === 1) {
            result += 'หนึ่งพัน'
        } else {
            result += thaiDigits[thousand] + 'พัน'
        }
    }

    // ร้อย (hundreds)
    if (hundred > 0) {
        if (hundred === 1) {
            result += 'หนึ่งร้อย'
        } else {
            result += thaiDigits[hundred] + 'ร้อย'
        }
    }

    // สิบและหน่วย (tens and ones)
    if (ten > 0) {
        if (ten === 1) {
            result += 'สิบ'
            if (digit === 1) {
                result += 'เอ็ด'
            } else if (digit > 0) {
                result += thaiDigits[digit]
            }
        } else {
            result += thaiTens[ten]
            if (digit === 1) {
                result += 'เอ็ด'
            } else if (digit > 0) {
                result += thaiDigits[digit]
            }
        }
    } else if (digit > 0) {
        result += thaiDigits[digit]
    }

    return result + 'บาทถ้วน'
}

export { generateInvoicePDF }