import puppeteer from "puppeteer"
import { IInvoice } from "../../types/invoice"
import fs from "fs"
import path from "path"
import moment from "moment"
import Mustache from "mustache"
import { numberToThaiText } from "../../common"

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

    // Helper function to convert logo to base64 data URL
    const getLogoAsDataUrl = (): string => {
        try {
            // อ่าน logo จากหลาย path เป็นความพยายาม
            const possiblePaths = [
                // Development (source)
                path.join(__dirname, 'images', 'YIZU_LOGO.jpg'),
                // Production (dist)
                path.join(__dirname, '..', 'images', 'YIZU_LOGO.jpg'),
                // From tc-customer-pack source
                path.join(__dirname, '../../../images/YIZU_LOGO.jpg'),
            ]

            let imageBuffer: Buffer | null = null
            for (const logoPath of possiblePaths) {
                try {
                    imageBuffer = fs.readFileSync(logoPath)
                    break
                } catch (e) {
                    // Continue to next path
                }
            }

            if (!imageBuffer) {
                console.warn('Logo file not found in any of the expected paths')
                return ''
            }

            const base64 = imageBuffer.toString('base64')
            return `data:image/jpeg;base64,${base64}`
        } catch (error) {
            console.error('Error reading logo:', error)
            return ''
        }
    }

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
    const netTotalPriceInWords = numberToThaiText(totalAmount)
    const remark = invoice.remarks || ''

    const invoiceTypeOptions: string[] = ['ต้นฉบับ', 'สำเนา']

    const result: TGenerateInvoicePDF[] = invoiceTypeOptions.map((f, index) => ({
        logo: getLogoAsDataUrl(),
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

function formatCurrency(amount: number, digits: number = 2): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function currencySymbol(amount: number, symbol: string = 'บาท'): string {
    return `${formatCurrency(amount)} ${symbol}`
}

export { generateInvoicePDF }