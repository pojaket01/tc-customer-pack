import { Document } from "mongoose"

export interface IReceipt extends Document {
    
    //! ข้อมูลพื้นฐานของใบเสร็จรับเงิน
    receiptNumber: string; // หมายเลขใบเสร็จรับเงิน
    receiptDate: Date; // วันที่ออกใบเสร็จรับเงิน (วันที่รับเงิน)
    customerName: string; // ชื่อผู้รับเงิน (ไม่จำเป็นต้องเป็นลูกค้าปกติ)
    customerTaxId: string; // เลขประจำตัวผู้เสียภาษี
    customerAddress: string; // ที่อยู่ผู้รับเงิน
    sellerName: string; // ชื่อผู้บันทึก / ผู้จ่ายเงิน

    //! ข้อมูลการชำระเงิน (ความแตกต่างจาก Invoice)
    paymentMethod: string; // วิธีการชำระเงิน (เงินสด/เชค/โอนเงิน เป็นต้น)
    referenceNumber?: string; // เลขอ้างอิง (เลขใบแจ้งหนี้/เลขอ้างอิงอื่น)

    //! ข้อมูลรายละเอียดของใบเสร็จรับเงิน
    totalAmount: number; // ยอดรับเงิน (ยอดรวมสุดท้ายที่รับเงิน)

    //! ภาษี
    taxAmount?: number; // จำนวนเงินภาษีที่ต้องชำระ
    withholderTaxAmount?: number; // จำนวนเงินภาษีหักณ ที่จ่าย

    //! ยอดชำระ
    amountDue: number; // ยอดที่รับเงิน (หลังหักภาษี)
    details: {
        description: string;
        quantity: number;
        quantityUnit: string;
        price: number;
        totalPrice: number;
    }[];
    remarks?: string; // หมายเหตุ (ถ้ามี)
}

