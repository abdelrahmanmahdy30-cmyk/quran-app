const gregorianFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Cairo",
})

const timeFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Cairo",
})

export function formatArabicDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "لم يسجل"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "تاريخ غير صالح"

  const gregorian = gregorianFormatter.format(date)
  return withTime ? `${gregorian} — ${timeFormatter.format(date)}` : gregorian
}

export function formatArabicDayMonth(value: string | Date | null | undefined) {
  if (!value) return "لم يسجل"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "تاريخ غير صالح"
  return gregorianFormatter.format(date)
}
