import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', { id: text('id').primaryKey(), draft: text('draft').notNull(), published: text('published'), revision: integer('revision').notNull().default(0), updatedAt: text('updated_at').notNull(), publishedAt: text('published_at') });
