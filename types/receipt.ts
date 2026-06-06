import { Document } from "mongoose"

export interface IReceipt extends Document {
    
    //! ข้อมูลพื้นฐานของใบเสร็จรับเงิน
    receiptNumber: string; // หมายเลขใบเสร็จรับเงิน
    receiptDate: Date; // วันที่ออกใบเสร็จรับเงิน
    customerName: string; // ชื่อลูกค้า
    customerTaxId: string;
    customerAddress: string;
    sellerName: string; // ชื่อผู้ขาย

    //! ข้อมูลรายละเอียดของใบเสร็จรับเงิน
    totalAmount: number; // ยอดรวม (ฐาน + VAT)

    //! ภาษี
    taxAmount?: number; // จำนวนเงินภาษีที่ต้องชำระ
    withholderTaxAmount?: number; // จำนวนเงินภาษีหักณ ที่จ่าย

    //! ยอดชำระ
    amountDue: number;
    details: {
        description: string;
        quantity: number;
        quantityUnit: string;
        price: number;
        totalPrice: number;
    }[];
    remarks?: string; // หมายเหตุ (ถ้ามี)
    paymentMethod?: string; // วิธีการชำระเงิน (เงินสด/เชค/โอนเงิน เป็นต้น)
    referenceNumber?: string; // เลขอ้างอิง (เช่น เลขใบแจ้งหนี้)
}
