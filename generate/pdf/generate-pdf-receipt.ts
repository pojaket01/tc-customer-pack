import puppeteer from "puppeteer"
import { IReceipt } from "../../types/receipt"
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

type TGenerateReceiptPDF = {
    logo: string // URL หรือ path ของโลโก้บริษัท
    receiptNumber: string // เลขที่ใบเสร็จรับเงิน
    receiptDate: string // วันที่ออกใบเสร็จรับเงิน
    customerName: string // ชื่อผู้รับเงิน
    customerAddress: string // ที่อยู่ผู้รับเงิน
    customerTaxId: string // เลขประจำตัวผู้เสียภาษี
    sellerName: string // ชื่อผู้บันทึก
    items: Items[],
    subtotal: string // ยอดรวมของรายการ
    vat: string // ภาษีมูลค่าเพิ่ม
    withholdingTax: string // ภาษีหัก ณ ที่จ่าย
    totalAmount: string // ยอดรับเงินสุดท้าย (ยอดสิ่งที่รับเงิน)
    totalAmountInWords: string // ยอดรับเงินเป็นตัวอักษร
    paymentMethod: string // วิธีการชำระเงิน
    referenceNumber: string // เลขอ้างอิง
    remark: string // หมายเหตุ
}

async function generateReceiptPDF(receipt: IReceipt): Promise<Buffer> {
    // สร้าง PDF โดยใช้ข้อมูลจาก receipt
    const data = buildDataFromReceiptData(receipt)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    
    await page.setContent(data.html)
    const pdfData = await page.pdf({ printBackground: true })
    await browser.close()

    return Buffer.from(pdfData)
}

function buildDataFromReceiptData(receipt: IReceipt): { html: string } {
    const templatePath = path.join(__dirname, './template/template-receipt.html')
    const template = fs.readFileSync(templatePath, 'utf-8')

    const items: Items[] = receipt.details.map((detail, index) => ({
        no: index + 1,
        description: detail.description,
        quantity: detail.quantity,
        quantityUnit: detail.quantityUnit,
        price: detail.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalPrice: detail.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    }))

    const subtotal = receipt.details.reduce((sum, detail) => sum + detail.totalPrice, 0)
    const taxAmount = receipt.taxAmount || 0
    const withholdingTaxAmount = receipt.withholderTaxAmount || 0
    const totalAmount = receipt.totalAmount // ยอดสุดท้ายที่รับเงิน

    const receiptData: TGenerateReceiptPDF = {
        logo: '', // สามารถเพิ่มโลโก้ได้
        receiptNumber: receipt.receiptNumber,
        receiptDate: moment(receipt.receiptDate).format('DD/MM/YYYY'),
        customerName: receipt.customerName,
        customerAddress: receipt.customerAddress,
        customerTaxId: receipt.customerTaxId,
        sellerName: receipt.sellerName,
        items,
        subtotal: subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vat: taxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        withholdingTax: withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAmount: totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAmountInWords: numberToThaiText(totalAmount),
        paymentMethod: receipt.paymentMethod || '',
        referenceNumber: receipt.referenceNumber || '',
        remark: receipt.remarks || '',
    }

    const html = Mustache.render(template, { pages: [receiptData] })
    return { html }
}



export { generateReceiptPDF, type TGenerateReceiptPDF }
