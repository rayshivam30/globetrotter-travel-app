import pool from "./database"

export async function getExchangeRate(base: string, target: string): Promise<number> {
  const b = base?.toUpperCase()
  const t = target?.toUpperCase()
  if (!b || !t || b === t) return 1

  const selectSql = `SELECT rate, updated_at FROM exchange_rates WHERE base_currency = $1 AND target_currency = $2`
  const res = await pool.query(selectSql, [b, t])
  const now = Date.now()

  if (res.rows.length) {
    const { rate, updated_at } = res.rows[0]
    const ageMs = now - new Date(updated_at).getTime()
    if (ageMs < 1000 * 60 * 60) {
      return Number(rate)
    }
  }

  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(b)}&symbols=${encodeURIComponent(t)}`
  const apiRes = await fetch(url)
  if (!apiRes.ok) throw new Error("Failed to fetch exchange rate")
  const data = await apiRes.json()
  const rate = Number(data?.rates?.[t])
  if (!rate || !isFinite(rate)) throw new Error("Invalid exchange rate")

  await pool.query(
    `INSERT INTO exchange_rates (base_currency, target_currency, rate, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW()`,
    [b, t, rate]
  )

  return rate
}

export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  const rate = await getExchangeRate(from, to)
  return Number((amount * rate).toFixed(2))
} 