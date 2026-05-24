import { Document } from "mongoose"

export interface IInvoice extends Document {
    
    //! ข้อมูลพื้นฐานของใบแจ้งหนี้
    invoiceNumber: string; // หมายเลขใบแจ้งหนี้
    invoiceDate: Date; // วันที่ออกใบแจ้งหนี้
    customerName: string; // ชื่อลูกค้า
    customerTaxId: string;
    customerAddress: string;
    sellerName: string; // ชื่อผู้ขาย

    //! ข้อมูลรายละเอียดของใบแจ้งหนี้
    totalAmount: number; // ยอดรวม (ฐาน + VAT)

    isPaymentTerm: boolean; // แบ่งชำระเป็นงวดหรือไม่
    paymentTermDetails?: {
        percentage: number; // เปอร์เซ็นต์ของยอดชำระสุทธิ
    }[]

    //! ภาษี
    taxAmount?: number; // จำนวนเงินภาษีที่ต้องชำระ
    withholderTaxAmount?: number; // จำนวนเงินภาษีหักณ ที่จ่าย

    //! ยอดชำระ (จำนวนเงินรวมทั้งสิน - (จำนวนเงินรวมทั้งสิน * ภาษี))
    amountDue: number;
    details: {
        description: string;
        quantity: number;
        quantityUnit: string;
        price: number;
        totalPrice: number;
    }[];
    remarks?: string; // หมายเหตุ (ถ้ามี)
}