export const CampaignType = {
    EmailCampaign: "Email Campaign",
    SMSCampaign: "SMS Campaign",
    LineCampaign: "Line Campaign",
} as const;

export type CampaignTypeKey = keyof typeof CampaignType;
export type CampaignTypeValue = typeof CampaignType[CampaignTypeKey];
