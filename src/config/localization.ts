export const CurrencyConfig = {
    symbol: "Rs.",
    code: "INR",
    locale: "en-IN",
};

export const PaymentMethodConfig = {
    digital: {
        key: "digital",
        label: "UPI/Venmo",
    },
    cash: {
        key: "cash",
        label: "Cash",
    },
};

export type PaymentMethodType = keyof typeof PaymentMethodConfig;
