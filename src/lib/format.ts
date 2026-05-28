export function formatCurrency(
  value: number | string | null | undefined,
  currency = "VND",
) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numberValue);
}

export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN").format(numberValue);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(date);
}

export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}
