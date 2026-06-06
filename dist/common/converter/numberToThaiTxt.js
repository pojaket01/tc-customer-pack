"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToThaiText = numberToThaiText;
function numberToThaiText(num) {
    // Helper function to convert number to Thai text
    // This is a simplified version - you may want to use a library for more complex cases
    const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const tens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
    const scales = ['', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    if (num === 0)
        return 'ศูนย์บาท';
    let result = '';
    let scaleIndex = 0;
    const numStr = Math.floor(num).toString().padStart(6, '0');
    for (let i = 0; i < numStr.length; i += 3) {
        const group = parseInt(numStr.substring(i, i + 3));
        if (group !== 0) {
            const hundred = Math.floor(group / 100);
            const ten = Math.floor((group % 100) / 10);
            const unit = group % 10;
            if (hundred > 0) {
                result += units[hundred] + 'ร้อย';
            }
            if (ten > 0) {
                result += tens[ten];
            }
            if (unit > 0) {
                if (ten === 0 && unit === 1) {
                    result += 'หนึ่ง';
                }
                else {
                    result += units[unit];
                }
            }
            if (scaleIndex > 0) {
                result += scales[3 - scaleIndex];
            }
        }
        scaleIndex++;
    }
    // Handle decimal part (satang)
    const decimalPart = Math.round((num % 1) * 100);
    if (decimalPart > 0) {
        result += 'บาท' + numberToThaiText(decimalPart) + 'สตางค์';
    }
    else {
        result += 'บาทถ้วน';
    }
    return result;
}
//# sourceMappingURL=numberToThaiTxt.js.map