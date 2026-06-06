import { IReceipt } from "../../types/receipt";
type Items = {
    no: number;
    description: string;
    quantity: number;
    quantityUnit: string;
    price: string;
    totalPrice: string;
};
type TGenerateReceiptPDF = {
    logo: string;
    receiptNumber: string;
    receiptDate: string;
    customerName: string;
    customerAddress: string;
    customerTaxId: string;
    sellerName: string;
    items: Items[];
    subtotal: string;
    vat: string;
    withholdingTax: string;
    totalAmount: string;
    totalAmountInWords: string;
    paymentMethod: string;
    referenceNumber: string;
    remark: string;
};
declare function generateReceiptPDF(receipt: IReceipt): Promise<Buffer>;
export { generateReceiptPDF, type TGenerateReceiptPDF };
//# sourceMappingURL=generate-pdf-receipt.d.ts.map