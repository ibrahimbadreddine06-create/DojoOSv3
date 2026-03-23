import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const rows = await sql`
  SELECT COUNT(*) as total,
         COUNT(difficulty) as with_difficulty,
         COUNT(met) as with_met,
         COUNT(instructions) as with_instructions
  FROM exercise_library
`;
console.log("Exercise Library Stats:", rows[0]);

const sample = await sql`
  SELECT name, difficulty, met, recommended_reps,
         LEFT(instructions, 60) as instructions_preview
  FROM exercise_library
  ORDER BY name
  LIMIT 5
`;
console.log("\nSample exercises:");
sample.forEach(r => console.log(` - ${r.name} | ${r.difficulty} | MET: ${r.met} | ${r.recommended_reps}`));
process.exit(0);
