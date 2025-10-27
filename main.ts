import { DatabaseSync } from "node:sqlite"

const pokemonData = await Deno.readTextFile("./data/pokemon_data.json")
const pokemons = JSON.parse(pokemonData)


// ---------------------------------------------
// sqlite データベースを構築
// ---------------------------------------------

const db = new DatabaseSync("./pokemon.db")

db.exec(`
    CREATE TABLE IF NOT EXISTS pokemons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokemonNo INTEGER,
        name TEXT,
        form TEXT,
        isMegaEvolution INTEGER,
        hp INTEGER,
        attack INTEGER,
        defence INTEGER,
        spAttack INTEGER,
        spDefence INTEGER,
        speed INTEGER
    );
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS pokemonTypes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokemonId INTEGER,
        name TEXT
    );
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS abilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokemonId INTEGER,
        name TEXT
    );
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS hiddenAbilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokemonId INTEGER,
        name TEXT
    );
`)

const insertStmtForPokemons = db.prepare(`
    INSERT INTO pokemons (
        pokemonNo,
        name,
        form,
        isMegaEvolution,
        hp,
        attack,
        defence,
        spAttack,
        spDefence,
        speed
    ) VALUES (?,?,?,?,?,?,?,?,?,?);
`)

const insertStmtForPokemonTypes = db.prepare(`
    INSERT INTO pokemonTypes (
        pokemonId,
        name
    ) VALUES (?,?);
`)

const insertStmtForAbilities = db.prepare(`
    INSERT INTO abilities (
        pokemonId,
        name
    ) VALUES (?,?);
`)

const insertStmtForHiddenAbilities = db.prepare(`
    INSERT INTO hiddenAbilities (
        pokemonId,
        name
    ) VALUES (?,?);
`)


pokemons.forEach((pokemon, index)=>{
    const stats = pokemon.stats
    const isMegaEvolution = pokemon.isMegaEvolution===false ? 0 : 1

    const row = insertStmtForPokemons.run(
        pokemon.no,
        pokemon.name,
        pokemon.form,
        isMegaEvolution,
        stats.hp,
        stats.attack,
        stats.defence,
        stats.spAttack,
        stats.spDefence,
        stats.speed
    )

    const pokemonId = row.lastInsertRowid

    pokemon.types.forEach((typeName)=>{
        insertStmtForPokemonTypes.run(pokemonId, typeName)
    })

    pokemon.abilities.forEach((name)=>{
        insertStmtForAbilities.run(pokemonId, name)
    })

    pokemon.hiddenAbilities.forEach((name)=>{
        insertStmtForHiddenAbilities.run(pokemonId, name)
    })
})


// ---------------------------------------------
// SQL で問い合わせして欲しい情報を取り出す（例）
// ---------------------------------------------

//
// すべてのポケモンタイプを列挙
//
const pokemonTypes = db.prepare(`
    SELECT DISTINCT name FROM pokemonTypes
`).all().map((row)=>row.name)
console.log(pokemonTypes)

//
// すべての能力を列挙
//
const abilities = db.prepare(`
    SELECT DISTINCT name FROM abilities
`).all().map((row)=>row.name)
console.log(abilities)

//
// すべての隠れ能力を列挙
//
const hiddenAbilities = db.prepare(`
    SELECT DISTINCT name FROM hiddenAbilities
`).all().map((row)=>row.name)
console.log(hiddenAbilities)


//
// 'ほのお'タイプのポケモンを取り出す
//
const fireTypePokemons = db.prepare(`
    SELECT p.pokemonNo, p.name, p.form, p.hp, p.attack, p.defence, p.speed, pt.name as type
      FROM pokemons p
      JOIN pokemonTypes pt ON p.id = pt.pokemonId
      WHERE pt.name = 'ほのお'
      LIMIT 10;
`).all().map((row)=> {
    return {no: row.pokemonNo, name: row.name, type: row.type, hp: row.hp}
})
console.log(fireTypePokemons)

//
// タイプごとのポケモン数
//
const pokemonCountsByType = db.prepare(`
    SELECT
          pt.name AS pokemon_type,
          COUNT(DISTINCT pt.pokemonId) AS pokemon_count
      FROM pokemonTypes pt
      GROUP BY pt.name
      ORDER BY pokemon_count DESC;
`).all().map((row)=> {
    return {type: row.pokemon_type, count: row.pokemon_count}
})
console.log(pokemonCountsByType)

db.close()
