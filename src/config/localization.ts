export const CurrencyConfig = {
    symbol: "Rs.",
    code: "Rs.",
    locale: "en-IN",
};

export const PaymentMethodConfig = {
    digital: {
        key: "upi",
        label: "UPI/Venmo",
    },
    cash: {
        key: "cash",
        label: "Cash",
    },
};

export type PaymentMethodType = keyof typeof PaymentMethodConfig;
