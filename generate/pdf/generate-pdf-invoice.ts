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
    price: string // ราคาต่อหน่วย
    totalPrice: string // ราคารวม (quantity * price)
}

type PaymentTermDetail = {
    no: number
    percentage: number // เปอร์เซ็นต์ของยอดชำระสุทธิ
    amount: string // จำนวนเงินที่คำนวณจากเปอร์เซ็นต์
}

type TGenerateInvoicePDF = {
    logo: string // URL หรือ path ของโลโก้บริษัท
    invoiceType: string // ใบแจ้งหนี้สำหรับใคร ex ต้นฉบับ/สำเนา
    invoiceNumber: string // เลขที่ใบแจ้งหนี้
    invoiceDate: string // วันที่ออกใบแจ้งหนี้
    // reference: string // อ้างอิง (ถ้ามี)
    customerName: string // ชื่อลูกค้า
    customerAddress: string // ที่อยู่ลูกค้า
    customerTaxId: string // เลขประจำตัวผู้เสียภาษีลูกค้า
    sellerName: string // ชื่อผู้ขาย
    items: Items[],
    isPaymentTerm: boolean // แบ่งชำระเป็นงวดหรือไม่
    paymentTermDetails: PaymentTermDetail[]
    totalPrice: string // ราคารวมทั้งสิน
    vat: string // ภาษีมูลค่าเพิ่ม
    netTotalPrice: string // ราคารวมทั้งสิน + ภาษี
    netTotalPriceInWords: string // ราคารวมทั้งสินเป็นตัวอักษร ex "หนึ่งพันบาทถ้วน"
    withholdingTax: string // ภาษีหัก ณ ที่จ่าย
    totalAmount: string // ยอดชำระ (ราคารวมทั้งสิน + ภาษี - ภาษีหัก ณ ที่จ่าย)
    remark: string // หมายเหตุ
    needsPageBreak?: boolean // Flag to add page break after this invoice
}

async function generateInvoicePDF(invoice: IInvoice): Promise<Buffer> {
    // สร้าง PDF โดยใช้ข้อมูลจาก invoice
    const data = buildDataFromInvoiceData(invoice)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // สร้าง HTML ทั้ง 2 หน้า (ต้นฉบับ/สำเนา) พร้อมกัน
    let fullHTML = ''

    fullHTML += renderInvoiceHTML(data)
    // for (let i = 0; i < data.length; i++) {
    //     fullHTML += renderInvoiceHTML(data[i]!)
    // }

    await page.setContent(fullHTML)
    const pdfData = await page.pdf({ printBackground: true })
    await browser.close()

    return Buffer.from(pdfData)
}

function buildDataFromInvoiceData(invoice: IInvoice): TGenerateInvoicePDF[] {

    const items: Items[] = invoice.details.map((detail, index) => ({
        no: index + 1,
        description: detail.description,
        quantity: detail.quantity,
        quantityUnit: detail.quantityUnit,
        price: currencySymbol(detail.price),
        totalPrice: currencySymbol(detail.totalPrice)
    }))

    // คำนวณฐาน = totalAmount - VAT (เพราะ totalAmount แล้วรวม VAT)
    const vat = invoice.taxAmount || 0
    const baseAmount = invoice.totalAmount - vat
    
    const paymentTermDetails: PaymentTermDetail[] = invoice.paymentTermDetails ? invoice.paymentTermDetails.map((term, index) => ({
        no: index + 1,
        percentage: term.percentage,
        amount: currencySymbol((invoice.amountDue * term.percentage) / 100)
    })) : []

    const totalPrice = baseAmount  // รวมเป็นเงิน = ฐาน (ก่อน VAT)
    const netTotalPrice = invoice.totalAmount  // รวมทั้งสิ้น = ฐาน + VAT = totalAmount
    const withholdingTax = invoice.withholderTaxAmount || 0
    const totalAmount = invoice.amountDue
    const netTotalPriceInWords = convertNumberToThaiWords(totalAmount)
    const remark = invoice.remarks || ''

    const invoiceTypeOptions: string[] = ['ต้นฉบับ', 'สำเนา']

    const result: TGenerateInvoicePDF[] = invoiceTypeOptions.map((f, index) => ({
        logo: __dirname + '/images/YIZU_LOGO.jpg', // ใส่ path หรือ URL ของโลโก้บริษัท
        invoiceType: f,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: moment(invoice.invoiceDate).format('DD/MM/YYYY'),
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
    }))

    return result
}

function renderInvoiceHTML(data: TGenerateInvoicePDF[]): string {
    const templatePath = path.join(__dirname, 'template', 'template-invoice.html')
    const template = fs.readFileSync(templatePath, 'utf-8')

    let html = Mustache.render(template, { pages: data })

    // Add page break BEFORE invoice if flag is set (for all except first page)
    // if (data.needsPageBreak) {
    //     html = '<div style="page-break-before: always;"></div>' + html
    // }

    return html
}

function convertNumberToThaiWords(num: number): string {
    // ฟังก์ชันนี้จะทำการแปลงตัวเลขเป็นคำภาษาไทย
    // ตัวอย่างเช่น 1000 จะถูกแปลงเป็น "หนึ่งพันบาทถ้วน"
    // 1000.50 จะถูกแปลงเป็น "หนึ่งพันบาทห้าสิบสตางค์"

    const thaiDigits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    const thaiTens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ']

    // แยกส่วนจำนวนเต็มและทศนิยม
    const baht = Math.floor(num)
    const satang = Math.round((num - baht) * 100)

    function convertToThaiWords(n: number): string {
        if (n === 0) return ''

        let result = ''
        let million = Math.floor(n / 1000000)
        let hundred_thousand = Math.floor((n % 1000000) / 100000)
        let ten_thousand = Math.floor((n % 100000) / 10000)
        let thousand = Math.floor((n % 10000) / 1000)
        let hundred = Math.floor((n % 1000) / 100)
        let ten = Math.floor((n % 100) / 10)
        let digit = Math.floor(n % 10)

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

        return result
    }

    // สร้างข้อความสำหรับบาท
    let result = convertToThaiWords(baht) + 'บาท'

    // สร้างข้อความสำหรับสตางค์
    if (satang > 0) {
        result += convertToThaiWords(satang) + 'สตางค์'
    } else {
        result += 'ถ้วน'
    }

    return result
}

function formatCurrency(amount: number, digits: number = 2): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function currencySymbol(amount: number, symbol: string = 'บาท'): string {
    return `${formatCurrency(amount)} ${symbol}`
}

export { generateInvoicePDF }