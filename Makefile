
run: pokemon.db
pokemon.db:
	rm -f pokemon.db
	deno --allow-read --allow-write main.ts

schema: schema.sql
schema.sql: pokemon.db
	sqlite3 pokemon.db .schema > schema.sql

clean:
	rm -f pokemon.db
	rm -f schema.sql

