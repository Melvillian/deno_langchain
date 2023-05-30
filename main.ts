import { serve } from "https://deno.land/std@0.189.0/http/server.ts";
import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();
const key = env["OPENAI_KEY"];

console.log(key);
