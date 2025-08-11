import { pgTable, serial, text, varchar, integer, decimal, index } from 'drizzle-orm/pg-core';

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  countryCode: text('country_code'),
  region: text('region'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  population: integer('population'),
  timezone: text('timezone'),
}, (table) => ({
  nameIdx: index('cities_name_idx').on(table.name),
  countryIdx: index('cities_country_idx').on(table.country),
  countryCodeIdx: index('cities_country_code_idx').on(table.countryCode),
}));

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
