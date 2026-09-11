import { defineEventHandler, getMethod } from "h3";
import { getRates } from "../../../src/lib/rates.ts";
import { corsPreflight, json } from "../../lib/api-http.ts";

export default defineEventHandler(async (event) => {
  if (getMethod(event) === "OPTIONS") return corsPreflight();
  const rates = await getRates();
  return json(rates);
});
