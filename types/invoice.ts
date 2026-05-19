import { Document } from "mongoose"

export interface IInvoice extends Document {
    
    //! ข้อมูลพื้นฐานของใบแจ้งหนี้
    invoiceNumber: string; // หมายเลขใบแจ้งหนี้
    invoiceDate: Date; // วันที่ออกใบแจ้งหนี้
    dueDate: Date; // วันที่ครบกำหนด
    customerName: string; // ชื่อลูกค้า
    sellerName: string; // ชื่อผู้ขาย
    reference?: string; // อ้างอิง (ถ้ามี)
    projectName?: string; // ชื่องาน หรือ โครงการ (ถ้ามี)



    //! ข้อมูลรายละเอียดของใบแจ้งหนี้
    discount?: number; // ส่วนลด (ถ้ามี)
    totalAmount: number; // ยอดชำระสุทธิ

    isPaymentTerm: boolean; // แบ่งชำระเป็นงวดหรือไม่
    paymentTermsAmount?: number; // จำนวนเงินที่ต้องชำระในแต่ละงวด (ถ้าแบ่งชำระเป็นงวด)
    paymentTermsPercentage?: number; // คิดเป็นกี่เปอร์เซ็นต์ของจำนวนเงินทั้งหมด (ถ้าแบ่งชำระเป็นงวด)

    //! หักภาษี ณ ที่จ่าย (ถ้ามี)
    taxPercentage?: number; // อัตราภาษี
    taxAmount?: number; // จำนวนเงินภาษีที่ต้องชำระ

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
    status: 'paid' | 'unpaid' | 'overdue';
}